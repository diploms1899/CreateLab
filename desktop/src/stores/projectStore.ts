import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      currentProject: null,
      projects: [],

      setCurrentProject: (project) => set({ currentProject: project }),
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
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
