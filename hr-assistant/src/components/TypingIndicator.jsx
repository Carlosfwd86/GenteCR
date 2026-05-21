// Tres puntos animados mientras el bot está respondiendo.
export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 flex gap-1">
        <span className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-[var(--color-text-muted)] rounded-full animate-bounce" />
      </div>
    </div>
  );
}
