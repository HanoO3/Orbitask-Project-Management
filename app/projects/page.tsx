'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Search, FolderKanban, Loader2, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserProjects } from '@/lib/actions/projects';

type RealProject = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  displayStatus: 'On track' | 'At risk' | 'Delayed' | 'Completed';
  manager?: { id: string; name: string; email: string };
  members: { user: { id: string; name: string; email: string } }[];
  tasks: { id: string; status: string }[];
};

function formatDate(d: string | Date) {
  if (!d) return '';
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getInitials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const bgColors = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
];

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<RealProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'status' | 'date'>('name');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserProjects();
      setProjects(data as RealProject[]);
    } catch (error) {
      console.error('Failed to fetch user projects:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadProjects(), 0);
    return () => clearTimeout(t);
  }, [loadProjects]);

  const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || p.displayStatus === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'priority') return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (sortBy === 'status') return a.displayStatus.localeCompare(b.displayStatus);
      if (sortBy === 'date') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      return 0;
    });

  const getStatusBadge = (status: RealProject['displayStatus']) => {
    switch (status) {
      case 'On track':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
            On track
          </span>
        );
      case 'At risk':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
            At risk
          </span>
        );
      case 'Delayed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
            Delayed
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const userRole = session?.user?.role;

  const getProjectHref = (projectId: string) => {
    return `/manager/projects/${projectId}`;
  };

  return (
    <DashboardLayout title="Projects">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Active Projects</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Manage your real workspace projects and track progress across deliverables.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full sm:w-48 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'priority' | 'status' | 'date')}
            className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
          >
            <option value="name">Sort by Name</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
            <option value="date">Sort by Due Date</option>
          </select>

          <div className="flex flex-wrap bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-1 text-xs max-w-full overflow-x-auto">
            {['All', 'On track', 'At risk', 'Delayed', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === status
                    ? 'bg-[#4E75FF] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid or Loading / Empty State */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--text-secondary)] gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#4E75FF]" />
          <span>Loading workspace projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-8 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[#5B82FF]">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No active projects found</h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {searchQuery || filterStatus !== 'All'
              ? 'No projects match your search or status filter criteria.'
              : userRole === 'PROJECT_MANAGER'
              ? 'You currently have no active projects created. Create one from your manager dashboard.'
              : 'You have not been assigned to any workspace projects yet.'}
          </p>
          {userRole === 'PROJECT_MANAGER' && (
            <Link
              href="/manager/dashboard"
              className="inline-flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>Go to Manager Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project, idx) => {
            const href = getProjectHref(project.id);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <Link
                  href={href}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#5B82FF] active:border-[#5B82FF] active:scale-[0.99] cursor-pointer rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all group block h-full"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5">
                        <FolderKanban className="w-5 h-5 text-[#5B82FF] group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#5B82FF] transition-colors break-words">
                          {project.name}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Due {formatDate(project.endDate)}</p>
                      </div>
                    </div>
                    <div className="self-start shrink-0">
                      {getStatusBadge(project.displayStatus)}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed line-clamp-2">
                    {project.description || 'Workspace project deliverables and task tracking.'}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)]">Manager:</span>
                        <span className="font-semibold text-[var(--text-primary)]">{project.manager?.name || 'Unassigned'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--text-secondary)]">Members:</span>
                        {project.members && project.members.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden">
                            {project.members.slice(0, 4).map((m, mIdx) => {
                              const initials = getInitials(m.user.name);
                              const colorClass = bgColors[mIdx % bgColors.length];
                              return (
                                <div
                                  key={m.user.id}
                                  title={m.user.name}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[var(--bg-card)] ${colorClass}`}
                                >
                                  {initials}
                                </div>
                              );
                            })}
                            {project.members.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center text-[10px] font-bold ring-2 ring-[var(--bg-card)]">
                                +{project.members.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">None</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Overall Progress</span>
                        <span className="font-semibold text-[var(--text-primary)]">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-[var(--border-color)] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#4E75FF] h-full rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
