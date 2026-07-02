import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { useChatStore, ChatMessage } from "../stores/chatStore";

interface Props {
  workspaceId: string;
}

export default function ChatPanel({ workspaceId }: Props) {
  const { messages, sendMessage, loading } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input;
    setInput("");
    await sendMessage(workspaceId, text);
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h3>Ask your AI instructor</h3>
            <p>Describe what you want to build, fix, or understand.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="chat-avatar">{msg.role === "user" ? "You" : "AI"}</div>
            <div className="chat-content">
              <pre className="chat-text">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <div className="chat-avatar">AI</div>
            <div className="chat-content">
              <Loader2 className="animate-spin" size={20} />
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-bar">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask your AI instructor..."
          rows={2}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
