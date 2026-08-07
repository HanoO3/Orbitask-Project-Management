'use client';

import React from 'react';
import Link from 'next/link';
import { OrbitaskLogo } from '@/components/logo';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  FolderKanban,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Settings,
  Search,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckCircle2 },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const pathname = usePathname();

  const isNavActive = (href: string) => {
    if (href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) {
      return true;
    }
    return pathname.startsWith(href) && href !== '/dashboard';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#090B17] text-white p-4 w-64 border-r border-[#23263A] justify-between select-none">
      <div>
        {/* Top Header Logo */}
        <div className="flex items-center justify-between pb-6 pt-2 px-2">
          <OrbitaskLogo size="md" />
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-[#8E95AF] hover:text-white p-1 rounded-full hover:bg-[#141726] transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6 text-[#5B82FF]" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 px-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#121524] border border-[#23263A] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] focus:ring-1 focus:ring-[#5B82FF] transition-all"
          />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 px-1">
          {navItems.map((item) => {
            const active = isNavActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#4E75FF] text-white shadow-[0_4px_14px_rgba(78,117,255,0.4)] font-semibold'
                    : 'text-[#8E95AF] hover:text-white hover:bg-[#141726]'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#8E95AF]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings Link */}
      <div className="pt-4 border-t border-[#23263A]/80 px-1">
        <Link
          href="/settings"
          onClick={onCloseMobile}
          className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            pathname.startsWith('/settings')
              ? 'bg-[#4E75FF] text-white shadow-[0_4px_14px_rgba(78,117,255,0.4)]'
              : 'text-[#8E95AF] hover:text-white hover:bg-[#141726]'
          }`}
        >
          <Settings className="w-5 h-5 text-[#8E95AF]" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 z-30 w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-in Sidebar + Backdrop) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative z-10 h-full"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
