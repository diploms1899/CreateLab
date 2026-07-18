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
    diffAddedBg: string;
    diffAddedText: string;
    diffAddedBorder: string;
    diffRemovedBg: string;
    diffRemovedText: string;
    diffRemovedBorder: string;
  };
}

/** Built-in theme presets */
export const THEME_PRESETS: Record<string, ThemeConfig> = {
  Dark: {
    id: "dark", name: "Dark",
    colors: { surface: "#1a1a2e", surfaceAlt: "#16213e", surfaceHover: "#1e2a4a", textPrimary: "#e0e0e0", textSecondary: "#a0a0b0", textMuted: "#6b7280", accent: "#00d4aa", accentHover: "#00b894", border: "#2a2a4a", diffAddedBg: "rgba(34,197,94,0.12)", diffAddedText: "#4ade80", diffAddedBorder: "rgba(74,222,128,0.3)", diffRemovedBg: "rgba(239,68,68,0.12)", diffRemovedText: "#f87171", diffRemovedBorder: "rgba(248,113,113,0.3)" },
  },
  Light: {
    id: "light", name: "Light",
    colors: { surface: "#ffffff", surfaceAlt: "#f8fafc", surfaceHover: "#f1f5f9", textPrimary: "#0f172a", textSecondary: "#475569", textMuted: "#94a3b8", accent: "#0ea5e9", accentHover: "#0284c7", border: "#e2e8f0", diffAddedBg: "rgba(34,197,94,0.10)", diffAddedText: "#16a34a", diffAddedBorder: "rgba(34,197,94,0.25)", diffRemovedBg: "rgba(239,68,68,0.10)", diffRemovedText: "#dc2626", diffRemovedBorder: "rgba(239,68,68,0.25)" },
  },
  OLED: {
    id: "oled", name: "OLED",
    colors: { surface: "#000000", surfaceAlt: "#0a0a0a", surfaceHover: "#141414", textPrimary: "#ffffff", textSecondary: "#999999", textMuted: "#555555", accent: "#00ff88", accentHover: "#00cc6a", border: "#1a1a1a", diffAddedBg: "rgba(0,255,136,0.10)", diffAddedText: "#00ff88", diffAddedBorder: "rgba(0,255,136,0.25)", diffRemovedBg: "rgba(255,68,68,0.10)", diffRemovedText: "#ff4444", diffRemovedBorder: "rgba(255,68,68,0.25)" },
  },
  Synthwave: {
    id: "synthwave", name: "Synthwave",
    colors: { surface: "#1a0033", surfaceAlt: "#26004d", surfaceHover: "#330066", textPrimary: "#ff66ff", textSecondary: "#cc99ff", textMuted: "#9966cc", accent: "#ff00ff", accentHover: "#cc00cc", border: "#440066", diffAddedBg: "rgba(0,255,255,0.10)", diffAddedText: "#00ffff", diffAddedBorder: "rgba(0,255,255,0.25)", diffRemovedBg: "rgba(255,105,180,0.10)", diffRemovedText: "#ff69b4", diffRemovedBorder: "rgba(255,105,180,0.25)" },
  },
  Ocean: {
    id: "ocean", name: "Ocean",
    colors: { surface: "#0a1628", surfaceAlt: "#0f2240", surfaceHover: "#143050", textPrimary: "#e0f0ff", textSecondary: "#7ec8e3", textMuted: "#4a90a4", accent: "#4fc3f7", accentHover: "#29b6f6", border: "#1a3a5a", diffAddedBg: "rgba(34,197,94,0.12)", diffAddedText: "#4ade80", diffAddedBorder: "rgba(74,222,128,0.3)", diffRemovedBg: "rgba(239,68,68,0.12)", diffRemovedText: "#f87171", diffRemovedBorder: "rgba(248,113,113,0.3)" },
  },
  Forest: {
    id: "forest", name: "Forest",
    colors: { surface: "#0d1f0d", surfaceAlt: "#142814", surfaceHover: "#1a331a", textPrimary: "#d4edc9", textSecondary: "#8fbc8f", textMuted: "#5a8a5a", accent: "#4caf50", accentHover: "#388e3c", border: "#1e3a1e", diffAddedBg: "rgba(76,175,80,0.15)", diffAddedText: "#81c784", diffAddedBorder: "rgba(129,199,132,0.3)", diffRemovedBg: "rgba(229,115,115,0.15)", diffRemovedText: "#e57373", diffRemovedBorder: "rgba(229,115,115,0.3)" },
  },
  Nord: {
    id: "nord", name: "Nord",
    colors: { surface: "#2e3440", surfaceAlt: "#3b4252", surfaceHover: "#434c5e", textPrimary: "#eceff4", textSecondary: "#d8dee9", textMuted: "#81a1c1", accent: "#88c0d0", accentHover: "#5e81ac", border: "#4c566a", diffAddedBg: "rgba(163,190,140,0.15)", diffAddedText: "#a3be8c", diffAddedBorder: "rgba(163,190,140,0.3)", diffRemovedBg: "rgba(191,97,106,0.15)", diffRemovedText: "#bf616a", diffRemovedBorder: "rgba(191,97,106,0.3)" },
  },
  Dracula: {
    id: "dracula", name: "Dracula",
    colors: { surface: "#282a36", surfaceAlt: "#21222c", surfaceHover: "#343746", textPrimary: "#f8f8f2", textSecondary: "#cfcfc2", textMuted: "#6272a4", accent: "#bd93f9", accentHover: "#ff79c6", border: "#44475a", diffAddedBg: "rgba(80,250,123,0.12)", diffAddedText: "#50fa7b", diffAddedBorder: "rgba(80,250,123,0.3)", diffRemovedBg: "rgba(255,85,85,0.12)", diffRemovedText: "#ff5555", diffRemovedBorder: "rgba(255,85,85,0.3)" },
  },
  Monokai: {
    id: "monokai", name: "Monokai",
    colors: { surface: "#272822", surfaceAlt: "#1e1f1c", surfaceHover: "#3e3d32", textPrimary: "#f8f8f2", textSecondary: "#cfcfc2", textMuted: "#75715e", accent: "#a6e22e", accentHover: "#fd971f", border: "#49483e", diffAddedBg: "rgba(166,226,46,0.12)", diffAddedText: "#a6e22e", diffAddedBorder: "rgba(166,226,46,0.3)", diffRemovedBg: "rgba(249,38,114,0.12)", diffRemovedText: "#f92672", diffRemovedBorder: "rgba(249,38,114,0.3)" },
  },
  "One Dark": {
    id: "one-dark", name: "One Dark",
    colors: { surface: "#282c34", surfaceAlt: "#21252b", surfaceHover: "#2c313a", textPrimary: "#abb2bf", textSecondary: "#828997", textMuted: "#5c6370", accent: "#61afef", accentHover: "#56b6c2", border: "#373b41", diffAddedBg: "rgba(152,195,121,0.15)", diffAddedText: "#98c379", diffAddedBorder: "rgba(152,195,121,0.3)", diffRemovedBg: "rgba(224,108,117,0.15)", diffRemovedText: "#e06c75", diffRemovedBorder: "rgba(224,108,117,0.3)" },
  },
  "GitHub Dark": {
    id: "github-dark", name: "GitHub Dark",
    colors: { surface: "#0d1117", surfaceAlt: "#161b22", surfaceHover: "#1c2128", textPrimary: "#c9d1d9", textSecondary: "#8b949e", textMuted: "#484f58", accent: "#58a6ff", accentHover: "#79c0ff", border: "#30363d", diffAddedBg: "rgba(63,185,80,0.14)", diffAddedText: "#7ee787", diffAddedBorder: "rgba(63,185,80,0.3)", diffRemovedBg: "rgba(248,81,73,0.14)", diffRemovedText: "#ff7b72", diffRemovedBorder: "rgba(248,81,73,0.3)" },
  },
  Catppuccin: {
    id: "catppuccin", name: "Catppuccin",
    colors: { surface: "#1e1e2e", surfaceAlt: "#181825", surfaceHover: "#313244", textPrimary: "#cdd6f4", textSecondary: "#a6adc8", textMuted: "#6c7086", accent: "#cba6f7", accentHover: "#b4befe", border: "#45475a", diffAddedBg: "rgba(166,227,161,0.12)", diffAddedText: "#a6e3a1", diffAddedBorder: "rgba(166,227,161,0.3)", diffRemovedBg: "rgba(243,139,168,0.12)", diffRemovedText: "#f38ba8", diffRemovedBorder: "rgba(243,139,168,0.3)" },
  },
  "Tokyo Night": {
    id: "tokyo-night", name: "Tokyo Night",
    colors: { surface: "#1a1b26", surfaceAlt: "#16161e", surfaceHover: "#2f3349", textPrimary: "#c0caf5", textSecondary: "#a9b1d6", textMuted: "#565f89", accent: "#7aa2f7", accentHover: "#bb9af7", border: "#3b4261", diffAddedBg: "rgba(158,206,106,0.12)", diffAddedText: "#9ece6a", diffAddedBorder: "rgba(158,206,106,0.3)", diffRemovedBg: "rgba(247,118,142,0.12)", diffRemovedText: "#f7768e", diffRemovedBorder: "rgba(247,118,142,0.3)" },
  },
};
interface ThemeState {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  setThemeByName: (name: string) => void;
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
  root.style.setProperty("--diff-added-bg", colors.diffAddedBg);
  root.style.setProperty("--diff-added-text", colors.diffAddedText);
  root.style.setProperty("--diff-added-border", colors.diffAddedBorder);
  root.style.setProperty("--diff-removed-bg", colors.diffRemovedBg);
  root.style.setProperty("--diff-removed-text", colors.diffRemovedText);
  root.style.setProperty("--diff-removed-border", colors.diffRemovedBorder);
};

