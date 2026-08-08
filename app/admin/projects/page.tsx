"use client";

import { useEffect, useState, useCallback } from "react";
import { getProjects, getProjectManagers, deleteProject } from "@/lib/actions/projects";
import { ProjectModal } from "@/components/project-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { User2, ClipboardList, Users } from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
  managerId: string;
  manager: { id: string; name: string; email: string };
  _count: { tasks: number; members: number };
};

type Manager = { id: string; name: string; email: string };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [projectsData, managersData] = await Promise.all([
      getProjects(),
      getProjectManagers(),
    ]);
    setProjects(projectsData as Project[]);
    setManagers(managersData);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProject(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This will also delete its tasks.")) return;
    await deleteProject(id);
    loadData();
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Project Management</h1>
          <p className="text-[var(--text-secondary)] text-xs mt-1">Create and monitor all system projects</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
          >
            + New Project
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#5B82FF]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#5B82FF]"
        >
          <option value="ALL">All Status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-[var(--text-secondary)] py-8 text-xs">Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)] py-8 text-xs">No projects found</p>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-base text-[var(--text-primary)]">{project.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs mb-3">{project.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <User2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      Manager: {project.manager.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      {project._count.tasks} tasks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      {project._count.members} members
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 ml-4 text-xs">
                  <button
                    onClick={() => {
                      setEditingProject(project);
                      setModalOpen(true);
                    }}
                    className="text-[#5B82FF] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        editingProject={editingProject}
        managers={managers}
      />
    </div>
  );
}