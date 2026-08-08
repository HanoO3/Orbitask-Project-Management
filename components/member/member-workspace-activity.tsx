'use client';

import React from 'react';
import { WorkspaceOverview, colorPalette, getInitials } from './types';

interface MemberWorkspaceActivityProps {
  overview: WorkspaceOverview;
}

export function MemberWorkspaceActivity({ overview }: MemberWorkspaceActivityProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between transition-colors">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Workspace Activity</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-5">Latest updates from database</p>

        <div className="space-y-4">
          {overview.recentTasks.length === 0 && overview.recentUsers.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4">No recent activity logged.</p>
          ) : (
            overview.recentTasks.map((t, idx) => {
              const initials = getInitials(t.creator.name);
              const color = colorPalette[idx % colorPalette.length];
              return (
                <div key={t.id} className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-7 h-7 rounded-full ${color} text-white font-bold flex items-center justify-center shrink-0 text-[10px] uppercase shadow-xs`}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-secondary)] leading-snug">
                      <span className="font-semibold text-[var(--text-primary)]">{t.creator.name}</span> updated task{' '}
                      <span className="font-semibold text-[#5B82FF]">{t.title}</span> in{' '}
                      <span className="text-[var(--text-secondary)]">#{t.project.name}</span>
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Status: {t.status}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
