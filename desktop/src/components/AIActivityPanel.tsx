import { useEffect, useRef } from "react";
import { useAIActivityStore } from "@/stores/aiActivityStore";
import {
  FileCode,
  Search,
  FolderSearch,
  Pencil,
  Terminal,
  FilePlus,
  Trash2,
  GitBranch,
  Paintbrush,
  Brain,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  reading: <FileCode size={12} />,
  writing: <Pencil size={12} />,
  searching: <Search size={12} />,
  thinking: <Brain size={12} />,
  planning: <GitBranch size={12} />,
  compiling: <Terminal size={12} />,
  formatting: <Paintbrush size={12} />,
  creating: <FilePlus size={12} />,
  deleting: <Trash2 size={12} />,
  renaming: <Pencil size={12} />,
  navigating: <FolderSearch size={12} />,
};

const TYPE_LABELS: Record<string, string> = {
  reading: "Reading",
  writing: "Editing",
  searching: "Searching",
  thinking: "Analyzing",
  planning: "Planning",
  compiling: "Compiling",
  formatting: "Formatting",
  creating: "Creating",
  deleting: "Deleting",
  renaming: "Renaming",
  navigating: "Navigating",
};

export default function AIActivityPanel() {
  const { activities, isActive, phase, editQueue } = useAIActivityStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activities]);

  const visible = activities.slice(-20);

  return (
    <div className="ai-activity-panel">
      <div className="ai-activity-header">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Loader2 size={12} className="animate-spin text-accent" />
          ) : (
            <CheckCircle2 size={12} className="text-green-400" />
          )}
          <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
            AI Activity
          </span>
        </div>
        {isActive && (
          <span className="text-[10px] text-accent">{phase}</span>
        )}
      </div>

      <div className="ai-activity-stream" ref={scrollRef}>
        {visible.length === 0 && (
          <p className="text-[11px] text-text-muted text-center py-4 px-2">
            AI activity will appear here
          </p>
        )}
        {visible.map((a) => (
          <div key={a.id} className="ai-activity-row fade-in">
            <span className={`activity-icon type-${a.type}`}>
              {TYPE_ICONS[a.type] ?? <Brain size={12} />}
            </span>
            <div className="activity-detail">
              <span className="activity-label">
                {TYPE_LABELS[a.type] ?? "Working"}
              </span>
              <span className="activity-file">{a.file ?? a.action}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit queue */}
      {editQueue.length > 0 && (
        <div className="ai-edit-queue">
          <div className="text-[10px] text-text-muted uppercase tracking-wider px-3 py-1.5 font-medium">
            Edit Queue
          </div>
          {editQueue.map((q) => (
            <div
              key={q.file}
              className={`edit-queue-item status-${q.status}`}
            >
              <span className="edit-queue-icon">
                {q.status === "done" ? (
                  <CheckCircle2 size={12} className="text-green-400" />
                ) : q.status === "editing" ? (
                  <Loader2 size={12} className="animate-spin text-accent" />
                ) : q.status === "error" ? (
                  <span className="text-red-400">✕</span>
                ) : (
                  <span className="text-text-muted">•</span>
                )}
              </span>
              <span className="text-[11px] truncate">{q.file}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
