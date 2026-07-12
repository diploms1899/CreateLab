import { useState, useEffect, useCallback } from "react";
import { useArduinoStore } from "@/stores/arduinoStore";

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}
import {
  Search, Play, Upload, RefreshCw, Usb, X, RotateCcw,
  AlertTriangle, Terminal, Package, Trash2, Cpu, ExternalLink, Info, Clock
} from "lucide-react";

const FALLBACK_BOARDS = [
  "Arduino Uno", "Arduino Mega 2560", "Arduino Nano", "Arduino Leonardo",
  "ESP32 Dev Module", "ESP32-S3 Dev Module", "Raspberry Pi Pico", "Teensy 4.0"
];

interface LibraryInfo {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface CompileResult {
  success: boolean;
  output: string;
  error: string;
  duration_ms: number;
}

interface UploadResult {
  success: boolean;
  output: string;
  error: string;
  duration_ms: number;
}

type Tab = "board" | "libraries";

export default function HardwarePanel() {
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [cliReady, setCliReady] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const [boards, setBoards] = useState<string[]>(FALLBACK_BOARDS);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Libraries
  const [librarySearch, setLibrarySearch] = useState("");
  const [installedLibs, setInstalledLibs] = useState<LibraryInfo[]>([]);
  const [searchResults, setSearchResults] = useState<LibraryInfo[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);

  // Sync selection to shared store so AI agent can access it
  const arduinoStore = useArduinoStore();
  useEffect(() => { arduinoStore.setSelected(selectedBoard, selectedPort); }, [selectedBoard, selectedPort]);

  // Auto-detect on mount
  useEffect(() => {
    safeInvoke<string>("detect_arduino")
      .then(() => setCliReady(true))
      .catch(() => setCliReady(false));
  }, []);

  const refreshHardware = useCallback(async () => {
    setCompileResult(null); setUploadResult(null);
    try {
      const [b, p] = await Promise.all([
        safeInvoke<string[]>("list_boards").catch(() => FALLBACK_BOARDS),
        safeInvoke<string[]>("list_ports").catch(() => [] as string[]),
      ]);
      setBoards(b.length > 0 ? b : FALLBACK_BOARDS);
      setPorts(p);
    } catch { /* keep fallbacks */ }
  }, []);

  const refreshLibraries = useCallback(async () => {
    try {
      const libs = await safeInvoke<LibraryInfo[]>("list_libraries");
      setInstalledLibs(libs);
    } catch { /* cli may not be installed */ }
  }, []);

  useEffect(() => {
    if (cliReady) { refreshHardware(); refreshLibraries(); }
  }, [refreshHardware, refreshLibraries, cliReady]);

  const handleCompile = async () => {
    setCompiling(true); setCompileResult(null); setUploadResult(null);
    try {
      const result = await safeInvoke<CompileResult>("compile_sketch", { board: selectedBoard });
      setCompileResult(result);
    } catch (e: any) {
      setCompileResult({ success: false, output: "", error: typeof e === "string" ? e : (e?.message || String(e)), duration_ms: 0 });
    }
    setCompiling(false);
  };

  const handleUpload = async () => {
    setUploading(true); setCompileResult(null); setUploadResult(null);
    try {
      const result = await safeInvoke<UploadResult>("upload_sketch", { board: selectedBoard, port: selectedPort });
      setUploadResult(result);
    } catch (e: any) {
      setUploadResult({ success: false, output: "", error: typeof e === "string" ? e : (e?.message || String(e)), duration_ms: 0 });
    }
    setUploading(false);
  };

  const searchLibraries = async () => {
    if (!librarySearch.trim()) return;
    try {
      const results = await safeInvoke<LibraryInfo[]>("search_libraries", { query: librarySearch });
      setSearchResults(results);
    } catch { /* ignore */ }
  };

  const installLibrary = async (name: string) => {
    setInstalling(name);
    try { await safeInvoke("install_library", { name }); await refreshLibraries(); } catch { /* */ }
    setInstalling(null);
  };

  const removeLibrary = async (name: string) => {
    try { await safeInvoke("remove_library", { name }); await refreshLibraries(); } catch { /* */ }
  };

  const filteredBoards = boards.filter(b =>
    b.toLowerCase().includes(boardSearch.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-surface-dark border-r border-border overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-0.5">
          {([
            ["board", Cpu, "Board"],
            ["libraries", Package, "Libraries"],
          ] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeTab === id ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
        <button onClick={() => { refreshHardware(); refreshLibraries(); }}
          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* CLI not found warning */}
        {!cliReady && (
          <div className="flex items-start gap-2 px-2 py-2 rounded bg-yellow-600/10 border border-yellow-600/30 text-[11px] text-yellow-400">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Arduino CLI not found</p>
              <p className="text-yellow-500/80 mt-0.5">Install from:</p>
              <a href="https://arduino.github.io/arduino-cli/installation/" target="_blank" rel="noreferrer"
                className="block mt-1 text-accent hover:underline">arduino.github.io/arduino-cli/installation</a>
            </div>
          </div>
        )}

        {/* ═══ BOARD TAB ═══ */}
        {activeTab === "board" && (
          <>
            {/* Port */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Port</label>
              {ports.length > 0 ? (
                <select value={selectedPort} onChange={e => setSelectedPort(e.target.value)}
                  className="w-full bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent">
                  <option value="">Select port...</option>
                  {ports.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface border border-border text-xs text-text-muted">
                  <Usb size={12} /> No devices detected
                </div>
              )}
            </div>

            {/* Board */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Board</label>
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                <input type="text" placeholder="Filter boards..." value={boardSearch}
                  onChange={e => setBoardSearch(e.target.value)}
                  className="w-full bg-surface border border-border rounded pl-7 pr-2 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
                {boardSearch && (
                  <button onClick={() => setBoardSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    <X size={11} />
                  </button>
                )}
              </div>
              <div className="mt-1.5 space-y-0.5 max-h-28 overflow-auto">
                {filteredBoards.length > 0 ? filteredBoards.map(b => (
                  <button key={b} onClick={() => setSelectedBoard(b)}
                    className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors truncate ${selectedBoard === b ? "bg-accent/20 text-accent font-medium" : "text-text-muted hover:bg-surface-hover hover:text-text-primary"}`}>
                    {b}
                  </button>
                )) : (
                  <p className="text-[10px] text-text-muted px-2 py-1">No boards match</p>
                )}
              </div>
            </div>

            {/* Compile / Upload */}
            <div className="pt-2 border-t border-border space-y-2">
              <button onClick={handleCompile} disabled={compiling || !selectedBoard || !cliReady}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {compiling ? <RotateCcw size={13} className="animate-spin" /> : <Play size={13} />}
                {compiling ? "Compiling..." : "Compile"}
              </button>
              <button onClick={handleUpload} disabled={uploading || !selectedBoard || !selectedPort || !cliReady}
                className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium bg-green-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                {uploading ? <RotateCcw size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            {/* Compile result */}
            {compileResult && (
              <div className={`rounded border p-2 text-[11px] font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto ${compileResult.success ? "bg-green-600/5 border-green-600/30 text-green-400" : "bg-red-600/5 border-red-600/30 text-red-400"}`}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider opacity-70">
                  <Terminal size={11} />
                  {compileResult.success ? "Compile OK" : "Compile Failed"}
                  {compileResult.duration_ms > 0 && (
                    <span className="ml-auto flex items-center gap-1"><Clock size={10} />{compileResult.duration_ms}ms</span>
                  )}
                </div>
                <div>{compileResult.error || compileResult.output || "Done."}</div>
              </div>
            )}

            {/* Upload result */}
            {uploadResult && (
              <div className={`rounded border p-2 text-[11px] font-mono whitespace-pre-wrap break-all max-h-32 overflow-auto ${uploadResult.success ? "bg-green-600/5 border-green-600/30 text-green-400" : "bg-red-600/5 border-red-600/30 text-red-400"}`}>
                <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-wider opacity-70">
                  <Upload size={11} />
                  {uploadResult.success ? "Upload OK" : "Upload Failed"}
                  {uploadResult.duration_ms > 0 && (
                    <span className="ml-auto flex items-center gap-1"><Clock size={10} />{uploadResult.duration_ms}ms</span>
                  )}
                </div>
                <div>{uploadResult.error || uploadResult.output || "Done."}</div>
              </div>
            )}
          </>
        )}

        {/* ═══ LIBRARIES TAB ═══ */}
        {activeTab === "libraries" && (
          <>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Search Libraries</label>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Search arduino-cli libs..." value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchLibraries()}
                  className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent" />
                <button onClick={searchLibraries} className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-accent transition-colors">
                  <Search size={14} />
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-0.5 max-h-40 overflow-auto border border-border rounded divide-y divide-border">
                  {searchResults.map(lib => (
                    <div key={lib.name} className="flex items-center justify-between px-2 py-1.5 hover:bg-surface-hover">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-primary truncate">{lib.name}</div>
                        <div className="text-[9px] text-text-muted truncate">v{lib.version} — {lib.description || lib.author}</div>
                      </div>
                      <button onClick={() => installLibrary(lib.name)}
                        disabled={installing === lib.name || installedLibs.some(l => l.name === lib.name)}
                        className="ml-2 px-2 py-0.5 rounded text-[9px] font-medium bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                        {installing === lib.name ? "..." : installedLibs.some(l => l.name === lib.name) ? "✓" : "Install"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Installed */}
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Installed ({installedLibs.length})</span>
                <button onClick={refreshLibraries} className="p-1 rounded hover:bg-surface-hover text-text-muted"><RefreshCw size={11} /></button>
              </div>
              {installedLibs.length === 0 ? (
                <p className="text-[10px] text-text-muted px-1">No libraries installed</p>
              ) : (
                <div className="space-y-0.5">
                  {installedLibs.map(lib => (
                    <div key={lib.name} className="flex items-center justify-between px-2 py-1 rounded hover:bg-surface-hover group">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-text-primary">{lib.name}</div>
                        <div className="text-[9px] text-text-muted">v{lib.version} — {lib.author}</div>
                      </div>
                      <button onClick={() => removeLibrary(lib.name)}
                        className="p-1 rounded hover:bg-red-600/20 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
