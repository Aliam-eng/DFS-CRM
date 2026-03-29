import { prisma } from "./prisma";
import { NotificationType, UserRole } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}

export async function notifyByRole(
  role: UserRole,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  const users = await prisma.user.findMany({
    where: { role, status: "ACTIVE" },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type,
      title,
      message,
      link,
    })),
  });
}
