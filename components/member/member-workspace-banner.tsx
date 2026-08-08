'use client';

import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';

interface MemberWorkspaceBannerProps {
  totalWorkspaceUsers: number;
  totalProjects: number;
}

export function MemberWorkspaceBanner({ totalWorkspaceUsers, totalProjects }: MemberWorkspaceBannerProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center justify-between gap-4 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#4E75FF]/15 border border-[#5B82FF]/30 text-[#5B82FF] flex items-center justify-center shrink-0 shadow-xs">
          <Users className="w-6 h-6 text-[#5B82FF]" />
        </div>
        <div>
          <h3 className="font-bold text-base text-[var(--text-primary)]">Team Workspace</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {totalWorkspaceUsers || 1} active members · {totalProjects} active shared projects
          </p>
        </div>
      </div>

      <Link
        href="/messages"
        className="px-4 py-2.5 bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-semibold rounded-xl hover:bg-[#4E75FF] hover:text-white transition shrink-0"
      >
        Workspace Chat
      </Link>
    </div>
  );
}
