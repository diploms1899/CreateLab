import { ThemeConfig } from "../stores/projectStore";

export const platformerTheme: ThemeConfig = {
  id: "platformer", name: "Platformer",
  colors: {
    primary: "#a855f7", secondary: "#7c3aed", background: "#0f0f1a",
    surface: "#1a1a2e", text: "#e2e8f0", textSecondary: "#94a3b8",
    accent: "#f59e0b", error: "#ef4444", success: "#22c55e",
    warning: "#f59e0b", border: "#2d2d4a",
  },
  fonts: { heading: "'Press Start 2P', monospace", body: "'Fira Code', monospace", mono: "'Fira Code', monospace" },
  editorTheme: "vs-dark", borderRadius: "0px", animations: "playful",
};

export const fishingTheme: ThemeConfig = {
  id: "fishing", name: "Fishing",
  colors: {
    primary: "#0ea5e9", secondary: "#0284c7", background: "#082f49",
    surface: "#0c4a6e", text: "#e0f2fe", textSecondary: "#7dd3fc",
    accent: "#f59e0b", error: "#f87171", success: "#34d399",
    warning: "#fbbf24", border: "#164e63",
  },
  fonts: { heading: "'Quicksand', sans-serif", body: "'Inter', sans-serif", mono: "'Fira Code', monospace" },
  editorTheme: "vs-dark", borderRadius: "12px", animations: "subtle",
};

export const roboticsTheme: ThemeConfig = {
  id: "robotics", name: "Robotics",
  colors: {
    primary: "#f97316", secondary: "#ea580c", background: "#1c1917",
    surface: "#292524", text: "#fafaf9", textSecondary: "#a8a29e",
    accent: "#facc15", error: "#ef4444", success: "#22c55e",
    warning: "#f59e0b", border: "#44403c",
  },
  fonts: { heading: "'Barlow Condensed', sans-serif", body: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" },
  editorTheme: "vs-dark", borderRadius: "2px", animations: "standard",
};

export const calculatorTheme: ThemeConfig = {
  id: "calculator", name: "Calculator",
  colors: {
    primary: "#06b6d4", secondary: "#0891b2", background: "#f8fafc",
    surface: "#ffffff", text: "#0f172a", textSecondary: "#475569",
    accent: "#8b5cf6", error: "#ef4444", success: "#10b981",
    warning: "#f59e0b", border: "#cbd5e1",
  },
  fonts: { heading: "'DM Sans', sans-serif", body: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" },
  editorTheme: "vs", borderRadius: "8px", animations: "standard",
};

export const projectThemes: Record<string, ThemeConfig> = {
  platformer: platformerTheme,
  fishing: fishingTheme,
  robotics: roboticsTheme,
  calculator: calculatorTheme,
};
