"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createNotification(
  userId: string,
  type: "TASK_ASSIGNED" | "TASK_STATUS_UPDATED" | "NEW_DISCUSSION" | "DEADLINE_APPROACHING" | "PROJECT_ASSIGNED",
  message: string
) {
  await prisma.notification.create({
    data: { userId, type, message },
  });
}

export async function getMyNotifications() {
  const session = await auth();
  if (!session?.user) return [];

  try {
    await checkApproachingDeadlines();
  } catch (err) {
    console.error("Deadline check error:", err);
  }

  const notifs = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return notifs.map((n) => ({
    ...n,
    createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : '',
  }));
}

export async function getUnreadCount() {
  const session = await auth();
  if (!session?.user) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/");
}

export async function deleteNotification(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/");
}

export async function clearAllNotifications() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.notification.deleteMany({
    where: { userId: session.user.id },
  });

  revalidatePath("/");
}

export async function checkApproachingDeadlines() {
  const session = await auth();
  if (!session?.user) return;

  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Find non-completed tasks assigned to the user due within the next 48 hours
  const upcomingTasks = await prisma.task.findMany({
    where: {
      assigneeId: session.user.id,
      status: { not: "COMPLETED" },
      dueDate: { gte: now, lte: next48Hours },
    },
    include: { project: true },
  });

  for (const task of upcomingTasks) {
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId: session.user.id,
        type: "DEADLINE_APPROACHING",
        message: { contains: task.title },
      },
    });

    if (!existingNotif) {
      await createNotification(
        session.user.id,
        "DEADLINE_APPROACHING",
        `Deadline approaching for task "${task.title}" in ${task.project.name}`
      );
    }
  }
}