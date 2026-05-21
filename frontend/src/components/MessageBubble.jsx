// Burbuja individual. Soporta los 4 tipos de mensaje del contrato:
// user, bot con sources, bot escalado (escalated: true), bot con error.
import SourceCitation from './SourceCitation.jsx';
import EscalationBanner from './EscalationBanner.jsx';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = !!message.isError;
  const isEscalated = !!message.escalated;

  const text = message.text ?? '';

  const bubbleClass = [
    'max-w-[80%] px-3 py-2 rounded-md text-sm leading-relaxed',
    isUser
      ? 'bg-[var(--color-primary)] text-white'
      : isError
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]',
  ].join(' ');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col gap-1 max-w-[80%]">
        <div className={bubbleClass}>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>

        {!isUser && !isError && !isEscalated && (
          <SourceCitation sources={message.sources} />
        )}

        {isEscalated && <EscalationBanner />}
      </div>
    </div>
  );
}
