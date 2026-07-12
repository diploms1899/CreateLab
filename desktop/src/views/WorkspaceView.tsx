import { useState, useCallback, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useProjectStore, Project } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import FileExplorer from "@/components/FileExplorer";
import EditorPanel from "@/components/EditorPanel";
import AIChatPanel from "@/components/AIChatPanel";
import HardwarePanel from "@/components/HardwarePanel";
import { Bot, BarChart3, FileCode } from "lucide-react";

interface EditorFile {
  path: string;
  content: string;
  language: string;
}

interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
}

const DEFAULT_FILES: WorkspaceFile[] = [
  { path: "main.cpp", content: "// main.cpp\n#include \"config.h\"\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  // your code here\n}\n", language: "cpp" },
  { path: "config.h", content: "// config.h\n#pragma once\n\n#define PROJECT_NAME \"CreateLab\"\n#define VERSION \"1.0.0\"\n", language: "cpp" },
  { path: "README.md", content: "# Project\n\nCreated with CreateLab\n", language: "markdown" },
];

export default function WorkspaceView() {
  const { currentProject } = useProjectStore();
  const { activeId, files: wsFiles, readFile, writeFile, listWorkspaces } = useWorkspaceStore();
  const [showHardware, setShowHardware] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [files, setFiles] = useState<WorkspaceFile[]>(DEFAULT_FILES);
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const f of DEFAULT_FILES) map[f.path] = f.content;
    return map;
  });
  const [activeFilePath, setActiveFilePath] = useState<string>("main.cpp");

  // Load workspace files from store when available
  useEffect(() => {
    if (activeId && wsFiles.length > 0) {
      setFiles(wsFiles);
      const map: Record<string, string> = {};
      for (const f of wsFiles) map[f.path] = f.content;
      setFileContents(map);
      if (!activeFilePath || !wsFiles.find(f => f.path === activeFilePath)) {
        setActiveFilePath(wsFiles[0].path);
      }
    }
  }, [activeId, wsFiles]);

  // Load workspaces on mount
  useEffect(() => {
    listWorkspaces().catch(() => {});
  }, []);

  const activeFile = files.find(f => f.path === activeFilePath) || null;

  const handleSelectFile = useCallback((file: WorkspaceFile) => {
    setActiveFilePath(file.path);
  }, []);

  const handleEditorContentChange = useCallback((path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }));
  }, []);

  const handleEditorSave = useCallback((path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }));
    setFiles(prev => prev.map(f => f.path === path ? { ...f, content } : f));
    // Persist to workspace store if connected
    if (activeId) {
      writeFile(activeId, path, content).catch(() => {});
    }
  }, [activeId, writeFile]);

  const handleFileClose = useCallback((path: string) => {
    setFiles(prev => prev.filter(f => f.path !== path));
    setFileContents(prev => { const n = { ...prev }; delete n[path]; return n; });
    if (activeFilePath === path) {
      const remaining = files.filter(f => f.path !== path);
      if (remaining.length > 0) setActiveFilePath(remaining[0].path);
    }
  }, [activeFilePath, files]);

  const handleCreateFile = useCallback((parentPath: string) => {
    const name = prompt("File name:")?.trim();
    if (!name) return;
    const newPath = parentPath ? `${parentPath}/${name}` : name;
    const lang = name.split(".").pop() || "text";
    const file: WorkspaceFile = { path: newPath, content: "", language: lang };
    setFiles(prev => [...prev, file]);
    setFileContents(prev => ({ ...prev, [newPath]: "" }));
    setActiveFilePath(newPath);
  }, []);

  const handleCreateFolder = useCallback((parentPath: string) => {
    const name = prompt("Folder name:")?.trim();
    if (!name) return;
    const newPath = parentPath ? `${parentPath}/${name}` : name;
    const file: WorkspaceFile = { path: `${newPath}/.gitkeep`, content: "", language: "text" };
    setFiles(prev => [...prev, file]);
    setFileContents(prev => ({ ...prev, [newPath + "/.gitkeep"]: "" }));
  }, []);

  const editorFiles: EditorFile[] = files.map(f => ({
    path: f.path,
    content: fileContents[f.path] ?? f.content,
    language: f.language,
  }));

  const projectForChat: Project = currentProject || {
    id: "default",
    templateId: "platformer",
    name: "CreateLab",
    slug: "default",
    description: "Default project",
    progress: 0,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-surface shrink-0">
        <button onClick={() => setShowHardware(!showHardware)}
          className={`p-1.5 rounded text-xs transition-colors ${showHardware ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary"}`}
          title="Toggle Hardware Panel">
          <FileCode size={14} />
        </button>
        <button onClick={() => setShowAI(!showAI)}
          className={`p-1.5 rounded text-xs transition-colors ${showAI ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary"}`}
          title="Toggle AI Chat">
          <Bot size={14} />
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-text-muted px-2">{files.length} file{files.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" autoSaveId="workspace-layout">
          {showHardware && (
            <>
              <Panel defaultSize={12} minSize={10} maxSize={22}>
                <HardwarePanel />
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors cursor-col-resize" />
            </>
          )}

          <Panel defaultSize={14} minSize={8} maxSize={25}>
            <FileExplorer
              files={files}
              activeFile={activeFile || null}
              onSelect={handleSelectFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors cursor-col-resize" />

          <Panel defaultSize={showAI ? 48 : 72} minSize={20}>
            <EditorPanel
              files={editorFiles}
              activeFile={activeFilePath}
              onFileChange={(p: string | null) => setActiveFilePath(p ?? "main.cpp")}
              onFileClose={handleFileClose}
              onContentChange={handleEditorContentChange}
              onSave={handleEditorSave}
            />
          </Panel>

          {showAI && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors cursor-col-resize" />
              <Panel defaultSize={26} minSize={14} maxSize={42}>
                <AIChatPanel
                  project={projectForChat}
                  workspaceId={activeId || "default"}
                  files={fileContents}
                  onApplyPatch={(filePath, content) => {
                    handleEditorSave(filePath, content);
                    setActiveFilePath(filePath);
                  }}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  );
}
