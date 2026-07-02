import { Folder, File, FileCode, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
}

interface Props {
  files: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  onSelect: (file: WorkspaceFile) => void;
}

export default function FileExplorer({ files, activeFile, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const dirs = new Map<string, WorkspaceFile[]>();
  for (const f of files) {
    const dir = f.path.includes("/") ? f.path.substring(0, f.path.lastIndexOf("/")) : ".";
    if (!dirs.has(dir)) dirs.set(dir, []);
    dirs.get(dir)!.push(f);
  }

  function toggleDir(dir: string) {
    setExpanded((prev) => ({ ...prev, [dir]: !prev[dir] }));
  }

  function getIcon(path: string) {
    const ext = path.split(".").pop() ?? "";
    if (["ino", "cpp", "c", "h", "hpp"].includes(ext)) return <FileCode size={14} />;
    return <File size={14} />;
  }

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <Folder size={16} /> Files
      </div>
      {Array.from(dirs.entries()).map(([dir, dirFiles]) => (
        <div key={dir}>
          {dir !== "." && (
            <button className="file-dir" onClick={() => toggleDir(dir)}>
              {expanded[dir] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={14} /> {dir}
            </button>
          )}
          {(dir === "." || expanded[dir]) &&
            dirFiles.map((f) => (
              <button
                key={f.path}
                className={`file-item ${activeFile?.path === f.path ? "active" : ""}`}
                onClick={() => onSelect(f)}
              >
                {getIcon(f.path)}
                <span>{f.path.includes("/") ? f.path.split("/").pop() : f.path}</span>
              </button>
            ))}
        </div>
      ))}
      {files.length === 0 && <p className="file-explorer-empty">No files yet</p>}
    </div>
  );
}
