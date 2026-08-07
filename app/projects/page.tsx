'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Search, FolderKanban, Loader2, ArrowRight, Shield, User as UserIcon } from 'lucide-react';
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
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || p.displayStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: RealProject['displayStatus']) => {
    switch (status) {
      case 'On track':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            On track
          </span>
        );
      case 'At risk':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            At risk
          </span>
        );
      case 'Delayed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Delayed
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const userRole = session?.user?.role;

  const getProjectHref = (projectId: string) => {
    if (userRole === 'PROJECT_MANAGER') {
      return `/manager/projects/${projectId}`;
    }
    return `#`;
  };

  return (
    <DashboardLayout title="Projects">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Active Projects</h2>
          <p className="text-xs text-[#8E95AF] mt-1">
            Manage your real workspace projects and track progress across deliverables.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="bg-[#141726] border border-[#23263A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div className="flex bg-[#141726] border border-[#23263A] rounded-xl p-1 text-xs">
            {['All', 'On track', 'At risk', 'Delayed', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-[#4E75FF] text-white shadow-sm'
                    : 'text-[#8E95AF] hover:text-white'
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
        <div className="flex items-center justify-center py-20 text-[#8E95AF] gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#4E75FF]" />
          <span>Loading workspace projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1E2338] border border-[#2B314F] flex items-center justify-center mx-auto text-[#5B82FF]">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No active projects found</h3>
          <p className="text-xs text-[#8E95AF] leading-relaxed">
            {searchQuery || filterStatus !== 'All'
              ? 'No projects match your search or status filter criteria.'
              : userRole === 'PROJECT_MANAGER'
              ? 'You currently have no active projects created. Create one from your manager dashboard.'
              : 'You have not been assigned to any workspace projects yet.'}
          </p>
          {userRole === 'PROJECT_MANAGER' && (
            <Link
              href="/manager/dashboard"
              className="inline-flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all"
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
            const isClickable = href !== '#';

            const CardWrapper = isClickable ? Link : ('div' as any);

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
              >
                <CardWrapper
                  href={isClickable ? href : undefined}
                  className={`bg-[#141726] border border-[#23263A] ${
                    isClickable ? 'hover:border-[#5B82FF] cursor-pointer' : 'hover:border-[#333754]'
                  } rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all group block h-full`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1E2338] border border-[#2B314F] flex items-center justify-center shrink-0">
                          <FolderKanban className="w-5 h-5 text-[#5B82FF] group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-[#5B82FF] transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-xs text-[#8E95AF]">
                            Due {formatDate(project.endDate)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(project.displayStatus)}
                    </div>

                    <p className="text-xs text-[#8E95AF] mb-5 leading-relaxed line-clamp-2">
                      {project.description || 'Workspace project deliverables and task tracking.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#23263A]">
                    {/* Manager & Team Info */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8E95AF]">Manager:</span>
                        <span className="font-semibold text-white">
                          {project.manager?.name || 'Unassigned'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8E95AF]">Members:</span>
                        {project.members && project.members.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden">
                            {project.members.slice(0, 4).map((m, mIdx) => {
                              const initials = getInitials(m.user.name);
                              const colorClass = bgColors[mIdx % bgColors.length];
                              return (
                                <div
                                  key={m.user.id}
                                  title={m.user.name}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#141726] ${colorClass}`}
                                >
                                  {initials}
                                </div>
                              );
                            })}
                            {project.members.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-[#23263A] text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-[#141726]">
                                +{project.members.length - 4}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#8E95AF]">None</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#8E95AF]">Overall Progress</span>
                        <span className="font-semibold text-white">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-[#1C2035] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#4E75FF] h-full rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
