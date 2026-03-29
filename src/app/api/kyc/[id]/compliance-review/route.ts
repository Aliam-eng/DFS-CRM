import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/upload";
import { createNotification, notifyByRole } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import { sendKycStatusEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "COMPLIANCE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const decision = formData.get("decision") as string;
    const notes = formData.get("notes") as string | null;
    const amlReport = formData.get("amlReport") as File | null;

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

    // Save AML report if provided
    let amlReportPath: string | null = null;
    if (amlReport && amlReport.size > 0) {
      const uploadResult = await saveFile(amlReport, "aml-reports");
      amlReportPath = uploadResult.filePath;
    }

    // Create review record
    await prisma.kycReview.create({
      data: {
        kycSubmissionId: kyc.id,
        reviewerUserId: session.user.id,
        reviewType: "COMPLIANCE",
        decision,
        notes: notes || null,
        amlReportPath,
      },
    });

    // Update KYC status
    const newStatus = decision === "APPROVED" ? "COMPLIANCE_APPROVED" : "COMPLIANCE_REJECTED";
    await prisma.kycSubmission.update({
      where: { id: kyc.id },
      data: { status: newStatus },
    });

    // Create history entry
    await prisma.kycHistory.create({
      data: {
        kycSubmissionId: kyc.id,
        action: "COMPLIANCE_REVIEWED",
        performedBy: session.user.id,
        notes: `Decision: ${decision}. ${notes || ""}`.trim(),
      },
    });

    await logActivity({ userId: session.user.id, action: `COMPLIANCE_${decision}`, details: `KYC ${kyc.id} for ${kyc.user.email} ${decision.toLowerCase()}` });

    const clientName = `${kyc.user.firstName} ${kyc.user.lastName}`;

    if (decision === "APPROVED") {
      // Notify operations
      await notifyByRole(
        "OPERATIONS",
        "KYC_COMPLIANCE_APPROVED",
        "KYC Ready for Final Review",
        `Compliance has approved ${clientName}'s KYC. Final review required.`,
        `/operations/reviews/${kyc.id}`
      );
      sendKycStatusEmail(kyc.user.email, clientName, "COMPLIANCE_APPROVED");
    } else {
      // Notify client
      await createNotification({
        userId: kyc.userId,
        type: "KYC_COMPLIANCE_REJECTED",
        title: "KYC Rejected",
        message: `Your KYC has been rejected by compliance. ${notes ? `Reason: ${notes}` : ""}`,
        link: "/client/kyc/status",
      });
      sendKycStatusEmail(kyc.user.email, clientName, "COMPLIANCE_REJECTED", notes || undefined);
    }

    return NextResponse.json({ message: `KYC ${decision.toLowerCase()} successfully` });
  } catch (error) {
    console.error("Compliance review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
