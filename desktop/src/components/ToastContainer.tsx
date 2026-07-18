import { useToastStore } from "@/stores/toastStore";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const iconMap = {
  success: <CheckCircle size={16} className="text-green-400" />,
  error: <XCircle size={16} className="text-red-400" />,
  info: <Info size={16} className="text-blue-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
};

const bgMap = {
  success: "border-green-600/30 bg-green-600/5",
  error: "border-red-600/30 bg-red-600/5",
  info: "border-blue-600/30 bg-blue-600/5",
  warning: "border-yellow-600/30 bg-yellow-600/5",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg fade-in ${bgMap[t.type]}`}
        >
          {iconMap[t.type]}
          <span className="flex-1 text-xs text-text-primary">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="p-0.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
