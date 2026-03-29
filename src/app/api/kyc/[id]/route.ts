import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        documents: { orderBy: { uploadedAt: "desc" } },
        reviews: {
          include: { reviewer: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { reviewedAt: "asc" },
        },
      },
    });

    if (!kyc) {
      return NextResponse.json({ error: "KYC not found" }, { status: 404 });
    }

    // Clients can only see their own
    if (session.user.role === "CLIENT" && kyc.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(kyc);
  } catch (error) {
    console.error("KYC detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
    });

    if (!kyc || kyc.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (kyc.status !== "DRAFT") {
      return NextResponse.json({ error: "Can only edit draft KYC" }, { status: 400 });
    }

    const raw = await req.json();

    // Whitelist: only allow known KYC fields to be updated
    const ALLOWED_FIELDS = new Set([
      // Part A
      "firstName", "lastName", "middleName", "mothersFullName", "placeOfBirth",
      "dateOfBirth", "gender", "nationality", "otherNationality", "idNumber",
      "idIssueDate", "passportNumber", "passportExpiryDate", "maritalStatus",
      "spouseFullName", "spouseProfession",
      "numberOfDependents", "phoneNumber", "emailAddress",
      // Part B
      "homeStatus", "hasSecondaryAddress", "secondaryHomeStatus",
      "primaryCountry", "primaryCity", "primaryArea", "primaryStreet",
      "primaryBuilding", "primaryFloor", "primaryApartment",
      "secondaryCountry", "secondaryCity", "secondaryArea", "secondaryStreet",
      "secondaryBuilding", "secondaryFloor", "secondaryApartment",
      // Part C
      "employmentCategory", "currentProfession", "institutionName", "natureOfBusiness",
      "lengthOfEmployment", "institutionPhone", "institutionEmail", "personalInstitutionEmail",
      "institutionWebsite",
      "previousProfession", "universityName", "major", "expectedGraduationYear",
      "isDirectorOfListed", "directorCompanyName", "directorStockExchange",
      "directorPosition", "directorAppointmentDate",
      // Part D
      "preferEmail", "preferSMS", "preferWhatsApp", "preferOther", "preferOtherDetails",
      // Part E
      "annualIncomeRange", "sourceOfFunds", "sourceOfFundsOther", "estimatedNetWorth",
      "sourceOfWealth", "sourceOfWealthOther", "hasOtherBankAccounts", "otherBankCountry",
      "isUsPerson",
      // Part F
      "isActingOnBehalf", "beneficialOwner",
      // Part G
      "investmentStrategy", "investmentObjective", "investmentObjectiveOther",
      "riskTolerance",
      // Part H
      "investmentExperience",
      // Part I
      "isAssociatedWithListed", "associatedListedDetails",
      "hasInsideInformation", "insideInformationDetails",
      // Part J
      "pepStatus", "pepDetails",
      // Declaration
      "declarationAccepted", "declarationFullName", "declarationDate",
      // Tracking
      "currentStep",
    ]);

    const body: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      if (ALLOWED_FIELDS.has(key)) body[key] = raw[key];
    }

    // Handle date conversions
    const dateFields = ["dateOfBirth", "idIssueDate", "passportExpiryDate", "directorAppointmentDate", "declarationDate"];
    for (const field of dateFields) {
      if (body[field] && typeof body[field] === "string") {
        body[field] = new Date(body[field] as string);
      }
    }

    // Handle numeric conversions
    if (body.numberOfDependents !== undefined && body.numberOfDependents !== null) {
      body.numberOfDependents = parseInt(String(body.numberOfDependents)) || null;
    }
    if (body.expectedGraduationYear !== undefined && body.expectedGraduationYear !== null) {
      body.expectedGraduationYear = parseInt(String(body.expectedGraduationYear)) || null;
    }
    // Validate JSON fields structure before DB storage
    if (body.sourceOfFunds !== undefined && body.sourceOfFunds !== null) {
      if (!Array.isArray(body.sourceOfFunds)) {
        return NextResponse.json({ error: "sourceOfFunds must be an array" }, { status: 400 });
      }
    }

    if (body.sourceOfWealth !== undefined && body.sourceOfWealth !== null) {
      if (!Array.isArray(body.sourceOfWealth)) {
        return NextResponse.json({ error: "sourceOfWealth must be an array" }, { status: 400 });
      }
    }

    if (body.beneficialOwner !== undefined && body.beneficialOwner !== null) {
      if (typeof body.beneficialOwner !== "object" || Array.isArray(body.beneficialOwner)) {
        return NextResponse.json({ error: "beneficialOwner must be an object" }, { status: 400 });
      }
    }

    if (body.investmentExperience !== undefined && body.investmentExperience !== null) {
      if (typeof body.investmentExperience !== "object" || Array.isArray(body.investmentExperience)) {
        return NextResponse.json({ error: "investmentExperience must be an object" }, { status: 400 });
      }
    }

    const updated = await prisma.kycSubmission.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("KYC update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
