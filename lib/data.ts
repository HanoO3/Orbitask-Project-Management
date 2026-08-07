import { Project, Task, Activity, Member } from '@/types';

export const teamMembers: Record<string, Member> = {
  AK: { id: 'm1', name: 'Alex K', initials: 'AK', avatarBg: 'bg-indigo-600', email: 'alex@orbitask.io', role: 'UI/UX Designer' },
  MR: { id: 'm2', name: 'Maria R', initials: 'MR', avatarBg: 'bg-blue-600', email: 'maria@orbitask.io', role: 'Backend Engineer' },
  JL: { id: 'm3', name: 'James L', initials: 'JL', avatarBg: 'bg-teal-600', email: 'james.l@orbitask.io', role: 'Frontend Developer' },
  JD: { id: 'm4', name: 'James D', initials: 'JD', avatarBg: 'bg-blue-500', email: 'james.d@orbitask.io', role: 'Product Lead' },
  SR: { id: 'm5', name: 'Sarah R', initials: 'SR', avatarBg: 'bg-purple-600', email: 'sarah@orbitask.io', role: 'Mobile Developer' },
  EM: { id: 'm6', name: 'Emma M', initials: 'EM', avatarBg: 'bg-pink-600', email: 'emma@orbitask.io', role: 'Marketing Manager' },
  TW: { id: 'm7', name: 'Tom W', initials: 'TW', avatarBg: 'bg-amber-600', email: 'tom@orbitask.io', role: 'Content Strategist' },
  DK: { id: 'm8', name: 'David K', initials: 'DK', avatarBg: 'bg-emerald-600', email: 'david@orbitask.io', role: 'DevOps Engineer' },
};

export const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    dueDate: 'Aug 12',
    progress: 82,
    status: 'On track',
    team: [teamMembers.AK, teamMembers.MR, teamMembers.JL],
    tasksCount: 24,
  },
  {
    id: 'p2',
    name: 'Mobile App v2',
    dueDate: 'Sep 01',
    progress: 45,
    status: 'At risk',
    team: [teamMembers.JD, teamMembers.SR],
    tasksCount: 18,
  },
  {
    id: 'p3',
    name: 'Marketing Campaign',
    dueDate: 'Aug 20',
    progress: 67,
    status: 'On track',
    team: [teamMembers.EM, teamMembers.AK, teamMembers.TW],
    tasksCount: 15,
  },
  {
    id: 'p4',
    name: 'API Migration',
    dueDate: 'Oct 05',
    progress: 30,
    status: 'Delayed',
    team: [teamMembers.MR, teamMembers.JD],
    tasksCount: 32,
  },
];

export const initialRecentActivities: Activity[] = [
  {
    id: 'a1',
    user: teamMembers.AK,
    action: 'completed',
    target: 'Homepage wireframes',
    time: '2h ago',
  },
  {
    id: 'a2',
    user: teamMembers.MR,
    action: 'commented on',
    target: 'API Migration',
    time: '3h ago',
  },
  {
    id: 'a3',
    user: teamMembers.JD,
    action: 'created',
    target: 'Login redirect bug',
    time: '5h ago',
  },
  {
    id: 'a4',
    user: teamMembers.EM,
    action: 'uploaded',
    target: 'Brand assets v2',
    time: '1d ago',
  },
];

export const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Review homepage mockups',
    projectName: 'Website Redesign',
    dueDate: 'Today',
    priority: 'High',
    status: 'In Progress',
    completed: false,
    assignedTo: [teamMembers.AK],
  },
  {
    id: 't2',
    title: 'Fix login redirect bug',
    projectName: 'Mobile App v2',
    dueDate: 'Today',
    priority: 'Urgent',
    status: 'Overdue',
    completed: false,
    assignedTo: [teamMembers.JD],
  },
  {
    id: 't3',
    title: 'Draft Q3 content calendar',
    projectName: 'Marketing Campaign',
    dueDate: 'Tomorrow',
    priority: 'Medium',
    status: 'Todo',
    completed: false,
    assignedTo: [teamMembers.EM, teamMembers.TW],
  },
  {
    id: 't4',
    title: 'Update API documentation',
    projectName: 'API Migration',
    dueDate: 'Aug 10',
    priority: 'Low',
    status: 'Todo',
    completed: false,
    assignedTo: [teamMembers.MR],
  },
];
