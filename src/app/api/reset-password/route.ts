import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    // Verify OTP
    const otp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        purpose: "PASSWORD_RESET",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(code, otp.code);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
    }

    // Mark OTP as used and update password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.otp.update({ where: { id: otp.id }, data: { used: true } }),
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    ]);

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
