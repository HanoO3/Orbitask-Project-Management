import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      id: "admin-user",
      name: "Hana Nasir",
      email: "admin@orbitask.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  const projectManager = await prisma.user.upsert({
    where: { email: "pm@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "PROJECT_MANAGER",
    },
    create: {
      id: "pm-user",
      name: "Test PM",
      email: "pm@orbitask.com",
      password: hashedPassword,
      role: "PROJECT_MANAGER",
    },
  });

  const teamMemberOne = await prisma.user.upsert({
    where: { email: "tm1@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "TEAM_MEMBER",
    },
    create: {
      id: "tm1-user",
      name: "Test TM 1",
      email: "tm1@orbitask.com",
      password: hashedPassword,
      role: "TEAM_MEMBER",
    },
  });

  const teamMemberTwo = await prisma.user.upsert({
    where: { email: "tm2@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "TEAM_MEMBER",
    },
    create: {
      id: "tm2-user",
      name: "Test TM 2",
      email: "tm2@orbitask.com",
      password: hashedPassword,
      role: "TEAM_MEMBER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "attendance-project" },
    update: {
      name: "Student Attendance Tracking System",
      description:
        "A web-based attendance management system with secure authentication, teacher/student workflows, and reporting.",
      startDate: new Date("2026-08-06T00:00:00.000Z"),
      endDate: new Date("2026-08-16T00:00:00.000Z"),
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      managerId: projectManager.id,
    },
    create: {
      id: "attendance-project",
      name: "Student Attendance Tracking System",
      description:
        "A web-based attendance management system with secure authentication, teacher/student workflows, and reporting.",
      startDate: new Date("2026-08-06T00:00:00.000Z"),
      endDate: new Date("2026-08-16T00:00:00.000Z"),
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      manager: {
        connect: { id: projectManager.id },
      },
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: teamMemberOne.id } },
    update: {},
    create: {
      id: "attendance-project-member-1",
      projectId: project.id,
      userId: teamMemberOne.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: teamMemberTwo.id } },
    update: {},
    create: {
      id: "attendance-project-member-2",
      projectId: project.id,
      userId: teamMemberTwo.id,
    },
  });

  await prisma.task.upsert({
    where: { id: "task-1" },
    update: {
      title: "Design database schema",
      description: "Define project, attendance, user, and reporting tables for the attendance tracking system.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-08-10T17:00:00.000Z"),
      projectId: project.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-1",
      title: "Design database schema",
      description: "Define project, attendance, user, and reporting tables for the attendance tracking system.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-08-10T17:00:00.000Z"),
      project: { connect: { id: project.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-2" },
    update: {
      title: "Build attendance UI",
      description: "Create the student attendance interface, including daily attendance entry and summary views.",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: new Date("2026-08-12T17:00:00.000Z"),
      projectId: project.id,
      assigneeId: teamMemberTwo.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-2",
      title: "Build attendance UI",
      description: "Create the student attendance interface, including daily attendance entry and summary views.",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: new Date("2026-08-12T17:00:00.000Z"),
      project: { connect: { id: project.id } },
      assignee: { connect: { id: teamMemberTwo.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-3" },
    update: {
      title: "Implement authentication flow",
      description: "Add secure login, role-based access, and user session management for the application.",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-08-14T17:00:00.000Z"),
      projectId: project.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-3",
      title: "Implement authentication flow",
      description: "Add secure login, role-based access, and user session management for the application.",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-08-14T17:00:00.000Z"),
      project: { connect: { id: project.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  console.log("? Seed data created:");
  console.log("  Admin:", admin.email);
  console.log("  Project Manager:", projectManager.email);
  console.log("  Team Member 1:", teamMemberOne.email);
  console.log("  Team Member 2:", teamMemberTwo.email);
  console.log("  Project:", project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
