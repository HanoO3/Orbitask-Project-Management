"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getMyProjects, getMyProjectStats } from "@/lib/actions/manager-projects";
import { NotificationBell } from "@/components/notification-bell";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { Users, ClipboardList, CalendarDays } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  _count: { tasks: number; members: number };
  tasks: { id?: string; status: string }[];
};

function formatDate(d: string | Date) {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [projectsData, statsData] = await Promise.all([getMyProjects(), getMyProjectStats()]);
    setProjects(projectsData as Project[]);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Manager";

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardGreeting
          userName={userName}
          subtitle="Track and manage your team's assigned projects"
        />

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <NotificationBell />
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 uppercase">
            {session?.user?.name
              ? session.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "PM"}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Total Projects</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{stats.totalProjects}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Active Projects</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5">{stats.activeProjects}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Pending Tasks</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1.5">{stats.pendingTasks}</p>
        </div>
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-medium text-gray-400">Completed Tasks</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">{stats.completedTasks}</p>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-bold text-white mb-4">My Assigned Projects</h2>

        {loading ? (
          <p className="text-xs text-gray-500 py-6">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-xs text-gray-500 py-6">No projects assigned yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
              const totalTasks = project.tasks.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/manager/projects/${project.id}`}
                  className="bg-[#0B0E17]/60 border border-[#1E253B] p-5 rounded-2xl hover:border-blue-500/50 transition block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-white">{project.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{project.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="w-4 h-4" />
                      {project._count.tasks} tasks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project._count.members} members
                    </span>
                    <span className="inline-flex items-center gap-1" suppressHydrationWarning>
                      <CalendarDays className="w-4 h-4" />
                      {mounted ? formatDate(project.startDate) : ""} - {mounted ? formatDate(project.endDate) : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[#181F33] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">{progress}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}