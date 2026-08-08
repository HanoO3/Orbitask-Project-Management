"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getAnalyticsData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const role = session.user.role;

  let projectWhere: Record<string, unknown> = {};
  let taskWhere: Record<string, unknown> = {};

  if (role === "PROJECT_MANAGER") {
    projectWhere = {
      OR: [{ managerId: userId }, { members: { some: { userId } } }],
    };
    taskWhere = {
      project: {
        OR: [{ managerId: userId }, { members: { some: { userId } } }],
      },
    };
  } else if (role === "TEAM_MEMBER") {
    projectWhere = {
      members: { some: { userId } },
    };
    taskWhere = {
      assigneeId: userId,
    };
  }

  const [projects, tasks, usersCount] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: {
        tasks: true,
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    role === "ADMIN" ? prisma.user.count({ where: { approvalStatus: "APPROVED" } }) : Promise.resolve(0),
  ]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldProjects = projects.filter((p) => p.status === "ON_HOLD").length;

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const reviewTasks = tasks.filter((t) => t.status === "REVIEW").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;

  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const priorityBreakdown = {
    URGENT: tasks.filter((t) => t.priority === "URGENT").length,
    HIGH: tasks.filter((t) => t.priority === "HIGH").length,
    MEDIUM: tasks.filter((t) => t.priority === "MEDIUM").length,
    LOW: tasks.filter((t) => t.priority === "LOW").length,
  };

  const statusBreakdown = {
    TODO: todoTasks,
    IN_PROGRESS: inProgressTasks,
    REVIEW: reviewTasks,
    COMPLETED: completedTasks,
  };

  const now = new Date();
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "COMPLETED" && new Date(t.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.project.name,
      dueDate: t.dueDate,
      priority: t.priority,
      assigneeName: t.assignee?.name || "Unassigned",
    }));

  // Member Workload
  const memberWorkloadMap = new Map<string, { id: string; name: string; totalTasks: number; completedTasks: number }>();
  tasks.forEach((t) => {
    if (t.assignee) {
      const existing = memberWorkloadMap.get(t.assignee.id) || {
        id: t.assignee.id,
        name: t.assignee.name,
        totalTasks: 0,
        completedTasks: 0,
      };
      existing.totalTasks += 1;
      if (t.status === "COMPLETED") existing.completedTasks += 1;
      memberWorkloadMap.set(t.assignee.id, existing);
    }
  });

  const memberWorkload = Array.from(memberWorkloadMap.values());

  return {
    role,
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    taskCompletionRate,
    priorityBreakdown,
    statusBreakdown,
    upcomingDeadlines,
    memberWorkload,
    usersCount,
  };
}
