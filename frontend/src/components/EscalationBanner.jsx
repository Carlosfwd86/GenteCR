// Aviso visual debajo de una respuesta del bot que fue derivada al equipo
// de RH por el backend. Puramente presentacional, sin acciones.
export default function EscalationBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-2 px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)]"
    >
      Esta consulta fue derivada al equipo de RH.
    </div>
  );
}
