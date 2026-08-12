'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Plus, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavbarProps {
  title?: string;
  onOpenNewTaskModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = 'Dashboard',
  onOpenNewTaskModal,
}) => {
  const { data: session } = useSession();
  const canManageTasks = session?.user?.role === 'ADMIN' || session?.user?.role === 'PROJECT_MANAGER';
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <>
      {/* Desktop Top Navbar Header (lg and above) */}
      <header className="hidden lg:flex sticky top-0 z-20 bg-[var(--bg-main)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-8 py-3.5 items-center justify-between w-full max-w-full transition-colors">
        {/* Left side: Page Title */}
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {title}
          </h1>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* + New Task Button */}
          {canManageTasks && onOpenNewTaskModal && (
            <button
              onClick={onOpenNewTaskModal}
              className="flex items-center gap-1.5 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-3.5 py-1.5 rounded-lg font-medium text-sm shadow-[0_4px_12px_rgba(78,117,255,0.3)] hover:shadow-[0_6px_16px_rgba(78,117,255,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          )}

          {/* Database Notifications Bell */}
          <NotificationBell />

          {/* Profile Avatar circle */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#4E75FF] text-white font-bold text-xs shadow-md border border-[#5B82FF]/40 hover:ring-2 hover:ring-[#5B82FF]/60 transition-all uppercase cursor-pointer"
              aria-label="User Profile"
            >
              {userInitials}
            </button>

            {/* User Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2 z-50 text-sm"
                >
                  <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{userName}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut({ callbackUrl: '/login' });
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Page Header (lg:hidden) - Inline Title & Primary Action only */}
      <div className="lg:hidden px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)] flex items-center justify-between w-full max-w-full transition-colors">
        <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        {canManageTasks && onOpenNewTaskModal && (
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        )}
      </div>
    </>
  );
};
