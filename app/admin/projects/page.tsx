"use client";

import { useEffect, useState } from "react";
import { getProjects, getProjectManagers, deleteProject } from "@/lib/actions/projects";
import { ProjectModal } from "@/components/project-modal";
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

  const loadData = async () => {
    setLoading(true);
    const [projectsData, managersData] = await Promise.all([
      getProjects(),
      getProjectManagers(),
    ]);
    setProjects(projectsData as Project[]);
    setManagers(managersData);
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => void loadData(), 0);
    return () => clearTimeout(t);
  }, []);

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
    <div className="min-h-screen bg-[#0B0E17] text-white p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Project Management</h1>
          <p className="text-gray-400 text-xs mt-1">Create and monitor all system projects</p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null);
            setModalOpen(true);
          }}
          className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition self-start sm:self-auto shrink-0"
        >
          + New Project
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#131725] border border-[#22293F] text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#131725] border border-[#22293F] text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-xs">Loading projects...</p>
      ) : filteredProjects.length === 0 ? (
        <p className="text-center text-gray-500 py-8 text-xs">No projects found</p>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-[#131725] border border-[#22293F] rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-base text-white">{project.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">{project.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <User2 className="w-3.5 h-3.5 text-gray-400" />
                      Manager: {project.manager.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                      {project._count.tasks} tasks
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
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
                    className="text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-400 hover:underline"
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