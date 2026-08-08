"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getMyTasks,
  getMyMemberProjects,
  getMyTaskStats,
  updateMyTaskStatus,
  getMemberWorkspaceOverview,
} from "@/lib/actions/member-tasks";
import { NotificationBell } from "@/components/notification-bell";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { CheckSquare, Clock, CheckCircle2, FolderKanban, Users } from "lucide-react";


type ProjectMember = {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  manager: { id: string; name: string; email: string };
  members: ProjectMember[];
  _count: { tasks: number; members: number };
  tasks: { id: string; status: string }[];
};

type Task = {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  dueDate: string | Date;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string } | null;
  _count: { comments: number };
};

type WorkspaceOverview = {
  totalWorkspaceUsers: number;
  recentUsers: { id: string; name: string; role: string }[];
  recentTasks: {
    id: string;
    title: string;
    status: string;
    creator: { id: string; name: string };
    project: { id: string; name: string };
  }[];
};

function getInitials(name: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}



const priorityBadgeStyle = (p: string) => {
  const styles: Record<string, string> = {
    LOW: "bg-gray-800/60 text-gray-400 border border-gray-700/50",
    MEDIUM: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    HIGH: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    URGENT: "bg-red-500/15 text-red-400 border border-red-500/30",
  };
  return styles[p] || "bg-gray-800/60 text-gray-400 border border-gray-700/50";
};

