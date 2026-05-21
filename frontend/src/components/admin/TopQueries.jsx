// Top preguntas frecuentes — ordenadas por conteo descendente.
// Recibe queries: [{ pregunta, count }].
export default function TopQueries({ queries }) {
  const items = Array.isArray(queries) ? queries : [];

  return (
    <section className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md p-4">
      <h3 className="font-medium mb-3">Top preguntas</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Aún no hay consultas registradas.
        </p>
      ) : (
        <ol className="space-y-2 text-sm">
          {items.map((q, idx) => (
            <li
              key={`${idx}-${q.pregunta}`}
              className="flex items-start justify-between gap-3"
            >
              <span className="flex-1 break-words">{q.pregunta}</span>
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                {q.count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
