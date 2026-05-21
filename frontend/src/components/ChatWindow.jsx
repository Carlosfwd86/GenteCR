// Contenedor principal del chat: agrupa historial y input.
// La escalación la decide el backend; el banner se renderiza en cada
// MessageBubble cuando corresponde, sin acción del usuario.
import MessageList from './MessageList.jsx';
import ChatInput from './ChatInput.jsx';

import { useChat } from '../hooks/useChat.js';

export default function ChatWindow() {
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <section className="w-full max-w-2xl flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm overflow-hidden">
      <div className="flex-1 min-h-[480px] flex flex-col">
        <MessageList messages={messages} isTyping={isTyping} />
      </div>
      <div className="border-t border-[var(--color-border)] p-3">
        <ChatInput onSend={sendMessage} disabled={isTyping} />
      </div>
    </section>
  );
}
