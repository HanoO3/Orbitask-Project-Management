"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notifications";

async function requireTaskAccess(taskId: string) {
  const session = await auth();
  if (!session?.user) {
    return null;
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
    return null;
  }

  const { role, id: userId } = session.user;

  const isAdmin = role === "ADMIN";
  const isProjectManager =
    role === "PROJECT_MANAGER" &&
    (task.project.managerId === userId || task.creatorId === userId);
  const isAssignee = task.assigneeId === userId;
  const isProjectMember = task.project.members.some((m) => m.userId === userId);

  if (!isAdmin && !isProjectManager && !isAssignee && !isProjectMember) {
    return null;
  }

  return { session, task };
}

export async function getTaskDetail(taskId: string) {
  const access = await requireTaskAccess(taskId);
  if (!access) return null;

  const t = await prisma.task.findUnique({
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

  if (!t) return null;

  return {
    ...t,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : '',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
    comments: t.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : '',
    })),
  };
}

export async function addTaskComment(taskId: string, content: string) {
  const access = await requireTaskAccess(taskId);
  if (!access) return { success: false, error: "Unauthorized" };
  const { session } = access;

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
  if (!session?.user?.id) return [];

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

  return tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : '',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
  }));
}

export async function toggleTaskStatus(taskId: string) {
  const access = await requireTaskAccess(taskId);
  if (!access) return { success: false, error: "Unauthorized" };
  const { session, task } = access;

  let newStatus: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

  if (session.user.role === "TEAM_MEMBER") {
    if (task.status === "TODO") {
      newStatus = "IN_PROGRESS";
    } else if (task.status === "IN_PROGRESS") {
      newStatus = "REVIEW";
    } else if (task.status === "COMPLETED") {
      newStatus = "TODO";
    } else {
      newStatus = "REVIEW";
    }
  } else {
    if (task.status === "TODO") {
      newStatus = "IN_PROGRESS";
    } else if (task.status === "IN_PROGRESS") {
      newStatus = "REVIEW";
    } else if (task.status === "REVIEW") {
      newStatus = "COMPLETED";
    } else {
      newStatus = "TODO";
    }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  if (newStatus === "REVIEW") {
    await createNotification(
      task.creatorId,
      "TASK_STATUS_UPDATED",
      `Task "${task.title}" was submitted for review by ${session.user.name}`
    );
  } else if (newStatus === "COMPLETED") {
    await createNotification(
      task.creatorId,
      "TASK_STATUS_UPDATED",
      `Task "${task.title}" was marked as completed by ${session.user.name}`
    );
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/member/dashboard");
  revalidatePath("/manager/dashboard");
  return { success: true, newStatus };
}