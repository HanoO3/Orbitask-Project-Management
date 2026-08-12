'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Navbar } from './navbar';
import { NewTaskModal } from '@/components/modals/new-task-modal';
import { Task } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  onAddTask?: (task: Omit<Task, 'id' | 'completed'>) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Dashboard',
  onAddTask,
}) => {
  const { data: session } = useSession();
  const canManageTasks = session?.user?.role === 'ADMIN' || session?.user?.role === 'PROJECT_MANAGER';
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed'>) => {
    if (onAddTask) {
      onAddTask(newTask);
    }
  };

  return (
    <div className="flex flex-col min-w-0 flex-1 min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors">
      {/* Top Navbar Header */}
      <Navbar
        title={title}
        onOpenNewTaskModal={canManageTasks ? () => setNewTaskModalOpen(true) : undefined}
      />

      {/* Page Content Container */}
      <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto space-y-6">
        {children}
      </main>

      {/* New Task Dialog Modal */}
      {canManageTasks && (
        <NewTaskModal
          isOpen={newTaskModalOpen}
          onClose={() => setNewTaskModalOpen(false)}
          onAddTask={handleAddTask}
        />
      )}
    </div>
  );
};
