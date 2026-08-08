'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { Project } from '@/types';

interface ActiveProjectsProps {
  projects: Project[];
}

export const ActiveProjectsCard: React.FC<ActiveProjectsProps> = ({ projects }) => {
  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'On track':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
            On track
          </span>
        );
      case 'At risk':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
            At risk
          </span>
        );
      case 'Delayed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
            Delayed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            Active Projects
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Track progress across your teams
          </p>
        </div>
        <button
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
          aria-label="Options"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-5">
        {projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.07 }}
            className="group"
          >
            {/* Project Info Header */}
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[#5B82FF] transition-colors">
                  {project.name}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Due {project.dueDate}
                </p>
              </div>

              {/* Badges & Avatars */}
              <div className="flex items-center gap-3">
                {getStatusBadge(project.status)}

                {/* Overlapping Avatars */}
                <div className="flex -space-x-2 overflow-hidden">
                  {project.team.map((member) => (
                    <div
                      key={member.id}
                      title={member.name}
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--bg-card)] ${member.avatarBg}`}
                    >
                      {member.initials}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="space-y-1">
              <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + idx * 0.1 }}
                  className="bg-[#4E75FF] h-full rounded-full shadow-[0_0_8px_rgba(78,117,255,0.6)]"
                />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {project.progress}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
