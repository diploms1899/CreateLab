import { create } from "zustand";

export interface AIActivity {
  id: string;
  action: string;
  file?: string;
  timestamp: number;
  type: "reading" | "writing" | "searching" | "thinking" | "planning" | "compiling" | "formatting" | "creating" | "deleting" | "renaming" | "navigating";
}

export interface AIChangeNotification {
  id: string;
  summary: string;
  file?: string;
  linesAdded?: number;
  linesRemoved?: number;
  timestamp: number;
  seen: boolean;
}

export interface AIEditQueueItem {
  file: string;
  status: "waiting" | "editing" | "done" | "error";
}

interface CodeStats {
  totalLinesAdded: number;
  totalLinesRemoved: number;
  filesModified: number;
  filesCreated: number;
  filesDeleted: number;
  functionsAdded: number;
  functionsRemoved: number;
  startTime: number;
  currentTask: string;
}

interface AIActivityState {
  activities: AIActivity[];
  changeNotifications: AIChangeNotification[];
  editQueue: AIEditQueueItem[];
  currentEditingFile: string | null;
  stats: CodeStats;
  isActive: boolean;
  phase: string;
  addActivity: (action: string, type: AIActivity["type"], file?: string) => void;
  addNotification: (notification: Omit<AIChangeNotification, "id" | "timestamp" | "seen">) => void;
  markNotificationSeen: (id: string) => void;
  clearNotifications: () => void;
  setCurrentEditingFile: (file: string | null) => void;
  updateEditQueue: (files: string[]) => void;
  markEditDone: (file: string) => void;
  setPhase: (phase: string) => void;
  setIsActive: (active: boolean) => void;
  updateStats: (partial: Partial<CodeStats>) => void;
  resetSession: (task?: string) => void;
  getSessionSummary: () => { filesModified: number; linesAdded: number; linesRemoved: number; elapsedMs: number; task: string };
}

export const useAIActivityStore = create<AIActivityState>((set, get) => ({
  activities: [],
  changeNotifications: [],
  editQueue: [],
  currentEditingFile: null,
  stats: {
    totalLinesAdded: 0,
    totalLinesRemoved: 0,
    filesModified: 0,
    filesCreated: 0,
    filesDeleted: 0,
    functionsAdded: 0,
    functionsRemoved: 0,
    startTime: Date.now(),
    currentTask: "Idle",
  },
  isActive: false,
  phase: "Idle",

  addActivity: (action, type, file) => {
    const id = crypto.randomUUID();
    const activity: AIActivity = { id, action, file, timestamp: Date.now(), type };
    set((s) => ({ activities: [...s.activities.slice(-99), activity] }));
    if (file) set({ currentEditingFile: file });
  },

  addNotification: (notif) => {
    const id = crypto.randomUUID();
    set((s) => ({
      changeNotifications: [
        { ...notif, id, timestamp: Date.now(), seen: false },
        ...s.changeNotifications.slice(0, 199),
      ],
    }));
  },

  markNotificationSeen: (id) =>
    set((s) => ({
      changeNotifications: s.changeNotifications.map((n) =>
        n.id === id ? { ...n, seen: true } : n
      ),
    })),

  clearNotifications: () => set({ changeNotifications: [] }),

  setCurrentEditingFile: (file) => set({ currentEditingFile: file }),

  updateEditQueue: (files) => {
    const queue: AIEditQueueItem[] = files.map((f) => ({ file: f, status: "waiting" as const }));
    if (queue.length > 0) queue[0].status = "editing";
    set({ editQueue: queue, currentEditingFile: queue[0]?.file ?? null });
  },

  markEditDone: (file) => {
    const { editQueue } = get();
    const idx = editQueue.findIndex((q) => q.file === file);
    const updated = editQueue.map((q, i) => {
      if (i === idx) return { ...q, status: "done" as const };
      if (i === idx + 1 && q.status === "waiting") return { ...q, status: "editing" as const };
      return q;
    });
    set({ editQueue: updated, currentEditingFile: updated.find((q) => q.status === "editing")?.file ?? null });
  },

  setPhase: (phase) => set({ phase }),

  setIsActive: (active) => set({ isActive: active }),

  updateStats: (partial) =>
    set((s) => ({
      stats: { ...s.stats, ...partial },
    })),

  resetSession: (task) =>
    set({
      activities: [],
      editQueue: [],
      currentEditingFile: null,
      stats: {
        totalLinesAdded: 0,
        totalLinesRemoved: 0,
        filesModified: 0,
        filesCreated: 0,
        filesDeleted: 0,
        functionsAdded: 0,
        functionsRemoved: 0,
        startTime: Date.now(),
        currentTask: task ?? "Idle",
      },
      isActive: true,
      phase: task ? "Planning" : "Idle",
    }),

  getSessionSummary: () => {
    const { stats } = get();
    return {
      filesModified: stats.filesModified,
      linesAdded: stats.totalLinesAdded,
      linesRemoved: stats.totalLinesRemoved,
      elapsedMs: Date.now() - stats.startTime,
      task: stats.currentTask,
    };
  },
}));
