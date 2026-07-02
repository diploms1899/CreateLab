import { create } from "zustand";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (workspaceId: string, message: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  sendMessage: async (workspaceId, message) => {
    const userMsg: ChatMessage = { role: "user", content: message, timestamp: Date.now() };
    set(s => ({ messages: [...s.messages, userMsg], loading: true }));
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const res: any = await invoke("plugin:createlab|chat", { workspaceId, request: { message } })
        .catch(() => ({ content: "AI is not available. Please connect to the server.", role: "assistant" }));
      const aiMsg: ChatMessage = {
        role: res.role || "assistant",
        content: res.content || "No response.",
        timestamp: Date.now(),
      };
      set(s => ({ messages: [...s.messages, aiMsg], loading: false }));
    } catch (e: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `Error: ${e?.message || e}`,
        timestamp: Date.now(),
      };
      set(s => ({ messages: [...s.messages, errMsg], loading: false }));
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
