// Top 10 preguntas frecuentes recibidas por el bot.
export default function TopQueries({ items = [] }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md p-4">
      <h3 className="font-medium mb-3">Top preguntas</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Sin datos todavía.</p>
      ) : (
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          {items.map((q) => (
            <li key={q.id}>{q.text}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
