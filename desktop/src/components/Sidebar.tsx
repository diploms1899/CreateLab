import { useState, useEffect, useCallback } from "react";

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}
import { useProjectStore, Project } from "@/stores/projectStore";
import {
  FolderOpen, Cpu, Download, Upload, Play,
  Search, Plus, Trash2, RefreshCw, Package, Zap,
  ChevronRight, BookOpen, Settings, FileCode,
} from "lucide-react";

type Tab = "files" | "boards" | "libraries";

interface LibraryInfo {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface SidebarProps {
  project?: Project;
  compact?: boolean;
}

export default function Sidebar({ project, compact }: SidebarProps) {
  const { currentProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<Tab>(compact ? "boards" : "files");
  const [boardSearch, setBoardSearch] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [installedLibs, setInstalledLibs] = useState<LibraryInfo[]>([]);
  const [searchResults, setSearchResults] = useState<LibraryInfo[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [boards, setBoards] = useState<string[]>([]);
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedPort, setSelectedPort] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refreshHardware = useCallback(async () => {
    try {
      const b = await safeInvoke<string[]>("list_boards");
      setBoards(b);
      const p = await safeInvoke<string[]>("list_ports");
      setPorts(p);
    } catch { /* arduino-cli may not be installed */ }
  }, []);

  useEffect(() => { refreshHardware(); }, [refreshHardware]);

  const refreshLibraries = useCallback(async () => {
    try {
      const libs = await safeInvoke<LibraryInfo[]>("list_libraries");
      setInstalledLibs(libs);
    } catch { /* arduino-cli may not be installed */ }
  }, []);

  useEffect(() => { refreshLibraries(); }, [refreshLibraries]);

  const searchLibraries = async () => {
    if (!librarySearch.trim()) return;
    try {
      const results = await safeInvoke<LibraryInfo[]>("search_libraries", { query: librarySearch });
      setSearchResults(results);
    } catch { /* ignore */ }
  };

  const installLibrary = async (name: string) => {
    setInstalling(name);
    try {
      await safeInvoke("install_library", { name });
      await refreshLibraries();
      setInstalling(null);
    } catch { setInstalling(null); }
  };

  const removeLibrary = async (name: string) => {
    try {
      await safeInvoke("remove_library", { name });
      await refreshLibraries();
    } catch { /* ignore */ }
  };

  const handleCompile = async () => {
    setCompiling(true);
    try { await safeInvoke("compile_sketch", { board: selectedBoard }); } catch { /**/ }
    setCompiling(false);
  };

  const handleUpload = async () => {
    setUploading(true);
    try { await safeInvoke("upload_sketch", { board: selectedBoard, port: selectedPort }); } catch { /**/ }
    setUploading(false);
  };

  const p = project || currentProject;

  return (
    <aside className="sidebar">
      {/* Project info — skip in compact mode */}
      {!compact && (
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary truncate">{p?.name ?? "CreateLab"}</span>
        </div>
      </div>
      )}

      {/* Tab bar */}
      <div className={`flex border-b border-border ${compact ? "pt-2" : ""}`}>
        {([
          ...(compact ? [] : [["files", FileCode, "Files"] as const]),
          ["boards", Cpu, "Boards"],
          ["libraries", Package, "Libraries"],
        ] as readonly (readonly [Tab, any, string])[]).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs transition-colors border-b-2 ${
              activeTab === id ? "border-accent text-accent bg-accent/5" : "border-transparent text-text-muted hover:text-text-primary"
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-3">
        {/* ---- FILES ---- */}
        {activeTab === "files" && (
          <div className="space-y-0.5">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 px-1">Project Files</p>
            {p ? (
              <>
                {["src/", "include/", "lib/", "assets/", "platformio.ini", "main.cpp", "config.h"].map(f => (
                  <div key={f} className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                    f.endsWith("/") ? "text-text-secondary font-medium" : "text-text-muted"
                  } hover:bg-surface-hover`}>
                    {f.endsWith("/") ? <><ChevronRight size={12} /><FolderOpen size={13} /></> : <span className="w-5" />}
                    {f}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-text-muted p-2">No project open</p>
            )}
          </div>
        )}

        {/* ---- BOARDS ---- */}
        {activeTab === "boards" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider">Port</label>
              <div className="flex items-center gap-2 mt-1">
                <select value={selectedPort} onChange={e => setSelectedPort(e.target.value)}
                  className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent">
                  <option value="">Select port...</option>
                  {ports.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
                <button onClick={refreshHardware} className="p-1 rounded hover:bg-surface-hover text-text-muted">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider">Board</label>
              <input type="text" placeholder="Search boards..." value={boardSearch} onChange={e => setBoardSearch(e.target.value)}
                className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary placeholder-text-muted mt-1 focus:outline-none focus:border-accent" />
              <div className="mt-1 space-y-0.5 max-h-28 overflow-auto">
                {boards.filter(b => b.toLowerCase().includes(boardSearch.toLowerCase())).map(b => (
                  <button key={b} onClick={() => setSelectedBoard(b)}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                      selectedBoard === b ? "bg-accent/20 text-accent" : "text-text-muted hover:bg-surface-hover"
                    }`}>{b}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <button onClick={handleCompile} disabled={compiling || !selectedBoard}
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-all">
                {compiling ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
                {compiling ? "Compiling..." : "Compile"}
              </button>
              <button onClick={handleUpload} disabled={uploading || !selectedBoard || !selectedPort}
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-sm font-medium bg-green-600 text-white hover:opacity-90 disabled:opacity-40 transition-all">
                {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}

        {/* ---- LIBRARIES ---- */}
        {activeTab === "libraries" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider">Install Library</label>
              <div className="flex items-center gap-2 mt-1">
                <input type="text" placeholder="Search libraries..." value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchLibraries()}
                  className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
                <button onClick={searchLibraries} className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-accent">
                  <Search size={14} />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-0.5 max-h-48 overflow-auto">
                  {searchResults.map(lib => (
                    <div key={lib.name} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-hover">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-primary truncate">{lib.name}</div>
                        <div className="text-[10px] text-text-muted truncate">{lib.description}</div>
                      </div>
                      <button onClick={() => installLibrary(lib.name)}
                        disabled={installing === lib.name || installedLibs.some(l => l.name === lib.name)}
                        className="ml-2 px-2 py-1 rounded text-[10px] font-medium bg-accent text-white hover:opacity-90 disabled:opacity-40 shrink-0">
                        {installing === lib.name ? "..." : installedLibs.some(l => l.name === lib.name) ? "Installed" : "Install"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted uppercase tracking-wider">Installed ({installedLibs.length})</span>
                <button onClick={refreshLibraries} className="p-1 rounded hover:bg-surface-hover text-text-muted"><RefreshCw size={12} /></button>
              </div>
              {installedLibs.length === 0 ? (
                <p className="text-xs text-text-muted p-2">No libraries installed</p>
              ) : (
                <div className="space-y-0.5">
                  {installedLibs.map(lib => (
                    <div key={lib.name} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-hover group">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-primary">{lib.name}</div>
                        <div className="text-[10px] text-text-muted">v{lib.version} — {lib.author}</div>
                      </div>
                      <button onClick={() => removeLibrary(lib.name)}
                        className="p-1 rounded hover:bg-red-600/20 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
