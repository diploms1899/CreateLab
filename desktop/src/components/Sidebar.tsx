import { useState } from "react";
import { Project } from "@/stores/projectStore";
import {
  FileCode,
  FolderOpen,
  BookOpen,
  Settings,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
} from "lucide-react";

interface SidebarProps {
  project: Project;
}

type Tab = "files" | "docs" | "boards" | "settings";

export default function Sidebar({ project }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("files");
  const [connected, setConnected] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "files", label: "Files", icon: <FileCode size={16} /> },
    { id: "docs", label: "Docs", icon: <BookOpen size={16} /> },
    { id: "boards", label: "Boards", icon: <Cpu size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Project info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary truncate">
            {project.name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-400" : "bg-text-muted"
            }`}
          />
          <span className="text-xs text-text-muted">
            {connected ? "Server connected" : "Offline mode"}
          </span>
          {!connected && (
            <WifiOff size={12} className="text-text-muted" />
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
              activeTab === tab.id
                ? "text-accent border-b-2 border-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "files" && (
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 px-1">
              Project Files
            </p>
            <FileItem name="main.ino" type="ino" />
            <FileItem name="config.h" type="h" />
            <FileItem name="display.h" type="h" />
            <FileItem name="display.cpp" type="cpp" />
            <FileItem name="game.cpp" type="cpp" />
            <FileItem name="game.h" type="h" />
            <FileItem name="README.md" type="md" />
            <div className="mt-4">
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 px-1">
                Libraries
              </p>
              <FileItem name="U8g2" type="lib" />
              <FileItem name="Adafruit_SSD1306" type="lib" />
              <FileItem name="Adafruit_GFX" type="lib" />
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 px-1">
              Documentation
            </p>
            <DocItem name="Getting Started" />
            <DocItem name="Hardware Guide" />
            <DocItem name="API Reference" />
            <DocItem name="Troubleshooting" />
            <DocItem name={`${project.name} Guide`} />
          </div>
        )}

        {activeTab === "boards" && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 px-1">
              Connected Devices
            </p>
            <div className="bg-surface-hover/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Cpu size={14} className="text-accent" />
                <span className="text-sm text-text-primary">ESP32 DevKit</span>
              </div>
              <p className="text-xs text-text-muted">Port: /dev/ttyUSB0</p>
              <div className="flex gap-2 mt-2">
                <button className="text-xs bg-accent text-white px-3 py-1 rounded hover:bg-accent-hover transition-colors">
                  Compile
                </button>
                <button className="text-xs bg-surface-hover text-text-secondary px-3 py-1 rounded border border-border hover:text-text-primary transition-colors">
                  Upload
                </button>
              </div>
            </div>

            <div className="bg-surface-hover/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive size={14} className="text-text-muted" />
                <span className="text-sm text-text-secondary">No device</span>
              </div>
              <p className="text-xs text-text-muted">Click to scan ports</p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-3 px-1">
              Project Settings
            </p>
            <SettingRow label="Board" value="ESP32 Dev Module" />
            <SettingRow label="Flash Size" value="4MB" />
            <SettingRow label="Partition" value="Default" />
            <SettingRow label="CPU Freq" value="240MHz" />
            <SettingRow label="Upload Speed" value="921600" />
            <SettingRow label="Debug Level" value="None" />
          </div>
        )}
      </div>
    </aside>
  );
}

function FileItem({ name, type }: { name: string; type: string }) {
  const colors: Record<string, string> = {
    ino: "text-blue-400",
    h: "text-orange-400",
    cpp: "text-purple-400",
    md: "text-text-muted",
    lib: "text-yellow-400",
  };

  return (
    <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors text-left">
      <FileCode size={14} className={colors[type] || "text-text-muted"} />
      <span className="truncate">{name}</span>
    </button>
  );
}

function DocItem({ name }: { name: string }) {
  return (
    <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors text-left">
      <BookOpen size={14} className="text-text-muted" />
      <span className="truncate">{name}</span>
    </button>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-surface-hover/30">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs text-text-secondary">{value}</span>
    </div>
  );
}
