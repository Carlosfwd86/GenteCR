// Cliente de API real: habla con el servidor Express local a través del proxy de Vite.
// Mantiene exactamente la misma interfaz y firma para que useChat.js funcione sin cambios.

/**
 * Envia la consulta al servidor Express para ser procesada por la busqueda por
 * similitud de coseno y Anthropic Claude.
 * @param {string} pregunta  Pregunta formulada por el usuario
 * @returns {Promise<{respuesta: string|null, fuente?: object, confianza?: number, puede_escalar?: boolean}>}
 */
export async function askQuestion(pregunta) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pregunta }),
  });

  if (!response.ok) {
    throw new Error(`Error del servidor: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Notifica una escalacion de consulta a Recursos Humanos.
 * @param {string} pregunta  Pregunta original del usuario
 * @param {Array<{role: string, text: string}>} historial  Historial de la conversacion
 * @returns {Promise<{ok: boolean}>}
 */
export async function escalateToHR(pregunta, historial) {
  const response = await fetch('/api/escalate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pregunta, historial }),
  });

  if (!response.ok) {
    throw new Error(`Error al escalar a RRHH: HTTP ${response.status}`);
  }

  return response.json();
}
