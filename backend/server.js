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

const db = require('./db.js');

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
    'http://localhost:5174',
    'http://127.0.0.1:5174',
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

DATOS DE EMPLEADOS:
Si la pregunta es sobre un empleado específico mencionado por nombre (ej: "¿cuántas vacaciones tiene Lucas Méndez?", "¿qué puesto tiene Carlos Mora?"), llamá a la herramienta get_employee_info con su nombre. Si la herramienta devuelve null o un error, respondé que no encontraste ese empleado y sugerí consultar con RH directamente. NO inventes datos sobre empleados que no estén en la respuesta de la herramienta. Esta herramienta es SOLO para datos individuales de personas; NO la uses para preguntas generales sobre políticas.

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
ANTES de escalar, verificá si la pregunta es sobre un empleado específico mencionado por nombre. Si lo es, primero llamá a la herramienta get_employee_info y respondé con esos datos. NO escales preguntas sobre empleados individuales sin haber intentado la herramienta primero.

Si ocurre CUALQUIERA de estas situaciones (y la herramienta no aplica o ya la usaste sin éxito), responde ÚNICAMENTE con la palabra "[HUMAN_ESCALATION]" (sin más texto):
- La respuesta a la pregunta no se encuentra en el contexto proporcionado NI puede obtenerse con la herramienta get_employee_info.
- El usuario pide explícitamente hablar con una persona, un agente o el equipo de RRHH.
- El tema involucra situaciones delicadas como: despidos, acoso laboral, problemas de salud grave, conflictos interpersonales, denuncias, o situaciones de emergencia.
- El usuario expresa frustración significativa o pide ayuda urgente que no puedes resolver.
- La pregunta requiere una decisión o aprobación que solo RRHH puede dar.

