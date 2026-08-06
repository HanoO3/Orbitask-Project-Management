"use client";

import { useEffect, useState } from "react";
import { getProjects, getProjectManagers, deleteProject } from "@/lib/actions/projects";
import { ProjectModal } from "@/components/project-modal";

type Project = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
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
    setProjects(projectsData as any);
    setManagers(managersData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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

  const priorityBadge = (p: string) => {
    const styles: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-600",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-orange-100 text-orange-700",
      URGENT: "bg-red-100 text-red-700",
    };
    return styles[p];
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      NOT_STARTED: "bg-gray-100 text-gray-600",
      IN_PROGRESS: "bg-indigo-100 text-indigo-700",
      ON_HOLD: "bg-amber-100 text-amber-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return styles[s];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
            <p className="text-gray-500 text-sm">Create and monitor all projects</p>
          </div>
          <button
            onClick={() => {
              setEditingProject(null);
              setModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + New Project
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : filteredProjects.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No projects found</p>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(project.priority)}`}>
                        {project.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(project.status)}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-2">{project.description}</p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>👤 PM: {project.manager.name}</span>
                      <span>📋 {project._count.tasks} tasks</span>
                      <span>👥 {project._count.members} members</span>
                      <span>
                        📅 {new Date(project.startDate).toLocaleDateString()} -{" "}
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setModalOpen(true);
                      }}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        editingProject={editingProject}
        managers={managers}
      />
    </div>
  );
}