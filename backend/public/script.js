// ============================================================
// script.js — Lógica del Chat RRHH
// Maneja: UI, comunicación con API, historial en localStorage
// y renderizado de mensajes.
// ============================================================

'use strict';

// ── Constantes ────────────────────────────────────────────────

const API_ENDPOINT   = '/chat';
const HEALTH_ENDPOINT = '/health';
const STORAGE_KEY    = 'rrhh_chat_history_v2';
const MAX_HISTORY    = 40;  // Máximo de mensajes guardados en localStorage
const HEALTH_INTERVAL = 30000; // ms entre chequeos de salud

// ── Referencias DOM ───────────────────────────────────────────

const messagesArea    = document.getElementById('messages-area');
const userInput       = document.getElementById('user-input');
const sendBtn         = document.getElementById('send-btn');
const charCounter     = document.getElementById('char-counter');
const welcomeBanner   = document.getElementById('welcome-banner');
const btnClearChat    = document.getElementById('btn-clear-chat');
const statusDot       = document.getElementById('status-dot');
const statusLabel     = document.getElementById('status-label');

// ── Estado de la aplicación ───────────────────────────────────

let isLoading  = false;
// Historial para el contexto de la IA (solo roles user/assistant)
let apiHistory = [];

// ── LocalStorage — Persistencia del historial ─────────────────

/**
 * Carga el historial guardado en localStorage y lo renderiza en la UI.
 * Si no hay historial previo, muestra el banner de bienvenida.
 */
function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (!Array.isArray(saved) || saved.length === 0) return;

    // Ocultar banner de bienvenida
    welcomeBanner.classList.add('hidden');

    // Reconstruir apiHistory para mantener contexto con la IA
    apiHistory = [];

    saved.forEach(msg => {
      renderMessage(msg, false); // false = no animar al cargar

      // Solo los mensajes de usuario y bot (no escalaciones) van al contexto de la IA
      if (msg.role === 'user') {
        apiHistory.push({ role: 'user', content: msg.text });
      } else if (msg.role === 'bot' && !msg.escalated) {
        apiHistory.push({ role: 'assistant', content: msg.text });
      }
    });

    // Scroll al final sin animación
    scrollToBottom(false);

  } catch (err) {
    console.warn('[RRHH Chat] No se pudo cargar el historial:', err.message);
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Guarda un mensaje en localStorage manteniendo el límite de MAX_HISTORY.
 * @param {Object} msg  Objeto de mensaje a guardar
 */
function saveMessage(msg) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.push(msg);

    // Mantener solo los últimos MAX_HISTORY mensajes
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.warn('[RRHH Chat] No se pudo guardar el mensaje:', err.message);
  }
}

/**
 * Limpia todo el historial del localStorage y la UI.
 */
function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  messagesArea.innerHTML = '';
  apiHistory = [];
  welcomeBanner.classList.remove('hidden');
}

// ── Renderizado de mensajes ────────────────────────────────────

/**
 * Formatea la hora de un timestamp ISO.
 * @param {string} isoString  Timestamp ISO 8601
 * @returns {string} Hora formateada en HH:MM
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Escapa HTML para prevenir XSS en el texto del usuario.
 * @param {string} text  Texto a escapar
 * @returns {string} Texto seguro para insertar en el DOM
 */
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Convierte saltos de línea en <br> y negritas **texto** en <strong>.
 * @param {string} text  Texto del bot
 * @returns {string} HTML seguro
 */
