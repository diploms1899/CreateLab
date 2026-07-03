import { useRef, useState, useCallback, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useAIActivityStore } from "@/stores/aiActivityStore";

interface EditorFile {
  path: string;
  content: string;
  language: string;
}

interface EditorPanelProps {
  files: EditorFile[];
  activeFile: string | null;
  onFileChange: (path: string | null) => void;
  onFileClose: (path: string) => void;
  onContentChange: (path: string, content: string) => void;
  onSave: (path: string, content: string) => void;
}

export default function EditorPanel({
  files,
  activeFile,
  onFileChange,
  onFileClose,
  onContentChange,
  onSave,
}: EditorPanelProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const { addActivity } = useAIActivityStore();

  const activeData = files.find((f) => f.path === activeFile);
  const activeContent = activeData?.content ?? "";

  const getDisplayName = (path: string) => {
    return path.includes("/") ? path.split("/").pop()! : path;
  };

  const getLanguage = (path: string): string => {
    if (path.endsWith(".ino") || path.endsWith(".cpp") || path.endsWith(".c")) return "cpp";
    if (path.endsWith(".h") || path.endsWith(".hpp")) return "cpp";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".toml")) return "ini";
    if (path.endsWith(".yaml") || path.endsWith(".yml")) return "yaml";
    return "plaintext";
  };

  const getFileColor = (path: string): string => {
    if (path.endsWith(".ino")) return "bg-blue-400";
    if (path.endsWith(".h") || path.endsWith(".hpp")) return "bg-orange-400";
    if (path.endsWith(".cpp") || path.endsWith(".c")) return "bg-purple-400";
    if (path.endsWith(".md")) return "bg-gray-400";
    if (path.endsWith(".json")) return "bg-yellow-400";
    return "bg-green-400";
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Ctrl/Cmd+S
    editor.addAction({
      id: "save-file",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        if (activeFile) {
          const content = editor.getValue();
          onSave(activeFile, content);
        }
      },
    });
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && activeFile) {
        onContentChange(activeFile, value);
      }
    },
    [activeFile, onContentChange]
  );

  const switchTab = (path: string) => {
    onFileChange(path);
    addActivity(`Switched to ${getDisplayName(path)}`, "navigating", path);
  };

  const closeTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFileClose(path);
  };

  // When activeFile changes, focus editor
  useEffect(() => {
    editorRef.current?.focus();
  }, [activeFile]);

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        <div className="text-center">
          <p className="text-lg mb-2">No files open</p>
          <p>Select a file from the Explorer to start editing</p>
          <p className="text-xs mt-2 text-text-muted">
            Ctrl/Cmd+P to search files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex bg-surface-alt border-b border-border overflow-x-auto">
        {files.map((f) => {
          const name = getDisplayName(f.path);
          const isActive = f.path === activeFile;
          return (
            <button
              key={f.path}
              onClick={() => switchTab(f.path)}
              className={`flex items-center gap-2 px-4 py-2 text-xs border-r border-border transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-surface text-text-primary border-t-2 border-t-accent"
                  : "text-text-muted hover:text-text-secondary bg-surface-alt"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${getFileColor(f.path)}`} />
              <span>{name}</span>
              <span
                onClick={(e) => closeTab(f.path, e)}
                className="ml-2 text-text-muted hover:text-red-400 cursor-pointer"
              >
                ×
              </span>
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={activeData ? getLanguage(activeData.path) : "plaintext"}
          theme="vs-dark"
          value={activeContent}
          onChange={handleChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderWhitespace: "selection",
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 8 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: "always",
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-surface-alt border-t border-border text-xs text-text-muted">
        <div className="flex items-center gap-4">
          <span className="text-text-secondary">
            {activeFile ?? "No file open"}
          </span>
          <span>UTF-8</span>
          <span>ESP32</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}