const defaultTheme = THEME_PRESETS.Dark;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: defaultTheme,

      setTheme: (theme: ThemeConfig) => {
        applyColors(theme.colors);
        set({ theme });
      },

      setThemeByName: (name: string) => {
        const preset = THEME_PRESETS[name];
        if (!preset) return;
        applyColors(preset.colors);
        set({ theme: preset });
      },

      applyProjectTheme: (projectSlug: string) => {
        // Use project-specific accent colors based on slug
        const overrides: Record<string, Partial<ThemeConfig["colors"]>> = {
          platformer: { accent: "#ff6b35", accentHover: "#e55a2b", surface: "#1a0a0a", surfaceAlt: "#2a1010", surfaceHover: "#3a1818", border: "#3a2020" },
          fishing: { accent: "#4fc3f7", accentHover: "#29b6f6", surface: "#0a1628", surfaceAlt: "#0f2240", surfaceHover: "#143050", border: "#1a3a5a" },
          robotics: { accent: "#ff8c00", accentHover: "#e07c00", surface: "#1a1a1a", surfaceAlt: "#252525", surfaceHover: "#303030", border: "#3a3a3a" },
          calculator: { accent: "#7c4dff", accentHover: "#651fff", surface: "#0f0f1a", surfaceAlt: "#1a1a2e", surfaceHover: "#252540", border: "#2a2a45" },
        };
        const over = overrides[projectSlug];
        if (!over) return;
        const merged = { ...defaultTheme.colors, ...over };
        const theme: ThemeConfig = { id: projectSlug, name: `${projectSlug} Theme`, colors: merged };
        applyColors(merged);
        set({ theme });
      },

      resetTheme: () => {
        applyColors(defaultTheme.colors);
        set({ theme: defaultTheme });
      },
    }),
    { name: "createlab-theme", partialize: (state) => ({ theme: state.theme }) }
  )
);

// Apply initial theme on load — prefer stored, then system preference, then dark
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("createlab-theme");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme?.colors) {
        applyColors(parsed.state.theme.colors);
      }
    } catch { applyColors(defaultTheme.colors); }
  } else {
    // Auto-detect system preference on first visit
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyColors(prefersDark ? THEME_PRESETS.Dark.colors : THEME_PRESETS.Light.colors);
  }

  // Listen for OS theme changes (only when user hasn't set a manual preference)
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const hasManualTheme = localStorage.getItem("createlab-theme");
    if (!hasManualTheme) {
      applyColors(e.matches ? THEME_PRESETS.Dark.colors : THEME_PRESETS.Light.colors);
    }
  });
}
