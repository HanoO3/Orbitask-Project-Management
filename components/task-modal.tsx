'use client';

import { useState, useEffect } from 'react';
import { createTask, updateTask } from '@/lib/actions/manager-projects';
import { X } from 'lucide-react';

type Member = { id: string; name: string; email: string };

type Task = {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  dueDate: string | Date;
  assigneeId: string | null;
};

function formatDateInput(d: string | Date) {
  return new Date(d).toISOString().split('T')[0];
}

export function TaskModal({
  isOpen,
  onClose,
  projectId,
  editingTask,
  members,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  editingTask: Task | null;
  members: Member[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description);
        setPriority(editingTask.priority);
        setStatus(editingTask.status);
        setDueDate(formatDateInput(editingTask.dueDate));
        setAssigneeId(editingTask.assigneeId || '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('TODO');
        setDueDate('');
        setAssigneeId('');
      }
      setError('');
    }, 0);
    return () => clearTimeout(t);
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setError('Title and due date are required.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      title,
      description,
      priority,
      status,
      dueDate,
      assigneeId: assigneeId || null,
    };

    const res = editingTask
      ? await updateTask(editingTask.id, projectId, payload)
      : await createTask(projectId, payload);

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#141726] border border-[#23263A] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-white">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#23263A]">
          <h2 className="text-base font-bold text-white">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="text-[#8E95AF] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement user login API"
              className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task details and expectations..."
              className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED')}
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E95AF] mb-1 uppercase tracking-wider">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-[#0B0D1A] border border-[#23263A] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#5B82FF]"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#23263A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8E95AF] hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2 text-xs font-semibold rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}