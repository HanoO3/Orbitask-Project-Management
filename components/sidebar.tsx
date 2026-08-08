'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutGrid,
  FolderKanban,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Settings,
  Search,
  X,
  Menu,
} from 'lucide-react';
import { OrbitaskLogo } from '@/components/logo';
import { NotificationBell } from '@/components/notification-bell';
import { LogoutButton } from '@/components/logout-button';
import { useMobileNav } from '@/components/app-layout';

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { mobileOpen, toggleMobileNav, closeMobileNav } = useMobileNav();
  const [searchQuery, setSearchQuery] = useState('');

  const role = session?.user?.role;

  let dashboardHref = '/dashboard';
  if (role === 'ADMIN') dashboardHref = '/admin/dashboard';
  if (role === 'PROJECT_MANAGER') dashboardHref = '/manager/dashboard';
  if (role === 'TEAM_MEMBER') dashboardHref = '/member/dashboard';

  const navItems = [
    { label: 'Dashboard', href: dashboardHref, icon: LayoutGrid },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Tasks', href: '/tasks', icon: CheckCircle2 },
    { label: 'Calendar', href: '/calendar', icon: Calendar },
    { label: 'Messages', href: '/messages', icon: MessageSquare },
  ];

  const isNavActive = (href: string) => {
    if (href === dashboardHref || href === '/dashboard') {
      return pathname === href || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const roleBadge = (r?: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
      PROJECT_MANAGER: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
      TEAM_MEMBER: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    };
    return styles[r || ''] || 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30';
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="lg:hidden bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors">
        <OrbitaskLogo size="md" />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={toggleMobileNav}
            aria-label="Toggle navigation"
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6 text-[#5B82FF]" /> : <Menu className="w-6 h-6 text-[var(--text-primary)]" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <div
          onClick={closeMobileNav}
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 max-w-[80vw] bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Header Logo */}
          <div className="h-20 px-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <OrbitaskLogo size="md" />
            <button
              onClick={closeMobileNav}
              className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 transition-colors"
            >
              <X className="w-5 h-5 text-[#5B82FF]" />
            </button>
          </div>

          {/* Sidebar Search Input */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#5B82FF] placeholder-[var(--text-muted)] transition-all"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const active = isNavActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileNav}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#4E75FF] text-white shadow-[0_4px_14px_rgba(78,117,255,0.4)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Settings & User Card */}
        <div className="p-4 border-t border-[var(--border-color)] space-y-3 bg-[var(--bg-sidebar)] transition-colors">
          <Link
            href="/settings"
            onClick={closeMobileNav}
            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname.startsWith('/settings') || pathname === '/profile'
                ? 'bg-[#4E75FF] text-white shadow-[0_4px_14px_rgba(78,117,255,0.4)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
            <span>Settings</span>
          </Link>

          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#4E75FF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                {session?.user?.name
                  ? session.user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'JD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {session?.user?.name || 'User'}
                </p>
                <span
                  className={`inline-block px-1.5 py-0.2 rounded-full text-[9px] font-semibold border ${roleBadge(
                    role
                  )}`}
                >
                  {(role || 'USER').replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
