'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
        <Link href="/tasks" className="text-xs px-2.5 py-1 rounded-full bg-[#4E75FF]/15 text-[#4E75FF] font-semibold hover:bg-[#4E75FF]/25 transition cursor-pointer">
          {data.taskCompletionRate}% Overall Progress
        </Link>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/tasks?status=COMPLETED" className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#5B82FF]/50 rounded-2xl p-4 space-y-1 transition-all block cursor-pointer group shadow-xs">
          <p className="text-xs text-[var(--text-secondary)] group-hover:text-[#5B82FF] transition-colors">Task Completion Rate</p>
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
        </Link>

        <Link href="/projects" className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/50 rounded-2xl p-4 space-y-1 transition-all block cursor-pointer group shadow-xs">
          <p className="text-xs text-[var(--text-secondary)] group-hover:text-blue-500 transition-colors">Active Projects</p>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.activeProjects}</span>
          <p className="text-[10px] text-[var(--text-muted)]">Out of {data.totalProjects} total workspace projects</p>
        </Link>

        <Link href="/tasks?status=IN_PROGRESS" className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-2xl p-4 space-y-1 transition-all block cursor-pointer group shadow-xs">
          <p className="text-xs text-[var(--text-secondary)] group-hover:text-amber-500 transition-colors">In Progress Tasks</p>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{data.inProgressTasks}</span>
          <p className="text-[10px] text-[var(--text-muted)]">{data.reviewTasks} tasks under review</p>
        </Link>

        <Link href="/tasks?priority=URGENT" className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-rose-500/50 rounded-2xl p-4 space-y-1 transition-all block cursor-pointer group shadow-xs">
          <p className="text-xs text-[var(--text-secondary)] group-hover:text-rose-500 transition-colors">Urgent & High Priority</p>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {data.priorityBreakdown.URGENT + data.priorityBreakdown.HIGH}
          </span>
          <p className="text-[10px] text-[var(--text-muted)]">{data.priorityBreakdown.URGENT} urgent priority tasks</p>
        </Link>
      </div>

      {/* Task Status & Priority Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 transition-colors">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Task Status Breakdown
          </h3>
          <div className="space-y-3">
            <Link href="/tasks?status=TODO" className="block group cursor-pointer">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--text-primary)] font-medium group-hover:text-[#5B82FF] transition-colors">To Do</span>
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
            </Link>

            <Link href="/tasks?status=IN_PROGRESS" className="block group cursor-pointer">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-600 dark:text-blue-300 font-medium group-hover:underline">In Progress</span>
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
            </Link>

            <Link href="/tasks?status=REVIEW" className="block group cursor-pointer">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-600 dark:text-amber-300 font-medium group-hover:underline">Review</span>
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
            </Link>

            <Link href="/tasks?status=COMPLETED" className="block group cursor-pointer">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-600 dark:text-emerald-300 font-medium group-hover:underline">Completed</span>
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
            </Link>
          </div>
        </div>

        {/* Priority Breakdown Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 transition-colors">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Priority Distribution
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/tasks?priority=URGENT" className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-rose-500/50 rounded-xl p-3.5 flex items-center gap-3 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                URG
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)] group-hover:text-rose-500 transition-colors">{data.priorityBreakdown.URGENT}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Urgent Tasks</p>
              </div>
            </Link>

            <Link href="/tasks?priority=HIGH" className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-xl p-3.5 flex items-center gap-3 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                HIGH
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors">{data.priorityBreakdown.HIGH}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">High Priority</p>
              </div>
            </Link>

            <Link href="/tasks?priority=MEDIUM" className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-blue-500/50 rounded-xl p-3.5 flex items-center gap-3 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                MED
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">{data.priorityBreakdown.MEDIUM}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Medium Priority</p>
              </div>
            </Link>

            <Link href="/tasks?priority=LOW" className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-slate-500/50 rounded-xl p-3.5 flex items-center gap-3 transition-all cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-gray-500/15 dark:text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                LOW
              </div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)] group-hover:text-slate-400 transition-colors">{data.priorityBreakdown.LOW}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Low Priority</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
