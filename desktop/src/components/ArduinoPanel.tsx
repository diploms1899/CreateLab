import { useState, useEffect } from "react";
import { Play, Upload, Terminal, RefreshCw } from "lucide-react";
import { useArduinoStore } from "../stores/arduinoStore";

export default function ArduinoPanel() {
  const { boards, buildResult, compiling, uploading, detect, listBoards, compile, upload } = useArduinoStore();
  const [selectedBoard, setSelectedBoard] = useState("");
  const [sketchPath, setSketchPath] = useState("");

  useEffect(() => { listBoards(); }, []);

  const selected = boards.find((b) => b.fqbn === selectedBoard);

  return (
    <div className="arduino-panel">
      <div className="arduino-header">
        <h3>Arduino</h3>
        <button onClick={detect} title="Refresh boards"><RefreshCw size={16} /></button>
      </div>
      <select value={selectedBoard} onChange={(e) => setSelectedBoard(e.target.value)}>
        <option value="">Select board...</option>
        {boards.map((b) => (<option key={b.fqbn} value={b.fqbn}>{b.name}</option>))}
      </select>
      <div className="arduino-actions">
        <button onClick={() => compile(selectedBoard, sketchPath)} disabled={compiling || !selectedBoard}>
          <Play size={16} /> {compiling ? "Compiling..." : "Compile"}
        </button>
        <button onClick={() => upload(selectedBoard, selected?.port || "", sketchPath)} disabled={uploading || !selectedBoard || !selected?.port}>
          <Upload size={16} /> {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {buildResult && (
        <div className="arduino-output">
          <Terminal size={14} />
          <pre>{buildResult}</pre>
        </div>
      )}
    </div>
  );
}
