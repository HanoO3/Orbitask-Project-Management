'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Check } from 'lucide-react';
import { Task, TaskPriority } from '@/types';

interface MyTasksProps {
  tasks: Task[];
  onToggleTask?: (id: string) => void;
}

export const MyTasksCard: React.FC<MyTasksProps> = ({ tasks: initialTasks, onToggleTask }) => {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);

  const handleToggle = (id: string) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    if (onToggleTask) onToggleTask(id);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40">
            Low
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs transition-colors">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            My Tasks
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Tasks assigned to you
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-card-hover)] hover:bg-[#4E75FF] hover:text-white border border-[var(--border-color)] px-3.5 py-1.5 rounded-full transition-all"
        >
          View all
        </Link>
      </div>

      {/* Task Items List */}
      <div className="divide-y divide-[var(--border-color)]">
        {taskList.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.06 }}
            className="py-3.5 flex items-center justify-between gap-3 group first:pt-0 last:pb-0"
          >
            {/* Checkbox & Details */}
            <div className="flex items-center gap-3.5 min-w-0">
              <button
                onClick={() => handleToggle(task.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  task.completed
                    ? 'bg-[#4E75FF] border-[#4E75FF] text-white'
                    : 'border-[var(--border-color)] hover:border-[#5B82FF] bg-[var(--bg-input)]'
                }`}
                aria-label={`Mark task ${task.title} complete`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold transition-all truncate ${
                    task.completed
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-primary)] group-hover:text-[#5B82FF]'
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {task.projectName}
                </p>
              </div>
            </div>

            {/* Due Date & Priority Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{task.dueDate}</span>
              </div>
              {getPriorityBadge(task.priority)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
