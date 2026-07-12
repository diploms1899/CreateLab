import { useState, useEffect } from "react";
import { useArduinoStore } from "../stores/arduinoStore";

interface Props {
  value: string;
  onChange: (fqbn: string) => void;
}

export default function BoardSelector({ value, onChange }: Props) {
  const { boards, listBoards } = useArduinoStore();

  useEffect(() => { listBoards(); }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="board-selector">
      <option value="">Select board...</option>
      {boards.map((b) => (
        <option key={b} value={b}>{b}</option>
      ))}
    </select>
  );
}
