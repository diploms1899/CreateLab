import { create } from "zustand";

type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

interface PendingOp {
  type: "write_file" | "delete_file";
  workspaceId: string;
  path: string;
  content?: string;
  timestamp: number;
}

interface SyncState {
  status: SyncStatus;
  lastSync: number | null;
  version: number;
  pendingOps: PendingOp[];
  setStatus: (status: SyncStatus) => void;
  syncNow: (workspaceId: string) => Promise<void>;
  /** Queue an operation for later sync when offline */
  queueOp: (op: Omit<PendingOp, "timestamp">) => void;
  /** Replay all queued operations */
  replayQueue: () => Promise<void>;
}

const QUEUE_KEY = "createlab_sync_queue";

function loadQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(queue: PendingOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: "idle",
  lastSync: null,
  version: 0,
  pendingOps: loadQueue(),

  setStatus: (status) => set({ status }),

  syncNow: async (workspaceId) => {
    set({ status: "syncing" });
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      // Delta sync: send current version, receive updates since then
      const baseVersion = get().version;
      const result = await invoke<{ version: number; changes: number }>("push_changes", { workspaceId, baseVersion });
      await invoke("pull_changes", { workspaceId });
      set({
        status: "synced",
        lastSync: Date.now(),
        version: result?.version ?? baseVersion,
      });

      // After successful sync, replay any queued offline operations
      await get().replayQueue();
    } catch {
      set({ status: "offline" });
    }
  },

  queueOp: (op) => {
    const entry: PendingOp = { ...op, timestamp: Date.now() };
    const queue = [...get().pendingOps, entry];
    set({ pendingOps: queue });
    saveQueue(queue);
  },

  replayQueue: async () => {
    const queue = get().pendingOps;
    if (queue.length === 0) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      for (const op of queue) {
        if (op.type === "write_file") {
          await invoke("write_file", { workspaceId: op.workspaceId, path: op.path, content: op.content });
        } else if (op.type === "delete_file") {
          await invoke("delete_file", { workspaceId: op.workspaceId, path: op.path });
        }
      }
      set({ pendingOps: [] });
      saveQueue([]);
    } catch {
      // Keep queue for next retry
    }
  },
}));
