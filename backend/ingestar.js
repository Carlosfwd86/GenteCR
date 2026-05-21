// ============================================================
// ingestar.js — Script de Ingesta RAG para RRHH
// Lee PDFs de /documentos, genera embeddings con OpenAI y
// los guarda en embeddings_rrhh.json para búsqueda local.
// ============================================================

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DOCUMENTOS_DIR = path.join(__dirname, 'documentos');
const OUTPUT_FILE = path.join(__dirname, 'embeddings_rrhh.json');
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';

// ── Utilidades ────────────────────────────────────────────────

/**
 * Divide un texto largo en chunks con traslape configurable.
 * @param {string} text  Texto completo del documento
 * @param {number} size  Tamaño máximo de cada chunk (caracteres)
 * @param {number} overlap  Caracteres de traslape entre chunks
 * @returns {string[]} Array de chunks de texto
 */
function splitIntoChunks(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    start += size - overlap;
  }
  return chunks.filter(c => c.length > 50); // descartar fragmentos muy cortos
}

/**
 * Genera un embedding para un texto dado usando OpenAI.
 * Incluye reintentos automáticos con backoff exponencial.
 * @param {string} text  Texto a vectorizar
 * @param {number} retries  Número de reintentos
 * @returns {Promise<number[]>} Vector de embedding
 */
async function getEmbedding(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = attempt * 2000;
      console.warn(`  ⚠️  Reintento ${attempt}/${retries} en ${wait / 1000}s... (${err.message})`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ── Procesamiento de PDFs ─────────────────────────────────────

/**
 * Lee y parsea el texto de un archivo PDF.
 * @param {string} filePath  Ruta absoluta al PDF
 * @returns {Promise<string>} Texto extraído
 */
async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  // Normalizar espacios y saltos de línea múltiples
  return data.text.replace(/\s+/g, ' ').trim();
}

// ── Pipeline principal ────────────────────────────────────────

async function main() {
  console.log('\n🚀 Iniciando ingesta de documentos RRHH...\n');

  // Verificar que existe la carpeta /documentos
  if (!fs.existsSync(DOCUMENTOS_DIR)) {
    console.error('❌ La carpeta /documentos no existe. Créala y agrega tus PDFs.');
    process.exit(1);
  }

  // Filtrar solo archivos PDF
  const files = fs.readdirSync(DOCUMENTOS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.error('❌ No se encontraron PDFs en /documentos.');
    process.exit(1);
  }

  console.log(`📂 Documentos encontrados: ${files.length}`);
  files.forEach(f => console.log(`   • ${f}`));
  console.log('');

  // Cargar embeddings existentes si ya hay un archivo previo (modo incremental)
  let allEmbeddings = [];
  const processedSources = new Set();

  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      allEmbeddings = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      allEmbeddings.forEach(e => processedSources.add(e.source));
      console.log(`ℹ️  Se encontraron ${allEmbeddings.length} chunks previos. Modo incremental activado.\n`);
    } catch {
      console.warn('⚠️  No se pudo leer el archivo previo. Se generará uno nuevo.\n');
      allEmbeddings = [];
    }
  }

  let totalChunks = 0;
  let totalNew = 0;

  for (const file of files) {
    const filePath = path.join(DOCUMENTOS_DIR, file);

    if (processedSources.has(file)) {
      console.log(`⏭️  Omitiendo "${file}" (ya procesado)`);
      continue;
    }

    console.log(`📄 Procesando: ${file}`);

    let text;
    try {
      text = await extractTextFromPDF(filePath);
    } catch (err) {
      console.error(`   ❌ Error leyendo PDF: ${err.message}`);
      continue;
    }

    const chunks = splitIntoChunks(text);
    console.log(`   ✂️  Chunks generados: ${chunks.length}`);
    totalChunks += chunks.length;

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      process.stdout.write(`   🔄 Embedding ${i + 1}/${chunks.length}...`);

      try {
        const vector = await getEmbedding(chunkText);
        allEmbeddings.push({
          id: `${file.replace('.pdf', '')}_chunk_${i}`,
          source: file,
          chunkIndex: i,
          text: chunkText,
          vector,
        });
        process.stdout.write(' ✅\n');
        totalNew++;

        // Guardar progreso parcial cada 10 chunks
        if ((i + 1) % 10 === 0) {
          fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEmbeddings, null, 2));
        }

        // Pequeña pausa para no saturar la API
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        process.stdout.write(` ❌ ${err.message}\n`);
      }
    }

    console.log(`   ✅ "${file}" completado.\n`);
  }

  // Guardar resultado final
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allEmbeddings, null, 2));

  console.log('═══════════════════════════════════════════');
  console.log(`✅ Ingesta completada.`);
  console.log(`   Total chunks en base: ${allEmbeddings.length}`);
  console.log(`   Chunks nuevos agregados: ${totalNew}`);
  console.log(`   Archivo guardado: embeddings_rrhh.json`);
  console.log('═══════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal en la ingesta:', err.message);
  process.exit(1);
});
