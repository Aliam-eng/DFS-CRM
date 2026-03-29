import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (session.user.role === "CLIENT") {
      where.userId = session.user.id;
    } else if (session.user.role === "COMPLIANCE") {
      where.status = status || "SUBMITTED";
    } else if (session.user.role === "OPERATIONS") {
      if (status) {
        where.status = status;
      } else {
        where.status = { in: ["COMPLIANCE_APPROVED", "OPERATIONS_APPROVED", "OPERATIONS_REJECTED"] };
      }
    }
    // ADMIN and SUPER_ADMIN see all
    if (status && session.user.role !== "COMPLIANCE" && session.user.role !== "OPERATIONS") {
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

    if (dateFrom || dateTo) {
      where.submittedAt = {};
      if (dateFrom) (where.submittedAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        (where.submittedAt as Record<string, unknown>).lte = endDate;
      }
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
