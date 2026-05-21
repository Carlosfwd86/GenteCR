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

// Inicializar la lista de documentos disponibles de inmediato
updateAvailableDocuments();

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
    'Sos un asistente virtual de Recursos Humanos de Garnier & Garnier, amable, empatico y altamente profesional.',
    'Tu funcion es responder preguntas de los empleados sobre politicas internas de la empresa, tramites, beneficios, procesos de RRHH y temas laborales, basandote en el contexto proporcionado y en la lista de documentos.',
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
    '--- REGLAS FUNDAMENTALES ---',
    '1. Responde siempre en español rioplatense neutro, claro y conciso.',
    '2. Usa SOLO la informacion del contexto delimitado por <contexto></contexto>.',
    '3. Si la informacion no esta en el contexto, NO la inventes ni especules.',
    '4. Se empatico y profesional. Hablale al empleado como una persona, no como un manual.',
    '5. Podes usar listas o puntos cuando aporten claridad, pero no abuses.',
    '6. SALUDOS Y CORTESIA: Si el usuario te saluda, agradece o se despide (ej. "Hola", "Buenos dias", "Gracias", "Adios"), responde de forma natural, cordial y profesional. No requieres contexto para estas interacciones.',
    '7. ASOCIACION SEMANTICA INTELIGENTE: Relaciona conceptos sinonimos de manera inteligente. Por ejemplo:',
    '   - "Dia del trabajador", "Primero de mayo" o "1 de mayo" = feriados obligatorios en el Codigo de Trabajo.',
    '   - "Ropa", "vestirse", "uniforme" = Politica de Codigo de vestimenta.',
    '   - "Viaje", "transporte", "hospedaje", "hotel" = Politica de viaticos.',
    '   - "Acoso", "bullying", "maltrato", "hostigamiento" = Politica contra el Hostigamiento.',
    '   - "Teletrabajo", "trabajo remoto", "home office" = Politica de teletrabajo.',
    '8. SINTESIS Y CONSULTAS GENERALES: Si el usuario pide un resumen general (ej. "resumeme las politicas" o "que politicas hay?"), DEBES:',
    '   a) Listar TODOS los documentos del INVENTARIO DE DOCUMENTOS DISPONIBLES.',
    '   b) Para los documentos presentes en el <contexto>, proporciona un breve resumen de 1-2 lineas.',
    '   c) Para los demas documentos del inventario no presentes en el contexto, mencionalos e indica que el usuario puede preguntarte especificamente sobre ellos.',
    '9. PREGUNTAS FUERA DE TEMA: Si el usuario pregunta sobre temas no laborales (ej. "escribe codigo Python", "quien descubrio America"), responde amablemente que eres un asistente de RRHH y solo puedes ayudar con temas de la empresa y legislacion laboral. NO escales a humano en estos casos.',
    '',
    'DATOS DE EMPLEADOS:',
    'Si la pregunta es sobre un empleado especifico mencionado por nombre (ej: "¿cuantas vacaciones tiene Lucas Mendez?", "¿que puesto tiene Carlos Mora?"), llama a la herramienta get_employee_info con su nombre. Si la herramienta devuelve null o un error, responde que no encontraste ese empleado y sugiere consultar con RRHH directamente. NO inventes datos sobre empleados que no esten en la respuesta de la herramienta. Esta herramienta es SOLO para datos individuales de personas; NO la uses para preguntas generales sobre politicas.',
    '',
    'COMO ESCRIBIS (reglas para sonar humano, no como IA generica):',
    '- No uses guiones largos (—). Si necesitas separar ideas, usa punto, coma o parentesis.',
    '- Evita la "regla de tres" (frases en grupos de tres elementos paralelos). Si tienes tres puntos, escribilos en oraciones distintas o reduci a dos.',
    '- Evita vocabulario hinchado tipo "delve", "tapestry", "moreover", "furthermore", "in essence", "navigate", "leverage", "robust", "seamless", "holistic", "synergy". Si en español aparecen "profundizar", "navegar", "aprovechar", "robusto", "holistico", "sinergia", reformula con palabras corrientes.',
    '- Evita frases de transicion vacias tipo "Es importante destacar que", "Cabe mencionar que", "En el mundo actual", "En conclusion".',
    '- No abras con "¡Hola!" ni con un saludo si el usuario no saludo. Anda directo a la respuesta.',
    '- No cierres con coletillas tipo "¿Hay algo mas en lo que pueda ayudarte?" salvo que tenga sentido en el contexto.',
    '- Preferi voz activa sobre pasiva. "El empleado debe solicitar" antes que "Debe ser solicitado por el empleado".',
    '- No uses negaciones paralelas decorativas tipo "no es solo X, sino tambien Y". Deci directo lo que es.',
    '- Evita adjetivos vagos tipo "crucial", "fundamental", "esencial" cuando no aportan nada.',
    '',
    '--- REGLAS ESTRICTAS DE FORMATO (CHAT EN TEXTO PLANO) ---',
    'La interfaz de chat de usuario NO renderiza Markdown. Por lo tanto, para garantizar una lectura facil, clara y amigable:',
    '- CONCISION AL GRANO: Ve directo al punto sin rodeos, introducciones innecesarias o conclusiones repetitivas.',
    '- ADAPTACION DE LONGITUD DINAMICA: Analiza la complejidad de la pregunta para modular la longitud de la respuesta:',
    '  * PREGUNTAS SIMPLES/DIRECTAS (ej. "¿Cuanto es el subsidio?", "¿Cual es el horario?"): Responde con un parrafo de 2 a 4 lineas que contenga el dato exacto de forma clara y directa.',
    '  * PREGUNTAS COMPLEJAS/DETALLADAS (ej. "Resume la politica", "¿Cuales son los requisitos para X?"): Utiliza viñetas cortas y estructuradas, explicando de forma completa pero muy resumida y sin redundancias.',
    '- NUNCA uses asteriscos (** ni *) para negrita o cursiva. Escribe las palabras importantes en MAYUSCULAS o entre comillas simples si necesitas enfatizarlas.',
    '- NUNCA uses tablas de Markdown (con tuberias | o guiones ---). En su lugar, presenta cualquier dato tabular como una lista limpia de puntos de viñeta usando guiones (ej. "- 1 de enero: Ano Nuevo").',
    '- NUNCA uses simbolos de numeral (#, ##, ###) para titulos. Usa textos cortos en MAYUSCULAS para separar secciones o temas.',
    '- Deja espacios (lineas en blanco dobles) entre parrafos para que el texto respire.',
    '- Utiliza emojis de forma amigable (ej. 😊, 📅, ⚠️, 💡) para hacer la lectura mas amena y dinamica.',
    '- Estructura las respuestas de manera muy simple y directa. Evita bloques de texto gigantescos.',
    '',
    '--- REGLAS DE ESCALACION A HUMANO (CRITICA) ---',
    'Si ocurre cualquiera de estas situaciones:',
    '- La respuesta a la pregunta no se encuentra en el contexto proporcionado NI puede obtenerse con la herramienta get_employee_info.',
    '- El usuario pide explícitamente hablar con una persona, un agente o el equipo de RRHH.',
    '- El tema involucra situaciones delicadas como: despidos, acoso laboral, problemas de salud grave, conflictos interpersonales, denuncias, o situaciones de emergencia.',
    '- El usuario expresa frustración significativa o pide ayuda urgente que no puedes resolver.',
    '- La pregunta requiere una decisión o aprobación que solo RRHH puede dar.',
    '',
    'DEBES redactar una respuesta sumamente empática, cálida y profesional, explicando de manera humana que la consulta es delicada o requiere la atención personalizada de un especialista del equipo de Recursos Humanos para brindarle el mejor soporte de forma confidencial. Al final de tu mensaje, en una nueva línea, DEBES escribir exactamente el tag "[HUMAN_ESCALATION]":',
    'Por ejemplo: "Entiendo completamente que estás pasando por un momento sumamente difícil y estresante con esta situación. Quiero asegurarme de que recibas la atención y el apoyo adecuado. Debido a la naturaleza delicada de este tema, es importante que sea atendido directamente y con total confidencialidad por un especialista de nuestro equipo de Recursos Humanos.\n\n[HUMAN_ESCALATION]"',
    '',
    'RECUERDA: Si vas a escalar, redacta primero tu respuesta cálida y empática explicándole al empleado que lo derivarás a Recursos Humanos, y luego finaliza siempre en una nueva línea con el tag exacto: [HUMAN_ESCALATION]'
  ].join('\n');
}

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
 * Formatea el resultado de db.getEmployeeInfo como texto legible para el modelo.
 * El modelo lee mejor texto natural que JSON crudo.
 */
