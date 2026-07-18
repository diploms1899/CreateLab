import { useEffect } from "react";
import { X, Command } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: { section: string; items: Shortcut[] }[] = [
  {
    section: "General",
    items: [
      { keys: ["Ctrl", "K"], description: "Toggle this shortcuts panel" },
      { keys: ["Ctrl", "P"], description: "Quick file search" },
      { keys: ["Ctrl", "S"], description: "Save current file" },
      { keys: ["Escape"], description: "Close panel / cancel" },
    ],
  },
  {
    section: "Editor",
    items: [
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
      { keys: ["Ctrl", "F"], description: "Find in file" },
      { keys: ["Ctrl", "H"], description: "Find and replace" },
      { keys: ["Alt", "↑/↓"], description: "Move line up/down" },
    ],
  },
  {
    section: "AI Chat",
    items: [
      { keys: ["Enter"], description: "Send message (focus in chat)" },
      { keys: ["Shift", "Enter"], description: "New line in message" },
      { keys: ["Ctrl", "L"], description: "Focus AI chat input" },
    ],
  },
  {
    section: "Hardware",
    items: [
      { keys: ["Ctrl", "Shift", "C"], description: "Compile sketch" },
      { keys: ["Ctrl", "Shift", "U"], description: "Upload to board" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Renders a keycap badge like `Ctrl` or `K` */
function KeyBadge({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded text-[10px] font-medium bg-surface border border-border text-text-secondary font-mono">
      {label}
    </kbd>
  );
}

export default function KeyboardShortcuts({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Command size={18} className="text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Shortcut sections */}
        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                {section.section}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <KeyBadge label={key} />
                          {j < item.keys.length - 1 && <span className="text-text-muted text-[10px]">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-border text-[10px] text-text-muted text-center">
          Press <KeyBadge label="Esc" /> or <KeyBadge label="Ctrl" /> <span className="text-text-muted">+</span> <KeyBadge label="K" /> to close
        </div>
      </div>
    </div>
  );
}
