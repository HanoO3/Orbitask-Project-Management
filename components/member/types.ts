export type ProjectMember = {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

export type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  manager: { id: string; name: string; email: string };
  members: ProjectMember[];
  _count: { tasks: number; members: number };
  tasks: { id: string; status: string }[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  dueDate: string | Date;
  project: { id: string; name: string };
  assignee: { id: string; name: string; email: string } | null;
  _count: { comments: number };
};

export type WorkspaceOverview = {
  totalWorkspaceUsers: number;
  recentUsers: { id: string; name: string; role: string }[];
  recentTasks: {
    id: string;
    title: string;
    status: string;
    creator: { id: string; name: string };
    project: { id: string; name: string };
  }[];
};

export function getInitials(name: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const priorityBadgeStyle = (p: string) => {
  const styles: Record<string, string> = {
    LOW: "bg-gray-800/60 text-gray-400 border border-gray-700/50",
    MEDIUM: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    HIGH: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    URGENT: "bg-red-500/15 text-red-400 border border-red-500/30",
  };
  return styles[p] || "bg-gray-800/60 text-gray-400 border border-gray-700/50";
};

export const projectStatusStyle = (s: string) => {
  const styles: Record<string, { label: string; style: string }> = {
    NOT_STARTED: { label: "Not started", style: "bg-gray-800/60 text-gray-400 border-gray-700" },
    IN_PROGRESS: { label: "On track", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    ON_HOLD: { label: "At risk", style: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    COMPLETED: { label: "Completed", style: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  };
  return styles[s] || { label: s, style: "bg-gray-800/60 text-gray-400 border-gray-700" };
};

export const colorPalette = [
  "bg-blue-600",
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
];

export function formatDate(d: string | Date) {
  if (!d) return "";
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
