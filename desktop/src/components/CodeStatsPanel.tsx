import { useAIActivityStore } from "@/stores/aiActivityStore";
import { useState, useEffect } from "react";
import { Clock, FileCode, GitBranch, Plus, Minus } from "lucide-react";

function useElapsed(startTime: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(timer);
  }, [startTime]);
  return elapsed;
}

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function CodeStatsPanel() {
  const { stats, isActive, getSessionSummary } = useAIActivityStore();
  const elapsed = useElapsed(stats.startTime);
  const summary = getSessionSummary();

  if (!isActive && stats.filesModified === 0) return null;

  return (
    <div className="code-stats-panel">
      {/* Current task */}
      <div className="code-stats-header">
        <GitBranch size={12} className="text-accent" />
        <span className="text-[11px] font-medium text-text-secondary">
          {stats.currentTask || "Idle"}
        </span>
      </div>

      <div className="code-stats-grid">
        <div className="code-stat">
          <FileCode size={12} className="text-text-muted" />
          <span className="code-stat-value">{summary.filesModified}</span>
          <span className="code-stat-label">files</span>
        </div>
        <div className="code-stat">
          <Plus size={12} className="text-green-400" />
          <span className="code-stat-value text-green-400">
            +{summary.linesAdded}
          </span>
          <span className="code-stat-label">added</span>
        </div>
        <div className="code-stat">
          <Minus size={12} className="text-red-400" />
          <span className="code-stat-value text-red-400">
            -{summary.linesRemoved}
          </span>
          <span className="code-stat-label">removed</span>
        </div>
        <div className="code-stat">
          <Clock size={12} className="text-text-muted" />
          <span className="code-stat-value">{formatElapsed(elapsed)}</span>
          <span className="code-stat-label">elapsed</span>
        </div>
      </div>
    </div>
  );
}
