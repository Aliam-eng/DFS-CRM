import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

/**
 * POST /api/operations/pending-users/[id]/activate
 * Staff-only action: force-verify a client's email and make sure the account is ACTIVE.
 * Useful when a client can't receive the OTP email.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !["OPERATIONS", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role !== "CLIENT") {
      return NextResponse.json({ error: "Only client accounts can be managed here" }, { status: 400 });
    }

    const changes: string[] = [];
    if (!target.emailVerified) changes.push("email verified");
    if (target.status !== "ACTIVE") changes.push(`status: ${target.status} → ACTIVE`);

    if (changes.length === 0) {
      return NextResponse.json({ error: "User is already verified and active" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { status: "ACTIVE", emailVerified: true },
    });

    await logActivity({
      userId: session.user.id,
      action: "USER_VERIFIED_BY_STAFF",
      details: `Staff verified/activated ${target.email}: ${changes.join(", ")}`,
    });

    // Notify the client
    await createNotification({
      userId: target.id,
      type: "GENERAL",
      title: "Account Verified",
      message: "Your email has been verified by our team. You can log in and start your KYC application.",
      link: "/login",
    });

    return NextResponse.json({ message: "User verified successfully", changes });
  } catch (error) {
    console.error("Verify user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
