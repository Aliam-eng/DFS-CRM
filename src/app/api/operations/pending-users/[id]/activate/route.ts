import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !["OPERATIONS", "ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role !== "CLIENT") {
      return NextResponse.json({ error: "Only client accounts can be activated here" }, { status: 400 });
    }

    if (target.status === "ACTIVE") {
      return NextResponse.json({ error: "User is already active" }, { status: 400 });
    }

    // Activate + mark email verified (staff override — no OTP needed)
    await prisma.user.update({
      where: { id: target.id },
      data: { status: "ACTIVE", emailVerified: true },
    });

    await logActivity({
      userId: session.user.id,
      action: "USER_ACTIVATED",
      details: `Activated client ${target.email}${target.emailVerified ? "" : " (email verification bypassed)"}`,
    });

    // Notify the client their account is active
    await createNotification({
      userId: target.id,
      type: "GENERAL",
      title: "Account Activated",
      message: "Your account has been activated. You can now log in and start your KYC application.",
      link: "/login",
    });

    return NextResponse.json({ message: "User activated successfully" });
  } catch (error) {
    console.error("Activate user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
