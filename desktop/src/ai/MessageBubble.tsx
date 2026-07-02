import { ChatMessage } from "../stores/chatStore";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="message-avatar">{message.role === "user" ? "You" : "AI"}</div>
      <div className="message-content">
        <pre>{message.content}</pre>
      </div>
    </div>
  );
}
