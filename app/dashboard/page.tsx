'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardGreeting } from '@/components/dashboard/dashboard-greeting';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ActiveProjectsCard } from '@/components/dashboard/active-projects';
import { RecentActivityCard } from '@/components/dashboard/recent-activity';
import { MyTasksCard } from '@/components/dashboard/my-tasks';
import { WorkspaceCard } from '@/components/dashboard/workspace-card';
import { initialProjects, initialRecentActivities, initialTasks } from '@/lib/data';
import { Task } from '@/types';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState(initialProjects);
  const [activities, setActivities] = useState(initialRecentActivities);
  const [tasks, setTasks] = useState(initialTasks);

  const userName = session?.user?.name ? session.user.name.split(' ')[0] : 'User';

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `t_${Date.now()}`,
      completed: false,
    };
    setTasks([newTask, ...tasks]);
  };

  return (
    <DashboardLayout title="Dashboard" onAddTask={handleAddTask}>
      {/* Dynamic Greeting Header Section */}
      <div className="pb-2">
        <DashboardGreeting
          userName={userName}
          subtitle="Here's what's happening with your workspace projects today."
        />
      </div>

      {/* Metric Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Total Projects"
          value="12"
          change="+2 from last month"
          changeType="positive"
          iconType="total"
        />
        <MetricCard
          title="Tasks Completed"
          value="48/64"
          change="75% completion rate"
          changeType="positive"
          iconType="completion"
        />
        <MetricCard
          title="Team Members"
          value="8"
          change="All members active"
          changeType="neutral"
          iconType="progress"
        />
        <MetricCard
          title="Upcoming Deadlines"
          value="3"
          change="Next 48 hours"
          changeType="negative"
          iconType="overdue"
        />
      </div>

      {/* Main Content Area: Active Projects + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveProjectsCard projects={projects} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityCard activities={activities} />
        </div>
      </div>

      {/* Bottom Section: My Tasks + Workspace Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MyTasksCard tasks={tasks} />
        </div>
        <div className="lg:col-span-1">
          <WorkspaceCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
