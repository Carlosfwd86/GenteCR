// Vista de administración para Marvin: agrupa métricas y listas operativas.
import TopQueries from './TopQueries.jsx';
import GapsList from './GapsList.jsx';

export default function AdminPanel() {
  return (
    <section className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold">Panel de administración</h2>
        <p className="text-sm text-[var(--color-text-muted)]">Resumen de uso del HR Assistant.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <TopQueries />
        <GapsList />
      </div>
    </section>
  );
}
