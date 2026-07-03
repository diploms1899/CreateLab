import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileJson,
  FileText,
  FileImage,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Copy,
  Trash2,
  Pencil,
  ExternalLink,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import { useAIActivityStore } from "@/stores/aiActivityStore";

// ── Types ──────────────────────────────────────────────────

export interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: FileTreeNode[];
  file?: WorkspaceFile;
}

interface Props {
  files: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  onSelect: (file: WorkspaceFile) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onCreateFile?: (path: string) => void;
  onCreateFolder?: (path: string) => void;
}

// ── Context menu ───────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  node: FileTreeNode | null;
}

// ── File type helpers ──────────────────────────────────────

const FILE_ICONS: Record<string, React.ReactNode> = {
  ino: <FileCode size={15} className="text-blue-400" />,
  cpp: <FileCode size={15} className="text-purple-400" />,
  c: <FileCode size={15} className="text-purple-400" />,
  h: <FileCode size={15} className="text-orange-400" />,
  hpp: <FileCode size={15} className="text-orange-400" />,
  json: <FileJson size={15} className="text-yellow-400" />,
  md: <FileText size={15} className="text-gray-400" />,
  txt: <FileText size={15} className="text-gray-400" />,
  toml: <FileText size={15} className="text-green-400" />,
  yaml: <FileText size={15} className="text-green-400" />,
  yml: <FileText size={15} className="text-green-400" />,
  png: <FileImage size={15} className="text-cyan-400" />,
  jpg: <FileImage size={15} className="text-cyan-400" />,
  svg: <FileImage size={15} className="text-cyan-400" />,
};

function getFileIcon(path: string): React.ReactNode {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return FILE_ICONS[ext] ?? <File size={15} className="text-text-muted" />;
}

// ── Build tree from flat file list ─────────────────────────

function buildTree(files: WorkspaceFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const dirMap = new Map<string, FileTreeNode>();

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const f of sorted) {
    const parts = f.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1;
      const partialPath = parts.slice(0, i + 1).join("/");

      if (isLast) {
        current.push({
          name: parts[i],
          path: f.path,
          isDir: false,
          children: [],
          file: f,
        });
      } else {
        let dir = dirMap.get(partialPath);
        if (!dir) {
          dir = { name: parts[i], path: partialPath, isDir: true, children: [] };
          dirMap.set(partialPath, dir);
          current.push(dir);
        }
        current = dir.children;
      }
    }
  }

  return root;
}

// ── Component ──────────────────────────────────────────────

