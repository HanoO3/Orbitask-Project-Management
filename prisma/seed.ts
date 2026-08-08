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
      approvalStatus: "APPROVED",
    },
    create: {
      id: "admin-user",
      name: "Hana Nasir",
      email: "admin@orbitask.com",
      password: hashedPassword,
      role: "ADMIN",
      approvalStatus: "APPROVED",
    },
  });

  const projectManager = await prisma.user.upsert({
    where: { email: "pm@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "PROJECT_MANAGER",
      approvalStatus: "APPROVED",
    },
    create: {
      id: "pm-user",
      name: "Test PM",
      email: "pm@orbitask.com",
      password: hashedPassword,
      role: "PROJECT_MANAGER",
      approvalStatus: "APPROVED",
    },
  });

  const teamMemberOne = await prisma.user.upsert({
    where: { email: "tm1@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "TEAM_MEMBER",
      approvalStatus: "APPROVED",
    },
    create: {
      id: "tm1-user",
      name: "Test TM 1",
      email: "tm1@orbitask.com",
      password: hashedPassword,
      role: "TEAM_MEMBER",
      approvalStatus: "APPROVED",
    },
  });

  const teamMemberTwo = await prisma.user.upsert({
    where: { email: "tm2@orbitask.com" },
    update: {
      password: hashedPassword,
      role: "TEAM_MEMBER",
      approvalStatus: "APPROVED",
    },
    create: {
      id: "tm2-user",
      name: "Test TM 2",
      email: "tm2@orbitask.com",
      password: hashedPassword,
      role: "TEAM_MEMBER",
      approvalStatus: "APPROVED",
    },
  });

  // Project 1: Student Attendance Tracking System
  const p1 = await prisma.project.upsert({
    where: { id: "attendance-project" },
    update: {
      name: "Student Attendance Tracking System",
      description:
        "A web-based attendance management system with secure authentication, teacher/student workflows, and automated PDF reporting.",
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
        "A web-based attendance management system with secure authentication, teacher/student workflows, and automated PDF reporting.",
      startDate: new Date("2026-08-06T00:00:00.000Z"),
      endDate: new Date("2026-08-16T00:00:00.000Z"),
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      manager: { connect: { id: projectManager.id } },
    },
  });

  // Project 2: E-Commerce Platform Redesign
  const p2 = await prisma.project.upsert({
    where: { id: "ecommerce-project" },
    update: {
      name: "E-Commerce Platform Redesign",
      description:
        "Modern online store overhaul featuring product catalog filtering, persistent shopping cart, and Stripe payment gateway integration.",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-25T00:00:00.000Z"),
      priority: "HIGH",
      status: "ON_HOLD",
      managerId: projectManager.id,
    },
    create: {
      id: "ecommerce-project",
      name: "E-Commerce Platform Redesign",
      description:
        "Modern online store overhaul featuring product catalog filtering, persistent shopping cart, and Stripe payment gateway integration.",
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      endDate: new Date("2026-08-25T00:00:00.000Z"),
      priority: "HIGH",
      status: "ON_HOLD",
      manager: { connect: { id: projectManager.id } },
    },
  });

  // Project 3: Task Management System
  const p3 = await prisma.project.upsert({
    where: { id: "taskmanager-project" },
    update: {
      name: "Task Management System",
      description:
        "Enterprise project management suite with real-time task assignment, interactive calendar deadlines, and team discussions.",
      startDate: new Date("2026-07-15T00:00:00.000Z"),
      endDate: new Date("2026-08-05T00:00:00.000Z"),
      priority: "LOW",
      status: "COMPLETED",
      managerId: projectManager.id,
    },
    create: {
      id: "taskmanager-project",
      name: "Task Management System",
      description:
        "Enterprise project management suite with real-time task assignment, interactive calendar deadlines, and team discussions.",
      startDate: new Date("2026-07-15T00:00:00.000Z"),
      endDate: new Date("2026-08-05T00:00:00.000Z"),
      priority: "LOW",
      status: "COMPLETED",
      manager: { connect: { id: projectManager.id } },
    },
  });

  // Add members to all 3 projects
  for (const proj of [p1, p2, p3]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: proj.id, userId: teamMemberOne.id } },
      update: {},
      create: {
        projectId: proj.id,
        userId: teamMemberOne.id,
      },
    });

    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: proj.id, userId: teamMemberTwo.id } },
      update: {},
      create: {
        projectId: proj.id,
        userId: teamMemberTwo.id,
      },
    });
  }

  // Tasks for Project 1: Student Attendance Tracking System
  await prisma.task.upsert({
    where: { id: "task-1-1" },
    update: {
      title: "Design Database Schema",
      description: "Define student, attendance, teacher, and reporting tables.",
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-08-08T17:00:00.000Z"),
      projectId: p1.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-1-1",
      title: "Design Database Schema",
      description: "Define student, attendance, teacher, and reporting tables.",
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-08-08T17:00:00.000Z"),
      project: { connect: { id: p1.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-1-2" },
    update: {
      title: "Build Attendance UI & Camera Scanner",
      description: "Create student attendance interface with QR code camera scanner.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-08-12T17:00:00.000Z"),
      projectId: p1.id,
      assigneeId: teamMemberTwo.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-1-2",
      title: "Build Attendance UI & Camera Scanner",
      description: "Create student attendance interface with QR code camera scanner.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-08-12T17:00:00.000Z"),
      project: { connect: { id: p1.id } },
      assignee: { connect: { id: teamMemberTwo.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-1-3" },
    update: {
      title: "Implement Student & Teacher Auth",
      description: "Add secure login and role-based access control for students and teachers.",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-08-14T17:00:00.000Z"),
      projectId: p1.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-1-3",
      title: "Implement Student & Teacher Auth",
      description: "Add secure login and role-based access control for students and teachers.",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date("2026-08-14T17:00:00.000Z"),
      project: { connect: { id: p1.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  // Tasks for Project 2: E-Commerce Platform Redesign
  await prisma.task.upsert({
    where: { id: "task-2-1" },
    update: {
      title: "Product Catalog & Category Filters",
      description: "Build responsive grid for product listing with real-time category filtering.",
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-08-10T17:00:00.000Z"),
      projectId: p2.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-2-1",
      title: "Product Catalog & Category Filters",
      description: "Build responsive grid for product listing with real-time category filtering.",
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-08-10T17:00:00.000Z"),
      project: { connect: { id: p2.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-2-2" },
    update: {
      title: "Shopping Cart & State Persistence",
      description: "Implement interactive shopping cart with local storage persistence.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-08-18T17:00:00.000Z"),
      projectId: p2.id,
      assigneeId: teamMemberTwo.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-2-2",
      title: "Shopping Cart & State Persistence",
      description: "Implement interactive shopping cart with local storage persistence.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-08-18T17:00:00.000Z"),
      project: { connect: { id: p2.id } },
      assignee: { connect: { id: teamMemberTwo.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-2-3" },
    update: {
      title: "Stripe Payment Gateway Integration",
      description: "Connect Stripe API for secure credit card checkout processing.",
      priority: "URGENT",
      status: "TODO",
      dueDate: new Date("2026-08-22T17:00:00.000Z"),
      projectId: p2.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-2-3",
      title: "Stripe Payment Gateway Integration",
      description: "Connect Stripe API for secure credit card checkout processing.",
      priority: "URGENT",
      status: "TODO",
      dueDate: new Date("2026-08-22T17:00:00.000Z"),
      project: { connect: { id: p2.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  // Tasks for Project 3: Task Management System
  await prisma.task.upsert({
    where: { id: "task-3-1" },
    update: {
      title: "User Role Management & Permissions",
      description: "Configure Admin, Manager, and Member role permission guards.",
      priority: "MEDIUM",
      status: "COMPLETED",
      dueDate: new Date("2026-07-20T17:00:00.000Z"),
      projectId: p3.id,
      assigneeId: teamMemberOne.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-3-1",
      title: "User Role Management & Permissions",
      description: "Configure Admin, Manager, and Member role permission guards.",
      priority: "MEDIUM",
      status: "COMPLETED",
      dueDate: new Date("2026-07-20T17:00:00.000Z"),
      project: { connect: { id: p3.id } },
      assignee: { connect: { id: teamMemberOne.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  await prisma.task.upsert({
    where: { id: "task-3-2" },
    update: {
      title: "Interactive Project Kanban Board",
      description: "Create drag-and-drop task status board columns.",
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-08-01T17:00:00.000Z"),
      projectId: p3.id,
      assigneeId: teamMemberTwo.id,
      creatorId: projectManager.id,
    },
    create: {
      id: "task-3-2",
      title: "Interactive Project Kanban Board",
      description: "Create drag-and-drop task status board columns.",
      priority: "HIGH",
      status: "COMPLETED",
      dueDate: new Date("2026-08-01T17:00:00.000Z"),
      project: { connect: { id: p3.id } },
      assignee: { connect: { id: teamMemberTwo.id } },
      creator: { connect: { id: projectManager.id } },
    },
  });

  console.log("? Seed data created:");
  console.log("  Admin:", admin.email);
  console.log("  Project Manager:", projectManager.email);
  console.log("  Team Member 1:", teamMemberOne.email);
  console.log("  Team Member 2:", teamMemberTwo.email);
  console.log("  Projects created: 3 distinct projects with unique tasks.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
