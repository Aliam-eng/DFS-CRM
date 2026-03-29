import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      usersByRole,
      kycByStatus,
      totalDocuments,
      totalNotifications,
      totalUsers,
      totalKyc,
    ] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.kycSubmission.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.kycDocument.count(),
      prisma.notification.count(),
      prisma.user.count(),
      prisma.kycSubmission.count(),
    ]);

    const userRoleBreakdown: Record<string, number> = {};
    for (const entry of usersByRole) {
      userRoleBreakdown[entry.role] = entry._count.id;
    }

    const kycStatusBreakdown: Record<string, number> = {};
    for (const entry of kycByStatus) {
      kycStatusBreakdown[entry.status] = entry._count.id;
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: userRoleBreakdown,
      },
      kyc: {
        total: totalKyc,
        byStatus: kycStatusBreakdown,
      },
      totalDocuments,
      totalNotifications,
    });
  } catch (error) {
    console.error("System stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
