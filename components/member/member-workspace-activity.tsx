'use client';

import React from 'react';
import { WorkspaceOverview, colorPalette, getInitials } from './types';

interface MemberWorkspaceActivityProps {
  overview: WorkspaceOverview;
}

export function MemberWorkspaceActivity({ overview }: MemberWorkspaceActivityProps) {
  return (
    <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Workspace Activity</h2>
        <p className="text-xs text-gray-400 mb-5">Latest updates from database</p>

        <div className="space-y-4">
          {overview.recentTasks.length === 0 && overview.recentUsers.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No recent activity logged.</p>
          ) : (
            overview.recentTasks.map((t, idx) => {
              const initials = getInitials(t.creator.name);
              const color = colorPalette[idx % colorPalette.length];
              return (
                <div key={t.id} className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-7 h-7 rounded-full ${color} text-white font-bold flex items-center justify-center shrink-0 text-[10px] uppercase`}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 leading-snug">
                      <span className="font-semibold text-white">{t.creator.name}</span> updated task{' '}
                      <span className="font-semibold text-[#5B82FF]">{t.title}</span> in{' '}
                      <span className="text-gray-400">#{t.project.name}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Status: {t.status}</p>
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
