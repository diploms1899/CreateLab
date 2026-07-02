import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
}

interface WorkspaceState {
  workspaces: { id: string; name: string; template_id: string; sync_version: number }[];
  activeId: string | null;
  files: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  loading: boolean;
  listWorkspaces: () => Promise<void>;
  createWorkspace: (templateSlug: string, name: string) => Promise<string>;
  readFile: (workspaceId: string, path: string) => Promise<string>;
  writeFile: (workspaceId: string, path: string, content: string) => Promise<void>;
  setActiveFile: (file: WorkspaceFile | null) => void;
  setActiveId: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeId: null,
  files: [],
  activeFile: null,
  loading: false,

  listWorkspaces: async () => {
    const ws = await invoke<any[]>("list_workspaces");
    set({ workspaces: ws.map(w => ({ id: w.id, name: w.name, template_id: w.template_id, sync_version: w.sync_version })) });
  },

  createWorkspace: async (templateSlug, name) => {
    const ws: any = await invoke("create_workspace", { templateSlug, name });
    const id = ws.id;
    set({ activeId: id });
    await get().listWorkspaces();
    return id;
  },

  readFile: async (workspaceId, path) => {
    return await invoke<string>("read_file", { workspaceId, path });
  },

  writeFile: async (workspaceId, path, content) => {
    await invoke("write_file", { workspaceId, path, content });
    const { files } = get();
    const existing = files.find(f => f.path === path);
    if (existing) {
      set({ files: files.map(f => f.path === path ? { ...f, content } : f) });
    } else {
      const lang = path.endsWith(".ino") ? "cpp" : path.split(".").pop() || "text";
      set({ files: [...files, { path, content, language: lang }] });
    }
  },

  setActiveFile: (file) => set({ activeFile: file }),
  setActiveId: (id) => set({ activeId: id }),
}));
