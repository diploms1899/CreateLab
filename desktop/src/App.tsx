import { useState, Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useThemeStore } from "@/stores/themeStore";
import Titlebar from "@/components/Titlebar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import ToastContainer from "@/components/ToastContainer";
import { ChatSkeleton } from "@/components/common/Skeleton";

// Code-split views for faster initial load
const LoginView = lazy(() => import("@/views/LoginView"));
const SetupWizard = lazy(() => import("@/views/SetupWizard"));
const ProjectSelectView = lazy(() => import("@/views/ProjectSelectView"));
const WorkspaceView = lazy(() => import("@/views/WorkspaceView"));
const SettingsView = lazy(() => import("@/views/SettingsView"));
const RepoHealthPanel = lazy(() => import("@/components/RepoHealthPanel"));

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="space-y-4 w-80">
        <ChatSkeleton />
        <ChatSkeleton />
        <ChatSkeleton />
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();
  const { currentProject } = useProjectStore();
  const { theme } = useThemeStore();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();

  // Check if first-run setup has been completed
  const isSetupComplete = localStorage.getItem("createlab-setup-complete") === "true";

  // Global keyboard shortcut: Ctrl+K toggles keyboard shortcuts panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const pageTransition = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2, ease: "easeOut" },
  };

  return (
    <div className="h-full w-full flex flex-col">
      <Titlebar />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              {...pageTransition}
              className="h-full"
            >
              <Routes location={location}>
          <Route
            path="/"
            element={
              !isSetupComplete ? (
                <Navigate to="/setup" replace />
              ) : isAuthenticated() ? (
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
            path="/setup"
            element={
              isSetupComplete ? <Navigate to="/login" replace /> : <SetupWizard />
            }
          />
          <Route
            path="/login"
            element={
              !isSetupComplete ? (
                <Navigate to="/setup" replace />
              ) : isAuthenticated() ? (
                <Navigate to="/projects" replace />
              ) : (
                <LoginView />
              )
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
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastContainer />
    </div>
  );
}
