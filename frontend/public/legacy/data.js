// Mock data for GenteCR dashboard. 48 employees, surveys, announcements.

const FIRST_NAMES = [
  "Sofía","Mateo","Valentina","Diego","Camila","Lucas","Isabella","Andrés",
  "Ana","Tomás","Lucía","Joaquín","Emilia","Bruno","Catalina","Felipe",
  "Renata","Joaquina","Iván","Paula","Martín","Inés","Pablo","Daniela",
  "Sebastián","Antonia","Nicolás","Julieta","Esteban","Florencia",
  "Rodrigo","Mariana","Gabriel","Carolina","Hugo","Sara","Ramón","Luz",
  "Manuel","Helena","Vicente","Constanza","Álvaro","Trinidad","Cristóbal",
  "Begoña","Joel","Magdalena"
];
const LAST_NAMES = [
  "Rojas","Vargas","Hernández","Mora","Castro","Vega","Quirós","Solano",
  "Jiménez","Araya","Brenes","Calderón","Fonseca","Gómez","Madrigal","Núñez",
  "Picado","Ramírez","Salas","Ureña","Zúñiga","Chaves","Méndez","Aguilar",
  "Bonilla","Cordero","Esquivel","Fernández","Granados","Herrera","Loaiza",
  "Mata","Obando","Porras","Retana","Sánchez","Torres","Vásquez","Acuña",
  "Barrantes","Camacho","Delgado","Elizondo","Fallas","Garita","Hidalgo",
  "Leitón","Murillo"
];
const DEPTS = ["Ingeniería","Diseño","Producto","People","Ventas","Operaciones","Finanzas","Marketing"];
const ROLES = {
  "Ingeniería": ["Senior Engineer","Engineer","Tech Lead","Engineer","QA Lead","Engineer"],
  "Diseño":     ["Sr. Designer","Designer","Design Lead","Researcher"],
  "Producto":   ["PM","Sr. PM","Group PM","PMM"],
  "People":     ["HR Partner","Recruiter","Talent Lead","Onboarding"],
  "Ventas":     ["AE","SDR","Sales Lead","CSM"],
  "Operaciones":["Ops Analyst","Ops Lead","Workplace"],
  "Finanzas":   ["Analyst","Controller","FP&A"],
  "Marketing":  ["Content","Growth","Brand","PMM"]
};
const LOCATIONS = ["San José","Heredia","Cartago","Remoto","Alajuela","Liberia"];

function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const rnd = mulberry32(42);
const pick = (arr) => arr[Math.floor(rnd()*arr.length)];
const between = (a,b) => a + Math.floor(rnd()*(b-a+1));
const initials = (n) => n.split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase();

const EMPLOYEES = Array.from({length: 48}).map((_, i) => {
  const first = FIRST_NAMES[i % FIRST_NAMES.length];
  const last = LAST_NAMES[(i*3+7) % LAST_NAMES.length];
  const name = `${first} ${last}`;
  const dept = pick(DEPTS);
  const role = pick(ROLES[dept]);
  const loc = pick(LOCATIONS);
  const hue = (i * 47) % 360;
  // satisfaction 1-5 with float
  const baseSat = 2 + rnd() * 3;
  const noise = (rnd() - 0.5) * 0.6;
  const happiness = Math.max(1, Math.min(5, baseSat + noise));
  const eNPS = Math.round((happiness - 3) * 30 + (rnd()-0.5)*20);
  const workload = Math.round(40 + rnd()*60); // %
  const tenureM = between(1, 84);
  // last 8 mood checks for sparkline
  const trend = Array.from({length: 8}).map((_, k) => {
    const t = baseSat + (rnd()-0.5)*1.2 + (k/8 - 0.5)*((rnd()-0.5)*1.5);
    return Math.max(1, Math.min(5, t));
  });
  const lastResp = between(1, 18); // days ago
  const responded = lastResp <= 7;
  const status = happiness < 2.6 ? "at-risk" : (happiness < 3.4 ? "watch" : "healthy");
  return {
    id: `EMP-${String(1000+i)}`,
    name, first, last, initials: initials(name),
    dept, role, loc,
    hue,
    happiness: Math.round(happiness*10)/10,
    eNPS,
    workload,
    tenureM,
    trend,
    lastResp,
    responded,
    status,
    manager: `EMP-${String(1000 + ((i+3)%48))}`,
    email: `${first.toLowerCase().replace(/[áéíóú]/g, c => ({"á":"a","é":"e","í":"i","ó":"o","ú":"u"}[c]))}.${last.toLowerCase().replace(/[áéíóúñ]/g, c => ({"á":"a","é":"e","í":"i","ó":"o","ú":"u","ñ":"n"}[c]))}@gentecr.com`,
    startedAt: tenureM
  };
});

