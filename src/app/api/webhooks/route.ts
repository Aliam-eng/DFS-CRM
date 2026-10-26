import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WebhookEvent } from "@prisma/client";
import { generateSecret } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set<string>(Object.values(WebhookEvent));

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await prisma.webhook.findMany({
    include: {
      creator: { select: { firstName: true, lastName: true } },
      _count: { select: { deliveries: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Collect latest delivery per webhook so the table can show status
  const latestByWebhook = await prisma.webhookDelivery.groupBy({
    by: ["webhookId"],
    _max: { attemptedAt: true },
    where: { webhookId: { in: webhooks.map((w) => w.id) } },
  });
  const latestIds = await prisma.webhookDelivery.findMany({
    where: {
      OR: latestByWebhook.map((g) => ({
        webhookId: g.webhookId,
        attemptedAt: g._max.attemptedAt!,
      })),
    },
    select: { webhookId: true, success: true, responseStatus: true, attemptedAt: true },
  });
  const latestMap = new Map(latestIds.map((d) => [d.webhookId, d]));

  return NextResponse.json({
    webhooks: webhooks.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      event: w.event,
      active: w.active,
      createdAt: w.createdAt,
      createdBy: `${w.creator.firstName} ${w.creator.lastName}`.trim(),
      deliveryCount: w._count.deliveries,
      lastDelivery: latestMap.get(w.id) ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const event = body?.event;

  if (!name || name.length > 120) return NextResponse.json({ error: "Name required (max 120 chars)" }, { status: 400 });
  if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: "URL must start with http:// or https://" }, { status: 400 });
  if (!event || !VALID_EVENTS.has(event)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const created = await prisma.webhook.create({
    data: {
      name,
      url,
      event: event as WebhookEvent,
      secret: generateSecret(),
      createdByUserId: session.user.id,
    },
  });

  // Return the secret only on create — displayed once in the UI
  return NextResponse.json({ webhook: created }, { status: 201 });
}
