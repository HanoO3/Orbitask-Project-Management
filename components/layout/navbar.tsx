'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Plus, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '@/components/notification-bell';
import { useMobileNav } from '@/components/app-layout';

interface NavbarProps {
  title?: string;
  onOpenMobileMenu?: () => void;
  onOpenNewTaskModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = 'Dashboard',
  onOpenMobileMenu,
  onOpenNewTaskModal,
}) => {
  const { data: session } = useSession();
  const { toggleMobileNav } = useMobileNav();
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
    <header className="sticky top-0 z-20 bg-[#0B0D1A]/90 backdrop-blur-md border-b border-[#23263A] px-4 md:px-8 py-3.5 flex items-center justify-between w-full max-w-full overflow-x-hidden">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          onClick={onOpenMobileMenu || toggleMobileNav}
          className="lg:hidden text-[#8E95AF] hover:text-white p-1.5 rounded-lg hover:bg-[#141726] transition-colors shrink-0"
          aria-label="Open Menu"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* + New Task Button */}
        {onOpenNewTaskModal && (
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-3.5 py-1.5 rounded-lg font-medium text-xs md:text-sm shadow-[0_4px_12px_rgba(78,117,255,0.3)] hover:shadow-[0_6px_16px_rgba(78,117,255,0.4)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}

        {/* Real Database Notifications Bell */}
        <NotificationBell />

        {/* Profile Avatar circle */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[#4E75FF] text-white font-bold text-xs shadow-md border border-[#5B82FF]/40 hover:ring-2 hover:ring-[#5B82FF]/60 transition-all uppercase"
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
                className="absolute right-0 mt-2 w-56 bg-[#141726] border border-[#23263A] rounded-xl shadow-2xl p-2 z-50 text-sm"
              >
                <div className="px-3 py-2 border-b border-[#23263A] mb-1">
                  <p className="font-semibold text-white truncate">{userName}</p>
                  <p className="text-xs text-[#8E95AF] truncate">{userEmail}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#8E95AF] hover:text-white hover:bg-[#1D2236] transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOut({ callbackUrl: '/login' });
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
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
  );
};
