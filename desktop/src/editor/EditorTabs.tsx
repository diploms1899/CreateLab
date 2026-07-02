import { X } from "lucide-react";

interface Props {
  openFiles: string[];
  activeFile: string | null;
  dirtyFiles: Set<string>;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export default function EditorTabs({ openFiles, activeFile, dirtyFiles, onSelect, onClose }: Props) {
  return (
    <div className="editor-tabs">
      {openFiles.map((path) => {
        const name = path.split("/").pop() || path;
        const isActive = path === activeFile;
        const isDirty = dirtyFiles.has(path);
        return (
          <button
            key={path}
            className={`editor-tab ${isActive ? "active" : ""}`}
            onClick={() => onSelect(path)}
          >
            <span>{name}{isDirty ? " ●" : ""}</span>
            <span className="editor-tab-close" onClick={(e) => { e.stopPropagation(); onClose(path); }}>
              <X size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