function formatBotText(text) {
  return escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/**
 * Crea y añade un elemento de mensaje en la UI.
 * @param {Object} msg       Objeto de mensaje {id, role, text, timestamp, escalated, sources}
 * @param {boolean} animate  Si debe animarse al aparecer
 */
function renderMessage(msg, animate = true) {
  const row = document.createElement('div');
  row.className = `message-row ${msg.role}${msg.escalated ? ' escalation' : ''}`;
  row.dataset.id = msg.id;

  if (!animate) {
    row.style.animation = 'none';
  }

  // Avatar emoji
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = msg.role === 'user' ? '👤' : '🤖';

  // Burbuja de mensaje
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const content = document.createElement('div');
  content.className = 'bubble-content';

  if (msg.escalated) {
    // Badge visual para mensajes de escalación
    const badge = document.createElement('div');
    badge.className = 'escalation-badge';
    badge.innerHTML = '🔔 Transferido a RRHH';
    content.appendChild(badge);
  }

  const textNode = document.createElement('span');
  if (msg.role === 'user') {
    textNode.textContent = msg.text;
  } else {
    textNode.innerHTML = formatBotText(msg.text);
  }
  content.appendChild(textNode);
  bubble.appendChild(content);

  // Metadatos: hora y fuentes
  const meta = document.createElement('div');
  meta.className = 'message-meta';

  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = formatTime(msg.timestamp);
  meta.appendChild(time);

  // Mostrar fuentes documentales si las hay
  if (msg.sources && msg.sources.length > 0) {
    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'message-sources';
    msg.sources.forEach(source => {
      const tag = document.createElement('span');
      tag.className = 'source-tag';
      tag.textContent = source.replace('.pdf', '');
      tag.title = `Fuente: ${source}`;
      sourcesDiv.appendChild(tag);
    });
    meta.appendChild(sourcesDiv);
  }

  bubble.appendChild(meta);
  row.appendChild(avatar);
  row.appendChild(bubble);
  messagesArea.appendChild(row);

  if (animate) {
    scrollToBottom(true);
  }

  return row;
}

// ── Indicador de escritura ────────────────────────────────────

let typingElement = null;

/**
 * Muestra el indicador de "escribiendo..." del bot.
 */
function showTyping() {
  if (typingElement) return;

  typingElement = document.createElement('div');
  typingElement.className = 'typing-indicator';
  typingElement.setAttribute('aria-label', 'El asistente está escribiendo');
  typingElement.innerHTML = `
    <div class="message-avatar" aria-hidden="true">🤖</div>
    <div class="typing-dots" aria-hidden="true">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  messagesArea.appendChild(typingElement);
  scrollToBottom(true);
}

/**
 * Oculta el indicador de escritura.
 */
function hideTyping() {
  if (typingElement) {
    typingElement.remove();
    typingElement = null;
  }
}

// ── Scroll ────────────────────────────────────────────────────

/**
 * Hace scroll al último mensaje.
 * @param {boolean} smooth  Si debe ser suave o instantáneo
 */
function scrollToBottom(smooth = true) {
  const container = document.querySelector('.chat-container');
  container.scrollTo({
    top: container.scrollHeight,
    behavior: smooth ? 'smooth' : 'instant',
  });
}

// ── Toast de errores ──────────────────────────────────────────

let toastEl = null;
let toastTimeout = null;

/**
 * Muestra un mensaje de error temporal.
 * @param {string} message  Texto del error
 * @param {number} duration Duración en ms
 */
function showToast(message, duration = 4000) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    document.body.appendChild(toastEl);
  }

  toastEl.textContent = message;
  toastEl.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
}

// ── Estado de conexión (Health Check) ────────────────────────

/**
 * Verifica el estado del servidor y actualiza el indicador de estado.
 */
async function checkHealth() {
  try {
    const res = await fetch(HEALTH_ENDPOINT, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();

    if (res.ok && data.status === 'ok') {
      statusDot.className = 'status-dot online';
      if (data.chunksLoaded > 0) {
        statusLabel.textContent = `En línea · ${data.chunksLoaded} docs`;
      } else {
        statusLabel.textContent = 'Sin datos';
        statusDot.className = 'status-dot loading';
      }
    } else {
      throw new Error('Server not OK');
    }
  } catch {
    statusDot.className = 'status-dot offline';
    statusLabel.textContent = 'Sin conexión';
  }
}

// ── Envío de mensajes ─────────────────────────────────────────

/**
 * Procesa y envía el mensaje del usuario al backend.
 */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  // Ocultar banner de bienvenida al primer mensaje
  welcomeBanner.classList.add('hidden');

  // Crear objeto de mensaje del usuario
  const userMsg = {
    id: `msg-${Date.now()}-user`,
    role: 'user',
    text,
    timestamp: new Date().toISOString(),
    escalated: false,
    sources: [],
  };

  // Renderizar y guardar mensaje del usuario
  renderMessage(userMsg);
  saveMessage(userMsg);

  // Actualizar historial de la IA
  apiHistory.push({ role: 'user', content: text });

  // Limpiar input
  userInput.value = '';
  userInput.style.height = '';
  charCounter.textContent = '0/1000';
  charCounter.className = 'char-counter';
  updateSendBtn();

  // Mostrar indicador de escritura
  isLoading = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: apiHistory.slice(-10), // Últimos 10 turnos como contexto
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error del servidor (${response.status})`);
    }

    const data = await response.json();
    hideTyping();

    // Crear objeto de mensaje del bot
    const botMsg = {
      id: `msg-${Date.now()}-bot`,
      role: 'bot',
      text: data.reply,
      timestamp: new Date().toISOString(),
      escalated: data.escalated || false,
      sources: data.sources || [],
    };

    // Renderizar y guardar mensaje del bot
    renderMessage(botMsg);
    saveMessage(botMsg);

    // Actualizar historial de la IA (solo si no fue escalación)
    if (!data.escalated) {
      apiHistory.push({ role: 'assistant', content: data.reply });
    }

    // Limitar tamaño del apiHistory en memoria
    if (apiHistory.length > 20) {
      apiHistory.splice(0, apiHistory.length - 20);
    }

  } catch (err) {
    hideTyping();

    let errorText;
    if (err.name === 'TimeoutError') {
      errorText = 'La solicitud tardó demasiado. Por favor intenta de nuevo.';
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      errorText = 'No se pudo conectar con el servidor. Verifica que esté corriendo.';
    } else {
      errorText = err.message || 'Ocurrió un error inesperado.';
    }

    showToast(`❌ ${errorText}`);

    // Quitar el mensaje del usuario del apiHistory si falló
    apiHistory.pop();

  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// ── Input: auto-resize y contador de caracteres ───────────────

/**
 * Actualiza el estado del botón de enviar según el input.
 */
function updateSendBtn() {
  const hasText = userInput.value.trim().length > 0;
  sendBtn.disabled = !hasText || isLoading;
}

userInput.addEventListener('input', () => {
  // Auto-resize del textarea
  userInput.style.height = 'auto';
  userInput.style.height = `${Math.min(userInput.scrollHeight, 140)}px`;

  // Contador de caracteres
  const len = userInput.value.length;
  charCounter.textContent = `${len}/1000`;
  charCounter.className = 'char-counter' + (len > 950 ? ' limit' : len > 800 ? ' warn' : '');

  updateSendBtn();
});

// Enter para enviar, Shift+Enter para nueva línea
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Botón de enviar
sendBtn.addEventListener('click', sendMessage);

// ── Chips de preguntas rápidas ─────────────────────────────────

document.querySelectorAll('.quick-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const question = chip.dataset.question;
    userInput.value = question;
    userInput.dispatchEvent(new Event('input'));
    sendMessage();
  });
});

