import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KycStatus, KycInternalState, Prisma } from "@prisma/client";

const VALID_STATUSES = new Set<string>(Object.values(KycStatus));
const VALID_INTERNAL_STATES = new Set<string>(Object.values(KycInternalState));

// Non-CLIENT roles must not be able to filter to DRAFT via URL param —
// drafts belong to the client and aren't visible to staff.
const STAFF_ALLOWED_STATUSES = new Set<KycStatus>([
  "SUBMITTED",
  "OPERATIONS_APPROVED",
  "OPERATIONS_REJECTED",
  "COMPLIANCE_APPROVED",
  "COMPLIANCE_REJECTED",
]);

function parseValidDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const internalStateParam = searchParams.get("internalState");
    const search = searchParams.get("search") || "";
    const dateFrom = parseValidDate(searchParams.get("dateFrom"));
    const dateTo = parseValidDate(searchParams.get("dateTo"));

    // Pagination — clamp so bad values can't hammer the DB or produce
    // negative skips.
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 10;

    // Enum validation: unknown status/internalState → silently drop the
    // filter rather than passing garbage to Prisma (500).
    const status: KycStatus | null =
      statusParam && VALID_STATUSES.has(statusParam) ? (statusParam as KycStatus) : null;
    const internalState: KycInternalState | null =
      internalStateParam && VALID_INTERNAL_STATES.has(internalStateParam)
        ? (internalStateParam as KycInternalState)
        : null;

    const where: Prisma.KycSubmissionWhereInput = {};

    // Role-based scope
    if (session.user.role === "CLIENT") {
      where.userId = session.user.id;
    } else if (session.user.role === "OPERATIONS" || session.user.role === "COMPLIANCE") {
      // Staff default queue when the caller didn't ask for a specific status.
      const defaultStatus: KycStatus = session.user.role === "OPERATIONS" ? "SUBMITTED" : "OPERATIONS_APPROVED";
      // Block DRAFT even when explicitly requested — it belongs to the client.
      if (status && STAFF_ALLOWED_STATUSES.has(status)) {
        where.status = status;
      } else {
        where.status = defaultStatus;
      }
    } else if (status) {
      // ADMIN / SUPER_ADMIN can see any status they ask for.
      where.status = status;
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

    if (internalState && session.user.role !== "CLIENT") {
      where.internalState = internalState;
    }

    if (dateFrom || dateTo) {
      const submittedAt: Prisma.DateTimeNullableFilter = {};
      if (dateFrom) submittedAt.gte = dateFrom;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        submittedAt.lte = end;
      }
      where.submittedAt = submittedAt;
    }

    const [submissions, total] = await Promise.all([
      prisma.kycSubmission.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          documents: true,
          reviews: {
            include: { reviewer: { select: { firstName: true, lastName: true, role: true } } },
            orderBy: { reviewedAt: "desc" },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kycSubmission.count({ where }),
    ]);

    return NextResponse.json({ submissions, total, page, limit });
  } catch (error) {
    console.error("KYC list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has a KYC
    const existing = await prisma.kycSubmission.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const kyc = await prisma.kycSubmission.create({
      data: {
        userId: session.user.id,
        status: "DRAFT",
      },
    });

    return NextResponse.json(kyc, { status: 201 });
  } catch (error) {
    console.error("KYC create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
