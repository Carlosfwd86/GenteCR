// Pie de burbuja con la referencia al documento RH consultado.
export default function SourceCitation({ source }) {
  if (!source) return null;
  const { doc, seccion, pagina } = source;

  return (
    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
      Fuente: {doc}, sección {seccion}
      {pagina ? `, pág. ${pagina}` : ''}
    </p>
  );
}
