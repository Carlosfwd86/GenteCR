// Preguntas que el bot no pudo responder — input para mejorar la base de conocimiento.
export default function GapsList({ items = [] }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-4">
      <h3 className="font-medium mb-3">Preguntas sin respuesta</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Sin gaps registrados.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {items.map((q) => (
            <li key={q.id} className="border-b border-[var(--color-border)] last:border-0 py-1">
              {q.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
