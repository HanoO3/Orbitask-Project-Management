'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export const WorkspaceCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="bg-[#141726] border border-[#23263A] rounded-2xl p-4 md:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      {/* Icon & Workspace Info */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#1E2338] border border-[#2B314F] flex items-center justify-center shrink-0 shadow-inner">
          <Users className="w-5 h-5 text-[#5B82FF]" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
            Team Workspace
          </h3>
          <p className="text-xs text-[#8E95AF] mt-0.5">
            8 members active · 4 projects shared
          </p>
        </div>
      </div>

      {/* Action Button */}
      <Link
        href="/settings?tab=team"
        className="w-full sm:w-auto text-center text-xs font-semibold text-white bg-[#1E2338] hover:bg-[#2A304D] border border-[#2B314F] px-4 py-2 rounded-xl transition-all shadow-sm"
      >
        Manage team
      </Link>
    </motion.div>
  );
};
