// Modal de administración: muestra stats reales del backend y permite
// exportar las consultas como CSV. Se abre desde App.jsx cuando la URL
// trae ?admin=1.
import { useEffect, useState } from 'react';

import TopQueries from './TopQueries.jsx';
import GapsList from './GapsList.jsx';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

export default function AdminPanel({ onClose }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(`${BACKEND_URL}/admin/stats`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled || err.name === 'AbortError') return;
        setError(err.message ?? 'Error desconocido');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const handleExport = () => {
    window.location.href = `${BACKEND_URL}/admin/queries.csv`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel de administración"
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
    >
      <div className="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-md shadow-lg w-full max-w-3xl my-8">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-xl font-semibold">Panel administrativo</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {stats
                ? `${stats.total ?? 0} consultas registradas · ${stats.employeesCount ?? 0} empleados`
                : 'Resumen de uso del HR Assistant.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="text-sm px-3 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg)]"
          >
            Cerrar
          </button>
        </header>

        <div className="p-6 flex flex-col gap-6">
          {loading && (
            <p className="text-sm text-[var(--color-text-muted)]">Cargando estadísticas…</p>
          )}

          {error && !loading && (
            <div
              role="alert"
              className="text-sm px-3 py-2 rounded border border-red-300 bg-red-50 text-red-700"
            >
              No pude cargar las estadísticas: {error}. Verificá que el backend
              esté corriendo en {BACKEND_URL || '(VITE_BACKEND_URL no seteada)'}.
            </div>
          )}

          {!loading && !error && stats && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <TopQueries queries={stats.topQueries} />
                <GapsList gaps={stats.gaps} />
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
                <p className="text-xs text-[var(--color-text-muted)]">
                  El CSV incluye todas las consultas con sus fuentes, latencia
                  y si se usó la tool de empleados.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  className="text-sm px-4 py-2 rounded bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]"
                >
                  Exportar consultas (CSV)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
