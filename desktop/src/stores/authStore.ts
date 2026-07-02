import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    role: string;
  } | null;
  serverUrl: string;
  deviceId: string;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthState["user"]) => void;
  setServerUrl: (url: string) => void;
  setDeviceId: (id: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      serverUrl: "http://localhost:8443",
      deviceId: "",

      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      setServerUrl: (url) => set({ serverUrl: url }),
      setDeviceId: (id) => set({ deviceId: id }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    {
      name: "createlab-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        serverUrl: state.serverUrl,
        deviceId: state.deviceId,
      }),
    }
  )
);
