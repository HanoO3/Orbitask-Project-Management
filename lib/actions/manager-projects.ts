"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notifications";

async function requireManager() {
  const session = await auth();
  if (session?.user?.role !== "PROJECT_MANAGER") {
    throw new Error("Unauthorized: Project Manager access required");
  }
  return session;
}

async function requireOwnedProject(projectId: string) {
  const session = await requireManager();
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.managerId !== session.user.id) {
    throw new Error("Unauthorized: Not your project");
  }
  return session;
}

export async function getMyProjects() {
  const session = await requireManager();

  return prisma.project.findMany({
    where: { managerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true, members: true } },
      tasks: {
        select: { status: true },
      },
    },
  });
}

export async function getMyProjectStats() {
  const session = await requireManager();

  const projects = await prisma.project.findMany({
    where: { managerId: session.user.id },
    include: { tasks: true },
  });

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const allTasks = projects.flatMap((p) => p.tasks);
  const pendingTasks = allTasks.filter((t) => t.status !== "COMPLETED").length;
  const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;

  return { totalProjects, activeProjects, pendingTasks, completedTasks };
}

export async function getProjectById(projectId: string) {
  await requireOwnedProject(projectId);

  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });
}

export async function getAvailableTeamMembers(projectId: string) {
  await requireOwnedProject(projectId);

  return prisma.user.findMany({
    where: {
      role: "TEAM_MEMBER",
      projectMemberships: { none: { projectId } },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function getAssignableMembers(projectId: string) {
  await requireOwnedProject(projectId);

  return prisma.user.findMany({
    where: {
      role: "TEAM_MEMBER",
      projectMemberships: { some: { projectId } },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function addProjectMember(projectId: string, userId: string) {
  await requireOwnedProject(projectId);

  await prisma.projectMember.create({
    data: { projectId, userId },
  });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  await createNotification(
    userId,
    "PROJECT_ASSIGNED",
    `You were added to the project "${project?.name}"`
  );

  revalidatePath(`/manager/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectMember(projectId: string, memberId: string) {
  await requireOwnedProject(projectId);

  await prisma.task.updateMany({
    where: { projectId, assigneeId: memberId },
    data: { assigneeId: null },
  });

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId: memberId } },
  });

  revalidatePath(`/manager/projects/${projectId}`);
  return { success: true };
}

export async function createTask(
  projectId: string,
  data: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
    dueDate: string;
    assigneeId: string | null;
  }
) {
  const session = await requireOwnedProject(projectId);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: new Date(data.dueDate),
      assigneeId: data.assigneeId || null,
      projectId,
      creatorId: session.user.id,
    },
  });

  if (data.assigneeId) {
    await createNotification(
      data.assigneeId,
      "TASK_ASSIGNED",
      `You were assigned a new task: "${data.title}"`
    );
  }

  revalidatePath(`/manager/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(
  taskId: string,
  projectId: string,
  data: {
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
    dueDate: string;
    assigneeId: string | null;
  }
) {
  await requireOwnedProject(projectId);

  const previousTask = await prisma.task.findUnique({ where: { id: taskId } });

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: new Date(data.dueDate),
      assigneeId: data.assigneeId || null,
    },
  });

  // Notify only if the assignee changed to someone new
  if (data.assigneeId && data.assigneeId !== previousTask?.assigneeId) {
    await createNotification(
      data.assigneeId,
      "TASK_ASSIGNED",
      `You were assigned to task: "${data.title}"`
    );
  }

  revalidatePath(`/manager/projects/${projectId}`);
  return { success: true };
}

export async function deleteTask(taskId: string, projectId: string) {
  await requireOwnedProject(projectId);
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/manager/projects/${projectId}`);
  return { success: true };
}