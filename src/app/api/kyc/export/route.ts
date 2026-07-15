import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, KycStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: KycStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "COMPLIANCE_APPROVED",
  "COMPLIANCE_REJECTED",
  "OPERATIONS_APPROVED",
  "OPERATIONS_REJECTED",
];

const ALLOWED_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${fmtDate(date)} ${hh}:${min}`;
}

function fmtBool(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  return v ? "Yes" : "No";
}

function joinList(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  return "";
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.KycSubmissionWhereInput = {};

    // Role-based default status filter when the caller didn't provide one
    if (statusParam && VALID_STATUSES.includes(statusParam as KycStatus)) {
      where.status = statusParam as KycStatus;
    } else if (!statusParam) {
      if (session.user.role === "OPERATIONS") where.status = "SUBMITTED";
      else if (session.user.role === "COMPLIANCE") where.status = "OPERATIONS_APPROVED";
      // ADMIN / SUPER_ADMIN default: no status filter (export everything)
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (dateFrom || dateTo) {
      const submittedAt: Prisma.DateTimeNullableFilter = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (!isNaN(d.getTime())) submittedAt.gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (!isNaN(d.getTime())) submittedAt.lte = d;
      }
      if (Object.keys(submittedAt).length > 0) where.submittedAt = submittedAt;
    }

    const submissions = await prisma.kycSubmission.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true, createdAt: true } },
        reviews: {
          include: {
            reviewer: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      // Client identity (from registration)
      "KYC ID",
      "Registered First Name",
      "Registered Last Name",
      "Registered Email",
      "Registered Phone",
      "Registered On",
      // KYC identity
      "KYC First Name",
      "KYC Middle Name (Father's)",
      "KYC Last Name",
      "Mother's Full Name",
      "Place of Birth",
      "Date of Birth",
      "Gender",
      "Marital Status",
      "Spouse Full Name",
      "Nationality",
      "Other Nationality",
      "ID Type",
      "ID Number",
      "ID Issue Date",
      "Passport Number",
      "Passport Expiry",
      "KYC Phone",
      "KYC Email",
      // Address
      "Home Status",
      "Country",
      "City",
      "Area",
      "Street",
      "Building",
      "Floor",
      "Apartment",
      // Employment
      "Employment Status",
      "Profession",
      "Institution Name",
      // Financial
      "Annual Income",
      "Source of Funds",
      "Net Worth",
      "Source of Wealth",
      "US Person",
      // Investment
      "Investment Strategy",
      "Investment Objective",
      "Risk Tolerance",
      // Beneficial Owner
      "Acting on Behalf",
      // Compliance
      "PEP Status",
      "Is Self PEP",
      "Is Family PEP",
      // Status + workflow
      "Status",
      "Submitted At",
      "Created At",
      "Operations Reviewer",
      "Operations Decision",
      "Operations Reviewed At",
      "Compliance Reviewer",
      "Compliance Decision",
      "Compliance Reviewed At",
      // Signatures
      "Declaration Accepted",
      "Declaration Signed By",
      "Regulatory Clause Accepted",
      "Agreement Signed",
      "Agreement Signed By",
      "Agreement Signed At",
      "Trading Partner",
      "Commission Tier",
    ];

    const lines: string[] = [headers.map(escapeCsv).join(",")];

    for (const s of submissions) {
      const opsReview = s.reviews.find((r) => r.reviewType === "OPERATIONS");
      const compReview = s.reviews.find((r) => r.reviewType === "COMPLIANCE");
      const opsReviewerName = opsReview?.reviewer
        ? `${opsReview.reviewer.firstName} ${opsReview.reviewer.lastName}`.trim()
        : "";
      const compReviewerName = compReview?.reviewer
        ? `${compReview.reviewer.firstName} ${compReview.reviewer.lastName}`.trim()
        : "";
      const idType = s.passportNumber ? "Passport" : s.idNumber ? "National ID" : "";

      const row = [
        s.id,
        s.user.firstName,
        s.user.lastName,
        s.user.email,
        s.user.phone ?? "",
        fmtDateTime(s.user.createdAt),
        s.firstName ?? "",
        s.middleName ?? "",
        s.lastName ?? "",
        s.mothersFullName ?? "",
        s.placeOfBirth ?? "",
        fmtDate(s.dateOfBirth),
        s.gender ?? "",
        s.maritalStatus ?? "",
        s.spouseFullName ?? "",
        s.nationality ?? "",
        s.otherNationality ?? "",
        idType,
        s.idNumber ?? "",
        fmtDate(s.idIssueDate),
        s.passportNumber ?? "",
        fmtDate(s.passportExpiryDate),
        s.phoneNumber ?? "",
        s.emailAddress ?? "",
        s.homeStatus ?? "",
        s.primaryCountry ?? "",
        s.primaryCity ?? "",
        s.primaryArea ?? "",
        s.primaryStreet ?? "",
        s.primaryBuilding ?? "",
        s.primaryFloor ?? "",
        s.primaryApartment ?? "",
        s.employmentCategory ?? "",
        s.currentProfession ?? "",
        s.institutionName ?? "",
        s.annualIncomeRange ?? "",
        joinList(s.sourceOfFunds),
        s.estimatedNetWorth ?? "",
        joinList(s.sourceOfWealth),
        fmtBool(s.isUsPerson),
        s.investmentStrategy ?? "",
        s.investmentObjective ?? "",
        s.riskTolerance ?? "",
        fmtBool(s.isActingOnBehalf),
        s.pepStatus ?? "",
        fmtBool(s.pepIsSelf),
        fmtBool(s.pepIsFamily),
        s.status,
        fmtDateTime(s.submittedAt),
        fmtDateTime(s.createdAt),
        opsReviewerName,
        opsReview?.decision ?? "",
        fmtDateTime(opsReview?.reviewedAt),
        compReviewerName,
        compReview?.decision ?? "",
        fmtDateTime(compReview?.reviewedAt),
        fmtBool(s.declarationAccepted),
        s.declarationFullName ?? "",
        fmtBool(s.regulatoryClauseAccepted),
        fmtBool(s.agreementAccepted),
        s.agreementFullName ?? "",
        fmtDateTime(s.agreementSignedAt),
        s.tradingCompany ?? "",
        s.tradingCommission ?? "",
      ];

      lines.push(row.map(escapeCsv).join(","));
    }

    // BOM for Excel Arabic support
    const csv = "﻿" + lines.join("\r\n");
    const today = new Date().toISOString().split("T")[0];
    const roleTag = session.user.role.toLowerCase();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kyc-export-${roleTag}-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error("KYC export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
