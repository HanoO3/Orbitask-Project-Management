"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import {
  getProjectById,
  getAvailableTeamMembers,
  getAssignableMembers,
  addProjectMember,
  removeProjectMember,
  deleteTask,
} from "@/lib/actions/manager-projects";
import { TaskModal } from "@/components/task-modal";

type Member = { id: string; name: string; email: string };

type Task = {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  dueDate: string | Date;
  assigneeId: string | null;
  assignee: Member | null;
  creator: { id: string; name: string };
  _count: { comments: number };
};

type ProjectDetail = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  manager: { id: string; name: string; email: string };
  members: { id: string; user: Member }[];
  tasks: Task[];
};

const priorityBadge = (p: string) => {
  const styles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };
  return styles[p];
};

const taskStatusBadge = (s: string) => {
  const styles: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    REVIEW: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
  };
  return styles[s];
};

const STATUS_COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "COMPLETED", label: "Completed" },
];

export default function ManagerProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [assignableMembers, setAssignableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNewMember, setSelectedNewMember] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [projectData, availableData, assignableData] = await Promise.all([
      getProjectById(projectId),
      getAvailableTeamMembers(projectId),
      getAssignableMembers(projectId),
    ]);
    setProject(projectData as ProjectDetail | null);
    setAvailableMembers(availableData as Member[]);
    setAssignableMembers(assignableData as Member[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddMember = async () => {
    if (!selectedNewMember) return;
    setAddingMember(true);
    await addProjectMember(projectId, selectedNewMember);
    setSelectedNewMember("");
    setAddingMember(false);
    loadData();
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm("Remove this member from the project? They'll be unassigned from any tasks.")) return;
    await removeProjectMember(projectId, memberUserId);
    loadData();
  };

  const handleTaskModalClose = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
    loadData();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    await deleteTask(taskId, projectId);
    loadData();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-400">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-400">
        Project not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/manager/dashboard" className="text-indigo-600 text-sm hover:underline">
          ← Back to Dashboard
        </Link>

        <div className="flex justify-between items-start mt-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(project.priority)}`}>
                {project.priority}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{project.description}</p>
            <p className="text-gray-400 text-xs mt-1">
              📅 {new Date(project.startDate).toLocaleDateString()} – {new Date(project.endDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 whitespace-nowrap"
          >
            + New Task
          </button>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Members</h2>

          {project.members.length === 0 ? (
            <p className="text-gray-400 text-sm mb-4">No members added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-1 py-1 text-sm"
                >
                  <span className="text-gray-700">{m.user.name}</span>
                  <button
                    onClick={() => handleRemoveMember(m.user.id)}
                    className="text-gray-400 hover:text-red-500 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50"
                    title="Remove from project"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <select
              value={selectedNewMember}
              onChange={(e) => setSelectedNewMember(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">
                {availableMembers.length === 0 ? "No available team members" : "Select a team member..."}
              </option>
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={!selectedNewMember || addingMember}
              className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 text-sm hover:bg-indigo-50 disabled:opacity-50"
            >
              Add Member
            </button>
          </div>
        </div>

        {/* Tasks board */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks</h2>

        {project.tasks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            No tasks yet. Create the first one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = project.tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="bg-gray-100/60 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-semibold text-gray-600">{col.label}</h3>
                    <span className="text-xs text-gray-400">{colTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div key={task.id} className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-medium text-gray-800 text-sm hover:text-indigo-600 hover:underline"
                          >
                            {task.title}
                          </Link>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${priorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mb-2 line-clamp-2">{task.description}</p>
                        <div className="text-xs text-gray-400 mb-2">
                          {task.assignee ? `👤 ${task.assignee.name}` : "Unassigned"} · 📅{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                          {task._count.comments > 0 && <> · 💬 {task._count.comments}</>}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${taskStatusBadge(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setTaskModalOpen(true);
                              }}
                              className="text-indigo-600 hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-500 hover:underline text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        onClose={handleTaskModalClose}
        projectId={projectId}
        editingTask={editingTask}
        members={assignableMembers}
      />
    </div>
  );
}