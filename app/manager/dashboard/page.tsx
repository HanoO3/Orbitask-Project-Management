import { getMyProjects, getMyProjectStats } from "@/lib/actions/manager-projects";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

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

export default async function ManagerDashboard() {
  const session = await auth();
  const [projects, stats] = await Promise.all([getMyProjects(), getMyProjectStats()]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-bold text-gray-800">
            Project Manager Dashboard
          </h1>
          <LogoutButton />
        </div>
        <p className="text-gray-500 mb-6">Welcome back, {session?.user?.name}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Total Projects</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Active Projects</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.activeProjects}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Pending Tasks</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-400 text-sm">Completed Tasks</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">My Assigned Projects</h2>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            No projects assigned yet. Ask your Administrator to assign one.
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => {
              const completedTasks = project.tasks.filter((t) => t.status === "COMPLETED").length;
              const totalTasks = project.tasks.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/manager/projects/${project.id}`}
                  className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition block"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(project.priority)}`}>
                        {project.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(project.status)}`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{project.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span>📋 {project._count.tasks} tasks</span>
                    <span>👥 {project._count.members} members</span>
                    <span>
                      📅 {new Date(project.startDate).toLocaleDateString()} -{" "}
                      {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}