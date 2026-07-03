import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string; secondary: string; background: string;
    surface: string; text: string; textSecondary: string;
    accent: string; error: string; success: string;
    warning: string; border: string;
  };
  fonts: { heading: string; body: string; mono: string };
  editorTheme: string;
  borderRadius: string;
  animations: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  tags: string[];
  difficulty: string;
  estimatedHours: number;
}

export interface Project {
  id: string;
  templateId: string;
  name: string;
  slug: string;
  description?: string;
  workspacePath?: string;
  progress: number;
}

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  getActiveTheme: () => ThemeConfig;
}

const defaultTheme: ThemeConfig = {
  id: "default", name: "Default",
  colors: {
    primary: "#a855f7", secondary: "#7c3aed", background: "#0f0f1a",
    surface: "#1a1a2e", text: "#e2e8f0", textSecondary: "#94a3b8",
    accent: "#f59e0b", error: "#ef4444", success: "#22c55e",
    warning: "#f59e0b", border: "#2d2d4a",
  },
  fonts: { heading: "'Inter', sans-serif", body: "'Inter', sans-serif", mono: "'Fira Code', monospace" },
  editorTheme: "vs-dark", borderRadius: "8px", animations: "standard",
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],

      setCurrentProject: (project) => set({ currentProject: project }),
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      getActiveTheme: () => {
        // Return default theme for now; extend with per-project themes later
        return defaultTheme;
      },
    }),
    {
      name: "createlab-projects",
      partialize: (state) => ({
        currentProject: state.currentProject,
        projects: state.projects,
      }),
    }
  )
);
