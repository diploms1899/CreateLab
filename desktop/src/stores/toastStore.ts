import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 3000;
    set((s) => ({ toasts: [...s.toasts.slice(-4), { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

/** Convenience helpers for common toast types */
export const toast = {
  success: (message: string) => useToastStore.getState().addToast({ type: "success", message }),
  error: (message: string) => useToastStore.getState().addToast({ type: "error", message, duration: 5000 }),
  info: (message: string) => useToastStore.getState().addToast({ type: "info", message }),
  warning: (message: string) => useToastStore.getState().addToast({ type: "warning", message, duration: 4000 }),
};
