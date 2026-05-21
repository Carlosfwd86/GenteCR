// ============================================================
// server.js — API RAG de RRHH
// Servidor Express con búsqueda por similitud del coseno.
// Cerebro: Claude Haiku 4.5 (Anthropic). Embeddings: OpenAI.
// Lógica de escalación a humano vía tag [HUMAN_ESCALATION].
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
// override: true para que el .env gane sobre variables del shell.
// Sin esto, si el shell ya tiene ANTHROPIC_API_KEY definida (ej. Claude Code
// la setea para su CLI), dotenv no la pisa y el server usa la del shell.
require('dotenv').config({ override: true });

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PORT = process.env.PORT || 3000;
const EMBEDDINGS_FILE = path.join(__dirname, 'embeddings_rrhh.json');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'claude-haiku-4-5';
const TOP_K = 3; // Número de chunks más relevantes a recuperar

// ── Middleware ────────────────────────────────────────────────

// CORS: permitir al frontend Vite (localhost:5173) llamarnos en dev.
// En prod, agregar el dominio público del frontend a la lista.
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Carga de embeddings en memoria ───────────────────────────

let embeddingsDB = [];

function loadEmbeddings() {
  if (!fs.existsSync(EMBEDDINGS_FILE)) {
    console.warn('⚠️  embeddings_rrhh.json no encontrado. Ejecuta "node ingestar.js" primero.');
    return;
  }
  try {
    embeddingsDB = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf-8'));
    console.log(`✅ Base de conocimiento cargada: ${embeddingsDB.length} chunks en memoria.`);
  } catch (err) {
    console.error('❌ Error cargando embeddings:', err.message);
  }
}

// Recargar embeddings cuando el archivo cambia (útil en desarrollo)
fs.watchFile(EMBEDDINGS_FILE, () => {
  console.log('🔄 Detectado cambio en embeddings_rrhh.json. Recargando...');
  loadEmbeddings();
});

loadEmbeddings();

// ── Similitud del Coseno ──────────────────────────────────────

/**
 * Calcula la similitud del coseno entre dos vectores.
 * Valores cercanos a 1.0 = muy similares, 0 = sin relación.
 * @param {number[]} a  Vector A
 * @param {number[]} b  Vector B
 * @returns {number} Puntuación de similitud [0, 1]
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Busca los K chunks más relevantes para una consulta vectorizada.
 * @param {number[]} queryVector  Vector de la consulta del usuario
 * @param {number} topK  Número de resultados a retornar
 * @returns {Array} Chunks ordenados por similitud descendente
 */
