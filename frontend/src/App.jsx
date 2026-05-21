// Layout raíz: header con marca + ChatWindow centrado.
// Cuando la app corre embebida en un iframe (modal de la landing), oculta el
// header propio para evitar duplicarlo con el header del modal.
// Si la URL trae ?admin=1, expone un botón discreto que abre el panel admin.
import { useState } from 'react';

import ChatWindow from './components/ChatWindow.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';

const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;
const isAdminEnabled =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('admin') === '1';

export default function App() {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {!isEmbedded && (
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <img src="/logo-garnier.svg" alt="" className="w-8 h-8" />
            <h1 className="text-lg font-semibold">Garnier HR Assistant</h1>
            <div className="ml-auto flex items-center gap-3">
              {isAdminEnabled && (
                <button
                  type="button"
                  onClick={() => setAdminOpen(true)}
                  className="text-xs px-3 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                >
                  Admin
                </button>
              )}
              <a
                href="/"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] underline-offset-2 hover:underline"
              >
                ← Volver al inicio
              </a>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 flex justify-center px-4 py-6">
        <ChatWindow />
      </main>

      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
