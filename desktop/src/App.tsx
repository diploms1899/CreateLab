import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import LoginView from "@/views/LoginView";
import ProjectSelectView from "@/views/ProjectSelectView";
import WorkspaceView from "@/views/WorkspaceView";
import SettingsView from "@/views/SettingsView";
import RepoHealthPanel from "@/components/RepoHealthPanel";
import Titlebar from "@/components/Titlebar";

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const { currentProject } = useProjectStore();
  const { theme } = useThemeStore();

  return (
    <div className="h-full w-full flex flex-col">
      <Titlebar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated() ? (
                currentProject ? (
                  <Navigate to="/workspace" replace />
                ) : (
                  <Navigate to="/projects" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated() ? <Navigate to="/projects" replace /> : <LoginView />
            }
          />
          <Route
            path="/projects"
            element={
              isAuthenticated() ? <ProjectSelectView /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/workspace"
            element={
              isAuthenticated() && currentProject ? (
                <WorkspaceView />
              ) : (
                <Navigate to="/projects" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated() ? <SettingsView /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/repo-health"
            element={
              isAuthenticated() ? <RepoHealthPanel /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </div>
    </div>
  );
}
