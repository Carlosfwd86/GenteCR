// Pie de burbuja con las fuentes (PDFs) consultadas por el backend RAG.
// Recibe sources como array de strings (nombres de archivo).
export default function SourceCitation({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-[var(--color-text-muted)]">
      <span>Fuente{sources.length > 1 ? 's' : ''}:</span>
      {sources.map((src) => (
        <span
          key={src}
          className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          {src}
        </span>
      ))}
    </div>
  );
}
