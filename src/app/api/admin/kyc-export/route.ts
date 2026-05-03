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
  return date.toISOString();
}

function fmtBool(v: boolean | null | undefined): string {
  if (v === null || v === undefined) return "";
  return v ? "Yes" : "No";
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.KycSubmissionWhereInput = {};
    if (statusParam && VALID_STATUSES.includes(statusParam as KycStatus)) {
      where.status = statusParam as KycStatus;
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
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        reviews: {
          include: {
            reviewer: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "KYC ID", "Client Name", "Email", "Phone", "Status", "Submitted At", "Created At",
      "Nationality", "Gender", "Date of Birth", "Marital Status", "Country", "City",
      "Employment Status", "Annual Income", "Net Worth", "PEP Status", "Investment Strategy",
      "Risk Tolerance", "US Person", "Acting on Behalf",
      "Operations Reviewer", "Operations Decision", "Operations Reviewed At",
      "Compliance Reviewer", "Compliance Decision", "Compliance Reviewed At",
      "Declaration Accepted", "Agreement Signed",
    ];

    const lines: string[] = [headers.map(escapeCsv).join(",")];

    for (const s of submissions) {
      const opsReview = s.reviews.find((r) => r.reviewType === "OPERATIONS");
      const compReview = s.reviews.find((r) => r.reviewType === "COMPLIANCE");
      const clientName = `${s.user.firstName} ${s.user.lastName}`.trim();
      const opsReviewerName = opsReview?.reviewer
        ? `${opsReview.reviewer.firstName} ${opsReview.reviewer.lastName}`.trim()
        : "";
      const compReviewerName = compReview?.reviewer
        ? `${compReview.reviewer.firstName} ${compReview.reviewer.lastName}`.trim()
        : "";

      const row = [
        s.id,
        clientName,
        s.user.email,
        s.user.phone ?? "",
        s.status,
        fmtDate(s.submittedAt),
        fmtDate(s.createdAt),
        s.nationality ?? "",
        s.gender ?? "",
        fmtDate(s.dateOfBirth),
        s.maritalStatus ?? "",
        s.primaryCountry ?? "",
        s.primaryCity ?? "",
        s.employmentCategory ?? "",
        s.annualIncomeRange ?? "",
        s.estimatedNetWorth ?? "",
        s.pepStatus ?? "",
        s.investmentStrategy ?? "",
        s.riskTolerance ?? "",
        fmtBool(s.isUsPerson),
        fmtBool(s.isActingOnBehalf),
        opsReviewerName,
        opsReview?.decision ?? "",
        fmtDate(opsReview?.reviewedAt),
        compReviewerName,
        compReview?.decision ?? "",
        fmtDate(compReview?.reviewedAt),
        fmtBool(s.declarationAccepted),
        fmtBool(s.agreementAccepted),
      ];

      lines.push(row.map(escapeCsv).join(","));
    }

    const csv = lines.join("\r\n");
    const today = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kyc-export-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error("KYC export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
