import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycSubmission.findUnique({ where: { id: params.id } });
    if (!kyc || kyc.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (kyc.status !== "OPERATIONS_REJECTED" && kyc.status !== "COMPLIANCE_REJECTED") {
      return NextResponse.json({ error: "KYC is not in a rejected state" }, { status: 400 });
    }

    const previousStatus = kyc.status;

    await prisma.kycSubmission.update({
      where: { id: params.id },
      data: { status: "DRAFT", submittedAt: null },
    });

    await prisma.kycHistory.create({
      data: {
        kycSubmissionId: params.id,
        action: "RESUBMITTED",
        performedBy: session.user.id,
        changes: { status: { old: previousStatus, new: "DRAFT" } },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "KYC_RESUBMIT_REOPENED",
      details: `Reopened KYC ${params.id} from ${previousStatus} to DRAFT`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("KYC resubmit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
