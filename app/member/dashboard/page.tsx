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
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { BackButton } from "@/components/back-button";
import { CheckSquare, Clock, CheckCircle2, FolderKanban, Users } from "lucide-react";
import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { ActivityTimeline } from "@/components/activity/activity-timeline";

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
    LOW: "bg-slate-100 text-slate-700 border border-slate-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700/50",
    MEDIUM: "bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    HIGH: "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    URGENT: "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
  };
  return styles[p] || "bg-slate-100 text-slate-700 border border-slate-300";
};

const projectStatusStyle = (s: string) => {
  const styles: Record<string, { label: string; style: string }> = {
    NOT_STARTED: { label: "Not started", style: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700" },
    IN_PROGRESS: { label: "On track", style: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30" },
    ON_HOLD: { label: "At risk", style: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30" },
    COMPLETED: { label: "Completed", style: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30" },
  };
  return styles[s] || { label: s, style: "bg-slate-100 text-slate-700 border-slate-300" };
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
        getMyTasks("assigned"),
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
  }, []);

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
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden transition-colors">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DashboardGreeting
          userName={userName}
          subtitle="Here's what's happening with your projects today."
        />

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-3.5 py-1.5 rounded-lg font-medium text-sm shadow-[0_4px_12px_rgba(78,117,255,0.3)] hover:shadow-[0_6px_16px_rgba(78,117,255,0.4)] transition-all active:scale-95 cursor-pointer"
          >
            <span>View Tasks</span>
          </Link>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <div className="w-9 h-9 rounded-full bg-[#4E75FF] text-white font-bold text-xs flex items-center justify-center shadow-md uppercase">
              {userInitials}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Tasks */}
        <Link href="/tasks" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#5B82FF]/60 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[#5B82FF] transition-colors">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.totalTasks}</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
              Assigned
            </span>
          </div>
        </Link>

        {/* Pending Tasks */}
        <Link href="/tasks?status=IN_PROGRESS" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/60 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.pendingTasks}</span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
              Pending
            </span>
          </div>
        </Link>

        {/* Completed Tasks */}
        <Link href="/tasks?status=COMPLETED" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/60 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-emerald-500 transition-colors">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.completedTasks}</span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {completionPercent}% Rate
            </span>
          </div>
        </Link>

        {/* Active Projects */}
        <Link href="/projects" className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/60 transition-all cursor-pointer block">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-purple-500 transition-colors">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/20 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.totalProjects}</span>
            <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 dark:text-purple-400 dark:bg-purple-500/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
        </Link>
      </div>

      {/* Main Grid: My Active Projects (2 Cols) + Real Recent Activity (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects List (2 Cols) */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Active Projects</h2>
              <p className="text-xs text-[var(--text-secondary)]">Projects you are contributing to</p>
            </div>
            <BackButton href="/projects" label="View All" iconPosition="right" />
          </div>

          {loading ? (
            <p className="text-xs text-[var(--text-muted)] py-6">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">No projects joined yet.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const totalProjTasks = project.tasks.length;
                const completedProjTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
                const progress = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
                const statusInfo = projectStatusStyle(project.status);

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[#5B82FF]/60 space-y-3 block transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[#5B82FF] transition-colors">{project.name}</h3>
                        <p className="text-[11px] text-[var(--text-secondary)]" suppressHydrationWarning>
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
                                } text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-card)] uppercase`}
                              >
                                {getInitials(m.user.name)}
                              </div>
                            ))
                          ) : (
                            <div
                              title={project.manager.name}
                              className="w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-card)] uppercase"
                            >
                              {getInitials(project.manager.name)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#4E75FF] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] min-w-[32px] text-right">
                        {progress}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Workspace Recent Activity (1 Col) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Workspace Activity</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-5">Latest updates from database</p>

            <div className="space-y-4">
              {overview.recentTasks.length === 0 && overview.recentUsers.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4">No recent activity logged.</p>
              ) : (
                overview.recentTasks.map((t, idx) => {
                  const initials = getInitials(t.creator.name);
                  const color = colorPalette[idx % colorPalette.length];
                  return (
                    <div key={t.id} className="flex items-start gap-3 text-xs">
                      <div
                        className={`w-7 h-7 rounded-full ${color} text-white font-bold flex items-center justify-center shrink-0 text-[10px] uppercase shadow-xs`}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-secondary)] leading-snug">
                          <span className="font-semibold text-[var(--text-primary)]">{t.creator.name}</span> updated task{" "}
                          <span className="font-semibold text-[#5B82FF]">{t.title}</span> in{" "}
                          <span className="text-[var(--text-secondary)]">#{t.project.name}</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Status: {t.status}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: My Assigned Tasks */}
      <div className="space-y-6">
        {/* My Assigned Tasks Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">My Assigned Tasks</h2>
              <p className="text-xs text-[var(--text-secondary)]">Tasks specifically assigned to you</p>
            </div>
            <BackButton href="/tasks" label="View All Tasks" iconPosition="right" />
          </div>

          {loading ? (
            <p className="text-xs text-[var(--text-muted)] py-6">Loading assigned tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">No tasks assigned yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[#5B82FF]/60 space-y-3 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleStatusChange(task.id, task.status)}
                          disabled={updatingId === task.id}
                          title={isCompleted ? "Mark incomplete" : "Mark complete"}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 cursor-pointer ${
                            isCompleted
                              ? "bg-[#4E75FF] border-[#4E75FF] text-white"
                              : "border-[var(--border-color)] hover:border-[#5B82FF] text-transparent bg-[var(--bg-input)]"
                          }`}
                        >
                          ✓
                        </button>
                        <div className="min-w-0">
                          <Link
                            href={`/tasks/${task.id}`}
                            className={`text-sm font-bold block truncate transition-colors ${
                              isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)] group-hover:text-[#5B82FF]"
                            }`}
                          >
                            {task.title}
                          </Link>
                          <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                            Project: {task.project.name}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${priorityBadgeStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400">
                        {task.status.replace("_", " ")}
                      </span>
                      <span className="text-[11px] flex items-center gap-1 text-[var(--text-muted)]" suppressHydrationWarning>
                        <Clock className="w-3.5 h-3.5 text-[#5B82FF]" />
                        <span>Due {mounted ? formatDate(task.dueDate) : ""}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Dynamic Team Workspace Banner */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#4E75FF]/15 border border-[#5B82FF]/30 text-[#5B82FF] flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-6 h-6 text-[#5B82FF]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">Team Workspace</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {overview.totalWorkspaceUsers || 1} active members · {stats.totalProjects} active shared projects
              </p>
            </div>
          </div>

          <Link
            href="/messages"
            className="px-4 py-2.5 bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold rounded-xl hover:bg-[#4E75FF] hover:text-white transition shrink-0"
          >
            Workspace Chat
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsSection />

      {/* Activity Timeline */}
      <ActivityTimeline />
    </div>
  );
}