import { useState, useCallback, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useProjectStore, Project } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import EditorPanel from "@/components/EditorPanel";
import AIChatPanel from "@/components/AIChatPanel";
import HardwarePanel from "@/components/HardwarePanel";
import { Bot, FileCode } from "lucide-react";

interface EditorFile {
  path: string;
  content: string;
  language: string;
}

const DEFAULT_CONTENT = `#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("CreateLab ready!");
}

void loop() {
  // your code here
}
`;

const SINGLE_FILE: EditorFile = {
  path: "main.cpp",
  content: DEFAULT_CONTENT,
  language: "cpp",
};

export default function WorkspaceView() {
  const { currentProject } = useProjectStore();
  const { activeId, readFile, writeFile, listWorkspaces } = useWorkspaceStore();
  const [showHardware, setShowHardware] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [fileContent, setFileContent] = useState(DEFAULT_CONTENT);
  const [fileLoaded, setFileLoaded] = useState(false);

  // Load content from workspace store when available
  useEffect(() => {
    if (activeId && !fileLoaded) {
      readFile(activeId, "main.cpp")
        .then(content => {
          if (content) setFileContent(content);
          setFileLoaded(true);
        })
        .catch(() => setFileLoaded(true));
    }
  }, [activeId, fileLoaded, readFile]);

  // Load workspaces on mount
  useEffect(() => {
    listWorkspaces().catch(() => {});
  }, []);

  const handleContentChange = useCallback((_path: string, content: string) => {
    setFileContent(content);
  }, []);

  const handleSave = useCallback((_path: string, content: string) => {
    setFileContent(content);
    if (activeId) {
      writeFile(activeId, "main.cpp", content).catch(() => {});
    }
  }, [activeId, writeFile]);

  const projectForChat: Project = currentProject || {
    id: "default",
    templateId: "platformer",
    name: "CreateLab",
    slug: "default",
    description: "Default project",
    progress: 0,
  };

  const fileContents = { "main.cpp": fileContent };

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
        <span className="text-[10px] text-text-muted px-2">main.cpp</span>
      </div>

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" autoSaveId="workspace-layout">
          {showHardware && (
            <>
              <Panel defaultSize={14} minSize={10} maxSize={22}>
                <HardwarePanel />
              </Panel>
              <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors cursor-col-resize" />
            </>
          )}

          <Panel defaultSize={showAI ? 52 : 76} minSize={20}>
            <EditorPanel
              files={[{ ...SINGLE_FILE, content: fileContent }]}
              activeFile="main.cpp"
              onFileChange={() => {}}
              onFileClose={() => {}}
              onContentChange={handleContentChange}
              onSave={handleSave}
            />
          </Panel>

          {showAI && (
            <>
              <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors cursor-col-resize" />
              <Panel defaultSize={34} minSize={18} maxSize={46}>
                <AIChatPanel
                  project={projectForChat}
                  workspaceId={activeId || "default"}
                  files={fileContents}
                  onApplyPatch={(filePath, content) => {
                    handleSave(filePath, content);
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
