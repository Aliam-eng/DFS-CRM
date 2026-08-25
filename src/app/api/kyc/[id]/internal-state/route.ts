import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyByRole } from "@/lib/notifications";
import { KycInternalState } from "@prisma/client";

const STAFF_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"];
const VALID_STATES = Object.values(KycInternalState);

// State changes we surface as notifications to the OTHER team. NEW and
// IN_PROGRESS are noisy (they fire every time someone opens the file),
// so we skip them.
const NOTIFY_STATES = new Set<KycInternalState>([
  "WAITING_CLIENT",
  "WAITING_TEAM",
  "ON_HOLD",
  "ESCALATED",
  "DONE",
]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const nextState = body?.internalState;
    if (!nextState || !VALID_STATES.includes(nextState)) {
      return NextResponse.json({ error: "Invalid internalState" }, { status: 400 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!kyc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const previous = kyc.internalState;
    if (previous === nextState) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const updated = await prisma.kycSubmission.update({
      where: { id: params.id },
      data: {
        internalState: nextState,
        internalStateUpdatedAt: new Date(),
        internalStateUpdatedBy: session.user.id,
      },
      select: {
        internalState: true,
        internalStateUpdatedAt: true,
        internalStateUpdatedBy: true,
      },
    });

    // Audit
    await prisma.kycHistory.create({
      data: {
        kycSubmissionId: params.id,
        action: "INTERNAL_STATE_CHANGED",
        performedBy: session.user.id,
        changes: { internalState: { old: previous ?? null, new: nextState } },
      },
    });

    // Cross-team notification for meaningful transitions only
    if (NOTIFY_STATES.has(nextState)) {
      const authorRole = session.user.role;
      const clientName = `${kyc.user.firstName} ${kyc.user.lastName}`.trim();
      const targets: Array<"OPERATIONS" | "COMPLIANCE"> = [];
      if (authorRole === "OPERATIONS") targets.push("COMPLIANCE");
      else if (authorRole === "COMPLIANCE") targets.push("OPERATIONS");
      else targets.push("OPERATIONS", "COMPLIANCE");

      Promise.all(
        targets.map((role) =>
          notifyByRole(
            role,
            "KYC_COMMENT",
            `${clientName} — internal state: ${nextState.replace(/_/g, " ")}`,
            `Marked "${nextState.replace(/_/g, " ")}" by ${authorRole}`,
            `/${role.toLowerCase()}/reviews/${params.id}`,
          ),
        ),
      ).catch((e) => console.error("Internal state notify failed:", e));
    }

    return NextResponse.json({ ok: true, ...updated });
  } catch (error) {
    console.error("Update internal state error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
