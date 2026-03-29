import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
