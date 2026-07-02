import { Save, Undo2, Redo2, Search } from "lucide-react";

interface Props {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSearch: () => void;
  fileName?: string;
  dirty?: boolean;
}

export default function EditorToolbar({ onSave, onUndo, onRedo, onSearch, fileName, dirty }: Props) {
  return (
    <div className="editor-toolbar">
      <span className="editor-filename">
        {fileName || "Untitled"}{dirty ? " ●" : ""}
      </span>
      <div className="editor-toolbar-actions">
        <button onClick={onSave} title="Save (Ctrl+S)"><Save size={16} /></button>
        <button onClick={onUndo} title="Undo"><Undo2 size={16} /></button>
        <button onClick={onRedo} title="Redo"><Redo2 size={16} /></button>
        <button onClick={onSearch} title="Search"><Search size={16} /></button>
      </div>
    </div>
  );
}
