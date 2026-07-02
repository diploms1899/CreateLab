import { useProjectStore } from "@/stores/projectStore";
import Sidebar from "@/components/Sidebar";
import EditorPanel from "@/components/EditorPanel";
import AIChatPanel from "@/components/AIChatPanel";

export default function WorkspaceView() {
  const { currentProject } = useProjectStore();

  if (!currentProject) return null;

  return (
    <div className="layout">
      <Sidebar project={currentProject} />
      <div className="main-content">
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col min-w-0">
            <EditorPanel />
          </div>
          <AIChatPanel project={currentProject} />
        </div>
      </div>
    </div>
  );
}
