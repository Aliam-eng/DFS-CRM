import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyByRole } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import { sendKycStatusEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: { documents: true, user: true },
    });

    if (!kyc || kyc.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (kyc.status !== "DRAFT") {
      return NextResponse.json({ error: "KYC is not in draft status" }, { status: 400 });
    }

    // Validate required fields
    const errors: string[] = [];

    // Part A: Personal Information
    if (!kyc.firstName) errors.push("First name is required");
    if (!kyc.lastName) errors.push("Last name is required");
    if (!kyc.dateOfBirth) errors.push("Date of birth is required");
    if (!kyc.gender) errors.push("Gender is required");
    if (!kyc.nationality) errors.push("Nationality is required");
    if (!kyc.maritalStatus) errors.push("Marital status is required");

    // Identity document number (passport or national ID)
    if (!kyc.passportNumber && !kyc.idNumber) errors.push("Passport number or ID number is required");

    // Part B: Address
    if (!kyc.homeStatus) errors.push("Home status is required");
    if (!kyc.primaryCountry) errors.push("Country is required");
    if (!kyc.primaryCity) errors.push("City is required");

    // Part C: Employment
    if (!kyc.employmentCategory) errors.push("Employment status is required");

    // Part E: Financial
    if (!kyc.annualIncomeRange) errors.push("Annual income range is required");
    {
      const funds = kyc.sourceOfFunds as string[] | null;
      if (!funds || !Array.isArray(funds) || funds.length === 0) errors.push("Source of funds is required");
    }
    if (!kyc.estimatedNetWorth) errors.push("Estimated net worth is required");
    {
      const wealth = kyc.sourceOfWealth as string[] | null;
      if (!wealth || !Array.isArray(wealth) || wealth.length === 0) errors.push("Source of wealth is required");
    }
    // Part F: Beneficial Owner (defaults to false, no validation needed)

    // Part G: Investment Profile
    if (!kyc.investmentStrategy) errors.push("Investment strategy is required");
    if (!kyc.investmentObjective) errors.push("Investment objective is required");
    if (!kyc.riskTolerance) errors.push("Risk tolerance is required");

    // Part I: Compliance (boolean fields default to false, no validation needed)

    // Part J: PEP
    if (!kyc.pepStatus) errors.push("PEP status is required");

    // Declaration
    if (!kyc.declarationAccepted) errors.push("Declaration must be accepted");
    if (!kyc.declarationFullName) errors.push("Declaration full name is required");

    // Documents
    const hasIdentityDoc = kyc.documents.some(
      (d) => d.documentType === "PASSPORT" || d.documentType === "NATIONAL_ID"
    );
    const hasProofOfAddress = kyc.documents.some(
      (d) => d.documentType === "UTILITY_BILL" || d.documentType === "BANK_STATEMENT"
    );

    if (!hasIdentityDoc) errors.push("Identity document is required");
    if (!hasProofOfAddress) errors.push("Proof of address is required");

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Submit atomically
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.kycSubmission.update({
        where: { id: params.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      await tx.kycHistory.create({
        data: {
          kycSubmissionId: params.id,
          action: "SUBMITTED",
          performedBy: session.user.id,
          notes: "KYC submitted for review",
        },
      });

      return result;
    });

    // Post-commit side effects (notifications, logging) — fire in parallel
    const clientName = `${kyc.user.firstName} ${kyc.user.lastName}`;
    await Promise.all([
      logActivity({ userId: session.user.id, action: "KYC_SUBMITTED", details: `KYC ${kyc.id} submitted for review` }),
      notifyByRole(
        "COMPLIANCE",
        "KYC_SUBMITTED",
        "New KYC Submission",
        `${clientName} has submitted their KYC for review.`,
        `/compliance/reviews/${kyc.id}`
      ),
      sendKycStatusEmail(kyc.user.email, clientName, "SUBMITTED"),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("KYC submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
