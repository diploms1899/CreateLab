import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface Board {
  name: string;
  fqbn: string;
  port?: string;
}

interface ArduinoState {
  boards: Board[];
  buildResult: string;
  compiling: boolean;
  uploading: boolean;
  detect: () => Promise<void>;
  listBoards: () => Promise<void>;
  compile: (board: string, sketchPath: string) => Promise<void>;
  upload: (board: string, port: string, sketchPath: string) => Promise<void>;
}

export const useArduinoStore = create<ArduinoState>((set) => ({
  boards: [],
  buildResult: "",
  compiling: false,
  uploading: false,

  detect: async () => {
    try { await invoke("detect_arduino"); } catch {}
  },

  listBoards: async () => {
    try {
      const boards = await invoke<Board[]>("list_boards");
      set({ boards });
    } catch {}
  },

  compile: async (board, sketchPath) => {
    set({ compiling: true, buildResult: "" });
    try {
      const result = await invoke<string>("compile", { board, sketchPath });
      set({ buildResult: result });
    } catch (e: any) {
      set({ buildResult: `Compilation failed: ${e}` });
    } finally {
      set({ compiling: false });
    }
  },

  upload: async (board, port, sketchPath) => {
    set({ uploading: true, buildResult: "" });
    try {
      const result = await invoke<string>("upload", { board, port, sketchPath });
      set({ buildResult: result });
    } catch (e: any) {
      set({ buildResult: `Upload failed: ${e}` });
    } finally {
      set({ uploading: false });
    }
  },
}));
