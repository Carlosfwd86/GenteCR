// Cliente del backend Express+RAG+Claude.
// Contrato:
//   POST `${VITE_BACKEND_URL}/chat`
//     request:  { message, history: [{ role, content }] }
//     response: { reply, escalated, sources, topScore }
//   GET  `${VITE_BACKEND_URL}/health`
//     response: { status, chunksLoaded, model, ... }
//
// Manejo de errores: nunca tira excepciones hacia useChat. Devuelve un
// objeto con isError: true para que el hook lo agregue como burbuja de error.

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const DEFAULT_TIMEOUT_MS = 20000;

const NETWORK_ERROR_REPLY = 'No pude conectarme con el servidor. Intentá de nuevo en un momento.';

async function callBackend(path, { method = 'POST', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const init = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (body !== undefined) init.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function askQuestion(message, history = []) {
  try {
    return await callBackend('/chat', { body: { message, history } });
  } catch {
    return {
      reply: NETWORK_ERROR_REPLY,
      escalated: false,
      sources: [],
      isError: true,
    };
  }
}

export async function getHealth() {
  try {
    return await callBackend('/health', { method: 'GET', timeoutMs: 5000 });
  } catch {
    return { status: 'unreachable' };
  }
}
