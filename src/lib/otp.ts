import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendOtpEmail } from "./email";
import { notifyByRole } from "./notifications";

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
    // Mark email verified, but keep status PENDING_VERIFICATION
    // — Operations/Admin/Super Admin must activate the account before the user can log in.
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Notify staff who can activate (fire-and-forget — never block OTP verification)
    const title = "New Client Awaiting Activation";
    const message = `${user.firstName} ${user.lastName} (${user.email}) has verified their email and is awaiting activation.`;
    const link = "/operations/pending-users";

    Promise.all([
      notifyByRole("OPERATIONS", "GENERAL", title, message, link),
      notifyByRole("ADMIN", "GENERAL", title, message, link),
      notifyByRole("SUPER_ADMIN", "GENERAL", title, message, link),
    ]).catch((err) => console.error("Failed to notify staff about new signup:", err));
  }

  return true;
}
