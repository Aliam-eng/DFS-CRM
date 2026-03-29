import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["CLIENT", "COMPLIANCE", "OPERATIONS", "ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If CLIENT, verify they own this KYC
    if (session.user.role === "CLIENT") {
      const kyc = await prisma.kycSubmission.findUnique({
        where: { id: params.id },
        select: { userId: true },
      });

      if (!kyc || kyc.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const history = await prisma.kycHistory.findMany({
      where: { kycSubmissionId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("KYC history fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
