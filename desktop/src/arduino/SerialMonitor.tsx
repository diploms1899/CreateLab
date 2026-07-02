import { useState } from "react";
import { Terminal, Trash2 } from "lucide-react";

export default function SerialMonitor() {
  const [lines, setLines] = useState<string[]>([]);

  return (
    <div className="serial-monitor">
      <div className="serial-monitor-header">
        <Terminal size={14} /> Serial Monitor
        <button onClick={() => setLines([])}><Trash2 size={14} /></button>
      </div>
      <div className="serial-monitor-output">
        {lines.map((line, i) => <div key={i}>{line}</div>)}
        {lines.length === 0 && <span className="serial-empty">No data</span>}
      </div>
    </div>
  );
}
