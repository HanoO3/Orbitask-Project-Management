export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'Todo' | 'In Progress' | 'Overdue' | 'Completed';

export type ProjectStatus = 'On track' | 'At risk' | 'Delayed' | 'Completed';

export interface Member {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  role?: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  projectName: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed: boolean;
  assignedTo?: Member[];
}

export interface Project {
  id: string;
  name: string;
  dueDate: string;
  progress: number;
  status: ProjectStatus;
  team: Member[];
  tasksCount?: number;
}

export interface Activity {
  id: string;
  user: Member;
  action: string;
  target: string;
  time: string;
}

export interface MetricData {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}
