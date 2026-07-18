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
  /** Latest serial output lines (last 20 lines max) — auto-fed to AI context */
  serialOutput: string[];
  addSerialLine: (line: string) => void;
  clearSerialOutput: () => void;
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
  /** Scan files for #include directives and auto-install missing libraries */
  autoInstallLibraries: (fileContents: Record<string, string>) => Promise<string[]>;
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
  serialOutput: [],
  addSerialLine: (line) => set((s) => ({ serialOutput: [...s.serialOutput.slice(-19), line] })),
  clearSerialOutput: () => set({ serialOutput: [] }),
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

  autoInstallLibraries: async (fileContents) => {
    // Extract #include <...> or #include "..." directives from all files
    const includes = new Set<string>();
    for (const content of Object.values(fileContents)) {
      const matches = content.matchAll(/#include\s*[<"]([^>"]+)[>"]/g);
      for (const m of matches) {
        const lib = m[1].split("/")[0].split(".")[0]; // e.g., "Arduino.h" → "Arduino"
        if (lib && !["Arduino", "stdint", "stddef", "string", "cmath", "cstdint"].includes(lib)) {
          includes.add(lib);
        }
      }
    }

    const installed: string[] = [];
    // Try installing each detected library
    for (const name of includes) {
      try {
        // Check if already installed
        const libs = await safeInvoke<{name: string}[]>("list_libraries");
        if (libs.some(l => l.name.toLowerCase() === name.toLowerCase())) continue;

        set({ installing: name });
        await safeInvoke("install_library", { name });
        installed.push(name);
      } catch { /* library may not exist in arduino-cli index */ }
    }
    set({ installing: null });
    if (installed.length > 0) {
      await get().listLibraries();
    }
    return installed;
  },
}));
