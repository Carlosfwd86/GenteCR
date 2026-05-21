---
name: garnier-hr-assistant
description: Conocimiento específico del proyecto Garnier HR Assistant — patrones de componentes, integración con el backend Express+RAG+Claude, estructura de mensajes del chat. Usar cuando se trabaje en cualquier archivo dentro de src/components, src/hooks o src/services.
---

# Garnier HR Assistant — Patrones del proyecto

## Estructura de un mensaje del chat

Todo mensaje en el array `messages` del hook `useChat` sigue una de estas
formas. La forma se deriva del contrato del backend documentado en CLAUDE.md.

```js
// Mensaje del usuario
{ role: 'user', text: 'string', ts: Number }

// Mensaje del bot — respuesta normal con fuentes
{
  role: 'bot',
  text: 'string',           // viene de reply
  sources: ['archivo.pdf'], // array de nombres de PDF
  topScore: 0.87,           // opcional, para debugging visual
  ts: Number
}

// Mensaje del bot — escalado por el backend
{
  role: 'bot',
  text: 'string',           // mensaje pre-armado que viene en reply
  escalated: true,
  sources: [],
  ts: Number
}

// Mensaje del bot — error de red/timeout (lo genera el frontend, no el backend)
{
  role: 'bot',
  text: 'No pude conectarme. Intentá de nuevo.',
  isError: true,
  ts: Number
}
```

Importante: **el frontend no decide cuándo escalar**. Solo renderiza el banner
de escalación cuando el bot le manda `escalated: true`.

## Mapeo response → mensaje

Cuando llega la respuesta del backend, useChat la transforma así:

```js
// pseudocódigo
const data = await askQuestion(message, history);
messages.push({
  role: 'bot',
  text: data.reply,
  sources: data.sources ?? [],
  topScore: data.topScore,
  escalated: data.escalated === true,
  ts: Date.now(),
});
```

El campo `history` que se manda al backend se construye desde `messages`
mapeando `user` → `user` y `bot` → `assistant`, y usando `text` como `content`.

## Patrón para componentes presentacionales

Cada componente recibe props y no maneja estado de negocio:

```jsx
// src/components/MessageBubble.jsx
// Renderiza una burbuja de mensaje individual.

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
        isUser ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-text)]'
      }`}>
        {message.text}
      </div>
    </div>
  );
}
```

## EscalationBanner (no es un botón)

Componente puramente visual. Se renderiza debajo de un MessageBubble del bot
cuando `message.escalated === true`. NO tiene onClick ni acciones. Reemplaza
al viejo EscalateButton.

```jsx
// src/components/EscalationBanner.jsx
// Aviso visual cuando el backend derivó la consulta a RH.

export default function EscalationBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]"
    >
      Esta consulta fue derivada al equipo de RH.
    </div>
  );
}
```

## Patrón para llamadas al backend

Toda llamada usa este patrón. Vive en `services/api.js`.

```js
async function callBackend(path, body, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Uso
export async function askQuestion(message, history = []) {
  return callBackend('/chat', { message, history });
}
```

Timeout más generoso que con el endpoint imaginado de n8n (20s) porque RAG +
Claude puede tardar varios segundos en consultas complejas.

## SourceCitation

Recibe `sources` (array de strings) y los renderiza como lista de chips
debajo de la burbuja del bot. Si `sources` está vacío o es undefined, no
renderiza nada.

```jsx
// src/components/SourceCitation.jsx
export default function SourceCitation({ sources }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {sources.map(src => (
        <span key={src} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
          {src}
        </span>
      ))}
    </div>
  );
}
```

## Preguntas oficiales de QA

Usalas siempre que valides un cambio. La validación es:
- ¿El bot respondió en español, claro y conciso?
- ¿`sources` trae al menos un PDF cuando la respuesta es real?
- ¿`escalated` es true en las que corresponden?

Preguntas válidas (esperamos respuesta + sources con al menos 1 PDF):
1. "¿Cuántos días de vacaciones tengo?"
2. "¿Cómo solicito teletrabajo?"
3. "¿Qué cubre la política de viáticos?"
4. "¿Cuál es el código de vestimenta?"
5. "¿Qué beneficios laborales tengo?"

Preguntas que deben disparar escalación (esperamos `escalated: true`):
6. "¿Cuánto pagan de aguinaldo este año?" (no está en el corpus)
7. "Quiero hablar con una persona de RH" (pide humano explícitamente)
8. "Tengo un problema de acoso laboral" (tema delicado)

## Tokens de diseño esperados

`tokens.css` define estas variables como mínimo:

```css
:root {
  --color-primary: #1F4E79;
  --color-primary-dark: #163A5F;
  --color-bg: #FFFFFF;
  --color-surface: #F2F4F7;
  --color-text: #1A1A1A;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius-md: 0.75rem;
}
```
