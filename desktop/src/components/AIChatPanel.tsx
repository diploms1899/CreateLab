import { useState, useRef, useEffect, useCallback } from "react";
import { Project } from "@/stores/projectStore";
import { useArduinoStore, CompileResult, UploadResult } from "@/stores/arduinoStore";
import { useAIActivityStore } from "@/stores/aiActivityStore";
import { useEditorStore } from "@/stores/editorStore";
import {
  Send, Bot, User, Loader2, FileCode, Check,
  Trash2, Copy, CheckCheck, Sparkles, Lightbulb, Bug, Code2,
  Terminal, Play, Upload, Cpu, AlertTriangle, Brain, ChevronDown, ChevronRight
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  patches?: CodePatch[];
  toolCall?: { tool: string; result?: CompileResult | UploadResult | string };
  /** Chain-of-thought reasoning from the AI (shown as thinking steps) */
  reasoning?: string;
}

interface CodePatch {
  filePath: string;
  newContent: string;
}

interface AIChatPanelProps {
  project: Project;
  workspaceId: string;
  files: Record<string, string>;
  onApplyPatch: (filePath: string, content: string) => void;
}

const WELCOME_MESSAGES: Record<string, string> = {
  platformer:
    "Hey there! Ready to build a retro platformer? I'm your game dev mentor. Let's make something awesome with tight physics, pixel art, and chiptune sounds. What would you like to start with?",
  fishing:
    "Welcome, young fisher! Ready to build a peaceful fishing simulation? We'll create dynamic water, craft fish AI, and design a serene world together. What aspect shall we work on first?",
  robotics:
    "Good day. I'm your embedded systems engineer. We'll build precise, reliable control systems for your robot. Let's start with the architecture — what subsystem shall we design?",
  calculator:
    "Hello! I'm your math professor for this project. Let's build a proper scientific calculator — expression parsing, graphing, the works. Shall we start with the Shunting Yard algorithm?",
};

const SUGGESTIONS_BY_SLUG: Record<string, string[]> = {
  platformer: ["How do I set up the OLED display?", "Add player movement with buttons", "Implement gravity and jumping", "Add enemy AI", "Create a scoring system"],
  fishing: ["How do I set up the display?", "Create the fishing rod mechanic", "Add fish swimming AI", "Implement day/night cycle", "Add a catch collection system"],
  robotics: ["How do I wire the MPU6050?", "Read sensor data from accelerometer", "Control a servo motor", "Implement PID control", "Create a self-balancing routine"],
  calculator: ["How do I set up the keypad?", "Parse mathematical expressions", "Add a graphing function", "Implement scientific functions", "Create the UI layout"],
};

function parseCodePatches(content: string): CodePatch[] {
  const patches: CodePatch[] = [];

  // Full file replacements: ### FILE: path\n```cpp\n...\n```
  const fileRegex = /###\s*FILE:\s*(\S+)\s*\n```\w*\n([\s\S]*?)```/g;
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    patches.push({ filePath: match[1], newContent: match[2].trimEnd() + "\n" });
  }

  return patches;
}

/** Parse unified diff blocks and return patches with the merged content */
function parseDiffPatches(content: string, existingFiles: Record<string, string>): CodePatch[] {
  const patches: CodePatch[] = [];
  const diffRegex = /###\s*DIFF:\s*(\S+)\s*\n```diff\n([\s\S]*?)```/g;
  let match;

  while ((match = diffRegex.exec(content)) !== null) {
    const filePath = match[1];
    const diffContent = match[2];
    const existing = existingFiles[filePath] || "";
    const merged = applyUnifiedDiff(existing, diffContent);
    if (merged !== null) {
      patches.push({ filePath, newContent: merged });
    }
  }

  return patches;
}

