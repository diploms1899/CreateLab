import { ThemeConfig } from "../stores/themeStore";

// Legacy project themes — migrated to unified ThemeConfig shape.
// Active theme application now handled by themeStore.ts applyProjectTheme().

export const platformerTheme: ThemeConfig = {
  id: "platformer", name: "Platformer",
  colors: {
    surface: "#1a0a0a", surfaceAlt: "#2a1010", surfaceHover: "#3a1818",
    textPrimary: "#e2e8f0", textSecondary: "#94a3b8", textMuted: "#6b7280",
    accent: "#ff6b35", accentHover: "#e55a2b", border: "#3a2020",
    diffAddedBg: "rgba(255,107,53,0.12)", diffAddedText: "#ff8c52", diffAddedBorder: "rgba(255,140,82,0.3)",
    diffRemovedBg: "rgba(255,80,80,0.12)", diffRemovedText: "#ff5555", diffRemovedBorder: "rgba(255,85,85,0.3)",
  },
};

export const fishingTheme: ThemeConfig = {
  id: "fishing", name: "Fishing",
  colors: {
    surface: "#0a1628", surfaceAlt: "#0f2240", surfaceHover: "#143050",
    textPrimary: "#e0f2fe", textSecondary: "#7dd3fc", textMuted: "#4a90a4",
    accent: "#4fc3f7", accentHover: "#29b6f6", border: "#1a3a5a",
    diffAddedBg: "rgba(79,195,247,0.12)", diffAddedText: "#81d4fa", diffAddedBorder: "rgba(129,212,250,0.3)",
    diffRemovedBg: "rgba(239,68,68,0.12)", diffRemovedText: "#f87171", diffRemovedBorder: "rgba(248,113,113,0.3)",
  },
};

export const roboticsTheme: ThemeConfig = {
  id: "robotics", name: "Robotics",
  colors: {
    surface: "#1a1a1a", surfaceAlt: "#252525", surfaceHover: "#303030",
    textPrimary: "#fafaf9", textSecondary: "#a8a29e", textMuted: "#6b7280",
    accent: "#ff8c00", accentHover: "#e07c00", border: "#3a3a3a",
    diffAddedBg: "rgba(255,140,0,0.12)", diffAddedText: "#ffb44c", diffAddedBorder: "rgba(255,180,76,0.3)",
    diffRemovedBg: "rgba(239,68,68,0.12)", diffRemovedText: "#f87171", diffRemovedBorder: "rgba(248,113,113,0.3)",
  },
};

export const calculatorTheme: ThemeConfig = {
  id: "calculator", name: "Calculator",
  colors: {
    surface: "#0f0f1a", surfaceAlt: "#1a1a2e", surfaceHover: "#252540",
    textPrimary: "#e2e8f0", textSecondary: "#94a3b8", textMuted: "#6b7280",
    accent: "#7c4dff", accentHover: "#651fff", border: "#2a2a45",
    diffAddedBg: "rgba(124,77,255,0.12)", diffAddedText: "#b388ff", diffAddedBorder: "rgba(179,136,255,0.3)",
    diffRemovedBg: "rgba(239,68,68,0.12)", diffRemovedText: "#f87171", diffRemovedBorder: "rgba(248,113,113,0.3)",
  },
};

export const projectThemes: Record<string, ThemeConfig> = {
  platformer: platformerTheme,
  fishing: fishingTheme,
  robotics: roboticsTheme,
  calculator: calculatorTheme,
};
