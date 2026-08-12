"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function createActivity(
  type: string,
  message: string,
  projectId?: string,
  taskId?: string,
  metadata?: string
) {
  const session = await auth();
  const userId = session?.user?.id;

  try {
    return await prisma.activity.create({
      data: {
        type,
        message,
        projectId,
        taskId,
        userId,
        metadata,
      },
    });
  } catch (err) {
    console.error("Failed to record activity:", err);
    return null;
  }
}

export async function getProjectActivities(projectId: string) {
  const session = await auth();
  if (!session?.user) return [];

  // Security check: ensure user is admin, manager, or member of the project
  if (session.user.role !== "ADMIN") {
    const isManager = await prisma.project.findFirst({
      where: { id: projectId, managerId: session.user.id },
    });
    const isMember = await prisma.projectMember.findFirst({
      where: { projectId, userId: session.user.id },
    });

    if (!isManager && !isMember) {
      return [];
    }
  }

  const activities = await prisma.activity.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return activities.map((a) => ({
    ...a,
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : '',
  }));
}

export async function getSystemActivities() {
  const session = await auth();
  if (!session?.user) return [];

  let whereClause = {};

  if (session.user.role === "PROJECT_MANAGER") {
    whereClause = {
      project: {
        OR: [
          { managerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    };
  } else if (session.user.role === "TEAM_MEMBER") {
    whereClause = {
      project: {
        members: { some: { userId: session.user.id } },
      },
    };
  }

  const activities = await prisma.activity.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return activities.map((a) => ({
    ...a,
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : '',
  }));
}