/** Apply a simple unified diff patch to existing content. Returns null if patch is invalid. */
function applyUnifiedDiff(original: string, diff: string): string | null {
  const originalLines = original.split("\n");
  const result: string[] = [];
  let origIdx = 0;

  // Parse hunk headers: @@ -start,count +start,count @@
  const hunkRegex = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;
  const diffLines = diff.split("\n");
  let inHunk = false;
  let hunkOrigStart = 0, hunkOrigCount = 0;

  for (let i = 0; i < diffLines.length; i++) {
    const line = diffLines[i];

    if (line.startsWith("@@")) {
      const hunkMatch = line.match(hunkRegex);
      if (hunkMatch) {
        // Flush lines before hunk start
        while (origIdx < parseInt(hunkMatch[1]) - 1) {
          if (origIdx < originalLines.length) result.push(originalLines[origIdx]);
          origIdx++;
        }
        inHunk = true;
        hunkOrigStart = parseInt(hunkMatch[1]) - 1;
        hunkOrigCount = hunkMatch[2] ? parseInt(hunkMatch[2]) : 1;
      }
      continue;
    }

    if (inHunk) {
      if (line.startsWith("+")) {
        result.push(line.substring(1));
      } else if (line.startsWith("-")) {
        origIdx++; // Skip removed line
      } else if (line.startsWith(" ") || line === "") {
        const content = line.startsWith(" ") ? line.substring(1) : line;
        if (origIdx < originalLines.length && originalLines[origIdx] !== content) {
          // Line mismatch — fall back to full replacement indication
          return null;
        }
        result.push(content);
        origIdx++;
      } else {
        // End of hunk
        inHunk = false;
      }
    }
  }

  // Append remaining original lines
  while (origIdx < originalLines.length) {
    result.push(originalLines[origIdx]);
    origIdx++;
  }

  return result.join("\n");
}

