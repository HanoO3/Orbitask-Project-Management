"use server";

import { prisma } from "@/lib/prisma";
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