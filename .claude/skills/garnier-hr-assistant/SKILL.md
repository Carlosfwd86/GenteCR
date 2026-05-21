---
name: garnier-hr-assistant
description: Conocimiento específico del proyecto Garnier HR Assistant — patrones de componentes, integración con n8n, estructura de mensajes del chat. Usar cuando se trabaje en cualquier archivo dentro de src/components, src/hooks o src/services.
---

# Garnier HR Assistant — Patrones del proyecto

## Estructura de un mensaje del chat

Todo mensaje en el array `messages` del hook `useChat` sigue esta forma:

```js
// Mensaje del usuario
{ role: 'user', text: 'string', ts: Number }

// Mensaje del bot con respuesta encontrada
{
  role: 'bot',
  text: 'string',
  fuente: { doc: 'RH-13', seccion: '6.3', pagina: 8 },
  confianza: 0.87,
  ts: Number
}

// Mensaje del bot sin respuesta (puede escalar)
{
  role: 'bot',
  text: null,
  puede_escalar: true,
  pregunta_original: 'string',  // se guarda para el escalado
  ts: Number
}

// Mensaje del bot por error de red/timeout
{
  role: 'bot',
  text: 'No pude conectarme. Intentá de nuevo.',
  isError: true,
  ts: Number
}
```

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

## Patrón para llamadas async

Toda llamada al webhook usa este patrón:

```js
async function callWebhook(path, body, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}${path}`, {
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
```

## Las 5 preguntas oficiales de QA

Usalas siempre que valides un cambio:

1. "¿Cuántos días de vacaciones tengo?" → debe citar RH-01
2. "¿Cómo solicito teletrabajo?" → debe citar RH-13
3. "¿Qué cubre la política de viáticos?" → debe citar RH-23
4. "¿Cómo reporto un incidente de acoso?" → debe citar RH-04
5. "¿Cuál es el código de vestimenta?" → debe citar RH-25

Y una pregunta fuera de alcance para validar el escalado:
6. "¿Cuánto pagan de aguinaldo este año?" → debe devolver `puede_escalar: true`

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
