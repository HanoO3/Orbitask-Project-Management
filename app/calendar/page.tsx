'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Loader2, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserWorkspaceTasks } from '@/lib/actions/task-comments';
import { getUserProjects } from '@/lib/actions/projects';

type CalendarTask = {
  id: string;
  title: string;
  dueDate: string | Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  project?: { id: string; name: string };
};

type CalendarProject = {
  id: string;
  name: string;
  endDate: string | Date;
  status: string;
};

const priorityColor: Record<string, string> = {
  URGENT: 'bg-rose-500',
  HIGH: 'bg-amber-500',
  MEDIUM: 'bg-blue-600',
  LOW: 'bg-emerald-600',
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // August 2026 default
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 7, 6)); // Default day 6

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [projects, setProjects] = useState<CalendarProject[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksData, projectsData] = await Promise.all([
        getUserWorkspaceTasks(),
        getUserProjects(),
      ]);
      setTasks(tasksData as CalendarTask[]);
      setProjects(projectsData as CalendarProject[]);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Calendar Math
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingPadding = Array.from({ length: firstDayOfWeek });

  // Map events to day numbers for current month/year
  const getEventsForDay = (day: number) => {
    const targetDateStr = new Date(year, month, day).toDateString();

    const dayTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate).toDateString() === targetDateStr;
    });

    const dayProjects = projects.filter((p) => {
      if (!p.endDate) return false;
      return new Date(p.endDate).toDateString() === targetDateStr;
    });

    return { dayTasks, dayProjects };
  };

  const selectedEvents = (() => {
    const day = selectedDate.getDate();
    if (selectedDate.getFullYear() === year && selectedDate.getMonth() === month) {
      return getEventsForDay(day);
    }
    return { dayTasks: [], dayProjects: [] };
  })();

  return (
    <DashboardLayout title="Calendar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {monthNames[month]} {year}
          </h2>
          <p className="text-xs text-[#8E95AF] mt-1">
            Overview of upcoming workspace task deadlines and project milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[#141726] border border-[#23263A] text-[#8E95AF] hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#4E75FF] hover:bg-[#5B82FF] text-white transition-all shadow-md"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-[#141726] border border-[#23263A] text-[#8E95AF] hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Month Grid (3 cols on desktop) */}
        <div className="lg:col-span-3 bg-[#141726] border border-[#23263A] rounded-2xl p-5 shadow-lg">
          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#8E95AF] pb-3 border-b border-[#23263A]">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {loading ? (
            <div className="py-24 text-center text-[#8E95AF] flex items-center justify-center gap-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#4E75FF]" />
              <span>Loading calendar deliverables...</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 md:gap-2 mt-3">
              {/* Blank leading slots for month start alignment */}
              {leadingPadding.map((_, i) => (
                <div key={`pad-${i}`} className="h-20 md:h-24 rounded-xl p-1 bg-transparent" />
              ))}

              {calendarDays.map((day) => {
                const cellDate = new Date(year, month, day);
                const isSelected =
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getFullYear() === year;

                const todayObj = new Date();
                const isToday =
                  todayObj.getDate() === day &&
                  todayObj.getMonth() === month &&
                  todayObj.getFullYear() === year;

                const { dayTasks, dayProjects } = getEventsForDay(day);
                const totalEventsCount = dayTasks.length + dayProjects.length;

                return (
                  <motion.div
                    key={day}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`h-20 md:h-24 rounded-xl p-2 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'bg-[#1E2540] border-[#5B82FF] shadow-[0_0_12px_rgba(91,130,255,0.3)]'
                        : isToday
                        ? 'bg-[#181C2E] border-[#4E75FF]/60'
                        : 'bg-[#0B0D1A]/40 border-[#23263A] hover:bg-[#141726]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-[#4E75FF] text-white flex items-center justify-center text-[11px]'
                            : 'text-white'
                        }`}
                      >
                        {day}
                      </span>
                      {totalEventsCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5B82FF]" />
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {dayProjects.map((p) => (
                        <div
                          key={`proj-${p.id}`}
                          className="text-[9px] font-bold text-white truncate px-1.5 py-0.5 rounded bg-purple-600/90"
                        >
                          📌 {p.name}
                        </div>
                      ))}

                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={`task-${t.id}`}
                          className={`text-[9px] font-semibold text-white truncate px-1.5 py-0.5 rounded ${
                            priorityColor[t.priority] || 'bg-[#4E75FF]'
                          }`}
                        >
                          {t.title}
                        </div>
                      ))}

                      {dayTasks.length > 2 && (
                        <p className="text-[9px] text-[#8E95AF] text-right font-medium">
                          +{dayTasks.length - 2} more
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Day Milestones Sidebar (1 col) */}
        <div className="lg:col-span-1 bg-[#141726] border border-[#23263A] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-[#23263A] pb-3">
            <CalendarIcon className="w-4 h-4 text-[#5B82FF]" />
            <h3 className="font-bold text-white text-sm">
              Schedule for {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
            </h3>
          </div>

          {selectedEvents.dayProjects.length === 0 && selectedEvents.dayTasks.length === 0 ? (
            <p className="text-xs text-[#8E95AF] py-8 text-center leading-relaxed">
              No task deadlines or project milestones scheduled for this date.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {/* Project End Date Milestones */}
              {selectedEvents.dayProjects.map((p) => (
                <div
                  key={`side-p-${p.id}`}
                  className="p-3.5 rounded-xl bg-[#0B0D1A] border border-purple-500/30 space-y-1"
                >
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    Project Deadline
                  </span>
                  <h4 className="text-xs font-bold text-white">{p.name}</h4>
                  <p className="text-[11px] text-[#8E95AF] flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-[#626A86]" /> Final Deliverables Due
                  </p>
                </div>
              ))}

              {/* Tasks Due */}
              {selectedEvents.dayTasks.map((t) => (
                <Link
                  key={`side-t-${t.id}`}
                  href={`/tasks/${t.id}`}
                  className="p-3.5 rounded-xl bg-[#0B0D1A] border border-[#23263A] hover:border-[#5B82FF] transition-all block group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#5B82FF] uppercase tracking-wider">
                      {t.project?.name || 'Task'}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold text-white ${
                        priorityColor[t.priority] || 'bg-[#4E75FF]'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#5B82FF] transition-colors">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-[#8E95AF] flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#626A86]" /> Status: {t.status}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#5B82FF] group-hover:translate-x-1 transition-transform" />
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
