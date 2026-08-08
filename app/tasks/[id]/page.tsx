'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { getTaskDetail, addTaskComment } from '@/lib/actions/task-comments';
import { NotificationBell } from '@/components/notification-bell';
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
    LOW: 'bg-slate-700/50 text-slate-300 border border-slate-600/40',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    HIGH: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    URGENT: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  };
  return styles[p] || 'bg-slate-700/50 text-slate-300';
};

const statusBadge = (s: string) => {
  const styles: Record<string, string> = {
    TODO: 'bg-slate-700/50 text-slate-300 border border-slate-600/40',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    REVIEW: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  };
  return styles[s] || 'bg-slate-700/50 text-slate-300';
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
    return <div className="min-h-screen bg-[#0B0D1A] p-8 text-center text-[#8E95AF]">Loading task details...</div>;
  }

  if (!task) {
    return <div className="min-h-screen bg-[#0B0D1A] p-8 text-center text-[#8E95AF]">Task not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0E17] text-white p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/tasks" className="flex items-center gap-2 text-xs font-semibold text-[#5B82FF] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Tasks
          </Link>
          <div className="hidden lg:block">
            <NotificationBell />
          </div>
        </div>

        {/* Task Details Card */}
        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#5B82FF] uppercase tracking-wider">
                {task.project.name}
              </span>
              <h1 className="text-2xl font-extrabold text-white">{task.title}</h1>
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

          <p className="text-sm text-[#8E95AF] leading-relaxed">{task.description || 'No description provided.'}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#23263A] text-xs text-[#8E95AF]">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[#626A86]">Assignee</span>
              <span className="font-bold text-white mt-0.5 block">{task.assignee ? task.assignee.name : 'Unassigned'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[#626A86]">Creator</span>
              <span className="font-bold text-white mt-0.5 block">{task.creator.name}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-[#626A86]">Due Date</span>
              <span className="font-bold text-white mt-0.5 block">{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Comments Stream */}
        <div className="bg-[#141726] border border-[#23263A] rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#5B82FF]" /> Activity & Comments ({task.comments.length})
          </h2>

          <div className="space-y-3">
            {task.comments.length === 0 ? (
              <p className="text-xs text-[#8E95AF]">No comments yet. Be the first to start the discussion.</p>
            ) : (
              task.comments.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-[#0B0D1A] border border-[#23263A] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.user?.name || 'System User'}</span>
                    <span className="text-[10px] text-[#626A86]">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#8E95AF] leading-relaxed mt-1">{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t border-[#23263A]">
            {commentError && <div className="p-2 bg-rose-500/20 text-rose-300 text-xs rounded-lg">{commentError}</div>}
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl p-3 text-xs text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="flex items-center gap-2 bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md disabled:opacity-40"
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