import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resendDelivery } from "@/lib/webhooks";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { deliveryId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await resendDelivery(params.deliveryId);
  if (!ok) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
