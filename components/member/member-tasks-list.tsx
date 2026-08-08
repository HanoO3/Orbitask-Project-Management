'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { Task, priorityBadgeStyle, formatDate } from './types';

interface MemberTasksListProps {
  tasks: Task[];
  taskScope: 'assigned' | 'all_project_tasks';
  setTaskScope: (scope: 'assigned' | 'all_project_tasks') => void;
  loading: boolean;
  updatingId: string | null;
  mounted: boolean;
  onStatusChange: (taskId: string, currentStatus: Task['status']) => void;
}

export function MemberTasksList({
  tasks,
  taskScope,
  setTaskScope,
  loading,
  updatingId,
  mounted,
  onStatusChange,
}: MemberTasksListProps) {
  return (
    <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">My Tasks</h2>
          <p className="text-xs text-gray-400">Tasks assigned to you</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={taskScope}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTaskScope(e.target.value as 'assigned' | 'all_project_tasks')}
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
            const isCompleted = task.status === 'COMPLETED';
            return (
              <div
                key={task.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-[#0B0E17]/40 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onStatusChange(task.id, task.status)}
                    disabled={updatingId === task.id}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                      isCompleted
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-[#303B5C] hover:border-blue-500 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <div className="min-w-0">
                    <Link
                      href={`/tasks/${task.id}`}
                      className={`text-sm font-semibold block truncate ${
                        isCompleted ? 'line-through text-gray-500' : 'text-white hover:text-blue-400'
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
                      <span>{mounted ? formatDate(task.dueDate) : ''}</span>
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
  );
}
