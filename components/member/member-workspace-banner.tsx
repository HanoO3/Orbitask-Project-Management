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
    <div className="bg-[#131725] border border-[#22293F] rounded-2xl p-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#4E75FF]/15 border border-[#5B82FF]/30 text-[#5B82FF] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(78,117,255,0.2)]">
          <Users className="w-6 h-6 text-[#5B82FF]" />
        </div>
        <div>
          <h3 className="font-bold text-base text-white">Team Workspace</h3>
          <p className="text-xs text-gray-400">
            {totalWorkspaceUsers || 1} active members · {totalProjects} active shared projects
          </p>
        </div>
      </div>

      <Link
        href="/messages"
        className="px-4 py-2.5 bg-[#1C2337] border border-[#2D3754] text-white text-xs font-semibold rounded-xl hover:bg-[#252E47] transition shrink-0"
      >
        Workspace Chat
      </Link>
    </div>
  );
}
