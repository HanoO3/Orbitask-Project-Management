"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getWorkspaceUsers() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
}) {
  await requireAdmin();

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    return { success: false, error: "Email already exists" };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
    password?: string;
  }
) {
  await requireAdmin();

  const existing = await prisma.user.findFirst({
    where: { email: data.email, NOT: { id } },
  });

  if (existing) {
    return { success: false, error: "Email already used by another user" };
  }

  if (data.password && data.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();

  if (session.user.id === id) {
    return { success: false, error: "You cannot delete your own account" };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return { success: true };
}