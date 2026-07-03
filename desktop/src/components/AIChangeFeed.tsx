import { useEffect, useState } from "react";
import { useAIActivityStore, AIChangeNotification } from "@/stores/aiActivityStore";
import { useEditorStore } from "@/stores/editorStore";
import { FileCode, Plus, Minus, X } from "lucide-react";

export default function AIChangeFeed() {
  const { changeNotifications, markNotificationSeen } = useAIActivityStore();
  const { openFile } = useEditorStore();
  const [visible, setVisible] = useState<AIChangeNotification[]>([]);

  useEffect(() => {
    // Show newest 5 unseen
    const unseen = changeNotifications.filter((n) => !n.seen).slice(0, 5);
    setVisible(unseen);

    // Auto-dismiss after 6 seconds
    if (unseen.length > 0) {
      const timer = setTimeout(() => {
        unseen.forEach((n) => markNotificationSeen(n.id));
        setVisible([]);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [changeNotifications, markNotificationSeen]);

  if (visible.length === 0) return null;

  return (
    <div className="ai-change-feed">
      {visible.map((notif) => (
        <div
          key={notif.id}
          className="change-notification fade-in"
          onClick={() => {
            if (notif.file) openFile(notif.file);
            markNotificationSeen(notif.id);
          }}
        >
          <div className="change-notif-icon">
            <FileCode size={13} />
          </div>
          <div className="change-notif-body">
            <span className="change-notif-summary">{notif.summary}</span>
            {notif.file && (
              <span className="change-notif-file">{notif.file}</span>
            )}
            <div className="change-notif-stats">
              {notif.linesAdded !== undefined && notif.linesAdded > 0 && (
                <span className="stat-added">
                  <Plus size={10} /> {notif.linesAdded}
                </span>
              )}
              {notif.linesRemoved !== undefined && notif.linesRemoved > 0 && (
                <span className="stat-removed">
                  <Minus size={10} /> {notif.linesRemoved}
                </span>
              )}
            </div>
          </div>
          <button
            className="change-notif-close"
            onClick={(e) => {
              e.stopPropagation();
              markNotificationSeen(notif.id);
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
