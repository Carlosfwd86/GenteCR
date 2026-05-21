// ============================================================
// db.js — Persistencia SQLite para logs de consultas y empleados.
// Archivo local: backend/data.db (ignorado en .gitignore raíz).
// ============================================================

const path = require('path');
const Database = require('better-sqlite3');

const DB_FILE = path.join(__dirname, 'data.db');
const db = new Database(DB_FILE);

// WAL para concurrencia de lecturas durante writes; foreign_keys por sanidad.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Esquema ───────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS consultas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    escalated INTEGER NOT NULL DEFAULT 0,
    sources_json TEXT NOT NULL DEFAULT '[]',
    top_score REAL,
    latency_ms INTEGER,
    used_employee_tool INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE COLLATE NOCASE,
    puesto TEXT,
    fecha_ingreso TEXT,
    vacaciones_disponibles INTEGER,
    vacaciones_tomadas INTEGER,
    email TEXT
  );
`);

// ── Seed condicional de empleados ─────────────────────────────

const SEED = [
  ['Lucas Méndez',       'Desarrollador',         '2023-03-15', 12,  3, 'lucas.mendez@garnier.cr'],
  ['María González',     'Diseñadora UX',         '2022-09-01',  8,  7, 'maria.gonzalez@garnier.cr'],
  ['Carlos Mora',        'Project Manager',       '2021-06-10', 15,  0, 'carlos.mora@garnier.cr'],
  ['Andrea Solano',      'HR Business Partner',   '2024-01-08',  5,  0, 'andrea.solano@garnier.cr'],
  ['Roberto Vargas',     'DevOps',                '2020-11-20',  4, 11, 'roberto.vargas@garnier.cr'],
  ['Sofía Castro',       'QA Lead',               '2023-08-15', 10,  5, 'sofia.castro@garnier.cr'],
  ['Diego Hernández',    'Ventas',                '2022-02-14',  6,  9, 'diego.hernandez@garnier.cr'],
  ['Valentina Ramírez',  'Marketing',             '2024-04-22',  3,  0, 'valentina.ramirez@garnier.cr'],
  ['Pablo Jiménez',      'CFO',                   '2019-05-03', 15,  0, 'pablo.jimenez@garnier.cr'],
  ['Camila Rojas',       'Customer Success',      '2023-11-30',  9,  6, 'camila.rojas@garnier.cr'],
  ['Sebastián Araya',    'Backend Senior',        '2021-09-12', 11,  4, 'sebastian.araya@garnier.cr'],
  ['Isabella Quesada',   'Data Analyst',          '2024-07-01',  7,  0, 'isabella.quesada@garnier.cr'],
];

const empleadosCount = db.prepare('SELECT COUNT(*) AS n FROM empleados').get().n;
if (empleadosCount === 0) {
  const insertEmp = db.prepare(`
    INSERT INTO empleados (nombre, puesto, fecha_ingreso, vacaciones_disponibles, vacaciones_tomadas, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((rows) => {
    for (const row of rows) insertEmp.run(...row);
  });
  tx(SEED);
  console.log(`✅ Seed de empleados insertado (${SEED.length} filas).`);
}

// ── Statements preparados ─────────────────────────────────────

const stmtInsertConsulta = db.prepare(`
  INSERT INTO consultas
    (ts, pregunta, respuesta, escalated, sources_json, top_score, latency_ms, used_employee_tool)
  VALUES
    (@ts, @pregunta, @respuesta, @escalated, @sources_json, @top_score, @latency_ms, @used_employee_tool)
`);

// La búsqueda case+accent-insensitive la hacemos en JS sobre todos los
// empleados (son ~12, no es problema de performance). SQLite LIKE no
// ignora acentos: "Lucas Mendez" no matchearía "Lucas Méndez".
const stmtAllEmpleados = db.prepare(`
  SELECT id, nombre, puesto, fecha_ingreso, vacaciones_disponibles, vacaciones_tomadas, email
  FROM empleados
  ORDER BY id ASC
`);

