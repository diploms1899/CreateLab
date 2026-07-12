import { useState, useEffect } from "react";
import { Play, Upload, Terminal, RefreshCw } from "lucide-react";
import { useArduinoStore } from "../stores/arduinoStore";

export default function ArduinoPanel() {
  const {
    boards, ports, compileResult, uploadResult, compiling, uploading,
    detect, listBoards, listPorts, compile, upload,
  } = useArduinoStore();
  const [selectedBoard, setSelectedBoard] = useState("");
  const [selectedPort, setSelectedPort] = useState("");

  useEffect(() => { listBoards(); listPorts(); }, []);

  return (
    <div className="arduino-panel">
      <div className="arduino-header">
        <h3>Arduino</h3>
        <button onClick={detect} title="Refresh boards"><RefreshCw size={16} /></button>
      </div>

      <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)}>
        <option value="">Select port...</option>
        {ports.map((p) => (<option key={p} value={p}>{p}</option>))}
      </select>

      <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
        <option value="">Select board...</option>
        {boards.map((b) => (<option key={b} value={b}>{b}</option>))}
      </select>

      <div className="arduino-actions">
        <button onClick={() => compile(selectedBoard)} disabled={compiling || !selectedBoard}>
          <Play size={16} /> {compiling ? "Compiling..." : "Compile"}
        </button>
        <button onClick={() => upload(selectedBoard, selectedPort)} disabled={uploading || !selectedBoard || !selectedPort}>
          <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {compileResult && (
        <div className={`arduino-output ${compileResult.success ? "text-green-400" : "text-red-400"}`}>
          <Terminal size={14} />
          <pre>{compileResult.error || compileResult.output || "Done."}</pre>
        </div>
      )}

      {uploadResult && (
        <div className={`arduino-output ${uploadResult.success ? "text-green-400" : "text-red-400"}`}>
          <Terminal size={14} />
          <pre>{uploadResult.error || uploadResult.output || "Done."}</pre>
        </div>
      )}
    </div>
  );
}
