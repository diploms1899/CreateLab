import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { Terminal, LogOut, ChevronLeft, Settings } from "lucide-react";

function useAppWindow() {
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}

export default function Titlebar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { currentProject, setCurrentProject } = useProjectStore();
  const appWindow = useAppWindow();
  const isTauri = appWindow !== null;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleMaximize = useCallback(async () => {
    if (!appWindow) return;
    const next = !isFullscreen;
    await appWindow.setFullscreen(next);
    setIsFullscreen(next);
  }, [isFullscreen, appWindow]);

  return (
    <header className="titlebar" data-tauri-drag-region>
      {isTauri && (
        <div className="traffic-lights" data-tauri-drag-region="false">
          <button onClick={() => appWindow!.close()} className="traffic-light traffic-light-close" aria-label="Close" />
          <button onClick={() => appWindow!.minimize()} className="traffic-light traffic-light-minimize" aria-label="Minimize" />
          <button onClick={handleMaximize} className="traffic-light traffic-light-maximize" aria-label={isFullscreen ? "Restore" : "Fullscreen"} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Terminal size={18} className="text-accent" />
        <span className="text-sm font-semibold text-text-primary tracking-wide">CreateLab</span>
      </div>
      {currentProject && (
        <>
          <span className="text-text-muted text-xs">/</span>
          <span className="text-xs text-text-secondary">{currentProject.name}</span>
        </>
      )}

      <div className="flex-1" data-tauri-drag-region />

      <div className="flex items-center gap-2" data-tauri-drag-region="false">
        {isAuthenticated() && (
          <>
            <span className="text-xs text-text-muted">{user?.displayName || user?.username}</span>
            {currentProject && (
              <button onClick={() => { setCurrentProject(null); navigate("/projects"); }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors rounded hover:bg-surface-hover">
                <ChevronLeft size={14} /> Projects
              </button>
            )}
            <button onClick={() => navigate("/settings")}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors rounded hover:bg-surface-hover">
              <Settings size={14} /> Settings
            </button>
            <button onClick={() => { logout(); navigate("/login"); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-red-400 transition-colors rounded hover:bg-surface-hover">
              <LogOut size={14} /> Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