/** Strip patch markers from display content so users don't see raw FILE/DIFF blocks. */
function stripPatchMarkers(content: string): string {
  return content
    .replace(/###\s*FILE:\s*\S+\s*\n```\w*\n[\s\S]*?```/g, "")
    .replace(/###\s*DIFF:\s*\S+\s*\n```diff\n[\s\S]*?```/g, "")
    .trim();
}

function parseToolCalls(content: string): { cleanContent: string; tools: string[] } {
  const tools: string[] = [];
  const cleanContent = content.replace(/\[TOOL:(\w+)\]/g, (_match, tool) => {
    tools.push(tool);
    return "";
  }).trim();
  return { cleanContent, tools };
}

/** Collapsible reasoning/thinking steps shown before the AI response.
 *  Defined outside AIChatPanel to preserve collapse/expand state across renders. */
function ReasoningSteps({ reasoning, hasContent }: { reasoning: string; hasContent: boolean }) {
  const [expanded, setExpanded] = useState(!hasContent);
  const steps = reasoning
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  if (steps.length === 0) return null;

  return (
    <div className="mb-1.5 w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="reasoning-toggle"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Brain size={12} className="text-accent/70" />
        <span>{hasContent ? "Thinking — done" : "Thinking..."}</span>
      </button>
      {expanded && (
        <div className="reasoning-steps">
          {steps.map((step, i) => (
            <div
              key={i}
              className="reasoning-step fade-in"
              style={{ animationDelay: `${Math.min(i * 30, 500)}ms` }}
            >
              {step.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIChatPanel({ project, workspaceId, files, onApplyPatch }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        WELCOME_MESSAGES[project.slug] ||
        "Welcome to your project! I'm your AI mentor. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toolRunning, setToolRunning] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const arduino = useArduinoStore();
  const aiActivity = useAIActivityStore();
  const editorStore = useEditorStore();

  // File size limit: warn when total content > 50KB
  const MAX_CONTEXT_SIZE = 50 * 1024; // 50KB
  const totalFileSize = Object.values(files).reduce((sum, c) => sum + new Blob([c]).size, 0);
  const isContextLarge = totalFileSize > MAX_CONTEXT_SIZE;

  const suggestions = SUGGESTIONS_BY_SLUG[project.slug] || [
    "What can you help me with?",
    "Explain the project structure",
    "How do I get started?",
    "Show me an example",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount: abort in-flight requests, prevent state updates
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const sendToAI = useCallback(async (userMsg: string) => {
    // Guard: don't send if no workspace is active
    if (!workspaceId) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "system",
        content: "⚠️ No workspace created yet. Create a project first from the Projects page.",
        timestamp: new Date(),
      }]);
      return;
    }

    setLoading(true);
    aiActivity.setIsActive(true);
    aiActivity.setPhase("Thinking");
    aiActivity.addActivity("Analyzing request...", "thinking");

    // Streaming state for the in-progress assistant message
    const msgId = crypto.randomUUID();
    let streamedReasoning = "";
    let streamedContent = "";

    // Add a placeholder assistant message that we'll update as chunks arrive
    const placeholder: Message = {
      id: msgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, placeholder]);

    try {
      const { useAuthStore } = await import("@/stores/authStore");
      const authStore = useAuthStore.getState();
      const token = authStore.accessToken;
      const serverUrl = authStore.serverUrl.replace(/\/$/, "");

      // Include latest build output + serial output for context
      const buildCtx = arduino.compileResult
        ? (arduino.compileResult.success ? "BUILD SUCCESS:\n" : "BUILD FAILED:\n") +
          (arduino.compileResult.error || arduino.compileResult.output || "")
        : "";
      const serialCtx = arduino.serialOutput.length > 0
        ? "SERIAL OUTPUT:\n" + arduino.serialOutput.join("\n")
        : "";

      // Abort any in-flight request and create new controller
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(`${serverUrl}/api/v1/ai/chat/${workspaceId}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMsg,
          include_files: Object.keys(files),
          files: files,
          build_output: [buildCtx, serialCtx].filter(Boolean).join("\n") || undefined,
          active_file: editorStore.activeFile || undefined,
          cursor_line: editorStore.activeFile ? 1 : undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "reasoning") {
              if (!mountedRef.current) break;
              aiActivity.setPhase("Thinking");
              aiActivity.addActivity("Reasoning through problem...", "thinking");
              streamedReasoning += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId ? { ...m, reasoning: streamedReasoning, content: streamedContent } : m
                )
              );
            } else if (event.type === "content") {
              // Actual response content arriving
              if (streamedContent === "" && streamedReasoning) {
                aiActivity.setPhase("Writing");
                aiActivity.addActivity("Writing response...", "writing");
              }
              streamedContent += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId
                    ? { ...m, reasoning: streamedReasoning || undefined, content: streamedContent }
                    : m
                )
              );
            } else if (event.type === "done") {
              // Stream complete
              aiActivity.setPhase("Idle");
            } else if (event.type === "error") {
              // AI service error — map error codes to user-friendly messages
              const errorMessages: Record<string, string> = {
                ai_auth_error: "🔑 AI API key issue — please check server configuration.",
                ai_rate_limited: "⏳ AI is rate limited — please wait a moment and try again.",
                ai_overloaded: "🏗️ AI servers are overloaded — retrying shortly...",
                ai_network_error: "🌐 Cannot reach AI servers — check your internet connection.",
                ai_server_error: "🖥️ AI server error — the service may be temporarily down.",
                ai_error: "⚠️ AI service error — please try again.",
              };
              const errMsg = errorMessages[event.code] || event.message || "Unknown AI error";
              streamedContent = errMsg;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId ? { ...m, content: errMsg, reasoning: streamedReasoning || undefined } : m
                )
              );
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Finalize message with parsed patches and tool calls
      const finalContent = streamedContent || "(No response received)";
      const { cleanContent, tools } = parseToolCalls(finalContent);
      const filePatches = parseCodePatches(cleanContent);
      const diffPatches = parseDiffPatches(cleanContent, files);
      const allPatches = [...filePatches, ...diffPatches];
      const displayContent = stripPatchMarkers(cleanContent);

      // Auto-apply all patches
      const appliedFiles: string[] = [];
      if (allPatches.length > 0) {
        aiActivity.setPhase("Applying changes");
        for (const patch of allPatches) {
          onApplyPatch(patch.filePath, patch.newContent);
          appliedFiles.push(patch.filePath);
          aiActivity.addActivity(`Applied ${patch.filePath}`, "writing", patch.filePath);
        }
        if (diffPatches.length > 0) {
          aiActivity.addNotification({
            summary: `Applied ${filePatches.length} file(s) + ${diffPatches.length} diff(s)`,
          });
        } else {
          aiActivity.addNotification({
            summary: `Applied ${allPatches.length} file change(s)`,
            file: appliedFiles.join(", "),
          });
        }
      }

      const finalMessage: Message = {
        id: msgId,
        role: "assistant",
        content: displayContent || finalContent,
        reasoning: streamedReasoning || undefined,
        patches: allPatches.length > 0 ? allPatches : undefined,
        toolCall: appliedFiles.length > 0
          ? { tool: "PATCH", result: `Applied ${appliedFiles.length} file(s): ${appliedFiles.join(", ")}` }
          : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? finalMessage : m))
      );

      // ── AGENTIC LOOP ── Execute tool calls and feed results back to AI
      if (tools.length > 0) {
        for (let i = 0; i < tools.length; i++) {
          const tool = tools[i];
          const result = await executeTool(tool);

          // If compile succeeded or failed, feed result back to AI for autonomous iteration
          if ((tool === "COMPILE" || tool === "UPLOAD") && i < tools.length - 0) {
            const isLast = i === tools.length - 1;
            // Feed build/upload result back to AI for next steps
            if (!isLast) continue; // Only trigger loop on last tool

            const resultObj = result as CompileResult | UploadResult | undefined;
            if (resultObj && "success" in resultObj) {
              const followCtx = resultObj.success
                ? `BUILD SUCCESS:\n${resultObj.output || "Compilation successful."}\n\nWhat should I do next?`
                : `BUILD FAILED:\n${resultObj.error || "Unknown error"}\n\nPlease analyze these errors and fix the code.`;

              // Auto-follow-up to AI to continue the agentic loop
              setTimeout(() => sendToAI(followCtx), 800);
            }
          }
        }
      }
    } catch (err: any) {
      // Error type distinction: network vs auth vs rate limit vs server error
      let errorContent: string;
      if (err?.message?.includes("401") || err?.message?.includes("403")) {
        errorContent = "🔒 Session expired. Please log in again to continue.";
      } else if (err?.message?.includes("429")) {
        errorContent = "⏳ Too many requests. Please wait a moment and try again.";
      } else if (err?.message?.includes("500") || err?.message?.includes("502") || err?.message?.includes("503")) {
        errorContent = "🖥️ Server is temporarily unavailable. Please try again in a moment.";
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        errorContent = "🌐 Cannot connect to the server. Make sure the CreateLab server is running.";
      } else {
        errorContent = `⚠️ Could not reach the AI server. Make sure the CreateLab server is running.\n\n${err?.message || ""}`;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, content: errorContent, reasoning: undefined }
            : m
        )
      );
    } finally {
      setLoading(false);
      aiActivity.setIsActive(false);
      aiActivity.setPhase("Idle");
    }
  }, [workspaceId, files, arduino.compileResult, onApplyPatch, aiActivity]);

  const executeTool = useCallback(async (tool: string) => {
    setToolRunning(tool);
    const toolMsg: Message = {
      id: crypto.randomUUID(),
      role: "system",
      content: "",
      timestamp: new Date(),
      toolCall: { tool },
    };

    try {
      if (tool === "COMPILE") {
        const board = arduino.selectedBoard;
        if (!board) {
          toolMsg.content = "⚠️ No board selected. Select a board in the Hardware panel first.";
          toolMsg.toolCall!.result = "No board selected";
        } else {
          toolMsg.content = `🔨 Compiling for ${board}...`;
          setMessages((prev) => [...prev, toolMsg]);
          const result = await arduino.compile(board);
          toolMsg.content = result.success
            ? `✅ Compilation successful (${result.duration_ms}ms)\n\`\`\`\n${result.output || "Done."}\n\`\`\``
            : `❌ Compilation failed\n\`\`\`\n${result.error}\n\`\`\``;
          toolMsg.toolCall!.result = result;
        }
      } else if (tool === "UPLOAD") {
        const board = arduino.selectedBoard;
        const port = arduino.selectedPort;
        if (!board || !port) {
          toolMsg.content = "⚠️ No board/port selected. Select both in the Hardware panel.";
          toolMsg.toolCall!.result = "No board/port";
        } else {
          toolMsg.content = `📤 Uploading to ${board} on ${port}...`;
          setMessages((prev) => [...prev, toolMsg]);
          const result = await arduino.upload(board, port);
          toolMsg.content = result.success
            ? `✅ Upload successful (${result.duration_ms}ms)\n\`\`\`\n${result.output || "Done."}\n\`\`\``
            : `❌ Upload failed\n\`\`\`\n${result.error}\n\`\`\``;
          toolMsg.toolCall!.result = result;
        }
      } else if (tool === "SERIAL") {
        toolMsg.content = "📡 Serial monitor not yet implemented. Check the Hardware panel for serial output.";
        toolMsg.toolCall!.result = "Not implemented";
      } else {
        toolMsg.content = `⚠️ Unknown tool: ${tool}`;
        toolMsg.toolCall!.result = "Unknown tool";
      }
    } catch (e: any) {
      toolMsg.content = `❌ Tool execution error: ${e}`;
      toolMsg.toolCall!.result = String(e);
    }

    setMessages((prev) => prev.map(m => m.id === toolMsg.id ? toolMsg : m));
    setToolRunning(null);

    // If compile succeeded, auto-upload next tool or ask AI for next steps
    if (tool === "COMPILE" && toolMsg.toolCall?.result && (toolMsg.toolCall.result as CompileResult).success) {
      // Auto-follow up: send build success to AI so it can decide next step
      const buildResult = toolMsg.toolCall.result as CompileResult;
      const followUp = `BUILD OUTPUT:\n${buildResult.output || "Compilation successful."}\n\nWhat should I do next?`;
      setTimeout(() => sendToAI(followUp), 500);
    } else if (tool === "COMPILE" && toolMsg.toolCall?.result && !(toolMsg.toolCall.result as CompileResult).success) {
      const buildResult = toolMsg.toolCall.result as CompileResult;
      const followUp = `BUILD OUTPUT (compilation failed):\n${buildResult.error}\n\nPlease analyze these errors and fix the code.`;
      setTimeout(() => sendToAI(followUp), 500);
    } else if (tool === "UPLOAD" && toolMsg.toolCall?.result && (toolMsg.toolCall.result as UploadResult).success) {
      const uploadResult = toolMsg.toolCall.result as UploadResult;
      const followUp = `UPLOAD RESULT:\n${uploadResult.output || "Upload successful."}\n\nThe code is now running on the board. What should I verify or build next?`;
      setTimeout(() => sendToAI(followUp), 500);
    }
  }, [arduino, sendToAI]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading || toolRunning) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    await sendToAI(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          WELCOME_MESSAGES[project.slug] ||
          "Welcome to your project! I'm your AI mentor. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* clipboard not available */ }
  };

  const QuickChip = ({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-surface border border-border text-text-muted hover:text-text-primary hover:border-accent/40 hover:bg-accent/5 transition-all shrink-0"
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <div className="h-full w-full border-l border-border bg-surface-alt flex flex-col">
      {/* Header — shrink-0 keeps it fixed */}
      <div className="shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">AI Mentor</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">agent</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">{project.name} assistant</p>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-red-400 transition-colors"
          title="Clear chat"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages — flex-1 min-h-0 allows scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          if (msg.role === "system") {
            const isCompile = msg.toolCall?.tool === "COMPILE";
            const isUpload = msg.toolCall?.tool === "UPLOAD";
            const result = msg.toolCall?.result;
            const success = result && typeof result === "object" && "success" in result ? (result as CompileResult).success : null;
            const borderColor = success === true ? "border-green-600/30" : success === false ? "border-red-600/30" : "border-border";
            const textColor = success === true ? "text-green-400" : success === false ? "text-red-400" : "text-text-muted";
            const bgColor = success === true ? "bg-green-600/5" : success === false ? "bg-red-600/5" : "bg-surface";

            return (
              <div key={msg.id} className="flex justify-center">
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-xs font-mono border ${borderColor} ${textColor} ${bgColor}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isCompile ? <Play size={12} /> : isUpload ? <Upload size={12} /> : msg.toolCall?.tool === "SERIAL" ? <Terminal size={12} /> : <Cpu size={12} />}
                    <span className="font-medium uppercase tracking-wider text-[10px]">
                      {msg.toolCall?.tool || "SYSTEM"}
                    </span>
                    {toolRunning === msg.toolCall?.tool && (
                      <Loader2 size={12} className="animate-spin ml-auto" />
                    )}
                  </div>
                  <div className="whitespace-pre-wrap break-all">{msg.content}</div>
                </div>
              </div>
            );
          }

          return (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant"
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-hover text-text-secondary"
              }`}
            >
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col group`}>
              {/* Reasoning / thinking steps — collapsible */}
              {msg.role === "assistant" && msg.reasoning && (
                <ReasoningSteps reasoning={msg.reasoning} hasContent={!!msg.content} />
              )}
              {msg.content ? (
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === "assistant"
                      ? "bg-surface border border-border text-text-primary"
                      : "bg-accent/10 border border-accent/20 text-text-primary"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.patches && msg.patches.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                      {msg.patches.map((patch, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <FileCode size={12} className="text-accent" />
                          <span className="text-text-muted flex-1 truncate">{patch.filePath}</span>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-600/10 text-green-400 text-[10px]">
                            <Check size={10} /> Applied
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent loading-dot" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent loading-dot" style={{ animationDelay: "200ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent loading-dot" style={{ animationDelay: "400ms" }} />
                  </span>
                  <span className="text-xs text-text-muted">Generating...</span>
                </div>
              ) : null}
              {/* Copy button for assistant messages */}
              {msg.role === "assistant" && msg.content && (
                <button
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="mt-1 px-1.5 py-0.5 rounded text-[10px] text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                >
                  {copiedId === msg.id ? <CheckCheck size={10} className="text-green-400" /> : <Copy size={10} />}
                  {copiedId === msg.id ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
          </div>
          );
        })}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="animate-pulse" />
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-accent" />
              <span className="text-xs text-text-muted">
                {aiActivity.phase === "Thinking" && "Thinking through your request..."}
                {aiActivity.phase === "Writing" && "Writing response..."}
                {aiActivity.phase === "Applying changes" && "Applying code changes..."}
                {(!aiActivity.phase || aiActivity.phase === "Idle") && "Processing..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area — shrink-0 keeps it pinned to bottom */}
      <div className="shrink-0 border-t border-border bg-surface-alt">
        {/* Suggestion chips */}
        {messages.length <= 1 && (
          <div className="px-4 pt-3 flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <QuickChip
                key={i}
                icon={i === 0 ? Sparkles : i === 1 ? Lightbulb : i === 2 ? Code2 : Bug}
                label={s}
                onClick={() => handleSend(s)}
              />
            ))}
          </div>
        )}

        {/* File size warning */}
        {isContextLarge && (
          <div className="px-4 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-600/10 border border-yellow-600/20 text-[11px] text-yellow-500">
              <AlertTriangle size={12} />
              <span>Large context ({(totalFileSize / 1024).toFixed(0)}KB). Consider focusing on fewer files for faster responses.</span>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="p-3 flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — plan, code, debug, learn..."
              rows={2}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 pr-12 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors"
            />
            <span className="absolute right-3 bottom-2 text-[10px] text-text-muted select-none">
              {input.length > 0 && `${input.length}`}
            </span>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-accent hover:bg-accent-hover text-white rounded-xl p-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center aspect-square"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Footer hints */}
        <div className="px-4 pb-2 flex items-center gap-3 text-[10px] text-text-muted">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-surface border border-border text-[9px]">Enter</kbd> to send</span>
          <span className="text-border">|</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
}


