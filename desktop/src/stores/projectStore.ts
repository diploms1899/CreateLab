import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ThemeConfig, THEME_PRESETS } from "@/stores/themeStore";

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
  removeProject: (id: string) => void;
  getActiveTheme: () => ThemeConfig;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      projects: [],

      setCurrentProject: (project) => set({ currentProject: project }),
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        })),
      getActiveTheme: () => {
        return THEME_PRESETS.Dark;
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