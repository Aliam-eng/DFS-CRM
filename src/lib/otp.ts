import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendOtpEmail } from "./email";

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function createAndSendOtp(userId: string, email: string, purpose: string) {
  // Invalidate existing unused OTPs
  await prisma.otp.updateMany({
    where: { userId, purpose, used: false },
    data: { used: true },
  });

  const plainOtp = generateOtp();
  const hashedOtp = await bcrypt.hash(plainOtp, 10);

  await prisma.otp.create({
    data: {
      userId,
      code: hashedOtp,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  await sendOtpEmail(email, plainOtp, purpose);
  return true;
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return false;

  const otp = await prisma.otp.findFirst({
    where: {
      userId: user.id,
      purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return false;

  const isValid = await bcrypt.compare(code, otp.code);
  if (!isValid) return false;

  await prisma.otp.update({
    where: { id: otp.id },
    data: { used: true },
  });

  if (purpose === "EMAIL_VERIFICATION") {
    // OTP success → verify email AND activate the account so the client can log in.
    // (If they couldn't receive the OTP, staff can do this manually from the
    // Client Verification page.)
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, status: "ACTIVE" },
    });
  }

  return true;
}
