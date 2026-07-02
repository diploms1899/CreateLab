import { Check, X, FileDiff } from "lucide-react";

interface Props {
  fileName: string;
  originalContent: string;
  proposedContent: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffPreview({ fileName, originalContent, proposedContent, onAccept, onReject }: Props) {
  const orig = originalContent.split("\n");
  const prop = proposedContent.split("\n");
  const maxLen = Math.max(orig.length, prop.length);
  const lines: { type: "same" | "added" | "removed"; text: string }[] = [];

  for (let i = 0; i < maxLen; i++) {
    const o = orig[i] ?? null;
    const p = prop[i] ?? null;
    if (o === p) { if (o !== null) lines.push({ type: "same", text: o }); }
    else {
      if (o !== null) lines.push({ type: "removed", text: o });
      if (p !== null) lines.push({ type: "added", text: p });
    }
  }

  return (
    <div className="diff-preview">
      <div className="diff-header">
        <FileDiff size={18} />
        <span className="diff-filename">{fileName}</span>
        <div className="diff-actions">
          <button className="diff-accept" onClick={onAccept}><Check size={16} /> Apply</button>
          <button className="diff-reject" onClick={onReject}><X size={16} /> Discard</button>
        </div>
      </div>
      <div className="diff-content">
        {lines.map((line, i) => (
          <div key={i} className={`diff-line ${line.type}`}>
            <span className="diff-marker">{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
            <span className="diff-text">{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
