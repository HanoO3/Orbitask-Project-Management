'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAnalyticsData } from '@/lib/actions/analytics';
import { BarChart3, Loader2 } from 'lucide-react';

type AnalyticsPayload = Awaited<ReturnType<typeof getAnalyticsData>>;

export function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnalyticsData();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  if (loading) {
    return (
      <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-8 text-center text-[#8E95AF] flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#4E75FF]" />
        <span className="text-xs">Loading real analytics data...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4E75FF]/10 text-[#4E75FF] flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Performance Analytics</h2>
            <p className="text-xs text-[#8E95AF]">Database-backed productivity and workload indicators</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#4E75FF]/15 text-[#4E75FF] font-semibold">
          {data.taskCompletionRate}% Overall Progress
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-4 space-y-1">
          <p className="text-xs text-[#8E95AF]">Task Completion Rate</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{data.taskCompletionRate}%</span>
            <span className="text-xs text-emerald-400 font-semibold">{data.completedTasks}/{data.totalTasks} Done</span>
          </div>
          <div className="w-full bg-[#1C2035] h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#4E75FF] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(78,117,255,0.6)]"
              style={{ width: `${data.taskCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-4 space-y-1">
          <p className="text-xs text-[#8E95AF]">Active Projects</p>
          <span className="text-2xl font-bold text-blue-400">{data.activeProjects}</span>
          <p className="text-[10px] text-[#626A86]">Out of {data.totalProjects} total workspace projects</p>
        </div>

        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-4 space-y-1">
          <p className="text-xs text-[#8E95AF]">In Progress Tasks</p>
          <span className="text-2xl font-bold text-amber-400">{data.inProgressTasks}</span>
          <p className="text-[10px] text-[#626A86]">{data.reviewTasks} tasks under review</p>
        </div>

        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-4 space-y-1">
          <p className="text-xs text-[#8E95AF]">Urgent & High Priority</p>
          <span className="text-2xl font-bold text-rose-400">
            {data.priorityBreakdown.URGENT + data.priorityBreakdown.HIGH}
          </span>
          <p className="text-[10px] text-[#626A86]">{data.priorityBreakdown.URGENT} urgent priority tasks</p>
        </div>
      </div>

      {/* Task Status & Priority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Card */}
        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[#8E95AF]">
            Task Status Breakdown
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300 font-medium">To Do</span>
                <span className="text-[#8E95AF]">{data.statusBreakdown.TODO} tasks</span>
              </div>
              <div className="w-full bg-[#1C2035] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gray-500 h-full rounded-full"
                  style={{
                    width: `${data.totalTasks ? (data.statusBreakdown.TODO / data.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-300 font-medium">In Progress</span>
                <span className="text-[#8E95AF]">{data.statusBreakdown.IN_PROGRESS} tasks</span>
              </div>
              <div className="w-full bg-[#1C2035] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${data.totalTasks ? (data.statusBreakdown.IN_PROGRESS / data.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-300 font-medium">Review</span>
                <span className="text-[#8E95AF]">{data.statusBreakdown.REVIEW} tasks</span>
              </div>
              <div className="w-full bg-[#1C2035] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${data.totalTasks ? (data.statusBreakdown.REVIEW / data.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-300 font-medium">Completed</span>
                <span className="text-[#8E95AF]">{data.statusBreakdown.COMPLETED} tasks</span>
              </div>
              <div className="w-full bg-[#1C2035] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${data.totalTasks ? (data.statusBreakdown.COMPLETED / data.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[#8E95AF]">
            Priority Distribution
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1A1E32] border border-[#2B314F] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                URG
              </div>
              <div>
                <p className="text-lg font-bold text-white">{data.priorityBreakdown.URGENT}</p>
                <p className="text-[10px] text-[#8E95AF]">Urgent Tasks</p>
              </div>
            </div>

            <div className="bg-[#1A1E32] border border-[#2B314F] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                HIGH
              </div>
              <div>
                <p className="text-lg font-bold text-white">{data.priorityBreakdown.HIGH}</p>
                <p className="text-[10px] text-[#8E95AF]">High Priority</p>
              </div>
            </div>

            <div className="bg-[#1A1E32] border border-[#2B314F] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                MED
              </div>
              <div>
                <p className="text-lg font-bold text-white">{data.priorityBreakdown.MEDIUM}</p>
                <p className="text-[10px] text-[#8E95AF]">Medium Priority</p>
              </div>
            </div>

            <div className="bg-[#1A1E32] border border-[#2B314F] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-500/15 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                LOW
              </div>
              <div>
                <p className="text-lg font-bold text-white">{data.priorityBreakdown.LOW}</p>
                <p className="text-[10px] text-[#8E95AF]">Low Priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
