'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from '@/types';

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivityCard: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
          Recent Activity
        </h3>
        <p className="text-xs text-[#8E95AF] mt-0.5">
          Latest updates from your team
        </p>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-4">
        {activities.map((act, idx) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="flex items-start gap-3 text-xs"
          >
            {/* User Avatar Circle */}
            <div
              className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-bold text-[11px] text-white ${act.user.avatarBg} shadow-sm border border-white/10`}
            >
              {act.user.initials}
            </div>

            {/* Activity Details */}
            <div className="flex-1 min-w-0">
              <p className="text-[#8E95AF] leading-relaxed break-words">
                <span className="font-semibold text-white mr-1">{act.user.name}</span>
                <span>{act.action}</span>{' '}
                <span className="font-semibold text-white">{act.target}</span>
              </p>
              <p className="text-[10px] text-[#626A86] mt-0.5">{act.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
