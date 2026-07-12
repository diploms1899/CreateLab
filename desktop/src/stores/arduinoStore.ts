import { create } from "zustand";

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export interface LibraryInfo {
  name: string;
  version: string;
  author: string;
  description: string;
}

export interface CompileResult {
  success: boolean;
  output: string;
  error: string;
  duration_ms: number;
}

export interface UploadResult {
  success: boolean;
  output: string;
  error: string;
  duration_ms: number;
}

interface ArduinoState {
  cliReady: boolean;
  cliPath: string;
  boards: string[];
  ports: string[];
  selectedBoard: string;
  selectedPort: string;
  compileResult: CompileResult | null;
  uploadResult: UploadResult | null;
  compiling: boolean;
  uploading: boolean;
  detect: () => Promise<void>;
  listBoards: () => Promise<void>;
  listPorts: () => Promise<void>;
  compile: (board: string) => Promise<CompileResult>;
  upload: (board: string, port: string) => Promise<UploadResult>;
  setSelected: (board: string, port: string) => void;
  // Libraries
  installedLibs: LibraryInfo[];
  searchResults: LibraryInfo[];
  installing: string | null;
  listLibraries: () => Promise<void>;
  searchLibraries: (query: string) => Promise<void>;
  installLibrary: (name: string) => Promise<void>;
  removeLibrary: (name: string) => Promise<void>;
}

export const useArduinoStore = create<ArduinoState>((set, get) => ({
  cliReady: false,
  cliPath: "",
  boards: [],
  ports: [],
  selectedBoard: "",
  selectedPort: "",
  compileResult: null,
  uploadResult: null,
  compiling: false,
  uploading: false,
  installedLibs: [],
  searchResults: [],
  installing: null,

  detect: async () => {
    try {
      const path = await safeInvoke<string>("detect_arduino");
      set({ cliReady: true, cliPath: path });
    } catch {
      set({ cliReady: false, cliPath: "" });
    }
  },

  listBoards: async () => {
    try {
      const boards = await safeInvoke<string[]>("list_boards");
      set({ boards });
    } catch { /* keep existing */ }
  },

  listPorts: async () => {
    try {
      const ports = await safeInvoke<string[]>("list_ports");
      set({ ports });
    } catch { /* keep existing */ }
  },

  setSelected: (board, port) => set({ selectedBoard: board, selectedPort: port }),

  compile: async (board) => {
    set({ compiling: true, compileResult: null, uploadResult: null });
    try {
      const result = await safeInvoke<CompileResult>("compile_sketch", { board });
      set({ compileResult: result });
      return result;
    } catch (e: any) {
      const fallback: CompileResult = { success: false, output: "", error: typeof e === "string" ? e : (e?.message || String(e)), duration_ms: 0 };
      set({ compileResult: fallback });
      return fallback;
    } finally {
      set({ compiling: false });
    }
  },

  upload: async (board, port) => {
    set({ uploading: true, compileResult: null, uploadResult: null });
    try {
      const result = await safeInvoke<UploadResult>("upload_sketch", { board, port });
      set({ uploadResult: result });
      return result;
    } catch (e: any) {
      const fallback: UploadResult = { success: false, output: "", error: typeof e === "string" ? e : (e?.message || String(e)), duration_ms: 0 };
      set({ uploadResult: fallback });
      return fallback;
    } finally {
      set({ uploading: false });
    }
  },

  listLibraries: async () => {
    try {
      const libs = await safeInvoke<LibraryInfo[]>("list_libraries");
      set({ installedLibs: libs });
    } catch { /* keep existing */ }
  },

  searchLibraries: async (query) => {
    try {
      const results = await safeInvoke<LibraryInfo[]>("search_libraries", { query });
      set({ searchResults: results });
    } catch { /* keep existing */ }
  },

  installLibrary: async (name) => {
    set({ installing: name });
    try {
      await safeInvoke("install_library", { name });
      await get().listLibraries();
    } catch { /* ignore */ }
    set({ installing: null });
  },

  removeLibrary: async (name) => {
    try {
      await safeInvoke("remove_library", { name });
      await get().listLibraries();
    } catch { /* ignore */ }
  },
}));
