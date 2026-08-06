import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MANAGE_ROLES = ["OPERATIONS", "ADMIN", "SUPER_ADMIN"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !MANAGE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const patch: { active?: boolean; name?: string; description?: string | null } = {};
    if (typeof body?.active === "boolean") patch.active = body.active;
    if (typeof body?.name === "string") {
      const n = body.name.trim();
      if (!n) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      if (n.length > 120) return NextResponse.json({ error: "Name is too long" }, { status: 400 });
      patch.name = n;
    }
    if (typeof body?.description === "string") {
      const d = body.description.trim();
      if (d.length > 2000) return NextResponse.json({ error: "Description is too long" }, { status: 400 });
      patch.description = d || null;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: patch,
    });

    return NextResponse.json({ campaign: updated });
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
