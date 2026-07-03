import { useState, useRef, useEffect } from "react";
import { Project } from "@/stores/projectStore";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  project: Project;
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

export default function AIChatPanel({ project }: AIChatPanelProps) {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { getApi } = await import("@/utils/api");
      const api = getApi();
      const response = await api.post(`/ai/chat/${project.id}`, {
        message: input.trim(),
        include_files: [],
      });
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.data.content || response.data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      // Fallback: show error message
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "⚠️ Could not reach the AI server. Make sure the CreateLab server is running and your API key is configured in Settings.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full w-full border-l border-border bg-surface-alt flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-accent" />
          <span className="text-sm font-medium text-text-primary">
            AI Mentor
          </span>
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {project.name} assistant
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant"
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-hover text-text-secondary"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot size={16} />
              ) : (
                <User size={16} />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "assistant"
                  ? "bg-surface border border-border text-text-primary"
                  : "bg-accent/10 border border-accent/20 text-text-primary"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3">
              <Loader2 size={16} className="animate-spin text-accent" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI mentor..."
            rows={2}
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="self-end bg-accent hover:bg-accent-hover text-white rounded-xl px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}


