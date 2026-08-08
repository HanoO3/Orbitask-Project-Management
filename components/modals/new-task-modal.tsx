'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Flag, FolderKanban, Check } from 'lucide-react';
import { Task, TaskPriority } from '@/types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onAddTask }) => {
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('Website Redesign');
  const [dueDate, setDueDate] = useState('Today');
  const [priority, setPriority] = useState<TaskPriority>('Medium');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title,
      projectName,
      dueDate,
      priority,
      status: 'In Progress',
    });

    setTitle('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg bg-[#141726] border border-[#23263A] rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#23263A]">
            <h3 className="text-lg font-bold text-white">Create New Task</h3>
            <button
              onClick={onClose}
              className="text-[#8E95AF] hover:text-white p-1 rounded-lg hover:bg-[#1E2338] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                Task Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Design mobile navbar responsive view"
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] focus:ring-1 focus:ring-[#5B82FF] transition-all"
              />
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                Project
              </label>
              <div className="relative">
                <FolderKanban className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF] transition-all appearance-none cursor-pointer"
                >
                  <option value="Website Redesign">Website Redesign</option>
                  <option value="Mobile App v2">Mobile App v2</option>
                  <option value="Marketing Campaign">Marketing Campaign</option>
                  <option value="API Migration">API Migration</option>
                </select>
              </div>
            </div>

            {/* Grid for Due Date & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g. Today, Tomorrow, Aug 15"
                    className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF] transition-all"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-[#8E95AF] mb-1.5 uppercase tracking-wider">
                  Priority
                </label>
                <div className="relative">
                  <Flag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5B82FF] transition-all appearance-none cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#23263A]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#8E95AF] hover:text-white hover:bg-[#1E2338] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-[#4E75FF]/30 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
