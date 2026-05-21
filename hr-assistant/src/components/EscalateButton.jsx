// Botón secundario para derivar la conversación a una persona de RH.
export default function EscalateButton({ onEscalate }) {
  return (
    <button
      type="button"
      onClick={onEscalate}
      className="text-left text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] underline-offset-2 hover:underline"
    >
      Esto no responde — escalar a RH
    </button>
  );
}