// Surveys (recibidas vía Microsoft Forms)
const SURVEYS = [
  {
    id: "PULSE-2026-05",
    title: { es: "Pulse semanal · Mayo S3", en: "Weekly pulse · May W3" },
    type: { es: "Pulse", en: "Pulse" },
    sentAt: "2026-05-18",
    closesAt: "2026-05-22",
    sent: 48,
    responses: 41,
    avgSat: 3.8,
    questions: [
      { id:"q1", text:{es:"¿Qué tan satisfecho estás esta semana?",en:"How satisfied are you this week?"}, type:"likert5", avg: 3.9 },
      { id:"q2", text:{es:"¿La carga de trabajo es sostenible?",en:"Is your workload sustainable?"}, type:"likert5", avg: 3.4 },
      { id:"q3", text:{es:"¿Recibiste el reconocimiento que merecías?",en:"Did you get the recognition you deserved?"}, type:"likert5", avg: 3.1 },
      { id:"q4", text:{es:"¿Recomendarías GenteCR como lugar para trabajar?",en:"Would you recommend GenteCR as a place to work?"}, type:"nps", avg: 4.1 },
      { id:"q5", text:{es:"Algo que tu manager debería saber esta semana",en:"Something your manager should know this week"}, type:"text" }
    ]
  },
  {
    id: "ONBO-2026-04",
    title: { es: "Onboarding · 30 días", en: "Onboarding · 30 days" },
    type: { es: "Onboarding", en: "Onboarding" },
    sentAt: "2026-04-30",
    closesAt: "2026-05-07",
    sent: 6, responses: 6, avgSat: 4.4
  },
  {
    id: "ENG-2026-Q1",
    title: { es: "Engagement Q1 2026", en: "Engagement Q1 2026" },
    type: { es: "Trimestral", en: "Quarterly" },
    sentAt: "2026-04-01",
    closesAt: "2026-04-15",
    sent: 46, responses: 44, avgSat: 3.6
  },
  {
    id: "EXIT-RR-031",
    title: { es: "Salida · Rodrigo R.", en: "Exit · Rodrigo R." },
    type: { es: "Salida", en: "Exit" },
    sentAt: "2026-05-10",
    closesAt: "2026-05-12",
    sent: 1, responses: 1, avgSat: 2.4
  }
];

// Text responses (open-ended), small curated set
const TEXT_RESPONSES = [
  { who: EMPLOYEES[3],  q: "q5", text: {
      es: "Me encantaría más espacio para foco profundo. Esta semana hubo demasiadas reuniones.",
      en: "I'd love more space for deep focus. Too many meetings this week." }, sentiment: "neutral" },
  { who: EMPLOYEES[12], q: "q5", text: {
      es: "El equipo está increíble. La sesión del viernes me dejó con muchísima energía.",
      en: "The team is amazing. Friday's session left me with so much energy." }, sentiment: "positive" },
  { who: EMPLOYEES[7],  q: "q5", text: {
      es: "Sigo esperando feedback de la última review. Me ayudaría tener claridad.",
      en: "Still waiting on feedback from the last review. Some clarity would help." }, sentiment: "negative" },
  { who: EMPLOYEES[21], q: "q5", text: {
      es: "Las nuevas herramientas de diseño cambian todo. Gracias por escuchar al equipo.",
      en: "The new design tools change everything. Thanks for listening to the team." }, sentiment: "positive" },
  { who: EMPLOYEES[33], q: "q5", text: {
      es: "Estamos cortos de manos en operaciones. Necesitamos contratar pronto.",
      en: "Ops is shorthanded. We need to hire soon." }, sentiment: "negative" },
  { who: EMPLOYEES[18], q: "q5", text: {
      es: "Mi manager me dio espacio para experimentar y se nota en los resultados.",
      en: "My manager gave me room to experiment and it shows in the results." }, sentiment: "positive" }
];

