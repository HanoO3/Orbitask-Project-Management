import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { NotificationBell } from "@/components/notification-bell";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { FolderKanban, Users } from "lucide-react";

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
    <div className="min-h-screen bg-[#0B0E17] text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardGreeting
          userName={userName}
          subtitle="System administration & platform control center"
        />

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <NotificationBell />
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 uppercase">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Total Users</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{totalUsers}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Projects</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5">{totalProjects}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Total Tasks</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1.5">{totalTasks}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Managers</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-1.5">{managersCount}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-gray-400">Team Members</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">{membersCount}</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/projects"
          className="group bg-[#131725] border border-[#22293F] hover:border-blue-500/50 rounded-2xl p-6 transition-all shadow-lg flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              Manage Projects
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Create projects, assign project managers, and monitor project status.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="group bg-[#131725] border border-[#22293F] hover:border-purple-500/50 rounded-2xl p-6 transition-all shadow-lg flex items-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
              Manage Users
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Add new users, edit details, and assign system access roles.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}