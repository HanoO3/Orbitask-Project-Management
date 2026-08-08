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
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 text-center text-[var(--text-secondary)] flex items-center justify-center gap-2 transition-colors">
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
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Real-Time Performance Analytics</h2>
            <p className="text-xs text-[var(--text-secondary)]">Database-backed productivity and workload indicators</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#4E75FF]/15 text-[#4E75FF] font-semibold">
          {data.taskCompletionRate}% Overall Progress
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-1 transition-colors">
          <p className="text-xs text-[var(--text-secondary)]">Task Completion Rate</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-primary)]">{data.taskCompletionRate}%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{data.completedTasks}/{data.totalTasks} Done</span>
          </div>
          <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#4E75FF] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(78,117,255,0.6)]"
              style={{ width: `${data.taskCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-1 transition-colors">
          <p className="text-xs text-[var(--text-secondary)]">Active Projects</p>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.activeProjects}</span>
          <p className="text-[10px] text-[var(--text-muted)]">Out of {data.totalProjects} total workspace projects</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-1 transition-colors">
          <p className="text-xs text-[var(--text-secondary)]">In Progress Tasks</p>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.inProgressTasks}</span>
          <p className="text-[10px] text-[var(--text-muted)]">{data.reviewTasks} tasks under review</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 space-y-1 transition-colors">
          <p className="text-xs text-[var(--text-secondary)]">Urgent & High Priority</p>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {data.priorityBreakdown.URGENT + data.priorityBreakdown.HIGH}
          </span>
          <p className="text-[10px] text-[var(--text-muted)]">{data.priorityBreakdown.URGENT} urgent priority tasks</p>
        </div>
      </div>

      {/* Task Status & Priority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 transition-colors">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Task Status Breakdown
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-primary)] font-medium">To Do</span>
                <span className="text-[var(--text-secondary)]">{data.statusBreakdown.TODO} tasks</span>
              </div>
              <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-400 dark:bg-gray-500 h-full rounded-full"
                  style={{
                    width: `${data.totalTasks ? (data.statusBreakdown.TODO / data.totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-600 dark:text-blue-300 font-medium">In Progress</span>
                <span className="text-[var(--text-secondary)]">{data.statusBreakdown.IN_PROGRESS} tasks</span>
              </div>
              <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
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
                <span className="text-amber-600 dark:text-amber-300 font-medium">Review</span>
                <span className="text-[var(--text-secondary)]">{data.statusBreakdown.REVIEW} tasks</span>
              </div>
              <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
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
                <span className="text-emerald-600 dark:text-emerald-300 font-medium">Completed</span>
                <span className="text-[var(--text-secondary)]">{data.statusBreakdown.COMPLETED} tasks</span>
              </div>
              <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
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
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 transition-colors">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Priority Distribution
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                URG
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{data.priorityBreakdown.URGENT}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Urgent Tasks</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                HIGH
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{data.priorityBreakdown.HIGH}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">High Priority</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                MED
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{data.priorityBreakdown.MEDIUM}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Medium Priority</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-gray-500/15 dark:text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                LOW
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{data.priorityBreakdown.LOW}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Low Priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