const stmtTopPreguntas = db.prepare(`
  SELECT pregunta, COUNT(*) AS count
  FROM consultas
  GROUP BY LOWER(pregunta)
  ORDER BY count DESC, MAX(ts) DESC
  LIMIT ?
`);

const stmtGaps = db.prepare(`
  SELECT pregunta, COUNT(*) AS count
  FROM consultas
  WHERE escalated = 1
  GROUP BY LOWER(pregunta)
  ORDER BY count DESC, MAX(ts) DESC
  LIMIT ?
`);

const stmtListEmpleadosPublic = db.prepare(`
  SELECT nombre, puesto, vacaciones_disponibles
  FROM empleados
  ORDER BY nombre ASC
`);

const stmtCountConsultas = db.prepare('SELECT COUNT(*) AS n FROM consultas');
const stmtCountEmpleados = db.prepare('SELECT COUNT(*) AS n FROM empleados');
const stmtAllConsultas = db.prepare(`
  SELECT id, ts, pregunta, respuesta, escalated, sources_json, top_score, latency_ms, used_employee_tool
  FROM consultas
  ORDER BY ts ASC
`);

// ── API pública ───────────────────────────────────────────────

function logConsulta({ pregunta, respuesta, escalated, sources, topScore, latencyMs, usedEmployeeTool }) {
  stmtInsertConsulta.run({
    ts: Date.now(),
    pregunta: String(pregunta ?? ''),
    respuesta: String(respuesta ?? ''),
    escalated: escalated ? 1 : 0,
    sources_json: JSON.stringify(Array.isArray(sources) ? sources : []),
    top_score: typeof topScore === 'number' ? topScore : null,
    latency_ms: Number.isInteger(latencyMs) ? latencyMs : null,
    used_employee_tool: usedEmployeeTool ? 1 : 0,
  });
}

// Normaliza una cadena: minúsculas, sin acentos, sin espacios extra.
// "Lucas Méndez" y "lucas mendez" terminan ambos como "lucas mendez".
function normalize(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function getEmployeeInfo(nombre) {
  if (!nombre || typeof nombre !== 'string') return null;
  const needle = normalize(nombre);
  if (!needle) return null;

  const all = stmtAllEmpleados.all();
  // Primero busco match por substring del nombre completo normalizado.
  let match = all.find((emp) => normalize(emp.nombre).includes(needle));
  if (match) return stripPrivateFields(match);

  // Si no hubo match directo, pruebo token a token: cualquier palabra del
  // nombre del empleado contiene el needle (cubre buscar solo apellido).
  match = all.find((emp) =>
    normalize(emp.nombre).split(/\s+/).some((token) => token.includes(needle))
  );
  return match ? stripPrivateFields(match) : null;
}

function stripPrivateFields(emp) {
  const { id, ...rest } = emp;
  return rest;
}

function topPreguntas(limit = 10) {
  return stmtTopPreguntas.all(limit);
}

function gaps(limit = 10) {
  return stmtGaps.all(limit);
}

function listEmpleadosPublic() {
  return stmtListEmpleadosPublic.all();
}

function counts() {
  return {
    consultas: stmtCountConsultas.get().n,
    empleados: stmtCountEmpleados.get().n,
  };
}

// CSV simple. Escapa comillas dobles duplicándolas y envuelve cualquier
// campo que tenga coma, comilla o salto de línea.
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportarCsv() {
  const header = [
    'id', 'ts_iso', 'pregunta', 'respuesta', 'escalated',
    'sources', 'top_score', 'latency_ms', 'used_employee_tool',
  ];
  const lines = [header.join(',')];
  for (const row of stmtAllConsultas.iterate()) {
    lines.push([
      row.id,
      new Date(row.ts).toISOString(),
      csvEscape(row.pregunta),
      csvEscape(row.respuesta),
      row.escalated ? 'true' : 'false',
      csvEscape(row.sources_json),
      row.top_score ?? '',
      row.latency_ms ?? '',
      row.used_employee_tool ? 'true' : 'false',
    ].join(','));
  }
  return lines.join('\n');
}

module.exports = {
  logConsulta,
  getEmployeeInfo,
  topPreguntas,
  gaps,
  listEmpleadosPublic,
  counts,
  exportarCsv,
};
