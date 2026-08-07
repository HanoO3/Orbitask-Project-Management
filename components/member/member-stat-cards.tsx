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
      <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#303B5C] transition">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-400">Total Tasks</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold text-white">{stats.totalTasks}</span>
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
            {taskScope === 'assigned' ? 'Assigned' : 'Project'}
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
  );
}
