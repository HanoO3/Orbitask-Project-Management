'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getProjectActivities, getSystemActivities } from '@/lib/actions/activities';
import { Activity, Clock, Loader2 } from 'lucide-react';

interface ActivityTimelineProps {
  projectId?: string;
}

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  createdAt: Date | string;
  user?: { id: string; name: string; email: string } | null;
  task?: { id: string; title: string } | null;
  project?: { id: string; name: string } | null;
};

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      if (projectId) {
        const data = await getProjectActivities(projectId);
        setActivities(data as ActivityItem[]);
      } else {
        const data = await getSystemActivities();
        setActivities(data as ActivityItem[]);
      }
    } catch (err) {
      console.error('Failed to load activity timeline:', err);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    const t = setTimeout(() => void loadActivities(), 0);
    return () => clearTimeout(t);
  }, [loadActivities]);

  return (
    <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-2 border-b border-[#23263A] pb-3">
        <Activity className="w-4 h-4 text-[#4E75FF]" />
        <h3 className="text-sm font-bold text-white tracking-tight">Activity Timeline</h3>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-[#8E95AF] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#4E75FF]" />
          <span>Loading workspace history...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8E95AF] space-y-1">
          <Clock className="w-6 h-6 text-[#626A86] mx-auto mb-2" />
          <p className="font-semibold text-white">No recent activities</p>
          <p className="text-[10px]">Actions will appear chronologically as your team collaborates.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#23263A]">
          {activities.map((act) => {
            const timeStr = new Date(act.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={act.id} className="relative text-xs space-y-1">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#4E75FF] ring-4 ring-[#141726]" />
                <div className="flex items-center justify-between text-[#8E95AF]">
                  <span className="font-semibold text-white truncate">
                    {act.user?.name || 'System User'}
                  </span>
                  <span className="text-[10px] text-[#626A86] shrink-0 ml-2">{timeStr}</span>
                </div>
                <p className="text-[#8E95AF] leading-relaxed">{act.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
