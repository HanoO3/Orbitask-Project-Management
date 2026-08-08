"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireTaskAccess(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: { members: true },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const { role, id: userId } = session.user;

  const isAdmin = role === "ADMIN";
  const isProjectManager =
    role === "PROJECT_MANAGER" &&
    (task.project.managerId === userId || task.creatorId === userId);
  const isAssignee = task.assigneeId === userId;
  const isProjectMember = task.project.members.some((m) => m.userId === userId);

  if (!isAdmin && !isProjectManager && !isAssignee && !isProjectMember) {
    throw new Error("Unauthorized: No access to this task");
  }

  return { session, task };
}

export async function getTaskDetail(taskId: string) {
  await requireTaskAccess(taskId);

  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { id: true, name: true, managerId: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
}

export async function addTaskComment(taskId: string, content: string) {
  const { session } = await requireTaskAccess(taskId);

  if (!content.trim()) {
    return { success: false, error: "Comment cannot be empty" };
  }

  await prisma.taskComment.create({
    data: {
      taskId,
      userId: session.user.id,
      content: content.trim(),
    },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId } });

  const notifyUserId =
    session.user.id === task?.assigneeId ? task?.creatorId : task?.assigneeId;

  if (notifyUserId && notifyUserId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: "NEW_DISCUSSION",
        message: `${session.user.name} commented on task "${task?.title}"`,
      },
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/member/dashboard");
  revalidatePath("/manager/dashboard");
  if (task?.projectId) {
    revalidatePath(`/manager/projects/${task.projectId}`);
  }
  return { success: true };
}

export async function getUserWorkspaceTasks() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const role = session.user.role;

  let whereClause: Prisma.TaskWhereInput = {};

  if (role === "PROJECT_MANAGER") {
    whereClause = {
      OR: [
        { project: { managerId: userId } },
        { assigneeId: userId },
        { creatorId: userId },
      ],
    };
  } else if (role === "TEAM_MEMBER") {
    whereClause = {
      OR: [
        { assigneeId: userId },
        { project: { members: { some: { userId } } } },
      ],
    };
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { dueDate: "asc" },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  return tasks;
}

export async function toggleTaskStatus(taskId: string) {
  const { task } = await requireTaskAccess(taskId);

  const newStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/member/dashboard");
  revalidatePath("/manager/dashboard");
  return { success: true, newStatus };
}