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

    // ─── Hard block: US Person cannot proceed ───
    if (kyc.isUsPerson) {
      return NextResponse.json(
        { error: "U.S. Persons and tax residents of jurisdictions other than Lebanon are not eligible. Please contact our support team." },
        { status: 400 }
      );
    }

    // Part A: Personal Information
    if (!kyc.firstName) errors.push("First name is required");
    if (!kyc.lastName) errors.push("Last name is required");
    if (!kyc.middleName) errors.push("Middle name (Father's name) is required");
    if (!kyc.mothersFullName) errors.push("Mother's full name is required");
    if (!kyc.dateOfBirth) errors.push("Date of birth is required");
    if (!kyc.gender) errors.push("Gender is required");
    if (!kyc.nationality) errors.push("Nationality is required");
    if (!kyc.maritalStatus) errors.push("Marital status is required");

    // Identity document number (passport or national ID)
    if (!kyc.passportNumber && !kyc.idNumber) errors.push("Passport number or ID number is required");

    // Passport expiry must be in the future
    if (kyc.passportNumber && kyc.passportExpiryDate) {
      const expiry = new Date(kyc.passportExpiryDate);
      if (expiry < new Date()) errors.push("Passport is expired — please upload a valid passport");
    }

    // KYC contact must match registration
    if (kyc.emailAddress && kyc.emailAddress.toLowerCase() !== kyc.user.email.toLowerCase()) {
      errors.push("Email address must match the email used at registration");
    }
    if (kyc.phoneNumber && kyc.user.phone && kyc.phoneNumber.replace(/\D/g, "") !== kyc.user.phone.replace(/\D/g, "")) {
      errors.push("Phone number must match the phone used at registration");
    }

    // Part B: Address — Area, Street, Building, Floor now mandatory
    if (!kyc.homeStatus) errors.push("Home status is required");
    if (!kyc.primaryCountry) errors.push("Country is required");
    if (!kyc.primaryCity) errors.push("City is required");
    if (!kyc.primaryArea) errors.push("Area / Neighborhood is required");
    if (!kyc.primaryStreet) errors.push("Street name & number is required");
    if (!kyc.primaryBuilding) errors.push("Building name or number is required");
    if (!kyc.primaryFloor) errors.push("Floor number is required");

    // Part C: Employment
    if (!kyc.employmentCategory) errors.push("Employment status is required");

    // Working clients (employed / self-employed) → company/institution required
    if (kyc.employmentCategory === "EMPLOYED" || kyc.employmentCategory === "SELF_EMPLOYED") {
      if (!kyc.institutionName) errors.push("Company / institution name is required");
    }

    // Students → university required
    if (kyc.employmentCategory === "STUDENT") {
      if (!kyc.universityName) errors.push("University name is required");
    }

    // Director of listed company → all sub-fields required
    if (kyc.isDirectorOfListed) {
      if (!kyc.directorCompanyName) errors.push("Director — name of company is required");
      if (!kyc.directorStockExchange) errors.push("Director — stock exchange is required");
      if (!kyc.directorPosition) errors.push("Director — position held is required");
      if (!kyc.directorAppointmentDate) errors.push("Director — date of appointment is required");
    }

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

    // Part F: Beneficial Owner — when not the BO, full details for each BO required
    if (kyc.isActingOnBehalf) {
      const raw = kyc.beneficialOwner as Record<string, unknown> | null;
      if (!raw || typeof raw !== "object") {
        errors.push("Beneficial owner details are required");
      } else {
        const owners = (raw.owners as Record<string, unknown>[]) ||
          (Object.keys(raw).length > 0 && !("owners" in raw) ? [raw] : []);
        if (owners.length === 0) {
          errors.push("At least one beneficial owner is required");
        }
        owners.forEach((bo, idx) => {
          const tag = `BO #${idx + 1}`;
          if (!bo.fullName) errors.push(`${tag} — full name is required`);
          if (!bo.dateOfBirth) errors.push(`${tag} — date of birth is required`);
          if (!bo.nationality) errors.push(`${tag} — nationality is required`);
          const idType = bo.idType as string | undefined;
          if (!idType) {
            errors.push(`${tag} — please select ID or Passport`);
          } else if (idType === "ID" && !bo.idNumber) {
            errors.push(`${tag} — ID number is required`);
          } else if (idType === "PASSPORT") {
            if (!bo.passportNumber) errors.push(`${tag} — passport number is required`);
            if (!bo.passportExpiryDate) {
              errors.push(`${tag} — passport expiry date is required`);
            } else {
              const expiry = new Date(bo.passportExpiryDate as string);
              if (expiry < new Date()) errors.push(`${tag} — passport is expired`);
            }
          }
          if (!bo.relationshipToAccountHolder) errors.push(`${tag} — relationship is required`);
          if (bo.ownershipPercentage === undefined || bo.ownershipPercentage === null || bo.ownershipPercentage === "") {
            errors.push(`${tag} — % ownership/control is required`);
          }
        });
      }
    }

    // Part G: Investment Profile
    if (!kyc.investmentStrategy) errors.push("Investment strategy is required");
    if (!kyc.investmentObjective) errors.push("Investment objective is required");
    if (!kyc.riskTolerance) errors.push("Risk tolerance is required");

    // Part H: Investment Experience — every instrument must be answered; if YES, years required
    {
      const exp = kyc.investmentExperience as Record<string, { has: boolean; years?: number | null }> | null;
      const INSTRUMENTS = ["securities", "futuresCfds", "options", "commodities", "bonds", "forex"];
      if (!exp || typeof exp !== "object") {
        errors.push("Investment experience must be answered for every instrument");
      } else {
        for (const k of INSTRUMENTS) {
          const entry = exp[k];
          if (!entry || typeof entry.has !== "boolean") {
            errors.push(`Investment experience — ${k} must be answered`);
          } else if (entry.has && (entry.years === null || entry.years === undefined || Number(entry.years) <= 0)) {
            errors.push(`Investment experience — ${k}: years of experience required`);
          }
        }
      }
    }

    // Part I: Compliance — explanation required when Yes
    if (kyc.isAssociatedWithListed && !kyc.associatedListedDetails) {
      errors.push("Please explain your association with the publicly listed company");
    }
    if (kyc.hasInsideInformation && !kyc.insideInformationDetails) {
      errors.push("Please explain your access to non-public/inside information");
    }

    // Part J: PEP — if PEP-related, explanation required
    if (!kyc.pepStatus) errors.push("PEP status is required");
    if ((kyc.pepStatus === "IS_PEP" || kyc.pepStatus === "PEP_FAMILY_ASSOCIATE") && !kyc.pepDetails) {
      errors.push("Please explain your PEP status");
    }

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
        "OPERATIONS",
        "KYC_SUBMITTED",
        "New KYC Submission",
        `${clientName} has submitted their KYC for review.`,
        `/operations/reviews/${kyc.id}`
      ),
      sendKycStatusEmail(kyc.user.email, clientName, "SUBMITTED"),
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("KYC submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
