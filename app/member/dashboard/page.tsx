"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getMyTasks,
  getMyMemberProjects,
  getMyTaskStats,
  updateMyTaskStatus,
} from "@/lib/actions/member-tasks";
import { LogoutButton } from "@/components/logout-button";

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  manager: { id: string; name: string; email: string };
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

const priorityBadge = (p: string) => {
  const styles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };
  return styles[p] || "bg-gray-100 text-gray-600";
};

const projectStatusBadge = (s: string) => {
  const styles: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    ON_HOLD: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
  };
  return styles[s] || "bg-gray-100 text-gray-600";
};

const statusBadge = (s: string) => {
  const styles: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    REVIEW: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
  };
  return styles[s] || "bg-gray-100 text-gray-600";
};

export default function MemberDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [taskScope, setTaskScope] = useState<"assigned" | "all_project_tasks">("assigned");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [projectsData, tasksData, statsData] = await Promise.all([
      getMyMemberProjects(),
      getMyTasks(taskScope),
      getMyTaskStats(),
    ]);
    setProjects(projectsData as Project[]);
    setTasks(tasksData as Task[]);
    setStats(statsData);
    setLoading(false);
  }, [taskScope]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    setUpdatingId(taskId);
    await updateMyTaskStatus(taskId, status);
    await loadData();
    setUpdatingId(null);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isOverdue = (task: Task) =>
    task.status !== "COMPLETED" && new Date(task.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-2xl font-bold text-indigo-600">Team Member Dashboard</h1>
            <LogoutButton />
          </div>
          <p className="text-gray-500">Overview of your assigned projects and tasks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Assigned Projects</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalProjects}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
          </div>
        </div>

        {/* My Assigned Projects Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Assigned Projects</h2>
          {loading ? (
            <p className="text-gray-400">Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
              No projects assigned yet. Ask your Project Manager to add you to a project.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => {
                const completedCount = project.tasks.filter((t) => t.status === "COMPLETED").length;
                const totalCount = project.tasks.length;
                const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <div key={project.id} className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(project.priority)}`}>
                          {project.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${projectStatusBadge(project.status)}`}>
                          {project.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                    <p className="text-xs text-gray-500 mb-3">👤 Manager: {project.manager.name}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-3">
                      <span>📋 {project._count.tasks} tasks</span>
                      <span>👥 {project._count.members} members</span>
                      <span>
                        📅 {new Date(project.startDate).toLocaleDateString()} -{" "}
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Task Scope:</span>
              <select
                value={taskScope}
                onChange={(e) => setTaskScope(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="assigned">Directly Assigned to Me</option>
                <option value="all_project_tasks">All Project Tasks</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by task or project name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
              No tasks found for this selection.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-2xl shadow p-6 border border-gray-100">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-bold text-gray-800 hover:text-indigo-600 hover:underline"
                        >
                          {task.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {isOverdue(task) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-2">{task.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                        <span>📁 {task.project.name}</span>
                        <span>👤 Assignee: {task.assignee ? task.assignee.name : "Unassigned"}</span>
                        <span>📅 Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        <span>💬 {task._count.comments} comments</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(task.status)}`}>
                        {task.status.replace("_", " ")}
                      </span>
                      <select
                        value={task.status}
                        disabled={updatingId === task.id}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                        className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}