import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Trash2, HardDrive, GitBranch, CheckCircle, AlertTriangle,
  RotateCcw, Database, FolderOpen, Terminal, RefreshCw, XCircle
} from "lucide-react";

interface DirSize { name: string; size_bytes: number; human: string; category: "cache" | "source" | "unknown"; }
interface HealthReport { repo_size_human: string; source_count: number; ignored_dirs: DirSize[]; clean: boolean; };

async function scanRepo(): Promise<HealthReport> {
  try {
    return await invoke<HealthReport>("scan_repo_health");
  } catch {
    // fallback: client-side estimate
    return { repo_size_human: "?", source_count: 0, ignored_dirs: [], clean: false };
  }
}

export default function RepoHealthPanel() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await scanRepo();
    setReport(r);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const runCmd = async (label: string, cmd: string[]) => {
    setCleaning(label);
    try {
      await invoke("run_shell_cmd", { cmd });
      setMsg(`${label} complete`);
    } catch (e) { setMsg(`Failed: ${e}`); }
    setCleaning(null);
    setTimeout(refresh, 500);
  };

  const totalIgnored = report?.ignored_dirs.reduce((s, d) => s + d.size_bytes, 0) ?? 0;

  return (
    <div className="h-full flex flex-col bg-surface-dark">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-surface">
        <HardDrive size={18} className="text-accent" />
        <h1 className="text-lg font-semibold text-text-primary">Repository Health</h1>
        <div className="flex-1" />
        <button onClick={refresh} disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary rounded hover:bg-surface-hover transition-colors">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl space-y-6">

          {/* Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface rounded-lg p-4 border border-border">
              <div className="text-xs text-text-muted mb-1">Tracked Files</div>
              <div className="text-2xl font-bold text-text-primary">{report?.source_count ?? "—"}</div>
              <div className="text-[10px] text-text-muted mt-1">source code only</div>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <div className="text-xs text-text-muted mb-1">Ignored Size</div>
              <div className="text-2xl font-bold text-accent">{totalIgnored > 0 ? `${(totalIgnored / 1e9).toFixed(1)} GB` : "—"}</div>
              <div className="text-[10px] text-text-muted mt-1">build caches excluded</div>
            </div>
            <div className="bg-surface rounded-lg p-4 border border-border">
              <div className="text-xs text-text-muted mb-1">Git Status</div>
              <div className="flex items-center gap-2 mt-1">
                {report?.clean ? (
                  <><CheckCircle size={20} className="text-green-400" /><span className="text-lg font-bold text-green-400">Clean</span></>
                ) : (
                  <><AlertTriangle size={20} className="text-amber-400" /><span className="text-lg font-bold text-amber-400">Dirty</span></>
                )}
              </div>
            </div>
          </div>

          {/* Build Artifacts */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Build Artifacts</h2>
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
              {report?.ignored_dirs.length === 0 ? (
                <div className="p-6 text-center text-text-muted text-sm">No build artifacts found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-surface-dark border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs text-text-muted font-medium">Directory</th>
                      <th className="text-right px-4 py-2 text-xs text-text-muted font-medium">Size</th>
                      <th className="text-right px-4 py-2 text-xs text-text-muted font-medium">Type</th>
                      <th className="text-right px-4 py-2 text-xs text-text-muted font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.ignored_dirs.map(d => (
                      <tr key={d.name} className="border-b border-border/50 hover:bg-surface-hover/30">
                        <td className="px-4 py-2.5 text-text-primary font-mono text-xs">{d.name}</td>
                        <td className="px-4 py-2.5 text-right text-text-muted">{d.human}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.category === "cache" ? "bg-amber-400/10 text-amber-400" : "bg-surface-dark text-text-muted"}`}>
                            {d.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => {
                            if (d.name.includes("target")) runCmd("cargo clean", ["cargo", "clean"]);
                            else if (d.name.includes("node_modules")) runCmd("npm clean", ["rm", "-rf", "node_modules"]);
                            else if (d.name.includes(".venv")) runCmd("venv clean", ["rm", "-rf", ".venv"]);
                          }}
                            className="p-1 rounded hover:bg-red-600/20 text-text-muted hover:text-red-400 transition-colors"
                            title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* One-Click Cleanup */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">One-Click Cleanup</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Cargo Clean", Terminal, "cargo clean", ["cargo", "clean"]],
                ["npm Clean", Package, "npm clean", ["rm", "-rf", "desktop/node_modules"]],
                ["Python Clean", Database, "pycache clean", ["find", ".", "-type", "d", "-name", "__pycache__", "-exec", "rm", "-rf", "{}", "+"]],
              ].map(([label, Icon, _, cmd]) => (
                <button key={label as string} onClick={() => runCmd(label as string, cmd as string[])}
                  disabled={cleaning !== null}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border bg-surface hover:bg-surface-hover transition-colors disabled:opacity-40">
                  <Icon size={16} className="text-text-muted" />
                  <span className="text-sm text-text-primary">{label as string}</span>
                  {cleaning === label && <RefreshCw size={14} className="animate-spin text-accent" />}
                </button>
              ))}
            </div>
            {msg && (
              <div className="mt-3 flex items-center gap-2 px-4 py-2 rounded bg-accent/10 border border-accent/30 text-sm text-accent">
                <CheckCircle size={14} /> {msg}
              </div>
            )}
          </div>

          {/* Git Info */}
          <div>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Git</h2>
            <div className="bg-surface rounded-lg p-4 border border-border space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <GitBranch size={14} className="text-text-muted" />
                <span className="text-text-muted">Remote:</span>
                <span className="text-text-primary font-mono text-xs">github.com/nekaas/CreateLab</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FolderOpen size={14} className="text-text-muted" />
                <span className="text-text-muted">Clone size (source only):</span>
                <span className="text-text-primary font-mono text-xs">~800 KB</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <RotateCcw size={14} className="text-text-muted" />
                <span className="text-text-muted">Reproduce:</span>
                <code className="text-xs text-accent bg-surface-dark px-2 py-0.5 rounded">git clone + npm install + pip install -r requirements.txt</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// local icon since we may not have Package in lucide
function Package({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
