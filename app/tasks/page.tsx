'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Clock, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserWorkspaceTasks, toggleTaskStatus } from '@/lib/actions/task-comments';

type RealTask = {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  dueDate: string | Date;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string };
};

function formatDueDate(d: string | Date) {
  if (!d) return 'No due date';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dueDate: string | Date, status: string) {
  if (status === 'COMPLETED') return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(new Date(dueDate).getFullYear(), new Date(dueDate).getMonth(), new Date(dueDate).getDate());
  return target < today;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'title'>('dueDate');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserWorkspaceTasks();
      setTasks(data as RealTask[]);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadTasks(), 0);
    return () => clearTimeout(t);
  }, [loadTasks]);

  const handleToggleTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(id);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED' }
          : t
      )
    );

    try {
      await toggleTaskStatus(id);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      void loadTasks(); // Rollback on failure
    }
    setTogglingId(null);
  };

  const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const statusOrder: Record<string, number> = { TODO: 1, IN_PROGRESS: 2, REVIEW: 3, COMPLETED: 4 };

  const filteredTasks = tasks
    .filter((t) => {
      const titleMatch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const projectMatch = t.project?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = titleMatch || projectMatch;

      const taskIsCompleted = t.status === 'COMPLETED';
      const taskIsOverdue = isOverdue(t.dueDate, t.status);

      if (activeTab === 'In Progress') return matchesSearch && !taskIsCompleted && !taskIsOverdue;
      if (activeTab === 'Overdue') return matchesSearch && taskIsOverdue;
      if (activeTab === 'Completed') return matchesSearch && taskIsCompleted;

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortBy === 'priority') return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (sortBy === 'status') return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const getPriorityBadge = (priority: RealTask['priority']) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
            Urgent
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40">
            Low
          </span>
        );
    }
  };

  return (
    <DashboardLayout title="Tasks">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Task Workspace</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track and complete real deliverables assigned across workspace projects.
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks or projects..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'status' | 'title')}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 overflow-x-auto max-w-full scrollbar-none">
        {['All', 'In Progress', 'Overdue', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === tab
                ? 'bg-[#4E75FF] text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks Table/List Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
        {loading ? (
          <div className="py-16 text-center text-[var(--text-secondary)] flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#4E75FF]" />
            <span>Loading workspace tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[#5B82FF]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">No tasks found</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {searchQuery || activeTab !== 'All'
                ? 'No deliverables match your search or tab filter.'
                : 'You have no assigned tasks in this workspace.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const isCompleted = task.status === 'COMPLETED';
            const overdue = isOverdue(task.dueDate, task.status);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#5B82FF] transition-all group block"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={(e) => handleToggleTask(task.id, e)}
                      disabled={togglingId === task.id}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-[#4E75FF] border-[#4E75FF] text-white'
                          : 'border-[var(--border-color)] hover:border-[#5B82FF] bg-[var(--bg-input)]'
                      }`}
                    >
                      {togglingId === task.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      ) : isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : null}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate group-hover:text-[#5B82FF] transition-colors ${
                          isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="text-[#5B82FF] font-medium">{task.project?.name || 'Workspace'}</span>
                        {task.assignee && (
                          <span className="text-[var(--text-secondary)] text-[11px]">
                            • Assigned to: {task.assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-[var(--border-color)] pt-2 sm:pt-0">
                    <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-[var(--text-secondary)]'}`}>
                      <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{formatDueDate(task.dueDate)}</span>
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
