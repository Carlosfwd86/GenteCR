// Historial scrollable de mensajes + indicador de tipeo.
// Auto-scroll al final cuando llega un mensaje nuevo o se prende el typing.
import { useEffect, useRef } from 'react';

import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';

export default function MessageList({ messages = [], isTyping = false, onEscalate }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" role="log" aria-live="polite">
      {messages.map((msg) => (
        <MessageBubble key={msg.ts} message={msg} onEscalate={onEscalate} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
