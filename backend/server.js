// ============================================================
// server.js - API RAG de RRHH (GenteCR)
// Servidor Express con busqueda por similitud del coseno,
// integracion con Anthropic Claude y logica de escalacion.
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();

// Inicializacion de clientes API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('AVISO: ANTHROPIC_API_KEY no esta configurada en el archivo .env');
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'mock-key' });

const PORT = process.env.PORT || 3000;
const EMBEDDINGS_FILE = path.join(__dirname, 'embeddings_rrhh.json');
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'claude-sonnet-4-6';
const TOP_K = 6; // Numero de chunks mas relevantes a recuperar

// -- Middleware ------------------------------------------------

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -- Carga de embeddings en memoria ---------------------------

let embeddingsDB = [];
let availableDocumentsList = '';

function updateAvailableDocuments() {
  if (embeddingsDB.length === 0) {
    availableDocumentsList = '(No hay documentos cargados en el sistema)';
    return;
  }
  const uniqueSources = [...new Set(embeddingsDB.map(chunk => chunk.source))];
  availableDocumentsList = uniqueSources
    .map(s => {
      const cleanName = s
        .replace(/\.pdf$/i, '')
        .replace(/_/g, ' ');
      return '- ' + cleanName + ' (Archivo: ' + s + ')';
    })
    .join('\n');
}

function loadEmbeddings() {
  if (!fs.existsSync(EMBEDDINGS_FILE)) {
    console.warn('AVISO: embeddings_rrhh.json no encontrado. Ejecuta "node ingestar.js" primero.');
    return;
  }
  try {
    embeddingsDB = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf-8'));
    console.log('OK Base de conocimiento cargada: ' + embeddingsDB.length + ' chunks en memoria.');
    updateAvailableDocuments();
  } catch (err) {
    console.error('ERROR cargando embeddings:', err.message);
  }
}

// Recargar embeddings cuando el archivo cambia (util en desarrollo)
fs.watchFile(EMBEDDINGS_FILE, () => {
  console.log('Detectado cambio en embeddings_rrhh.json. Recargando...');
  loadEmbeddings();
});

loadEmbeddings();

// -- Similitud del Coseno -------------------------------------

/**
 * Calcula la similitud del coseno entre dos vectores.
 * @param {number[]} a  Vector A
 * @param {number[]} b  Vector B
 * @returns {number} Puntuacion de similitud [0, 1]
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
 * Busca los K chunks mas relevantes para una consulta vectorizada.
 * @param {number[]} queryVector  Vector de la consulta del usuario
 * @param {number} topK  Numero de resultados a retornar
 * @returns {Array} Chunks ordenados por similitud descendente
 */
