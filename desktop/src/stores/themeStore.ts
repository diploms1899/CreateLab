import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    surface: string;
    surfaceAlt: string;
    surfaceHover: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    border: string;
  };
}

const defaultTheme: ThemeConfig = {
  id: "default",
  name: "Default Dark",
  colors: {
    surface: "#1a1a2e",
    surfaceAlt: "#16213e",
    surfaceHover: "#1e2a4a",
    textPrimary: "#e0e0e0",
    textSecondary: "#a0a0b0",
    textMuted: "#6b7280",
    accent: "#00d4aa",
    accentHover: "#00b894",
    border: "#2a2a4a",
  },
};

const projectThemes: Record<string, Partial<ThemeConfig["colors"]>> = {
  platformer: {
    surface: "#1a0a0a",
    surfaceAlt: "#2a1010",
    surfaceHover: "#3a1818",
    accent: "#ff6b35",
    accentHover: "#e55a2b",
    border: "#3a2020",
  },
  fishing: {
    surface: "#0a1628",
    surfaceAlt: "#0f2240",
    surfaceHover: "#143050",
    accent: "#4fc3f7",
    accentHover: "#29b6f6",
    border: "#1a3a5a",
  },
  robotics: {
    surface: "#1a1a1a",
    surfaceAlt: "#252525",
    surfaceHover: "#303030",
    accent: "#ff8c00",
    accentHover: "#e07c00",
    border: "#3a3a3a",
  },
  calculator: {
    surface: "#0f0f1a",
    surfaceAlt: "#1a1a2e",
    surfaceHover: "#252540",
    accent: "#7c4dff",
    accentHover: "#651fff",
    border: "#2a2a45",
  },
};

interface ThemeState {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  applyProjectTheme: (projectSlug: string) => void;
  resetTheme: () => void;
}

const applyColors = (colors: ThemeConfig["colors"]) => {
  const root = document.documentElement;
  root.style.setProperty("--color-surface", colors.surface);
  root.style.setProperty("--color-surface-alt", colors.surfaceAlt);
  root.style.setProperty("--color-surface-hover", colors.surfaceHover);
  root.style.setProperty("--color-text-primary", colors.textPrimary);
  root.style.setProperty("--color-text-secondary", colors.textSecondary);
  root.style.setProperty("--color-text-muted", colors.textMuted);
  root.style.setProperty("--color-accent", colors.accent);
  root.style.setProperty("--color-accent-hover", colors.accentHover);
  root.style.setProperty("--color-border", colors.border);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,

      setTheme: (theme: ThemeConfig) => {
        applyColors(theme.colors);
        set({ theme });
      },

      applyProjectTheme: (projectSlug: string) => {
        const overrides = projectThemes[projectSlug];
        if (!overrides) return;
        const merged = { ...defaultTheme.colors, ...overrides };
        const theme: ThemeConfig = {
          id: projectSlug,
          name: `${projectSlug.charAt(0).toUpperCase() + projectSlug.slice(1)} Theme`,
          colors: merged,
        };
        applyColors(merged);
        set({ theme });
      },

      resetTheme: () => {
        applyColors(defaultTheme.colors);
        set({ theme: defaultTheme });
      },
    }),
    {
      name: "createlab-theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Apply initial theme on load
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("createlab-theme");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme?.colors) {
        applyColors(parsed.state.theme.colors);
      }
    } catch {}
  } else {
    applyColors(defaultTheme.colors);
  }
}