function findTopKChunks(queryVector, topK = TOP_K) {
  const scored = embeddingsDB.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ── System Prompt ─────────────────────────────────────────────
// Incluye reglas de escritura humana embebidas (skill "humanizer"
// adaptada para correr al momento de generación, no en post-proceso).

const SYSTEM_PROMPT = `Sos un asistente virtual de Recursos Humanos de Garnier & Garnier, amable y profesional.

Tu función es responder preguntas de los empleados sobre políticas internas de la empresa, trámites, beneficios, procesos de RRHH y temas laborales, basándote ÚNICAMENTE en la información del contexto proporcionado.

REGLAS FUNDAMENTALES:
1. Responde siempre en español rioplatense neutro, claro y conciso.
2. Usa SOLO la información del contexto delimitado por <contexto></contexto>.
3. Si la información no está en el contexto, NO la inventes ni especules.
4. Sé empático y profesional. Hablale al empleado como una persona, no como un manual.
5. Podés usar listas o puntos cuando aporten claridad, pero no abuses.

CÓMO ESCRIBÍS (reglas para sonar humano, no como IA genérica):
- No uses guiones largos (—). Si necesitás separar ideas, usá punto, coma o paréntesis.
- Evitá la "regla de tres" (frases en grupos de tres elementos paralelos). Si tenés tres puntos, escribilos en oraciones distintas o reducí a dos.
- Evitá vocabulario hinchado tipo "delve", "tapestry", "moreover", "furthermore", "in essence", "navigate", "leverage", "robust", "seamless", "holistic", "synergy". Si en español aparecen "profundizar", "navegar", "aprovechar", "robusto", "holístico", "sinergia", reformulá con palabras corrientes.
- Evitá frases de transición vacías tipo "Es importante destacar que", "Cabe mencionar que", "En el mundo actual", "En conclusión".
- No abras con "¡Hola!" ni con un saludo si el usuario no saludó. Andá directo a la respuesta.
- No cierres con coletillas tipo "¿Hay algo más en lo que pueda ayudarte?" salvo que tenga sentido en el contexto.
- Preferí voz activa sobre pasiva. "El empleado debe solicitar" antes que "Debe ser solicitado por el empleado".
- No uses negaciones paralelas decorativas tipo "no es solo X, sino también Y". Decí directo lo que es.
- Evitá adjetivos vagos tipo "crucial", "fundamental", "esencial" cuando no aportan nada.

REGLA DE ESCALACIÓN — MUY IMPORTANTE:
Si ocurre CUALQUIERA de estas situaciones, responde ÚNICAMENTE con la palabra "[HUMAN_ESCALATION]" (sin más texto):
- La respuesta a la pregunta no se encuentra en el contexto proporcionado.
- El usuario pide explícitamente hablar con una persona, un agente o el equipo de RRHH.
- El tema involucra situaciones delicadas como: despidos, acoso laboral, problemas de salud grave, conflictos interpersonales, denuncias, o situaciones de emergencia.
- El usuario expresa frustración significativa o pide ayuda urgente que no puedes resolver.
- La pregunta requiere una decisión o aprobación que solo RRHH puede dar.

No agregues explicaciones adicionales cuando escales. Solo responde: [HUMAN_ESCALATION]`;

// ── Lógica de Escalación ──────────────────────────────────────

const ESCALATION_TAG = '[HUMAN_ESCALATION]';

/**
 * Detecta si la respuesta de la IA requiere escalación humana.
 * @param {string} response  Respuesta del modelo
 * @returns {boolean}
 */
function needsEscalation(response) {
  return response.includes(ESCALATION_TAG);
}

/**
 * Maneja la escalación: registra alerta en consola y genera mensaje para el usuario.
 * @param {string} userMessage  Mensaje original del usuario
 * @returns {string}  Mensaje amable para el usuario
 */
function handleEscalation(userMessage) {
  const timestamp = new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' });

  // Simular alerta/notificación al equipo de RRHH
  console.log('\n' + '='.repeat(60));
  console.log('🚨 ALERTA DE ESCALACIÓN — RRHH Requerido');
  console.log('='.repeat(60));
  console.log(`⏰ Hora: ${timestamp}`);
  console.log(`💬 Consulta del usuario: "${userMessage}"`);
  console.log(`📧 Notificando a RRHH... (En producción: enviar email/Slack/ticket)`);
  console.log('='.repeat(60) + '\n');

  return 'Entiendo tu consulta y quiero asegurarme de que recibas la mejor atención posible. Este tema requiere la atención directa de nuestro equipo de Recursos Humanos. 🤝\n\nHe notificado a un agente de RRHH y se pondrá en contacto contigo a la brevedad. Si es urgente, puedes contactarlos directamente al correo **rrhh@empresa.com** o al interno **1234**.\n\n¿Hay algo más en lo que pueda ayudarte mientras tanto?';
}

// ── Endpoint Principal: /chat ─────────────────────────────────

app.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'El campo "message" es requerido.' });
  }

  const userMessage = message.trim();

  // 1. Verificar que haya embeddings cargados
  if (embeddingsDB.length === 0) {
    return res.status(503).json({
      error: 'La base de conocimiento no está disponible. Ejecuta "node ingestar.js" primero.',
    });
  }

  try {
    // 2. Vectorizar la consulta del usuario
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: userMessage,
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // 3. Buscar los chunks más relevantes por similitud del coseno
    const topChunks = findTopKChunks(queryVector, TOP_K);

    // 4. Construir el contexto para el modelo
    const contexto = topChunks
      .map((chunk, i) => `[Fuente ${i + 1}: ${chunk.source} | Relevancia: ${(chunk.score * 100).toFixed(1)}%]\n${chunk.text}`)
      .join('\n\n---\n\n');

    // 5. Construir el historial de conversación para Claude.
    //    Anthropic separa system del array de messages. Los roles válidos
    //    son 'user' y 'assistant'; nada de 'system' en messages.
    //    Normalizamos el history por si el frontend manda roles legacy.
    const normalizedHistory = history
      .slice(-10)
      .filter(turn => turn && turn.content)
      .map(turn => ({
        role: turn.role === 'assistant' || turn.role === 'bot' ? 'assistant' : 'user',
        content: String(turn.content),
      }));

    const messages = [
      ...normalizedHistory,
      // Mensaje actual con contexto RAG inyectado
      {
        role: 'user',
        content: `<contexto>\n${contexto}\n</contexto>\n\nPregunta del empleado: ${userMessage}`,
      },
    ];

    // 6. Llamar a Claude Haiku 4.5
    const completion = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    // La respuesta viene como content blocks (array). Extraemos el primer
    // bloque de texto. Defensivo: si por alguna razón no hay texto, fallback.
    const rawResponse =
      completion.content.find(b => b.type === 'text')?.text ?? '';

    // 7. Detectar si requiere escalación humana
    if (needsEscalation(rawResponse)) {
      const escalationMessage = handleEscalation(userMessage);
      return res.json({
        reply: escalationMessage,
        escalated: true,
        sources: [],
      });
    }

    // 8. Respuesta normal — incluir fuentes para transparencia
    const sources = [...new Set(topChunks.map(c => c.source))];

    return res.json({
      reply: rawResponse,
      escalated: false,
      sources,
      topScore: topChunks[0]?.score || 0,
    });

  } catch (err) {
    // Stderr síncrono para garantizar flush antes del response.
    process.stderr.write(`❌ Error en /chat: ${err.name}: ${err.message}\n`);
    if (err.stack) process.stderr.write(err.stack + '\n');

    // Distinguir errores de API vs errores internos.
    // 401 puede venir de OpenAI (embeddings) o Anthropic (chat).
    if (err.status === 401) {
      return res.status(500).json({
        error: 'API key inválida. Verificá OPENAI_API_KEY y ANTHROPIC_API_KEY en el .env.',
      });
    }
    if (err.status === 429) {
      return res.status(429).json({
        error: 'Límite de solicitudes alcanzado. Intentá en un momento.',
      });
    }
    if (err.status === 529) {
      return res.status(503).json({
        error: 'El modelo está sobrecargado. Intentá en un momento.',
      });
    }

    return res.status(500).json({ error: 'Error interno del servidor. Por favor intentá de nuevo.' });
  }
});

// ── Endpoint de salud ─────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    chunksLoaded: embeddingsDB.length,
    model: CHAT_MODEL,
    embeddingModel: EMBEDDING_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// ── Iniciar servidor ──────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🟢 Servidor RRHH RAG corriendo en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat API: POST http://localhost:${PORT}/chat\n`);
});
