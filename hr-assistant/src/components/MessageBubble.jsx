// Burbuja individual. Soporta los 4 tipos de mensaje del contrato:
// user, bot con fuente, bot puede_escalar y bot con error.
import SourceCitation from './SourceCitation.jsx';
import EscalateButton from './EscalateButton.jsx';

const FALLBACK_NO_MATCH =
  'No encontré una respuesta para tu consulta. ¿Querés que un agente de RH te contacte?';

export default function MessageBubble({ message, onEscalate }) {
  const isUser = message.role === 'user';
  const isError = !!message.isError;
  const canEscalate = !!message.puede_escalar && !message.escalado;
  const wasEscalated = !!message.escalado;

  const text = message.text ?? FALLBACK_NO_MATCH;

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
          {message.fuente && <SourceCitation source={message.fuente} />}
        </div>

        {canEscalate && (
          <EscalateButton onEscalate={() => onEscalate?.(message)} />
        )}
        {wasEscalated && (
          <p className="text-xs text-[var(--color-text-muted)]">
            ✓ Escalado a RH
          </p>
        )}
      </div>
    </div>
  );
}
