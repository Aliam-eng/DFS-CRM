import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhook = await prisma.webhook.findUnique({
    where: { id: params.id },
    include: {
      deliveries: {
        orderBy: { attemptedAt: "desc" },
        take: 50,
      },
    },
  });
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Never leak the secret after creation
  const { secret: _secret, ...safe } = webhook;
  void _secret;
  return NextResponse.json({ webhook: safe });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const patch: { name?: string; url?: string; active?: boolean } = {};
  if (typeof body?.active === "boolean") patch.active = body.active;
  if (typeof body?.name === "string") {
    const n = body.name.trim();
    if (!n || n.length > 120) return NextResponse.json({ error: "Name required (max 120 chars)" }, { status: 400 });
    patch.name = n;
  }
  if (typeof body?.url === "string") {
    const u = body.url.trim();
    if (!/^https?:\/\//i.test(u)) return NextResponse.json({ error: "URL must start with http:// or https://" }, { status: 400 });
    patch.url = u;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.webhook.update({ where: { id: params.id }, data: patch });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.webhook.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
