'use client';

import React from 'react';
import { CheckSquare, Clock, CheckCircle2, FolderKanban } from 'lucide-react';

interface MemberStatCardsProps {
  stats: {
    totalProjects: number;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
  taskScope: 'assigned' | 'all_project_tasks';
  completionPercent: number;
}

export function MemberStatCards({ stats, taskScope, completionPercent }: MemberStatCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#5B82FF]/40 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Total Tasks</span>
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/20 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-[var(--text-primary)]">{stats.totalTasks}</span>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
            {taskScope === 'assigned' ? 'Assigned' : 'Project'}
          </span>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#5B82FF]/40 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[var(--text-secondary)]">In Progress</span>
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
      </div>

      {/* Completed Tasks */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#5B82FF]/40 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Completed</span>
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
      </div>

      {/* Active Projects */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 relative overflow-hidden group hover:border-[#5B82FF]/40 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Active Projects</span>
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
      </div>
    </div>
  );
}