No agregues explicaciones adicionales cuando escales. Solo responde: [HUMAN_ESCALATION]`;

// ── Tools (Anthropic tool use) ────────────────────────────────

const TOOLS = [
  {
    name: 'get_employee_info',
    description:
      'Consulta información de un empleado de Garnier & Garnier por su nombre. Devuelve nombre, puesto, fecha de ingreso, vacaciones disponibles y tomadas. Usar SOLO cuando la pregunta del usuario menciona explícitamente el nombre de una persona y necesitás datos individuales (saldo de vacaciones, puesto, etc). NO usar para preguntas generales sobre políticas.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          description: 'Nombre o parte del nombre del empleado a buscar',
        },
      },
      required: ['nombre'],
    },
  },
];

/**
 * Formatea el resultado de getEmployeeInfo como texto legible para Claude.
 * Si el empleado no se encontró (emp == null), devuelve un mensaje claro
 * para que Claude responda apropiadamente.
 */
function formatEmployeeResult(emp) {
  if (!emp) {
    return 'Empleado no encontrado en la base de datos de Garnier & Garnier.';
  }
  const parts = [
    `${emp.nombre} — ${emp.puesto}.`,
    `Ingresó el ${emp.fecha_ingreso}.`,
    `Vacaciones disponibles: ${emp.vacaciones_disponibles} días.`,
    `Vacaciones tomadas este año: ${emp.vacaciones_tomadas} días.`,
  ];
  return parts.join(' ');
}

/**
 * Loop de tool use con Claude. Permite hasta MAX_TOOL_ITER iteraciones para
 * encadenar consultas, pero en la práctica una sola pasada alcanza para el
 * caso simple de get_employee_info.
 *
 * @param {Array} messages  Mensajes iniciales (user/assistant)
 * @returns {Promise<{rawResponse: string, usedEmployeeTool: boolean}>}
 */
async function callClaudeWithTools(messages) {
  const MAX_TOOL_ITER = 3;
  // Trabajamos sobre una copia para no mutar el array del caller.
  const convo = [...messages];
  let usedEmployeeTool = false;

  for (let iter = 0; iter < MAX_TOOL_ITER; iter++) {
    const completion = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: convo,
    });

    // Si el modelo no pidió tools, salimos con el texto.
    if (completion.stop_reason !== 'tool_use') {
      const text = completion.content.find(b => b.type === 'text')?.text ?? '';
      return { rawResponse: text, usedEmployeeTool };
    }

    // El modelo pidió al menos una tool. Agregamos su turno completo
    // (texto + tool_use blocks) al historial y respondemos con tool_result.
    convo.push({ role: 'assistant', content: completion.content });

    const toolUseBlocks = completion.content.filter(b => b.type === 'tool_use');
    const toolResults = [];

    for (const block of toolUseBlocks) {
      let resultText;
      if (block.name === 'get_employee_info') {
        usedEmployeeTool = true;
        try {
          const emp = db.getEmployeeInfo(block.input?.nombre);
          resultText = formatEmployeeResult(emp);
        } catch (err) {
          process.stderr.write(`⚠️  Tool get_employee_info falló: ${err.message}\n`);
          resultText = 'Error consultando la base interna de empleados.';
        }
      } else {
        // Tool desconocida — no debería pasar con un solo tool registrado.
        resultText = `Tool no implementada: ${block.name}`;
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: resultText,
      });
    }

    convo.push({ role: 'user', content: toolResults });
  }

  // Si saltamos el loop sin un stop_reason !== 'tool_use', devolvemos
  // texto vacío y dejamos que el caller maneje el caso.
  process.stderr.write('⚠️  callClaudeWithTools: alcanzó MAX_TOOL_ITER sin respuesta final.\n');
  return { rawResponse: '', usedEmployeeTool };
}

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

  const startedAt = Date.now();

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

    // 6. Llamar a Claude Haiku 4.5 con tool use habilitado
    const { rawResponse, usedEmployeeTool } = await callClaudeWithTools(messages);

    // 7. Detectar si requiere escalación humana
    if (needsEscalation(rawResponse)) {
      const escalationMessage = handleEscalation(userMessage);
      const latencyMs = Date.now() - startedAt;
      try {
        db.logConsulta({
          pregunta: userMessage,
          respuesta: escalationMessage,
          escalated: true,
          sources: [],
          topScore: topChunks[0]?.score ?? null,
          latencyMs,
          usedEmployeeTool,
        });
      } catch (logErr) {
        console.error('⚠️  logConsulta (escalated) falló:', logErr.message);
      }
      return res.json({
        reply: escalationMessage,
        escalated: true,
        sources: [],
      });
    }

    // 8. Respuesta normal — incluir fuentes para transparencia
    const sources = [...new Set(topChunks.map(c => c.source))];
    const topScore = topChunks[0]?.score || 0;
    const latencyMs = Date.now() - startedAt;

    try {
      db.logConsulta({
        pregunta: userMessage,
        respuesta: rawResponse,
        escalated: false,
        sources,
        topScore,
        latencyMs,
        usedEmployeeTool,
      });
    } catch (logErr) {
      console.error('⚠️  logConsulta falló:', logErr.message);
    }

    return res.json({
      reply: rawResponse,
      escalated: false,
      sources,
      topScore,
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

// ── Endpoints admin ───────────────────────────────────────────

app.get('/admin/stats', (req, res) => {
  try {
    const { consultas, empleados } = db.counts();
    res.json({
      topQueries: db.topPreguntas(10),
      gaps: db.gaps(10),
      total: consultas,
      employeesCount: empleados,
    });
  } catch (err) {
    process.stderr.write(`❌ /admin/stats: ${err.message}\n`);
    res.status(500).json({ error: 'No se pudo leer las estadísticas.' });
  }
});

app.get('/admin/queries.csv', (req, res) => {
  try {
    const csv = db.exportarCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="consultas.csv"');
    res.send(csv);
  } catch (err) {
    process.stderr.write(`❌ /admin/queries.csv: ${err.message}\n`);
    res.status(500).json({ error: 'No se pudo exportar el CSV.' });
  }
});

app.get('/admin/employees', (req, res) => {
  try {
    res.json(db.listEmpleadosPublic());
  } catch (err) {
    process.stderr.write(`❌ /admin/employees: ${err.message}\n`);
    res.status(500).json({ error: 'No se pudo listar empleados.' });
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
