"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const [user, projectsCount, tasksCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    }),
    prisma.project.count({
      where: {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } },
        ],
      },
    }),
    prisma.task.count({
      where: {
        OR: [
          { assigneeId: userId },
          { creatorId: userId },
        ],
      },
    }),
  ]);

  if (!user) {
    return null;
  }

  return {
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
    stats: {
      projectsCount,
      tasksCount,
    },
  };
}

export async function updateProfile(data: {
  name: string;
  email: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) {
    return { success: false, error: "User not found" };
  }

  // Check email uniqueness if changing email
  if (data.email.toLowerCase() !== currentUser.email.toLowerCase()) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existingEmail) {
      return { success: false, error: "Email is already taken by another account" };
    }
  }

  let updatedPassword = currentUser.password;

  // Handle password change if requested
  if (data.newPassword) {
    if (!data.currentPassword) {
      return { success: false, error: "Please enter your current password to set a new password" };
    }

    const isValid = await bcrypt.compare(data.currentPassword, currentUser.password);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    if (data.newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long" };
    }

    updatedPassword = await bcrypt.hash(data.newPassword, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      avatar: data.avatar || null,
      password: updatedPassword,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/member/dashboard");
  revalidatePath("/manager/dashboard");
  revalidatePath("/admin/dashboard");

  return { success: true };
}
