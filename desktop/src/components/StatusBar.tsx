import { useAuthStore } from "../stores/authStore";
import { useSyncStore } from "../stores/syncStore";

export default function StatusBar() {
  const user = useAuthStore((s) => s.user);
  const syncStatus = useSyncStore((s) => s.status);

  return (
    <div className="status-bar">
      <div className="status-left">
        {syncStatus === "synced" && <span className="status-indicator green">● Synced</span>}
        {syncStatus === "syncing" && <span className="status-indicator yellow">◌ Syncing...</span>}
        {syncStatus === "offline" && <span className="status-indicator red">○ Offline</span>}
        {syncStatus === "idle" && <span className="status-indicator dim">● Ready</span>}
      </div>
      <div className="status-right">
        {user && <span>{user.displayName} ({user.role})</span>}
      </div>
    </div>
  );
}
