import { ReactNode } from "react";
import { useProjectStore } from "../stores/projectStore";
import Sidebar from "./Sidebar";
import Titlebar from "./Titlebar";
import StatusBar from "./StatusBar";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const getActiveTheme = useProjectStore((s) => s.getActiveTheme);
  const theme = getActiveTheme();

  const cssVars = theme
    ? ({
        "--color-primary": theme.colors.primary,
        "--color-secondary": theme.colors.secondary,
        "--color-bg": theme.colors.background,
        "--color-surface": theme.colors.surface,
        "--color-text": theme.colors.text,
        "--color-text-secondary": theme.colors.textSecondary,
        "--color-accent": theme.colors.accent,
        "--color-error": theme.colors.error,
        "--color-success": theme.colors.success,
        "--color-warning": theme.colors.warning,
        "--color-border": theme.colors.border,
        "--font-heading": theme.fonts.heading,
        "--font-body": theme.fonts.body,
        "--font-mono": theme.fonts.mono,
        "--border-radius": theme.borderRadius,
      } as React.CSSProperties)
    : {};

  return (
    <div className="app-shell" style={cssVars}>
      <Titlebar />
      <div className="app-body">
        <Sidebar />
        <main className="app-content">{children}</main>
      </div>
      <StatusBar />
    </div>
  );
}
