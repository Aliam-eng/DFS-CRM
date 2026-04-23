import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyByRole } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import { sendKycStatusEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "OPERATIONS") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { decision, notes } = body;

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!kyc) {
      return NextResponse.json({ error: "KYC not found" }, { status: 404 });
    }

    if (kyc.status !== "SUBMITTED") {
      return NextResponse.json({ error: "KYC is not in submitted status" }, { status: 400 });
    }

    // Create review record
    await prisma.kycReview.create({
      data: {
        kycSubmissionId: kyc.id,
        reviewerUserId: session.user.id,
        reviewType: "OPERATIONS",
        decision,
        notes: notes || null,
      },
    });

    // Update KYC status
    const newStatus = decision === "APPROVED" ? "OPERATIONS_APPROVED" : "OPERATIONS_REJECTED";
    await prisma.kycSubmission.update({
      where: { id: kyc.id },
      data: { status: newStatus },
    });

    // Create history entry
    await prisma.kycHistory.create({
      data: {
        kycSubmissionId: kyc.id,
        action: "OPERATIONS_REVIEWED",
        performedBy: session.user.id,
        notes: `Decision: ${decision}. ${notes || ""}`.trim(),
      },
    });

    await logActivity({ userId: session.user.id, action: `OPERATIONS_${decision}`, details: `KYC ${kyc.id} for ${kyc.user.email} ${decision.toLowerCase()}` });

    const clientName = `${kyc.user.firstName} ${kyc.user.lastName}`;

    if (decision === "APPROVED") {
      // Forward to Compliance for final review
      await notifyByRole(
        "COMPLIANCE",
        "KYC_OPERATIONS_APPROVED",
        "KYC Ready for Compliance Review",
        `Operations has approved ${clientName}'s KYC. Final compliance review required.`,
        `/compliance/reviews/${kyc.id}`
      );
      sendKycStatusEmail(kyc.user.email, clientName, "OPERATIONS_APPROVED");
    } else {
      // Notify client of rejection
      await createNotification({
        userId: kyc.userId,
        type: "KYC_REJECTED",
        title: "KYC Rejected",
        message: `Your KYC has been rejected by operations. ${notes ? `Reason: ${notes}` : ""}`,
        link: "/client/kyc/status",
      });
      sendKycStatusEmail(kyc.user.email, clientName, "OPERATIONS_REJECTED", notes || undefined);
    }

    return NextResponse.json({ message: `KYC ${decision.toLowerCase()} successfully` });
  } catch (error) {
    console.error("Operations review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
