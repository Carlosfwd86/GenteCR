// Cliente de "base de datos" simulada: lee public/db.json y busca por keywords.
// Mantiene la firma del contrato de n8n (respuesta, fuente, confianza /
// puede_escalar / ok) para que useChat no necesite cambios.
//
// TODO Fase 3: reemplazar por fetch real al webhook
//   - POST `${import.meta.env.VITE_N8N_WEBHOOK_URL}/chat` con { pregunta }
//   - POST `${import.meta.env.VITE_N8N_WEBHOOK_URL}/escalate` con { pregunta, historial }

const DB_URL = '/db.json';
const ESCALATE_DELAY_MS = 600;

// Normaliza a minúsculas y sin tildes para matching laxo.
function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function randomLatencyMs() {
  return 400 + Math.floor(Math.random() * 500);
}

async function loadDb() {
  const res = await fetch(DB_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`db.json HTTP ${res.status}`);
  return res.json();
}

export async function askQuestion(pregunta) {
  const db = await loadDb();
  const q = normalize(pregunta);

  const match = db.politicas.find((p) =>
    p.keywords.some((kw) => q.includes(normalize(kw))),
  );

  await new Promise((r) => setTimeout(r, randomLatencyMs()));

  if (!match) {
    return { respuesta: null, puede_escalar: true };
  }

  return {
    respuesta: match.respuesta,
    fuente: match.fuente,
    confianza: match.confianza,
  };
}

export async function escalateToHR(pregunta, historial) {
  // Lee db.json como validación simbólica. consultas_log y escalaciones
  // existen como placeholder pero no se mutan (db.json es estático).
  await loadDb();
  void pregunta;
  void historial;
  await new Promise((r) => setTimeout(r, ESCALATE_DELAY_MS));
  return { ok: true };
}
