import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const msgs = parsed.error.issues.map((i) => i.message);
      return NextResponse.json({ error: "Validation failed", details: msgs }, { status: 400 });
    }

    const { newPassword } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    });

    await logActivity({
      userId: session.user.id,
      action: "PASSWORD_RESET",
      details: `Reset password for user ${targetUser.email} (${targetUser.firstName} ${targetUser.lastName})`,
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
