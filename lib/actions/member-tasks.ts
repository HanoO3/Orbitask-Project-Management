"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notifications";

async function requireMember() {
  const session = await auth();
  if (session?.user?.role !== "TEAM_MEMBER") {
    throw new Error("Unauthorized: Team Member access required");
  }
  return session;
}

export async function getMyMemberProjects() {
  const session = await requireMember();

  return prisma.project.findMany({
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
}

export async function getMyTasks(scope: "assigned" | "all_project_tasks" = "assigned") {
  const session = await requireMember();

  const whereClause =
    scope === "all_project_tasks"
      ? { project: { members: { some: { userId: session.user.id } } } }
      : { assigneeId: session.user.id };

  return prisma.task.findMany({
    where: whereClause,
    orderBy: { dueDate: "asc" },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      _count: { select: { comments: true } },
    },
  });
}

export async function getMyTaskStats() {
  const session = await requireMember();

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
  const session = await requireMember();

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.assigneeId !== session.user.id) {
    throw new Error("Unauthorized: Not your task");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  if (status === "COMPLETED") {
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
  const session = await requireMember();

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
    recentTasks,
  };
}