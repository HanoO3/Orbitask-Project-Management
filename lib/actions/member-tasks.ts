"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notifications";

export async function getMyMemberProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      _count: { select: { tasks: true, members: true } },
      tasks: {
        select: { id: true, status: true },
      },
    },
  });

  return projects.map((p) => ({
    ...p,
    startDate: p.startDate ? new Date(p.startDate).toISOString() : '',
    endDate: p.endDate ? new Date(p.endDate).toISOString() : '',
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
  }));
}

export async function getMyTasks(scope: "assigned" | "all_project_tasks" = "assigned") {
  const session = await auth();
  if (!session?.user?.id) return [];

  const whereClause =
    scope === "all_project_tasks"
      ? { project: { members: { some: { userId: session.user.id } } } }
      : { assigneeId: session.user.id };

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { dueDate: "asc" },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });

  return tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : '',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
  }));
}

export async function getMyTaskStats() {
  const session = await auth();
  if (!session?.user?.id) {
    return { totalProjects: 0, totalTasks: 0, pendingTasks: 0, completedTasks: 0, overdueTasks: 0 };
  }

  const [projectsCount, tasks] = await Promise.all([
    prisma.project.count({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: session.user.id },
          { project: { members: { some: { userId: session.user.id } } } },
        ],
      },
    }),
  ]);

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && new Date(t.dueDate) < new Date()
  ).length;

  return { totalProjects: projectsCount, totalTasks, pendingTasks, completedTasks, overdueTasks };
}

export async function updateMyTaskStatus(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || (session.user.role === "TEAM_MEMBER" && task.assigneeId !== session.user.id)) {
    return { success: false, error: "Unauthorized: Not your task" };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  if (status === "REVIEW") {
    await createNotification(
      task.creatorId,
      "TASK_STATUS_UPDATED",
      `Task "${task.title}" was submitted for review by ${session.user.name}`
    );
  } else if (status === "COMPLETED") {
    await createNotification(
      task.creatorId,
      "TASK_STATUS_UPDATED",
      `Task "${task.title}" was marked as completed by ${session.user.name}`
    );
  }

  revalidatePath("/member/dashboard");
  return { success: true };
}

export async function getMemberWorkspaceOverview() {
  const session = await auth();
  if (!session?.user?.id) {
    return { totalWorkspaceUsers: 0, recentUsers: [], recentTasks: [] };
  }

  const [totalWorkspaceUsers, recentUsers, recentTasks] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, role: true },
    }),
    prisma.task.findMany({
      where: {
        project: {
          members: { some: { userId: session.user.id } },
        },
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    totalWorkspaceUsers,
    recentUsers,
    recentTasks: recentTasks.map((t) => ({
      ...t,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : '',
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : '',
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : '',
    })),
  };
}