export default function FileExplorer({
  files,
  activeFile,
  onSelect,
  onDelete,
  onRename,
  onCreateFile,
  onCreateFolder,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("createlab_expanded_dirs");
    return saved ? new Set(JSON.parse(saved)) : new Set<string>();
  });
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const { currentEditingFile } = useAIActivityStore();

  const tree = useMemo(() => buildTree(files), [files]);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    const filter = (nodes: FileTreeNode[]): FileTreeNode[] =>
      nodes
        .map((n) => ({
          ...n,
          children: filter(n.children),
        }))
        .filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            (n.isDir && n.children.length > 0)
        );
    return filter(tree);
  }, [tree, search]);

  // Persist expanded state
  const toggleExpand = useCallback(
    (path: string) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        localStorage.setItem(
          "createlab_expanded_dirs",
          JSON.stringify([...next])
        );
        return next;
      });
    },
    []
  );

  // Auto-expand to active file
  useEffect(() => {
    if (!activeFile) return;
    const parts = activeFile.path.split("/");
    parts.pop(); // remove filename
    let partial = "";
    const paths: string[] = [];
    for (const p of parts) {
      partial = partial ? `${partial}/${p}` : p;
      paths.push(partial);
    }
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const p of paths) {
        if (!next.has(p)) {
          next.add(p);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(
          "createlab_expanded_dirs",
          JSON.stringify([...next])
        );
      }
      return next;
    });
  }, [activeFile?.path]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        const input = treeRef.current?.querySelector("input");
        input?.focus();
      }
      if (e.key === "Escape") {
        setContextMenu(null);
        setRenaming(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Click outside closes context menu
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleRenameStart = (node: FileTreeNode) => {
    setRenaming(node.path);
    setRenameValue(node.name);
    setContextMenu(null);
  };

  const handleRenameCommit = () => {
    if (renaming && renameValue && renameValue !== renaming.split("/").pop()) {
      const dir = renaming.includes("/")
        ? renaming.substring(0, renaming.lastIndexOf("/"))
        : "";
      const newPath = dir ? `${dir}/${renameValue}` : renameValue;
      onRename?.(renaming, newPath);
    }
    setRenaming(null);
  };

  const handleDragStart = (e: React.DragEvent, node: FileTreeNode) => {
    e.dataTransfer.setData("text/plain", node.path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, node: FileTreeNode) => {
    if (!node.isDir) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(node.path);
  };

  const handleDrop = (e: React.DragEvent, targetDir: FileTreeNode) => {
    e.preventDefault();
    setDragOver(null);
    const sourcePath = e.dataTransfer.getData("text/plain");
    if (!sourcePath || !targetDir.isDir) return;
    const name = sourcePath.split("/").pop()!;
    const newPath = `${targetDir.path}/${name}`;
    if (sourcePath !== newPath) onRename?.(sourcePath, newPath);
  };

  // ── Render ──────────────────────────────────────────────

  const renderNode = (node: FileTreeNode, depth: number) => {
    const isExpanded = expanded.has(node.path);
    const isActive = activeFile?.path === node.path;
    const isEditing = currentEditingFile === node.path;
    const isRenaming = renaming === node.path;

    if (node.isDir) {
      return (
        <div key={node.path}>
          <div
            className={`tree-row ${dragOver === node.path ? "drag-over" : ""}`}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={() => toggleExpand(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            onDragOver={(e) => handleDragOver(e, node)}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, node)}
          >
            <span className="tree-chevron">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="tree-icon">
              {isExpanded ? (
                <FolderOpen size={15} className="text-yellow-400" />
              ) : (
                <Folder size={15} className="text-yellow-400" />
              )}
            </span>
            {isRenaming ? (
              <input
                className="tree-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameCommit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameCommit();
                  if (e.key === "Escape") setRenaming(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tree-name">{node.name}</span>
            )}
          </div>
          {isExpanded &&
            node.children.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <div key={node.path}>
        <div
          className={`tree-row ${isActive ? "active" : ""} ${isEditing ? "editing" : ""}`}
          style={{ paddingLeft: depth * 16 + 8 }}
          onClick={() => onSelect(node.file!)}
          onDoubleClick={() => onSelect(node.file!)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
        >
          <span className="tree-chevron" style={{ visibility: "hidden" }}>
            <ChevronRight size={14} />
          </span>
          <span className="tree-icon">{getFileIcon(node.path)}</span>
          {isRenaming ? (
            <input
              className="tree-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameCommit();
                if (e.key === "Escape") setRenaming(null);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="tree-name">
                {node.name}
                {isEditing && (
                  <span className="tree-editing-badge" title="AI is editing this file">
                    <span className="editing-dot" />
                  </span>
                )}
              </span>
              {isActive && <span className="tree-active-dot" />}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="file-explorer" ref={treeRef}>
      {/* Header */}
      <div className="file-explorer-header">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="tree-action-btn"
            onClick={() => onCreateFile?.("")}
            title="New File"
          >
            <Plus size={14} />
          </button>
          <button
            className="tree-action-btn"
            onClick={() => onCreateFolder?.("")}
            title="New Folder"
          >
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 pb-1">
        <div className="tree-search">
          <Search size={13} className="text-text-muted flex-shrink-0" />
          <input
            placeholder="Filter files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tree-search-input"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="tree-body">
        {filteredTree.length === 0 && (
          <p className="text-xs text-text-muted text-center py-6">
            {search ? "No matching files" : "No files yet"}
          </p>
        )}
        {filteredTree.map((node) => renderNode(node, 0))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {!contextMenu.node?.isDir && (
            <>
              <button
                className="context-menu-item"
                onClick={() => {
                  onSelect(contextMenu.node!.file!);
                  setContextMenu(null);
                }}
              >
                <File size={13} /> Open
              </button>
              <div className="context-menu-divider" />
            </>
          )}
          <button
            className="context-menu-item"
            onClick={() => handleRenameStart(contextMenu.node!)}
          >
            <Pencil size={13} /> Rename
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              onRename?.(contextMenu.node!.path, `${contextMenu.node!.path}.copy`);
              setContextMenu(null);
            }}
          >
            <Copy size={13} /> Duplicate
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.node!.path);
              setContextMenu(null);
            }}
          >
            <Copy size={13} /> Copy Path
          </button>
          {!contextMenu.node?.isDir && (
            <button
              className="context-menu-item"
              onClick={() => {
                onCreateFile?.(contextMenu.node!.path);
                setContextMenu(null);
              }}
            >
              <Plus size={13} /> New File
            </button>
          )}
          <button
            className="context-menu-item"
            onClick={() => {
              onCreateFolder?.(contextMenu.node!.isDir ? contextMenu.node!.path : "");
              setContextMenu(null);
            }}
          >
            <FolderOpen size={13} /> New Folder
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              onDelete?.(contextMenu.node!.path);
              setContextMenu(null);
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="file-explorer-footer">
        <span className="text-[10px] text-text-muted">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
