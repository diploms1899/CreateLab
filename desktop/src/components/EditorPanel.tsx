import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

const defaultCode = `// Welcome to CreateLab!
// Start coding your project below.

#include <Arduino.h>
#include <U8g2lib.h>

// Display configuration
U8G2_SSD1306_128X64_NONAME_F_HW_I2C display(U8G2_R2, /* reset=*/ U8X8_PIN_NONE);

void setup() {
  Serial.begin(115200);
  display.begin();
  display.setFont(u8g2_font_ncenB08_tr);
  display.clearBuffer();
  display.drawStr(0, 20, "Hello, CreateLab!");
  display.sendBuffer();
}

void loop() {
  // Your game logic here
  delay(16); // ~60 FPS
}
`;

const TABS = ["main.ino", "config.h", "display.cpp", "display.h", "game.cpp", "game.h"];

export default function EditorPanel() {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const activeFile = "main.ino"; // TODO: make switchable

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor tabs */}
      <div className="flex bg-surface-alt border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-xs border-r border-border transition-colors whitespace-nowrap ${
              tab === activeFile
                ? "bg-surface text-text-primary border-t-2 border-t-accent"
                : "text-text-muted hover:text-text-secondary bg-surface-alt"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs-dark"
          defaultValue={defaultCode}
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
          <span>main.ino</span>
          <span>UTF-8</span>
          <span>ESP32 Dev Module</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span className="text-green-400">Ready</span>
        </div>
      </div>
    </div>
  );
}
