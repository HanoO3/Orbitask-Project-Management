'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { getTaskDetail, addTaskComment } from '@/lib/actions/task-comments';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';

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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  dueDate: string | Date;
  project: { id: string; name: string; managerId: string };
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string };
  comments: Comment[];
};

const priorityBadge = (p: string) => {
  const styles: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40',
    MEDIUM: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    HIGH: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    URGENT: 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
  };
  return styles[p] || 'bg-slate-100 text-slate-700';
};

const statusBadge = (s: string) => {
  const styles: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/40',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    REVIEW: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  };
  return styles[s] || 'bg-slate-100 text-slate-700';
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: taskId } = use(params);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getTaskDetail(taskId);
    setTask(data as TaskDetail | null);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setCommentError('');

    const res = await addTaskComment(taskId, newComment.trim());

    setSubmittingComment(false);

    if (res.error) {
      setCommentError(res.error);
    } else {
      setNewComment('');
      loadData();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[var(--bg-main)] p-8 text-center text-[var(--text-secondary)]">Loading task details...</div>;
  }

  if (!task) {
    return <div className="min-h-screen bg-[var(--bg-main)] p-8 text-center text-[var(--text-secondary)]">Task not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/tasks" className="flex items-center gap-2 text-xs font-semibold text-[#5B82FF] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Tasks
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>

        {/* Task Details Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#5B82FF] uppercase tracking-wider">
                {task.project.name}
              </span>
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{task.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityBadge(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{task.description || 'No description provided.'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">Assignee</span>
              <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{task.assignee ? task.assignee.name : 'Unassigned'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">Creator</span>
              <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{task.creator.name}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">Due Date</span>
              <span className="font-bold text-[var(--text-primary)] mt-0.5 block">{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Comments Stream */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#5B82FF]" /> Activity & Comments ({task.comments.length})
          </h2>

          <div className="space-y-3">
            {task.comments.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No comments yet. Be the first to start the discussion.</p>
            ) : (
              task.comments.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">{c.user?.name || 'System User'}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1">{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t border-[var(--border-color)]">
            {commentError && <div className="p-2 bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs rounded-lg">{commentError}</div>}
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Post Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}