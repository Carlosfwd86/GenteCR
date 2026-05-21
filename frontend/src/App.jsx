// Layout raíz: header con marca + ChatWindow centrado.
// Cuando la app corre embebida en un iframe (modal de la landing), oculta el
// header propio para evitar duplicarlo con el header del modal.
import ChatWindow from './components/ChatWindow.jsx';

const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {!isEmbedded && (
        <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <img src="/logo-garnier.svg" alt="" className="w-8 h-8" />
            <h1 className="text-lg font-semibold">Garnier HR Assistant</h1>
            <a
              href="/"
              className="ml-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] underline-offset-2 hover:underline"
            >
              ← Volver al inicio
            </a>
          </div>
        </header>
      )}

      <main className="flex-1 flex justify-center px-4 py-6">
        <ChatWindow />
      </main>
    </div>
  );
}
