import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Wifi, CheckCircle, XCircle, Loader2,
  Cpu, Palette, Settings2, Code, FolderOpen, Monitor, HardDrive
} from "lucide-react";

type SettingsTab = "ai" | "editor" | "hardware" | "theme" | "workspace";

interface TabDef { id: SettingsTab; icon: React.ReactNode; label: string; }

const TABS: TabDef[] = [
  { id: "ai", icon: <Wifi size={14} />, label: "AI" },
  { id: "editor", icon: <Code size={14} />, label: "Editor" },
  { id: "hardware", icon: <Cpu size={14} />, label: "Hardware" },
  { id: "theme", icon: <Palette size={14} />, label: "Theme" },
  { id: "workspace", icon: <FolderOpen size={14} />, label: "Workspace" },
];

export default function SettingsView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("ai");

  // AI
  const [apiKey, setApiKey] = useState(localStorage.getItem("deepseek_api_key") || "");
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem("deepseek_base_url") || "https://api.deepseek.com");
  const [model, setModel] = useState(localStorage.getItem("deepseek_model") || "deepseek-chat");
  const [temperature, setTemperature] = useState(Number(localStorage.getItem("deepseek_temperature") || "0.7"));
  const [maxTokens, setMaxTokens] = useState(Number(localStorage.getItem("deepseek_max_tokens") || "4096"));
  const [testResult, setTestResult] = useState<"idle" | "testing" | "success" | "fail">("idle");
  const [saved, setSaved] = useState(false);

  // Editor
  const [fontSize, setFontSize] = useState(Number(localStorage.getItem("editor_fontSize") || "14"));
  const [tabSize, setTabSize] = useState(Number(localStorage.getItem("editor_tabSize") || "2"));
  const [minimap, setMinimap] = useState(localStorage.getItem("editor_minimap") !== "false");
  const [lineNumbers, setLineNumbers] = useState(localStorage.getItem("editor_lineNumbers") !== "false");
  const [wordWrap, setWordWrap] = useState(localStorage.getItem("editor_wordWrap") !== "false");
  const [formatOnSave, setFormatOnSave] = useState(localStorage.getItem("editor_formatOnSave") === "true");

  // Hardware
  const [arduinoPath, setArduinoPath] = useState(localStorage.getItem("arduino_cli_path") || "arduino-cli");

  // Theme
  const themes = ["Dark", "Light", "OLED", "Synthwave", "Cyberpunk", "Ocean", "Forest", "Nord", "Dracula", "Monokai", "One Dark", "GitHub Dark", "Catppuccin", "Tokyo Night"];
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem("theme") || "Dark");

  // Workspace
  const [workspaceRoot, setWorkspaceRoot] = useState(localStorage.getItem("workspace_root") || "~/Documents/CreateLab");

  const handleTestConnection = async () => {
    setTestResult("testing");
    try {
      const res = await fetch(`${baseUrl}/v1/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
      setTestResult(res.ok ? "success" : "fail");
    } catch { setTestResult("fail"); }
  };

  const handleSaveAll = () => {
    localStorage.setItem("deepseek_api_key", apiKey);
    localStorage.setItem("deepseek_base_url", baseUrl);
    localStorage.setItem("deepseek_model", model);
    localStorage.setItem("deepseek_temperature", String(temperature));
    localStorage.setItem("deepseek_max_tokens", String(maxTokens));
    localStorage.setItem("editor_fontSize", String(fontSize));
    localStorage.setItem("editor_tabSize", String(tabSize));
    localStorage.setItem("editor_minimap", String(minimap));
    localStorage.setItem("editor_lineNumbers", String(lineNumbers));
    localStorage.setItem("editor_wordWrap", String(wordWrap));
    localStorage.setItem("editor_formatOnSave", String(formatOnSave));
    localStorage.setItem("arduino_cli_path", arduinoPath);
    localStorage.setItem("theme", activeTheme);
    localStorage.setItem("workspace_root", workspaceRoot);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-surface">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <div className="flex-1" />
        <button onClick={() => navigate("/repo-health")}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-accent hover:bg-surface-hover rounded transition-colors border border-border mr-2">
          <HardDrive size={14} /> Repo Health
        </button>
        <button onClick={handleSaveAll}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-all ${saved ? "bg-green-600 text-white" : "bg-accent text-white hover:opacity-90"}`}>
          {saved ? <><CheckCircle size={16} /> Saved</> : <><Save size={16} /> Save All</>}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Side tabs */}
        <div className="w-44 border-r border-border bg-surface flex flex-col py-2">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${activeTab === tab.id ? "bg-accent/10 text-accent border-r-2 border-accent" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-xl space-y-6">

            {/* ═══ AI ═══ */}
            {activeTab === "ai" && (<>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">AI Configuration</h2>

              {/* API Settings */}
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Connection</h3>
                <div><label className="block text-xs text-text-muted mb-1">DeepSeek API Key</label>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent font-mono" placeholder="sk-..." /></div>
                <div><label className="block text-xs text-text-muted mb-1">Base URL</label>
                  <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent font-mono" /></div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Model</label>
                  <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                    <option value="deepseek-chat">DeepSeek V3 (deepseek-chat)</option>
                    <option value="deepseek-reasoner">DeepSeek R1 (deepseek-reasoner)</option>
                    <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
                    <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-text-muted mb-1">Temperature ({temperature.toFixed(1)})</label>
                    <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-full accent-accent" />
                    <div className="flex justify-between text-[9px] text-text-muted mt-0.5"><span>Precise</span><span>Creative</span></div>
                  </div>
                  <div><label className="block text-xs text-text-muted mb-1">Max Tokens</label>
                    <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
                  </div>
                </div>
                <button onClick={handleTestConnection} disabled={testResult === "testing" || !apiKey}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${testResult === "testing" ? "bg-surface-hover text-text-muted" : testResult === "success" ? "bg-green-600/20 text-green-400 border border-green-600/30" : testResult === "fail" ? "bg-red-600/20 text-red-400 border border-red-600/30" : "bg-surface-hover text-text-primary hover:bg-border border border-border"}`}>
                  {testResult === "testing" ? <Loader2 size={16} className="animate-spin" /> : testResult === "success" ? <><CheckCircle size={16} /> Connected — API key valid</> : testResult === "fail" ? <><XCircle size={16} /> Connection failed — check key and URL</> : <><Wifi size={16} /> Test Connection</>}
                </button>
              </div>

              {/* Agent Behavior */}
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Agent Behavior</h3>
                <div>
                  <label className="block text-xs text-text-muted mb-2">Personality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "friendly", label: "Friendly", desc: "Encouraging, chatty" },
                      { id: "balanced", label: "Balanced", desc: "Helpful, concise" },
                      { id: "technical", label: "Technical", desc: "Direct, code-first" },
                    ].map(p => (
                      <button key={p.id} onClick={() => localStorage.setItem("ai_personality", p.id)}
                        className={`px-3 py-2 rounded-lg text-xs border transition-colors text-left ${(localStorage.getItem("ai_personality") || "balanced") === p.id ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-primary hover:border-text-muted"}`}>
                        <div className="font-medium">{p.label}</div>
                        <div className="text-[10px] opacity-70">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-2">Agent Mode</label>
                  <div className="space-y-2">
                    {[
                      { id: "plan", label: "Plan before coding", desc: "AI outlines a plan before writing code", default: true },
                      { id: "suggestions", label: "Show suggestion chips", desc: "Display quick-action buttons in chat", default: true },
                      { id: "autoScroll", label: "Auto-scroll to latest", desc: "Automatically scroll to new messages", default: true },
                    ].map(opt => {
                      const key = `ai_option_${opt.id}`;
                      const stored = localStorage.getItem(key);
                      const checked = stored === null ? opt.default : stored === "true";
                      return (
                        <label key={opt.id} className="flex items-start gap-3 cursor-pointer py-1">
                          <input type="checkbox" checked={checked} onChange={e => localStorage.setItem(key, String(e.target.checked))} className="mt-0.5 accent-accent w-4 h-4" />
                          <div>
                            <div className="text-sm text-text-primary">{opt.label}</div>
                            <div className="text-[10px] text-text-muted">{opt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Usage */}
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Usage & Limits</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-surface-alt rounded-lg p-3 border border-border">
                    <div className="text-text-muted text-xs mb-0.5">Requests today</div>
                    <div className="text-text-primary font-mono">—</div>
                  </div>
                  <div className="bg-surface-alt rounded-lg p-3 border border-border">
                    <div className="text-text-muted text-xs mb-0.5">Tokens used</div>
                    <div className="text-text-primary font-mono">—</div>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted">Usage tracking requires server-side implementation.</p>
              </div>
            </>)}

            {/* ═══ Editor ═══ */}
            {activeTab === "editor" && (<>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Editor</h2>
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-text-muted mb-1">Font Size</label>
                    <input type="number" min={10} max={32} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" /></div>
                  <div><label className="block text-xs text-text-muted mb-1">Tab Size</label>
                    <input type="number" min={1} max={8} value={tabSize} onChange={e => setTabSize(Number(e.target.value))} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" /></div>
                </div>
                <div className="space-y-3">
                  {[
                    [minimap, setMinimap, "Minimap"],
                    [lineNumbers, setLineNumbers, "Line Numbers"],
                    [wordWrap, setWordWrap, "Word Wrap"],
                    [formatOnSave, setFormatOnSave, "Format on Save"],
                  ].map(([val, setter, label]) => (
                    <label key={label as string} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-text-primary">{label as string}</span>
                      <input type="checkbox" checked={val as boolean} onChange={e => (setter as Function)(e.target.checked)} className="accent-accent w-4 h-4" />
                    </label>
                  ))}
                </div>
              </div>
            </>)}

            {/* ═══ Hardware ═══ */}
            {activeTab === "hardware" && (<>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Hardware</h2>
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <div><label className="block text-xs text-text-muted mb-1">Arduino CLI Path</label>
                  <input type="text" value={arduinoPath} onChange={e => setArduinoPath(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" /></div>
                <p className="text-xs text-text-muted">Download from <a href="https://arduino.github.io/arduino-cli/installation/" target="_blank" rel="noreferrer" className="text-accent hover:underline">arduino.github.io/arduino-cli</a></p>
              </div>
            </>)}

            {/* ═══ Theme ═══ */}
            {activeTab === "theme" && (<>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Theme</h2>
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <div className="grid grid-cols-2 gap-2">
                  {themes.map(t => (
                    <button key={t} onClick={() => setActiveTheme(t)}
                      className={`px-3 py-2 rounded text-sm text-left border transition-colors ${activeTheme === t ? "border-accent bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text-primary hover:border-text-muted"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>)}

            {/* ═══ Workspace ═══ */}
            {activeTab === "workspace" && (<>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Workspace</h2>
              <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                <div><label className="block text-xs text-text-muted mb-1">Workspace Root</label>
                  <input type="text" value={workspaceRoot} onChange={e => setWorkspaceRoot(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" /></div>
                <p className="text-xs text-text-muted">Projects are stored in subdirectories under this folder.</p>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}
