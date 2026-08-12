'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  getProjectById,
  getAvailableTeamMembers,
  getAssignableMembers,
  addProjectMember,
  removeProjectMember,
  deleteTask,
} from '@/lib/actions/manager-projects';
import { TaskModal } from '@/components/task-modal';
import { BackButton } from '@/components/back-button';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Calendar, User, Plus, Clock, User2 } from 'lucide-react';

type Member = { id: string; name: string; email: string };

type Task = {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  manager: { id: string; name: string; email: string };
  members: { id: string; user: Member }[];
  tasks: Task[];
};

const priorityBadge = (p: string) => {
  const styles: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40',
    MEDIUM: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    HIGH: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    URGENT: 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
  };
  return styles[p] || 'bg-slate-100 text-slate-700';
};

const taskStatusBadge = (s: string) => {
  const styles: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    REVIEW: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  };
  return styles[s] || 'bg-slate-100 text-slate-700';
};

const STATUS_COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function ManagerProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: session } = useSession();
  const canManageTasks = session?.user?.role === 'ADMIN' || session?.user?.role === 'PROJECT_MANAGER';

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [assignableMembers, setAssignableMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNewMember, setSelectedNewMember] = useState('');
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
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleAddMember = async () => {
    if (!selectedNewMember) return;
    setAddingMember(true);
    await addProjectMember(projectId, selectedNewMember);
    setSelectedNewMember('');
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
    if (!confirm('Delete this task?')) return;
    await deleteTask(taskId, projectId);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] p-8 text-center text-[var(--text-secondary)]">
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] p-8 text-center text-[var(--text-secondary)]">
        Project not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 md:p-8 space-y-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top bar link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton href="/projects" label="Back to Projects" />
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>

        {/* Project Header Info */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 transition-colors">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">{project.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityBadge(project.priority)}`}>
                {project.priority}
              </span>
            </div>
            <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">{project.description}</p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
              <Calendar className="w-4 h-4 text-[#5B82FF]" />
              <span>
                {new Date(project.startDate).toLocaleDateString()} – {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {canManageTasks && (
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all shrink-0 active:scale-95 cursor-pointer w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Task</span>
            </button>
          )}
        </div>

        {/* Members Management Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
          <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Team Members</h2>

          {project.members.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No members added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {project.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-full pl-3 pr-1.5 py-1 text-xs font-medium text-[var(--text-primary)] shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-[#5B82FF]" />
                  <span>{m.user.name}</span>
                  {canManageTasks && (
                    <button
                      onClick={() => handleRemoveMember(m.user.id)}
                      className="text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {canManageTasks && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <select
                value={selectedNewMember}
                onChange={(e) => setSelectedNewMember(e.target.value)}
                className="flex-1 max-w-sm bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#5B82FF]"
              >
                <option value="">
                  {availableMembers.length === 0 ? 'No available team members' : 'Select a team member...'}
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
                className="px-4 py-2.5 rounded-xl border border-[#4E75FF] text-[#5B82FF] hover:bg-[#4E75FF]/10 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}
        </div>

        {/* Tasks Kanban Board */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Tasks Board</h2>

          {project.tasks.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 text-center text-xs text-[var(--text-secondary)]">
              {canManageTasks ? 'No tasks yet. Click "+ New Task" above to create one.' : 'No tasks created yet for this project.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUS_COLUMNS.map((col) => {
                const colTasks = project.tasks.filter((t) => t.status === col.key);
                return (
                  <div key={col.key} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col justify-between transition-colors">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{col.label}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-sidebar)] text-[var(--text-primary)] border border-[var(--border-color)]">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[#5B82FF] rounded-xl p-4 shadow-xs transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="font-bold text-[var(--text-primary)] text-xs group-hover:text-[#5B82FF] transition-colors leading-snug"
                            >
                              {task.title}
                            </Link>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${priorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          <p className="text-[var(--text-secondary)] text-[11px] mb-3 line-clamp-2 leading-relaxed">{task.description}</p>

                          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-3 border-t border-[var(--border-color)] pt-2">
                            <User2 className="w-3.5 h-3.5 text-[#5B82FF]" />
                            <span>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
                            <span className="text-sm">·</span>
                            <Clock className="w-3.5 h-3.5 text-[#5B82FF]" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${taskStatusBadge(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            {canManageTasks && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setTaskModalOpen(true);
                                  }}
                                  className="text-[#5B82FF] hover:underline text-[11px] font-medium cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-rose-600 dark:text-rose-400 hover:underline text-[11px] font-medium cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
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