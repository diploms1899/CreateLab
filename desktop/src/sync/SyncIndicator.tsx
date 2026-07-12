import { useSyncStore } from "../stores/syncStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";

export default function SyncIndicator() {
  const { status, syncNow } = useSyncStore((s) => s);
  const activeId = useWorkspaceStore((s) => s.activeId);

  const icon = {
    idle: <Cloud size={16} />,
    syncing: <RefreshCw className="animate-spin" size={16} />,
    synced: <Check size={16} />,
    offline: <CloudOff size={16} />,
    error: <CloudOff size={16} />,
  }[status];

  return (
    <button
      className="sync-indicator"
      onClick={() => activeId && syncNow(activeId)}
      title={`Sync status: ${status}`}
    >
      {icon}
    </button>
  );
}
