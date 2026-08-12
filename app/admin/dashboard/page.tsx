import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { FolderKanban, Users } from "lucide-react";
import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { ActivityTimeline } from "@/components/activity/activity-timeline";

export default async function AdminDashboard() {
  const session = await auth();

  const [totalUsers, totalProjects, totalTasks, managersCount, membersCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.user.count({ where: { role: "PROJECT_MANAGER" } }),
    prisma.user.count({ where: { role: "TEAM_MEMBER" } }),
  ]);

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Admin";
  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardGreeting
          userName={userName}
          subtitle="System administration & platform control center"
        />

        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <NotificationBell />
          <div className="w-9 h-9 rounded-full bg-[#4E75FF] text-white font-bold text-xs flex items-center justify-center shadow-md uppercase">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Link
          href="/admin/users"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#5B82FF]/50 rounded-2xl p-4 sm:p-5 transition-all shadow-xs block cursor-pointer group"
        >
          <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[#5B82FF] transition-colors">Total Users</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">{totalUsers}</p>
        </Link>
        <Link
          href="/projects"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#5B82FF]/50 rounded-2xl p-4 sm:p-5 transition-all shadow-xs block cursor-pointer group"
        >
          <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[#5B82FF] transition-colors">Projects</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#5B82FF] mt-1.5">{totalProjects}</p>
        </Link>
        <Link
          href="/tasks"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-purple-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-xs block cursor-pointer group"
        >
          <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-purple-500 transition-colors">Total Tasks</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1.5">{totalTasks}</p>
        </Link>
        <Link
          href="/admin/users?role=PROJECT_MANAGER"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-xs block cursor-pointer group"
        >
          <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-indigo-500 transition-colors">Managers</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5">{managersCount}</p>
        </Link>
        <Link
          href="/admin/users?role=TEAM_MEMBER"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 col-span-2 sm:col-span-1 transition-all shadow-xs block cursor-pointer group"
        >
          <p className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-emerald-500 transition-colors">Team Members</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">{membersCount}</p>
        </Link>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/projects"
          className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#5B82FF]/50 rounded-2xl p-6 transition-all shadow-xs flex items-center gap-5 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#4E75FF]/10 text-[#5B82FF] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[#5B82FF] transition-colors">
              Manage Projects
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Create projects, assign project managers, and monitor project status.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-purple-500/50 rounded-2xl p-6 transition-all shadow-xs flex items-center gap-5 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Manage Users
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Review pending signups, assign roles, approve or reject user accounts.
            </p>
          </div>
        </Link>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsSection />

      {/* System Activity Timeline */}
      <ActivityTimeline />
    </div>
  );
}