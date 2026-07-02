import { create } from "zustand";

type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface SyncState {
  status: SyncStatus;
  lastSync: number | null;
  version: number;
  setStatus: (status: SyncStatus) => void;
  syncNow: (workspaceId: string) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: "idle",
  lastSync: null,
  version: 0,

  setStatus: (status) => set({ status }),

  syncNow: async (workspaceId) => {
    set({ status: "syncing" });
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("push_changes", { workspaceId, baseVersion: 0 });
      await invoke("pull_changes", { workspaceId });
      set({ status: "synced", lastSync: Date.now() });
    } catch {
      set({ status: "offline" });
    }
  },
}));
