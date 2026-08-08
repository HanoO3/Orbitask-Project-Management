'use client';

import React from 'react';
import Link from 'next/link';
import { Project, projectStatusStyle, formatDate, colorPalette, getInitials } from './types';

interface MemberActiveProjectsProps {
  projects: Project[];
  loading: boolean;
  mounted: boolean;
}

export function MemberActiveProjects({ projects, loading, mounted }: MemberActiveProjectsProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Active Projects</h2>
          <p className="text-xs text-[var(--text-secondary)]">Projects you are contributing to</p>
        </div>
        <Link
          href="/projects"
          className="text-xs font-semibold text-[#5B82FF] hover:underline transition"
        >
          View All →
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--text-muted)] py-6">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-6 text-center">No projects joined yet.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const totalProjTasks = project.tasks.length;
            const completedProjTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
            const progress = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
            const statusInfo = projectStatusStyle(project.status);

            return (
              <div key={project.id} className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">{project.name}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]" suppressHydrationWarning>
                      Manager: {project.manager.name} • Due {mounted ? formatDate(project.endDate) : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.style}`}>
                      {statusInfo.label}
                    </span>

                    {/* Real Dynamic Team Avatars */}
                    <div className="flex -space-x-2 overflow-hidden">
                      {project.members && project.members.length > 0 ? (
                        project.members.slice(0, 4).map((m, idx) => (
                          <div
                            key={m.id || idx}
                            title={m.user.name}
                            className={`w-6 h-6 rounded-full ${
                              colorPalette[idx % colorPalette.length]
                            } text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-card)] uppercase`}
                          >
                            {getInitials(m.user.name)}
                          </div>
                        ))
                      ) : (
                        <div
                          title={project.manager.name}
                          className="w-6 h-6 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[var(--bg-card)] uppercase"
                        >
                          {getInitials(project.manager.name)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#4E75FF] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] min-w-[32px] text-right">
                    {progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
