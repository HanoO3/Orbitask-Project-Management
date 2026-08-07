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
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-300 border border-slate-600/40">
            Low
          </span>
        );
    }
  };

  return (
    <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-5 shadow-lg">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
            My Tasks
          </h3>
          <p className="text-xs text-[#8E95AF] mt-0.5">
            Tasks assigned to you
          </p>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-white bg-[#1E2338] hover:bg-[#2A304D] border border-[#2B314F] px-3.5 py-1.5 rounded-full transition-all"
        >
          View all
        </Link>
      </div>

      {/* Task Items List */}
      <div className="divide-y divide-[#23263A]/70">
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
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                  task.completed
                    ? 'bg-[#4E75FF] border-[#4E75FF] text-white'
                    : 'border-[#333754] hover:border-[#5B82FF] bg-[#121524]'
                }`}
                aria-label={`Mark task ${task.title} complete`}
              >
                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>

              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold transition-all truncate ${
                    task.completed
                      ? 'line-through text-[#626A86]'
                      : 'text-white group-hover:text-[#5B82FF]'
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-[11px] text-[#8E95AF] truncate mt-0.5">
                  {task.projectName}
                </p>
              </div>
            </div>

            {/* Due Date & Priority Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-[#8E95AF]">
                <Clock className="w-3.5 h-3.5 text-[#626A86]" />
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
