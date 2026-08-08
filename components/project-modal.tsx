'use client';

import { useState, useEffect } from 'react';
import { createProject, updateProject } from '@/lib/actions/projects';
import { X } from 'lucide-react';

type User = { id: string; name: string; email: string };

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  managerId: string;
};

function formatDateInput(d: string | Date) {
  return new Date(d).toISOString().split('T')[0];
}

export function ProjectModal({
  isOpen,
  onClose,
  editingProject,
  managers,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  managers: User[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [status, setStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'>('NOT_STARTED');
  const [managerId, setManagerId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (editingProject) {
        setName(editingProject.name);
        setDescription(editingProject.description);
        setStartDate(formatDateInput(editingProject.startDate));
        setEndDate(formatDateInput(editingProject.endDate));
        setPriority(editingProject.priority);
        setStatus(editingProject.status);
        setManagerId(editingProject.managerId);
      } else {
        setName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setPriority('MEDIUM');
        setStatus('NOT_STARTED');
        setManagerId(managers[0]?.id || '');
      }
      setError('');
    }, 0);
    return () => clearTimeout(t);
  }, [editingProject, isOpen, managers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate || !managerId) {
      setError('Name, dates, and project manager are required.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      name,
      description,
      startDate,
      endDate,
      priority,
      status,
      managerId,
    };

    const res = editingProject
      ? await updateProject(editingProject.id, payload)
      : await createProject(payload);

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-[var(--text-primary)] transition-colors">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project goals and deliverables..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Status</label>
              <select
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED')}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Project Manager *</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5B82FF]"
            >
              <option value="">Select a manager...</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white px-5 py-2 text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}