// Announcements + comments
const ANNOUNCEMENTS = [
  {
    id: "A-014",
    author: EMPLOYEES[5],
    title: { es: "Beneficio nuevo: 4 días al mes 100% remoto", en: "New benefit: 4 days/month fully remote" },
    body: {
      es: "Sabemos que el balance importa. Desde junio cada persona del equipo puede tomar hasta 4 días al mes 100% remotos, sin pedir permiso anticipado. Pongan el día en el calendario y avísenle a su equipo.",
      en: "We know balance matters. Starting June, everyone can take up to 4 fully remote days a month with no advance approval. Put it on the calendar and tell your team."
    },
    postedAt: "Hace 2 días",
    postedAt_en: "2 days ago",
    audience: { es: "Toda la compañía · 48 personas", en: "Whole company · 48 people" },
    reactions: { "❤":18, "🎉":24, "👏":11 },
    readPct: 0.81,
    pinned: true,
    comments: [
      { who: EMPLOYEES[12], body: { es:"Esto es enorme, gracias 🙌", en:"This is huge, thank you 🙌" }, when:"hace 2d", when_en:"2d ago" },
      { who: EMPLOYEES[22], body: { es:"¿Cuenta si tomo medio día?", en:"Does a half day count?" }, when:"hace 2d", when_en:"2d ago" },
      { who: EMPLOYEES[5],  body: { es:"@Renata media jornada cuenta como 0,5. ✌️", en:"@Renata half day counts as 0.5. ✌️" }, when:"hace 1d", when_en:"1d ago", isAuthor:true }
    ]
  },
  {
    id: "A-013",
    author: EMPLOYEES[2],
    title: { es: "Resultados del Pulse de mayo", en: "May Pulse results are in" },
    body: {
      es: "Subimos a 3.8/5 en satisfacción general (vs 3.6 el mes pasado). La carga de trabajo bajó dos puntos. Gracias a todos los que respondieron. El detalle por equipo está disponible en el dashboard.",
      en: "We're up to 3.8/5 in overall satisfaction (vs 3.6 last month). Workload pressure dropped two points. Thanks to everyone who answered. Team detail is in the dashboard."
    },
    postedAt: "Hace 5 días",
    postedAt_en: "5 days ago",
    audience: { es: "Toda la compañía", en: "Whole company" },
    reactions: { "🙌":12, "📈":9 },
    readPct: 0.94,
    comments: []
  },
  {
    id: "A-012",
    author: EMPLOYEES[5],
    title: { es: "Bienvenidas a tres personas nuevas", en: "Welcome to three new teammates" },
    body: {
      es: "Esta semana sumamos a Helena, Iván y Magdalena. Si los ven en Slack, denles la bienvenida 👋.",
      en: "This week we welcomed Helena, Iván and Magdalena. Say hi when you see them 👋."
    },
    postedAt: "Hace 1 semana",
    postedAt_en: "1 week ago",
    audience: { es: "Toda la compañía", en: "Whole company" },
    reactions: { "👋":28, "🎉":15 },
    readPct: 0.88,
    comments: [
      { who: EMPLOYEES[1], body:{es:"¡Bienvenidas!", en:"Welcome!"}, when:"hace 6d", when_en:"6d ago" }
    ]
  }
];

// Department aggregates
function aggByDept() {
  const map = {};
  EMPLOYEES.forEach(e => {
    if (!map[e.dept]) map[e.dept] = { dept: e.dept, count: 0, sat: 0, eNPS: 0, atRisk: 0, responded: 0 };
    const r = map[e.dept];
    r.count++;
    r.sat += e.happiness;
    r.eNPS += e.eNPS;
    if (e.status === "at-risk") r.atRisk++;
    if (e.responded) r.responded++;
  });
  return Object.values(map).map(r => ({
    ...r,
    sat: Math.round(r.sat / r.count * 10) / 10,
    eNPS: Math.round(r.eNPS / r.count),
    responseRate: Math.round(r.responded / r.count * 100)
  })).sort((a,b) => b.sat - a.sat);
}

const COMPANY = {
  satisfaction: Math.round(EMPLOYEES.reduce((a,e)=>a+e.happiness,0)/EMPLOYEES.length*10)/10,
  eNPS: Math.round(EMPLOYEES.reduce((a,e)=>a+e.eNPS,0)/EMPLOYEES.length),
  responseRate: Math.round(EMPLOYEES.filter(e=>e.responded).length/EMPLOYEES.length*100),
  atRisk: EMPLOYEES.filter(e=>e.status==="at-risk").length,
  watch: EMPLOYEES.filter(e=>e.status==="watch").length,
  healthy: EMPLOYEES.filter(e=>e.status==="healthy").length,
  headcount: EMPLOYEES.length
};
// Believable "previous month" baselines for delta math
COMPANY.satisfactionPrev = Math.round((COMPANY.satisfaction - 0.2) * 10) / 10;
COMPANY.eNPSPrev = COMPANY.eNPS - 8;
COMPANY.responseRatePrev = Math.max(10, COMPANY.responseRate - 7);
// 12-week trend ending at current satisfaction
(function(){
  const end = COMPANY.satisfaction;
  const start = end - 0.6;
  const arr = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const base = start + (end - start) * t;
    const wobble = Math.sin(i * 1.7) * 0.08;
    arr.push(Math.round((base + wobble) * 10) / 10);
  }
  arr[arr.length - 1] = end;
  COMPANY.trend = arr;
})();

// 14-day workload bars
const WORKLOAD_TREND = [62,65,71,68,74,80,77,72,69,75,82,78,73,70];

window.GenteCR = {
  EMPLOYEES, SURVEYS, TEXT_RESPONSES, ANNOUNCEMENTS,
  COMPANY, WORKLOAD_TREND,
  aggByDept,
  DEPTS, LOCATIONS
};