const projectStatusStyle = (s: string) => {
  const styles: Record<string, { label: string; style: string }> = {
    NOT_STARTED: { label: "Not started", style: "bg-gray-800/60 text-gray-400 border-gray-700" },
    IN_PROGRESS: { label: "On track", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    ON_HOLD: { label: "At risk", style: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    COMPLETED: { label: "Completed", style: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  };
  return styles[s] || { label: s, style: "bg-gray-800/60 text-gray-400 border-gray-700" };
};

const colorPalette = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
];

function formatDate(d: string | Date) {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function MemberDashboard() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [overview, setOverview] = useState<WorkspaceOverview>({
    totalWorkspaceUsers: 0,
    recentUsers: [],
    recentTasks: [],
  });
  const [taskScope, setTaskScope] = useState<"assigned" | "all_project_tasks">("assigned");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsData, tasksData, statsData, overviewData] = await Promise.all([
        getMyMemberProjects(),
        getMyTasks(taskScope),
        getMyTaskStats(),
        getMemberWorkspaceOverview(),
      ]);
      setProjects(projectsData as Project[]);
      setTasks(tasksData as Task[]);
      setStats(statsData);
      setOverview(overviewData);
    } catch (err) {
      console.error("Failed to load member dashboard data:", err);
    }
    setLoading(false);
  }, [taskScope]);

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleStatusChange = async (taskId: string, currentStatus: Task["status"]) => {
    const nextStatusMap: Record<Task["status"], Task["status"]> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "REVIEW",
      REVIEW: "COMPLETED",
      COMPLETED: "TODO",
    };
    const nextStatus = nextStatusMap[currentStatus];
    setUpdatingId(taskId);
    await updateMyTaskStatus(taskId, nextStatus);
    await loadData();
    setUpdatingId(null);
  };

  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Member";
  const userInitials = getInitials(session?.user?.name || "Member");
  const completionPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardGreeting
          userName={userName}
          subtitle="Here's what's happening with your projects today."
        />

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition"
          >
            <span>+</span>
            <span>View Tasks</span>
          </Link>

          <NotificationBell />

          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/30 uppercase">
            {userInitials}
          </div>
        </div>
      </div>

      {/* 4 Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#303B5C] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.totalTasks}</span>
            <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
              {taskScope === "assigned" ? "Assigned" : "Project"}
            </span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#303B5C] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.pendingTasks}</span>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Pending
            </span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#303B5C] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.completedTasks}</span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {completionPercent}% Rate
            </span>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#303B5C] transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-gray-400">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.totalProjects}</span>
            <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: My Active Projects (2 Cols) + Real Recent Activity (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List (2 Cols) */}
        <div className="lg:col-span-2 bg-[#131725] border border-[#22293F] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">Active Projects</h2>
              <p className="text-xs text-gray-400">Projects you are contributing to</p>
            </div>
            <Link
              href="/projects"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <p className="text-xs text-gray-500 py-6">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No projects joined yet.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const totalProjTasks = project.tasks.length;
                const completedProjTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
                const progress = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
                const statusInfo = projectStatusStyle(project.status);

                return (
                  <div key={project.id} className="p-4 rounded-xl bg-[#0B0E17]/60 border border-[#1E253B] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-white">{project.name}</h3>
                        <p className="text-[11px] text-gray-500" suppressHydrationWarning>
                          Manager: {project.manager.name} • Due {mounted ? formatDate(project.endDate) : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>

                        {/* Real Dynamic Team Avatars */}
                        <div className="flex -space-x-2 overflow-hidden">
                          {project.members && project.members.length > 0 ? (
                            project.members.slice(0, 4).map((m, idx) => (
                              <div
                                key={m.id || idx}
                                title={m.user.name}
                                className={`w-6 h-6 rounded-full ${
                                  colorPalette[idx % colorPalette.length]
                                } text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0B0E17] uppercase`}
                              >
                                {getInitials(m.user.name)}
                              </div>
                            ))
                          ) : (
                            <div
                              title={project.manager.name}
                              className="w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0B0E17] uppercase"
                            >
                              {getInitials(project.manager.name)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[#181F33] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 min-w-[32px] text-right">
                        {progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Workspace Recent Activity (1 Col) */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Workspace Activity</h2>
            <p className="text-xs text-gray-400 mb-5">Latest updates from database</p>

            <div className="space-y-4">
              {overview.recentTasks.length === 0 && overview.recentUsers.length === 0 ? (
                <p className="text-xs text-gray-500 py-4">No recent activity logged.</p>
              ) : (
                overview.recentTasks.map((t, idx) => {
                  const initials = getInitials(t.creator.name);
                  const color = colorPalette[idx % colorPalette.length];
                  return (
                    <div key={t.id} className="flex items-start gap-3 text-xs">
                      <div
                        className={`w-7 h-7 rounded-full ${color} text-white font-bold flex items-center justify-center shrink-0 text-[10px] uppercase`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 leading-snug">
                          <span className="font-semibold text-white">{t.creator.name}</span> updated task{" "}
                          <span className="font-semibold text-[#5B82FF]">{t.title}</span> in{" "}
                          <span className="text-gray-400">#{t.project.name}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Status: {t.status}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: My Tasks Checklist & Workspace Banner */}
      <div className="space-y-6">
        {/* My Tasks Card */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white">My Tasks</h2>
              <p className="text-xs text-gray-400">Tasks assigned to you</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={taskScope}
                onChange={(e) => setTaskScope(e.target.value as "assigned" | "all_project_tasks")}
                className="bg-[#0B0E17] border border-[#22293F] text-xs text-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="assigned">Assigned to Me</option>
                <option value="all_project_tasks">All Project Tasks</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-gray-500 py-6">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">No tasks assigned yet.</p>
          ) : (
            <div className="divide-y divide-[#1E253B]">
              {tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                return (
                  <div
                    key={task.id}
                    className="py-3.5 flex items-center justify-between gap-4 group hover:bg-[#0B0E17]/40 px-2 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleStatusChange(task.id, task.status)}
                        disabled={updatingId === task.id}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          isCompleted
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "border-[#303B5C] hover:border-blue-500 text-transparent"
                        }`}
                      >
                        ✓
                      </button>
                      <div className="min-w-0">
                        <Link
                          href={`/tasks/${task.id}`}
                          className={`text-sm font-semibold block truncate ${
                            isCompleted ? "line-through text-gray-500" : "text-white hover:text-blue-400"
                          }`}
                        >
                          {task.title}
                        </Link>
                        <p className="text-[11px] text-gray-500 truncate">{task.project.name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400 hidden sm:inline flex items-center gap-1" suppressHydrationWarning>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{mounted ? formatDate(task.dueDate) : ""}</span>
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${priorityBadgeStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Dynamic Team Workspace Banner */}
        <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4E75FF]/15 border border-[#5B82FF]/30 text-[#5B82FF] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(78,117,255,0.2)]">
              <Users className="w-6 h-6 text-[#5B82FF]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Team Workspace</h3>
              <p className="text-xs text-gray-400">
                {overview.totalWorkspaceUsers || 1} active members · {stats.totalProjects} active shared projects
              </p>
            </div>
          </div>

          <Link
            href="/messages"
            className="px-4 py-2.5 bg-[#1C2337] border border-[#2D3754] text-white text-xs font-semibold rounded-xl hover:bg-[#252E47] transition shrink-0"
          >
            Workspace Chat
          </Link>
        </div>
      </div>
    </div>
  );
}