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
      const { getApi } = await import("@/utils/api");
      const api = getApi();
      const response = await api.post(`/ai/chat/${workspaceId}`, {
        message,
        include_files: false,
      });
      const data = response.data;
      const aiMsg: ChatMessage = {
        role: data.role || "assistant",
        content: data.content || data.message || "No response.",
        timestamp: Date.now(),
      };
      set(s => ({ messages: [...s.messages, aiMsg], loading: false }));
    } catch (e: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        content: `AI is not available. Please connect to the server.`,
        timestamp: Date.now(),
      };
      set(s => ({ messages: [...s.messages, errMsg], loading: false }));
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