// ── Confirmación de limpiar historial ────────────────────────

function showConfirmDialog() {
  // Crear overlay de confirmación si no existe
  let overlay = document.getElementById('confirm-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">🗑️ Limpiar conversación</h3>
        <p>¿Estás seguro? Se eliminarán todos los mensajes y el historial guardado.</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost" id="btn-cancel-clear">Cancelar</button>
          <button class="btn btn-danger" id="btn-confirm-clear">Eliminar todo</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-clear').addEventListener('click', hideConfirmDialog);
    document.getElementById('btn-confirm-clear').addEventListener('click', () => {
      clearHistory();
      hideConfirmDialog();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideConfirmDialog();
    });
  }

  requestAnimationFrame(() => overlay.classList.add('show'));
}

function hideConfirmDialog() {
  const overlay = document.getElementById('confirm-overlay');
  if (overlay) overlay.classList.remove('show');
}

btnClearChat.addEventListener('click', showConfirmDialog);

// ── Inicialización ────────────────────────────────────────────

(async function init() {
  // Deshabilitar botón de enviar hasta que haya texto
  sendBtn.disabled = true;

  // Verificar estado del servidor
  await checkHealth();
  setInterval(checkHealth, HEALTH_INTERVAL);

  // Cargar historial previo desde localStorage
  loadHistory();

  // Focus en el input
  userInput.focus();
})();
