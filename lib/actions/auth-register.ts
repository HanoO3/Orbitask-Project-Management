"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER";
}) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const role = data.role || "TEAM_MEMBER";

  if (!name || !email || !password) {
    return { success: false, error: "All fields are required" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      approvalStatus: "PENDING",
      avatar: "🚀",
    },
  });

  return { success: true };
}
