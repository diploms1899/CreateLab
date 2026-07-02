/** Shows a preview of the AI context being sent. */
interface Props {
  projectName: string;
  fileCount: number;
  messageCount: number;
}

export default function ContextPreview({ projectName, fileCount, messageCount }: Props) {
  return (
    <div className="context-preview">
      <span className="context-badge">Project: {projectName}</span>
      <span className="context-badge">Files: {fileCount}</span>
      <span className="context-badge">History: {messageCount}</span>
    </div>
  );
}
