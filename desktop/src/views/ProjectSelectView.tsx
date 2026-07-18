import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import { projectsApi } from "@/utils/api";
import { CardSkeleton } from "@/components/common/Skeleton";
import {
  Gamepad2,
  Fish,
  Cpu,
  Calculator,
  Plus,
  ArrowRight,
  Sparkles,
  Trash2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  theme_id: string;
  learning_objectives?: string[];
}

const templateIcons: Record<string, React.ReactNode> = {
  platformer: <Gamepad2 size={28} />,
  fishing: <Fish size={28} />,
  robotics: <Cpu size={28} />,
  calculator: <Calculator size={28} />,
};

const templateGradients: Record<string, string> = {
  platformer: "from-orange-600/20 to-red-900/20",
  fishing: "from-blue-600/20 to-cyan-900/20",
  robotics: "from-orange-500/20 to-yellow-800/20",
  calculator: "from-purple-600/20 to-indigo-900/20",
};

export default function ProjectSelectView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { setCurrentProject, addProject, removeProject, projects } = useProjectStore();
  const { applyProjectTheme } = useThemeStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await projectsApi.getTemplates();
      setTemplates(response.data);
    } catch {
      // Fallback templates if offline
      setTemplates([
        {
          id: "1",
          slug: "platformer",
          name: "Platformer Game",
          description:
            "Build a retro-style platformer with pixel art, gravity physics, and enemies.",
          theme_id: "platformer",
        },
        {
          id: "2",
          slug: "fishing",
          name: "Fishing Game",
          description:
            "A relaxing fishing simulation with dynamic water, fish AI, and day/night cycles.",
          theme_id: "fishing",
        },
        {
          id: "3",
          slug: "robotics",
          name: "Robotics Control",
          description:
            "Control a robotic arm or rover with sensors, servos, and autonomous routines.",
          theme_id: "robotics",
        },
        {
          id: "4",
          slug: "calculator",
          name: "Scientific Calculator",
          description:
            "Build a full scientific calculator with expression parsing and graphing.",
          theme_id: "calculator",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (template: Template) => {
    setSelectedTemplate(template.slug);
    setProjectName(template.name);
  };

  const handleCreateProject = async () => {
    if (!selectedTemplate || !projectName.trim()) return;
    setCreating(true);

    const template = templates.find((t) => t.slug === selectedTemplate);
    if (!template) return;

    try {
      const response = await projectsApi.createProject(
        selectedTemplate,
        projectName.trim()
      );
      const project = {
        id: response.data.id,
        templateId: template.id,
        name: response.data.name,
        slug: response.data.slug,
        description: template.description,
        progress: 0,
      };
      addProject(project);
      setCurrentProject(project);
      applyProjectTheme(template.slug);
      navigate("/workspace");
    } catch {
      // Offline fallback
      const project = {
        id: crypto.randomUUID(),
        templateId: template.id,
        name: projectName.trim(),
        slug: projectName.trim().toLowerCase().replace(/\s+/g, "-"),
        description: template.description,
        progress: 0,
      };
      addProject(project);
      setCurrentProject(project);
      applyProjectTheme(template.slug);
      navigate("/workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = (id: string) => {
    removeProject(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome{user?.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="text-text-secondary mt-1">
            Choose a project to get started. Each project has its own theme,
            mentor AI, and starter code.
          </p>
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            templates.map((template) => (
            <button
              key={template.slug}
              onClick={() => handleSelectProject(template)}
              className={`relative text-left p-5 rounded-xl border transition-all duration-200 ${
                selectedTemplate === template.slug
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface-alt hover:border-accent/50 hover:bg-surface-hover"
              }`}
            >
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${templateGradients[template.slug]} opacity-50 pointer-events-none`}
              />
              <div className="relative z-10">
                <div
                  className={`mb-3 ${
                    selectedTemplate === template.slug
                      ? "text-accent"
                      : "text-text-secondary"
                  }`}
                >
                  {templateIcons[template.slug]}
                </div>
                <h3 className="font-semibold text-text-primary mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {template.description}
                </p>
              </div>
            </button>
          ))
          )}
        </div>

        {/* Existing projects */}
        {projects.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
              <FolderOpen size={16} />
              Your Projects
            </h2>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-alt border border-border hover:border-accent/30 transition-colors group"
                >
                  <span className="flex-1 text-sm text-text-primary font-medium truncate">
                    {proj.name}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentProject(proj);
                      navigate("/workspace");
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    <ArrowRight size={12} /> Open
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(proj.id)}
                    className="p-1.5 rounded text-text-muted hover:text-red-400 hover:bg-red-600/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Delete Project</h3>
                  <p className="text-xs text-text-muted">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:bg-surface-hover transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteProject(deleteConfirm)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Creation panel */}
        {selectedTemplate && (
          <div className="bg-surface-alt border border-border rounded-xl p-6 fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={20} className="text-accent" />
              <h2 className="font-semibold text-text-primary">
                Create Project
              </h2>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || creating}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus size={16} />
                    Create
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
