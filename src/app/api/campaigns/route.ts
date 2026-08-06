import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MANAGE_ROLES = ["OPERATIONS", "ADMIN", "SUPER_ADMIN"];
const VIEW_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"];

// Short URL-safe code, e.g. dfsA7b3xK. Not cryptographically important — just
// unique enough to avoid collisions in the same account.
function generateCode(): string {
  return "dfs" + crypto.randomBytes(4).toString("base64url").replace(/[_-]/g, "").slice(0, 6);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !VIEW_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      include: {
        creator: { select: { firstName: true, lastName: true, role: true } },
        _count: { select: { signups: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        active: c.active,
        createdAt: c.createdAt,
        signupCount: c._count.signups,
        creator: c.creator ? `${c.creator.firstName} ${c.creator.lastName}`.trim() : "",
        creatorRole: c.creator?.role ?? "",
      })),
    });
  } catch (error) {
    console.error("List campaigns error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (name.length > 120) return NextResponse.json({ error: "Name is too long" }, { status: 400 });
    if (description.length > 2000) return NextResponse.json({ error: "Description is too long" }, { status: 400 });

    // Retry a few times if we hit a code collision (extremely unlikely
    // given the pool but harmless to guard against).
    let code = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const exists = await prisma.campaign.findUnique({ where: { code: candidate } });
      if (!exists) { code = candidate; break; }
    }
    if (!code) return NextResponse.json({ error: "Could not generate a unique code — try again" }, { status: 500 });

    const created = await prisma.campaign.create({
      data: {
        code,
        name,
        description: description || null,
        createdByUserId: session.user.id,
      },
    });

    return NextResponse.json({ campaign: created }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