function formatEmployeeResult(emp) {
  if (!emp) return 'Empleado no encontrado en la base interna de Garnier & Garnier.';
  return [
    `${emp.nombre} — ${emp.puesto}.`,
    `Ingresó el ${emp.fecha_ingreso}.`,
    `Vacaciones disponibles: ${emp.vacaciones_disponibles} días.`,
    `Vacaciones tomadas este año: ${emp.vacaciones_tomadas} días.`,
  ].join(' ');
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
      system: getSystemPrompt(),
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

// ── Endpoint Principal: /chat ─────────────────────────────────

app.post('/chat', async (req, res) => {
  // Acepta 'pregunta' (GenteCR frontend) o 'message' (formato original)
  const userMessage = req.body.pregunta || req.body.message;
  // Acepta 'historial' (GenteCR frontend) o 'history' (formamo original)
  const clientHistory = req.body.historial || req.body.history || [];

  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
    return res.status(400).json({ error: 'El campo "pregunta" o "message" es requerido.' });
  }

  const queryText = userMessage.trim();

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
      input: queryText,
    });
    const queryVector = embeddingResponse.data[0].embedding;

    // 3. Buscar los chunks más relevantes por similitud del coseno
    const topChunks = findTopKChunks(queryVector, TOP_K);

    // Si no hay chunks o la similitud es baja (< 0.25), igual enviamos a Claude con contexto vacio
    // para que pueda responder empáticamente y decidir si escala con su propio criterio.
    const similarityOk = topChunks.length > 0 && topChunks[0].score >= 0.25;
    if (!similarityOk) {
      console.log('Similitud baja o nula (' + (topChunks[0] ? topChunks[0].score.toFixed(3) : 0) + '). Dejando que Claude decida si escala.');
    }

    // 4. Construir el contexto para el modelo
    const contexto = similarityOk
      ? topChunks
          .map((chunk, i) => `[Fuente ${i + 1}: ${chunk.source} | Relevancia: ${(chunk.score * 100).toFixed(1)}%]\n${chunk.text}`)
          .join('\n\n---\n\n')
      : '(No hay informacion de contexto relevante disponible en la base de datos para esta pregunta)';

    // 5. Formatear y sanitizar mensajes para Anthropic Claude
    const currentMessage = {
      role: 'user',
      content: `<contexto>\n${contexto}\n</contexto>\n\nPregunta del empleado: ${queryText}`,
    };

    const messages = sanitizeMessagesForAnthropic(clientHistory, currentMessage);

    // 6. Llamar a Claude Haiku 4.5 con tool use habilitado
    const { rawResponse, usedEmployeeTool } = await callClaudeWithTools(messages);

    // 7. Detectar si requiere escalación humana
    if (needsEscalation(rawResponse)) {
      console.log('Claude indico [HUMAN_ESCALATION]. Retornando respuesta empatica para escalado.');
      const cleanResponse = rawResponse.replace(ESCALATION_TAG, '').trim();
      const latencyMs = Date.now() - startedAt;

      try {
        db.logConsulta({
          pregunta: queryText,
          respuesta: cleanResponse || 'Se requiere escalacion a un especialista de RRHH.',
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
        reply: cleanResponse || 'Este tema requiere la atención directa de nuestro equipo de Recursos Humanos. 🤝 He notificado a un agente de RRHH y se pondrá en contacto contigo a la brevedad.',
        respuesta: cleanResponse || 'Este tema requiere la atención directa de nuestro equipo de Recursos Humanos. 🤝 He notificado a un agente de RRHH y se pondrá en contacto contigo a la brevedad.',
        escalated: true,
        puede_escalar: true,
        sources: [],
        topScore: topChunks[0]?.score ?? null
      });
    }

    // 8. Respuesta normal — incluir fuentes para transparencia
    const sources = [...new Set(topChunks.map(c => c.source))];
    const topScore = topChunks[0]?.score || 0;
    const latencyMs = Date.now() - startedAt;

    try {
      db.logConsulta({
        pregunta: queryText,
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

    const topChunk = topChunks[0];
    const fuente = topChunk ? {
      doc: topChunk.source.replace(/\.pdf$/i, ''),
      seccion: 'Seccion de ' + topChunk.source.replace(/\.pdf$/i, ''),
      pagina: topChunk.chunkIndex + 1
    } : null;

    return res.json({
      reply: rawResponse,
      respuesta: rawResponse,
      escalated: false,
      puede_escalar: false,
      sources,
      fuente,
      confianza: topScore,
      topScore
    });

  } catch (err) {
    // Stderr síncrono para garantizar flush antes del response.
    process.stderr.write(`❌ Error en /chat: ${err.name}: ${err.message}\n`);
    if (err.stack) process.stderr.write(err.stack + '\n');

    // Distinguir errores de API vs errores internos.
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
