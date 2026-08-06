"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { getTaskDetail, addTaskComment } from "@/lib/actions/task-comments";
import { useSession } from "next-auth/react";

type Comment = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string; role: string } | null;
};

type TaskDetail = {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  dueDate: string | Date;
  project: { id: string; name: string; managerId: string };
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string };
  comments: Comment[];
};

const priorityBadge = (p: string) => {
  const styles: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };
  return styles[p] || "bg-gray-100 text-gray-600";
};

const statusBadge = (s: string) => {
  const styles: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    REVIEW: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-green-100 text-green-700",
  };
  return styles[s] || "bg-gray-100 text-gray-600";
};

const roleBadge = (role: string) => {
  const styles: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    PROJECT_MANAGER: "bg-blue-100 text-blue-700",
    TEAM_MEMBER: "bg-green-100 text-green-700",
  };
  return styles[role] || "bg-gray-100 text-gray-700";
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = use(params);
  const { data: session } = useSession();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadTask = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await getTaskDetail(taskId);
      setTask(data as TaskDetail);
      setError("");
    } catch (e: any) {
      if (!isSilent) setError(e.message || "Failed to load task");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadTask(false);

    // Auto-refresh comments every 5 seconds silently
    const interval = setInterval(() => {
      void loadTask(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [loadTask]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    const result = await addTaskComment(taskId, comment);
    setPosting(false);
    if (result.success) {
      setComment("");
      await loadTask(true);
    }
  };

  const backLink =
    session?.user?.role === "ADMIN"
      ? "/admin/projects"
      : session?.user?.role === "PROJECT_MANAGER"
      ? `/manager/projects/${task?.project.id || ""}`
      : "/member/dashboard";

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-400">Loading task details...</div>;
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow">
          <p className="text-red-500 font-medium mb-4">{error || "Task not found"}</p>
          <Link href="/member/dashboard" className="text-indigo-600 hover:underline text-sm">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <Link href={backLink} className="text-indigo-600 text-sm hover:underline">
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => void loadTask(true)}
            className="text-xs text-gray-500 hover:text-indigo-600"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mt-4 mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800">{task.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(task.status)}`}>
              {task.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{task.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>📁 {task.project?.name}</span>
            <span>👤 Assignee: {task.assignee?.name || "Unassigned"}</span>
            <span>📅 Due {new Date(task.dueDate).toLocaleDateString()}</span>
            <span>✍️ Created by {task.creator?.name || "Unknown"}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            Task Discussion ({task.comments.length})
          </h2>

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {task.comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No discussion yet. Start the conversation below.
              </p>
            ) : (
              task.comments.map((c) => {
                const userName = c.user?.name || "Unknown User";
                const userRole = c.user?.role || "TEAM_MEMBER";
                const initial = userName.charAt(0).toUpperCase();

                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium shrink-0">
                      {initial}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{userName}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${roleBadge(userRole)}`}>
                          {userRole.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{c.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              type="submit"
              disabled={posting || !comment.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}