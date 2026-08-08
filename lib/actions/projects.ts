"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getProjects() {
  await requireAdmin();
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });
}

export async function getUserProjects() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const role = session.user.role;

  let whereClause: Prisma.ProjectWhereInput = {};
  if (role === "PROJECT_MANAGER") {
    whereClause = {
      OR: [
        { managerId: userId },
        { members: { some: { userId } } }
      ]
    };
  } else if (role === "TEAM_MEMBER") {
    whereClause = {
      members: { some: { userId } }
    };
  }

  const projects = await prisma.project.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      },
      tasks: {
        select: { id: true, status: true }
      }
    }
  });

  // Deduplicate by project ID / name to prevent duplicate rendering
  const uniqueMap = new Map<string, (typeof projects)[number]>();
  for (const p of projects) {
    if (!uniqueMap.has(p.name)) {
      uniqueMap.set(p.name, p);
    }
  }
  const uniqueProjects = Array.from(uniqueMap.values());

  return uniqueProjects.map((p) => {
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let displayStatus: "On track" | "At risk" | "Delayed" | "Completed" = "On track";
    if (p.status === "COMPLETED") {
      displayStatus = "Completed";
    } else if (p.status === "ON_HOLD") {
      displayStatus = "At risk";
    } else if (new Date(p.endDate) < new Date() && progress < 100) {
      displayStatus = "Delayed";
    } else if (p.priority === "URGENT") {
      displayStatus = "At risk";
    }

    return {
      ...p,
      progress,
      displayStatus,
    };
  });
}

export async function getProjectManagers() {
  await requireAdmin();
  return prisma.user.findMany({
    where: { role: "PROJECT_MANAGER" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function createProject(data: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  managerId: string;
}) {
  await requireAdmin();

  if (new Date(data.endDate) < new Date(data.startDate)) {
    return { success: false, error: "End date cannot be before start date" };
  }

  await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      priority: data.priority,
      status: data.status,
      managerId: data.managerId,
    },
  });

  revalidatePath("/admin/projects");
  return { success: true };
}

export async function updateProject(
  id: string,
  data: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
    managerId: string;
  }
) {
  await requireAdmin();

  if (new Date(data.endDate) < new Date(data.startDate)) {
    return { success: false, error: "End date cannot be before start date" };
  }

  await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      priority: data.priority,
      status: data.status,
      managerId: data.managerId,
    },
  });

  revalidatePath("/admin/projects");
  return { success: true };
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  return { success: true };
}