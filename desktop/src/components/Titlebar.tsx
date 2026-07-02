import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import {
  Terminal,
  LogOut,
  ChevronLeft,
} from "lucide-react";

export default function Titlebar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, serverUrl } = useAuthStore();
  const { currentProject, setCurrentProject } = useProjectStore();

  return (
    <header className="titlebar">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-accent" />
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            CreateLab
          </span>
        </div>
        {currentProject && (
          <>
            <span className="text-text-muted text-xs">/</span>
            <span className="text-xs text-text-secondary">{currentProject.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAuthenticated() && (
          <>
            <span className="text-xs text-text-muted">
              {user?.displayName || user?.username}
            </span>
            {currentProject && (
              <button
                onClick={() => {
                  setCurrentProject(null);
                  navigate("/projects");
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors rounded hover:bg-surface-hover"
              >
                <ChevronLeft size={14} />
                Projects
              </button>
            )}
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted hover:text-red-400 transition-colors rounded hover:bg-surface-hover"
            >
              <LogOut size={14} />
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