function findTopKChunks(queryVector, topK) {
  if (topK === undefined) topK = TOP_K;
  const scored = embeddingsDB.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// -- System Prompt --------------------------------------------

function getSystemPrompt() {
  const docList = availableDocumentsList || '(No hay documentos cargados)';

  // Obtener la fecha y hora actual en la zona horaria de Costa Rica (Garnier & Garnier)
  const currentDateCR = new Date().toLocaleDateString('es-CR', {
    timeZone: 'America/Costa_Rica',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTimeCR = new Date().toLocaleTimeString('es-CR', {
    timeZone: 'America/Costa_Rica',
    hour: '2-digit',
    minute: '2-digit'
  });

  return [
    'Eres un asistente virtual de Recursos Humanos (RRHH) amable, empatico y altamente profesional de la empresa Garnier y Garnier.',
    'Tu objetivo es ayudar a los empleados respondiendo sus dudas sobre politicas internas, tramites, beneficios, procesos de la empresa y temas laborales, basandote en el contexto provisto y la lista de documentos disponibles.',
    '',
    '--- CONTEXTO TEMPORAL ACTUAL (CRITICO) ---',
    `Fecha actual de hoy: ${currentDateCR}`,
    `Hora actual en Costa Rica: ${currentTimeCR}`,
    'Usa esta informacion temporal para situar correctamente las consultas en el tiempo. Por ejemplo, si el usuario pregunta sobre traslados de feriados de este ano, considera que el ano en curso es el indicado arriba.',
    '',
    '--- INVENTARIO DE DOCUMENTOS DISPONIBLES ---',
    'En nuestra base de datos contamos con los siguientes documentos oficiales:',
    docList,
    '',
    '--- REGLAS DE CONVERSACION Y RAG ---',
    '1. SALUDOS Y CORTESIA: Si el usuario te saluda, agradece o se despide (ej. "Hola", "Buenos dias", "Gracias", "Adios"), responde de forma natural, cordial y profesional. No requieres contexto para estas interacciones.',
    '2. USO DEL CONTEXTO: Responde a las consultas laborales utilizando la informacion dentro de las etiquetas <contexto></contexto>. Se preciso y cita la fuente del documento (ej. "segun el Codigo de Conducta (RH-00)...").',
    '3. ASOCIACION SEMANTICA INTELIGENTE: Relaciona conceptos sinonimos de manera inteligente. Por ejemplo:',
    '   - "Dia del trabajador", "Primero de mayo" o "1 de mayo" = feriados obligatorios en el Codigo de Trabajo.',
    '   - "Ropa", "vestirse", "uniforme" = Politica de Codigo de vestimenta.',
    '   - "Viaje", "transporte", "hospedaje", "hotel" = Politica de viaticos.',
    '   - "Acoso", "bullying", "maltrato", "hostigamiento" = Politica contra el Hostigamiento.',
    '   - "Teletrabajo", "trabajo remoto", "home office" = Politica de teletrabajo.',
    '4. SINTESIS Y CONSULTAS GENERALES: Si el usuario pide un resumen general (ej. "resumeme las politicas" o "que politicas hay?"), DEBES:',
    '   a) Listar TODOS los documentos del INVENTARIO DE DOCUMENTOS DISPONIBLES.',
    '   b) Para los documentos presentes en el <contexto>, proporciona un breve resumen de 1-2 lineas.',
    '   c) Para los demas documentos del inventario no presentes en el contexto, mencionalos e indica que el usuario puede preguntarte especificamente sobre ellos.',
    '5. PREGUNTAS FUERA DE TEMA: Si el usuario pregunta sobre temas no laborales (ej. "escribe codigo Python", "quien descubrio America"), responde amablemente que eres un asistente de RRHH y solo puedes ayudar con temas de la empresa y legislacion laboral. NO escales a humano en estos casos.',
    '',
    '--- REGLAS ESTRICTAS DE FORMATO (CHAT EN TEXTO PLANO) ---',
    'La interfaz de chat de usuario NO renderiza Markdown. Por lo tanto, para garantizar una lectura facil, clara y amigable:',
    '- NUNCA uses asteriscos (** ni *) para negrita o cursiva. Escribe las palabras importantes en MAYUSCULAS o entre comillas simples si necesitas enfatizarlas.',
    '- NUNCA uses tablas de Markdown (con tuberias | o guiones ---). En su lugar, presenta cualquier dato tabular como una lista limpia de puntos de viñeta usando guiones (ej. "- 1 de enero: Ano Nuevo").',
    '- NUNCA uses simbolos de numeral (#, ##, ###) para titulos. Usa textos cortos en MAYUSCULAS para separar secciones o temas.',
    '- Deja espacios (lineas en blanco dobles) entre parrafos para que el texto respire.',
    '- Utiliza emojis de forma amigable (ej. 😊, 📅, ⚠️, 💡) para hacer la lectura mas amena y dinamica.',
    '- Estructura las respuestas de manera muy simple y directa. Evita bloques de texto gigantescos.',
    '',
    '--- REGLAS DE ESCALACION A HUMANO (CRITICA) ---',
    'Responde UNICAMENTE con el texto "[HUMAN_ESCALATION]" (sin ningun otro texto, saludo, disculpa ni explicacion) si ocurre alguno de estos casos:',
    '- El usuario pregunta algo especifico sobre politicas, procedimientos, salarios, beneficios o tramites internos cuya respuesta NO esta clara en el <contexto> provisto.',
    '- El usuario pide explicitamente hablar con una persona, agente u operador, o contactar al equipo de RRHH.',
    '- El tema involucra acoso, violencia, quejas graves, disputas legales, despidos, renuncias formales o emergencias.',
    '- El usuario expresa frustracion o enojo significativo.',
    '- La consulta requiere una decision, excepcion o aprobacion directa de la administracion.',
    '',
    'RECUERDA: Si vas a escalar, tu respuesta debe ser exactamente: [HUMAN_ESCALATION]',
  ].join('\n');
}

// -- Logica de Escalacion -------------------------------------

const ESCALATION_TAG = '[HUMAN_ESCALATION]';

/**
 * Detecta si la respuesta de la IA requiere escalacion humana.
 * @param {string} response  Respuesta del modelo
 * @returns {boolean}
 */
function needsEscalation(response) {
  return response.includes(ESCALATION_TAG);
}

/**
 * Normaliza y valida el historial para cumplir con las reglas del SDK de Anthropic (roles alternados).
 */
function sanitizeMessagesForAnthropic(history, currentMessage) {
  const cleaned = [];

  // Mapear historial
  for (const turn of history) {
    const role = turn.role === 'bot' || turn.role === 'assistant' ? 'assistant' : 'user';
    const text = turn.text || turn.content || '';
    if (text.trim() !== '') {
      cleaned.push({ role, content: text });
    }
  }

  // Agregar mensaje actual
  cleaned.push(currentMessage);

  // Asegurar roles alternados combinando mensajes consecutivos del mismo rol
  const alternating = [];
  for (const msg of cleaned) {
    if (alternating.length > 0 && alternating[alternating.length - 1].role === msg.role) {
      alternating[alternating.length - 1].content += '\n' + msg.content;
    } else {
      alternating.push(msg);
    }
  }

  // Anthropic requiere que el primer mensaje sea del rol 'user'
  while (alternating.length > 0 && alternating[0].role !== 'user') {
    alternating.shift();
  }

  return alternating;
}

// -- Endpoint Principal: /chat --------------------------------

app.post('/chat', async (req, res) => {
  // Acepta 'pregunta' (GenteCR frontend) o 'message' (formato original)
  const userMessage = req.body.pregunta || req.body.message;
  // Acepta 'historial' (GenteCR frontend) o 'history' (formato original)
  const clientHistory = req.body.historial || req.body.history || [];

  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
    return res.status(400).json({ error: 'El campo "pregunta" o "message" es requerido.' });
  }

  const queryText = userMessage.trim();

  // 1. Verificar que haya embeddings cargados
  if (embeddingsDB.length === 0) {
    return res.status(503).json({
      error: 'La base de conocimiento no esta disponible. Ejecuta "node ingestar.js" primero.',
    });
  }

  try {
    // 2. Vectorizar la consulta usando OpenAI (embeddings modelo compatible con embeddingsDB)
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: queryText,
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // 3. Buscar chunks mas relevantes
    const topChunks = findTopKChunks(queryVector, TOP_K);

    // Si no hay chunks o la similitud es bajisima (umbral de seguridad), escalamos directamente
    if (topChunks.length === 0 || topChunks[0].score < 0.25) {
      console.log('Similitud muy baja (' + (topChunks[0] ? topChunks[0].score : 0) + '). Escalando a humano directamente.');
      return res.json({
        respuesta: null,
        puede_escalar: true
      });
    }

    // 4. Construir el contexto para el modelo
    const contexto = topChunks
      .map((chunk, i) => '[Fuente ' + (i + 1) + ': ' + chunk.source + ' | Relevancia: ' + (chunk.score * 100).toFixed(1) + '%]\n' + chunk.text)
      .join('\n\n---\n\n');

    // 5. Formatear y sanitizar mensajes para Anthropic Claude
    const currentMessage = {
      role: 'user',
      content: '<contexto>\n' + contexto + '\n</contexto>\n\nPregunta del empleado: ' + queryText,
    };

    const messages = sanitizeMessagesForAnthropic(clientHistory, currentMessage);

    // 6. Llamar a Anthropic Claude
    const completion = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1000,
      temperature: 0.3,
      system: getSystemPrompt(),
      messages: messages,
    });

    const rawResponse = completion.content[0].text;

    // 7. Detectar si requiere escalacion humana
    if (needsEscalation(rawResponse)) {
      console.log('Claude indico [HUMAN_ESCALATION]. Retornando respuesta nula para escalado en frontend.');
      return res.json({
        respuesta: null,
        puede_escalar: true
      });
    }

    // 8. Respuesta normal con la fuente mas relevante para el frontend de GenteCR
    const topChunk = topChunks[0];
    const fuente = {
      doc: topChunk.source.replace(/\.pdf$/i, ''),
      seccion: 'Seccion de ' + topChunk.source.replace(/\.pdf$/i, ''),
      pagina: topChunk.chunkIndex + 1
    };

    return res.json({
      respuesta: rawResponse,
      fuente: fuente,
      confianza: topChunk.score
    });

  } catch (err) {
    console.error('ERROR en /chat:', err.message);

    if (err.status === 401) {
      return res.status(500).json({ error: 'API Key invalida. Verifica tu archivo .env.' });
    }
    return res.status(500).json({ error: 'Error interno del servidor. Por favor intenta de nuevo.' });
  }
});

