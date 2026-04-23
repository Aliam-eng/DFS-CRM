import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

    if (role === "CLIENT") {
      const kyc = await prisma.kycSubmission.findUnique({
        where: { userId: session.user.id },
        include: { reviews: true },
      });
      return NextResponse.json({ kyc });
    }

    if (role === "COMPLIANCE") {
      const [pending, approvedToday, rejectedToday] = await Promise.all([
        prisma.kycSubmission.count({ where: { status: "OPERATIONS_APPROVED" } }),
        prisma.kycReview.count({
          where: {
            reviewType: "COMPLIANCE",
            decision: "APPROVED",
            reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.kycReview.count({
          where: {
            reviewType: "COMPLIANCE",
            decision: "REJECTED",
            reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);
      return NextResponse.json({ pending, approvedToday, rejectedToday });
    }

    if (role === "OPERATIONS") {
      const [pending, approvedToday, rejectedToday] = await Promise.all([
        prisma.kycSubmission.count({ where: { status: "SUBMITTED" } }),
        prisma.kycReview.count({
          where: {
            reviewType: "OPERATIONS",
            decision: "APPROVED",
            reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.kycReview.count({
          where: {
            reviewType: "OPERATIONS",
            decision: "REJECTED",
            reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
      ]);
      return NextResponse.json({ pending, approvedToday, rejectedToday });
    }

    // ADMIN / SUPER_ADMIN
    const [
      totalClients,
      totalKycs,
      draft,
      submitted,
      complianceApproved,
      complianceRejected,
      opsApproved,
      opsRejected,
      totalUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.kycSubmission.count(),
      prisma.kycSubmission.count({ where: { status: "DRAFT" } }),
      prisma.kycSubmission.count({ where: { status: "SUBMITTED" } }),
      prisma.kycSubmission.count({ where: { status: "COMPLIANCE_APPROVED" } }),
      prisma.kycSubmission.count({ where: { status: "COMPLIANCE_REJECTED" } }),
      prisma.kycSubmission.count({ where: { status: "OPERATIONS_APPROVED" } }),
      prisma.kycSubmission.count({ where: { status: "OPERATIONS_REJECTED" } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      totalClients,
      totalKycs,
      totalUsers,
      kycByStatus: { draft, submitted, complianceApproved, complianceRejected, opsApproved, opsRejected },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
