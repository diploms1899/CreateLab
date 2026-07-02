import { create } from "zustand";

interface EditorState {
  openFiles: string[];
  activeFile: string | null;
  dirtyFiles: Set<string>;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  markDirty: (path: string, dirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFile: null,
  dirtyFiles: new Set(),

  openFile: (path) => {
    const { openFiles } = get();
    if (!openFiles.includes(path)) {
      set({ openFiles: [...openFiles, path] });
    }
    set({ activeFile: path });
  },

  closeFile: (path) => {
    const { openFiles, activeFile } = get();
    const idx = openFiles.indexOf(path);
    const next = openFiles.filter(f => f !== path);
    set({
      openFiles: next,
      activeFile: activeFile === path ? (next[Math.min(idx, next.length - 1)] || null) : activeFile,
    });
  },

  setActiveFile: (path) => set({ activeFile: path }),
  markDirty: (path, dirty) => {
    const s = new Set(get().dirtyFiles);
    dirty ? s.add(path) : s.delete(path);
    set({ dirtyFiles: s });
  },
}));
