import { useRef, useCallback } from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import { useProjectStore } from "../stores/projectStore";

interface Props {
  value: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onSave?: () => void;
}

export default function CodeEditor({ value, language = "cpp", readOnly = false, onChange, onSave }: Props) {
  const getActiveTheme = useProjectStore((s) => s.getActiveTheme);
  const theme = getActiveTheme();
  const editorRef = useRef<any>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.languages.register({ id: "arduino" });
    monaco.languages.setMonarchTokensProvider("arduino", {
      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/\/\*/, "comment", "@comment"],
          [/\b(void|int|float|double|char|bool|String|byte|long|unsigned|const|static|volatile)\b/, "type"],
          [/\b(setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|Serial|begin|print|println)\b/, "keyword"],
          [/\b(if|else|for|while|do|switch|case|break|continue|return)\b/, "keyword.control"],
          [/"/, "string", "@string_double"],
          [/'/, "string", "@string_single"],
        ],
        comment: [[/\*\//, "comment", "@pop"], [/./, "comment"]],
        string_double: [[/[^\\"]+/, "string"], [/\\./, "string.escape"], [/"/, "string", "@pop"]],
        string_single: [[/[^\\']+/, "string"], [/\\./, "string.escape"], [/'/, "string", "@pop"]],
      },
    });
    editor.addAction({
      id: "save-file",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => onSave?.(),
    });
  }, [onSave]);

  return (
    <div className="code-editor-container">
      <MonacoEditor
        height="100%"
        language={language === "ino" ? "arduino" : language}
        theme={theme?.editorTheme ?? "vs-dark"}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: theme?.fonts.mono ?? "'Fira Code', monospace",
          fontLigatures: true,
          lineNumbers: "on",
          renderWhitespace: "selection",
          tabSize: 2,
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: "always",
          wordWrap: "off",
          scrollBeyondLastLine: false,
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
