import { useState, useEffect, useCallback } from "react";
import { Terminal, Trash2 } from "lucide-react";

interface SerialMonitorProps {
  port?: string;
  baudRate?: number;
}

export default function SerialMonitor({ port, baudRate = 115200 }: SerialMonitorProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  const connectSerial = useCallback(async () => {
    if (!port) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      // Start serial monitor — in a full implementation this would use
      // Tauri events or a streaming command to receive data asynchronously
      const data: string = await invoke("serial_monitor", { port, baudRate });
      if (data) {
        setLines(prev => [...prev, ...data.split("\n").filter(Boolean)]);
      }
      setConnected(true);
    } catch {
      setLines(prev => [...prev, `[Serial] Could not connect to ${port}`]);
      setConnected(false);
    }
  }, [port, baudRate]);

  useEffect(() => {
    if (port) {
      connectSerial();
    }
  }, [port, connectSerial]);

  return (
    <div className="serial-monitor">
      <div className="serial-monitor-header">
        <Terminal size={14} /> Serial Monitor
        {port && <span className="text-[10px] text-text-muted ml-2">{port} @ {baudRate}</span>}
        {connected && <span className="text-[10px] text-green-500 ml-2">● Connected</span>}
        <button onClick={() => setLines([])}><Trash2 size={14} /></button>
      </div>
      <div className="serial-monitor-output">
        {lines.map((line, i) => <div key={i}>{line}</div>)}
        {lines.length === 0 && <span className="serial-empty">No data</span>}
      </div>
    </div>
  );
}