// -- Endpoint de Escalacion: /escalate -------------------------

app.post('/escalate', (req, res) => {
  const { pregunta, historial = [] } = req.body;
  const timestamp = new Date().toLocaleString('es-CR', { timeZone: 'America/Costa_Rica' });

  // Registrar alerta de escalacion en consola del servidor
  console.log('\n' + '='.repeat(60));
  console.log('ALERTA DE ESCALACION - RRHH Requerido');
  console.log('='.repeat(60));
  console.log('Hora: ' + timestamp);
  console.log('Consulta a escalar: "' + (pregunta || '(sin pregunta)') + '"');
  console.log('Historial de chat adjunto:');
  historial.forEach((h, index) => {
    console.log('  [' + (index + 1) + '] ' + h.role + ': ' + h.text);
  });
  console.log('Notificando al equipo de RRHH en Garnier & Garnier...');
  console.log('='.repeat(60) + '\n');

  return res.json({ ok: true });
});

// -- Endpoint de salud ----------------------------------------

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    chunksLoaded: embeddingsDB.length,
    model: CHAT_MODEL,
    embeddingModel: EMBEDDING_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// -- Iniciar servidor -----------------------------------------

app.listen(PORT, () => {
  console.log('\nServidor RRHH RAG corriendo en http://localhost:' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/health');
  console.log('Chat API: POST http://localhost:' + PORT + '/chat\n');
});
