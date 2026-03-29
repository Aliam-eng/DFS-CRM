import { prisma } from "./prisma";
import { headers } from "next/headers";

export async function logActivity(params: {
  userId: string;
  action: string;
  details?: string;
}) {
  const headersList = headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";

  return prisma.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      details: params.details || null,
      ipAddress: ip,
    },
  });
}
