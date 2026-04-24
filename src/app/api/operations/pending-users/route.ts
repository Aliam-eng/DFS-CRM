import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["OPERATIONS", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "PENDING"; // PENDING | SUSPENDED | ALL

    const where: Record<string, unknown> = { role: "CLIENT" };

    if (filter === "PENDING") {
      where.status = "PENDING_VERIFICATION";
    } else if (filter === "SUSPENDED") {
      where.status = { in: ["SUSPENDED", "DEACTIVATED"] };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Pending users list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
