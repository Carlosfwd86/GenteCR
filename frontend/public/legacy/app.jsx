// Root app — routing + tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "es",
  "density": "regular",
  "variant": "editorial"
}/*EDITMODE-END*/;

function App() {
  const [t_, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang = t_.lang === "en" ? "en" : "es";
  const t = window.useT(lang);
  const [route, setRoute] = React.useState("landing"); // "landing" | "dashboard" | "surveys" | "announce" | "employees" | "recruit"
  const [drawerEmp, setDrawerEmp] = React.useState(null);
  const [drawerSurvey, setDrawerSurvey] = React.useState(null);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-density", t_.density || "regular");
  }, [t_.density]);

  const onEnter = () => setRoute("dashboard");
  const openEmployee = (e) => setDrawerEmp(e);
  const openSurvey = (s) => { setDrawerSurvey(s); setRoute("surveys"); };

  const renderRoute = () => {
    if (route === "landing") return <Landing t={t} onEnter={onEnter}/>;
    if (route === "surveys") return <SurveysView t={t} openEmployee={openEmployee} currentSurvey={drawerSurvey}/>;
    if (route === "announce") return <AnnouncementsView t={t}/>;
    if (route === "employees") return <EmployeesView t={t} openEmployee={openEmployee}/>;
    if (route === "recruit") return <RecruitView t={t}/>;
    // dashboard with variant
    if (t_.variant === "ops") return <DashboardOps t={t} openEmployee={openEmployee} openSurvey={openSurvey} setRoute={setRoute}/>;
    if (t_.variant === "bento") return <DashboardBento t={t} openEmployee={openEmployee} openSurvey={openSurvey} setRoute={setRoute}/>;
    return <DashboardEditorial t={t} openEmployee={openEmployee} openSurvey={openSurvey} setRoute={setRoute}/>;
  };

  if (route === "landing") {
    return (
      <>
        {renderRoute()}
        <ChatFAB t={t} landing/>
        <TweaksPanelUI t={t} t_={t_} setTweak={setTweak} />
      </>
    );
  }

  // Floating "back to landing" button in app
  return (
    <div className="app">
      <Sidebar t={t} route={route} setRoute={setRoute} variant={t_.variant}/>
      <div style={{ position: "relative" }}>
        <Topbar t={t} route={route} variant={t_.variant} setVariant={(v) => setTweak("variant", v)}/>
        {renderRoute()}
        <button onClick={() => setRoute("landing")} style={{
          position: "fixed", bottom: 16, left: 16, zIndex: 50,
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line)",
          background: "var(--paper)", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--ink-2)"
        }}>
          <Icon name="home" size={12}/> {t("lang") === "ES" ? "Ver landing" : "View landing"}
        </button>
      </div>
      {drawerEmp && <EmployeeDrawer employee={drawerEmp} onClose={() => setDrawerEmp(null)} t={t}/>}
      <ChatFAB t={t}/>
      <TweaksPanelUI t={t} t_={t_} setTweak={setTweak} />
    </div>
  );
}

function TweaksPanelUI({ t, t_, setTweak }) {  return (
    <TweaksPanel>
      <TweakSection label={t("lang") === "ES" ? "Idioma" : "Language"} />
      <TweakRadio
        label={t("lang") === "ES" ? "Idioma del contenido" : "Content language"}
        value={t_.lang}
        options={[{ value: "es", label: "Español" }, { value: "en", label: "English" }]}
        onChange={(v) => setTweak("lang", v)}
      />
      <TweakSection label={t("lang") === "ES" ? "Densidad" : "Density"} />
      <TweakRadio
        label={t("lang") === "ES" ? "Tamaño general" : "Overall sizing"}
        value={t_.density}
        options={[
          { value: "compact", label: t("density.compact") },
          { value: "regular", label: t("density.regular") },
          { value: "comfy",   label: t("density.comfy") }
        ]}
        onChange={(v) => setTweak("density", v)}
      />
      <TweakSection label={t("lang") === "ES" ? "Variación del dashboard" : "Dashboard variant"} />
      <TweakSelect
        label={t("lang") === "ES" ? "Estilo" : "Style"}
        value={t_.variant}
        options={[
          { value: "editorial", label: t("view.editorial") },
          { value: "ops",       label: t("view.ops") },
          { value: "bento",     label: t("view.bento") }
        ]}
        onChange={(v) => setTweak("variant", v)}
      />
    </TweaksPanel>
  );
}

// Simple recruit view (light)
function RecruitView({ t }) {
  const stages = [
    { k: "applied",   l: t("recruit.applied"),   n: 124, color: "var(--ink-3)" },
    { k: "screening", l: t("lang")==="ES"?"Screening":"Screening", n: 48, color: "var(--sky)" },
    { k: "interview", l: t("recruit.interview"), n: 18, color: "var(--plum)" },
    { k: "offer",     l: t("recruit.offer"),     n: 5,  color: "var(--brand)" },
    { k: "hired",     l: t("recruit.hired"),     n: 2,  color: "var(--olive)" }
  ];
  const D = window.GenteCR;
  const candidates = D.EMPLOYEES.slice(20, 32).map((e, i) => ({
    ...e, stage: stages[(i % stages.length)].k, applied: `${i+1}d`, role: ["Engineer","Designer","PM","Analyst"][i%4]
  }));
  return (
    <div className="main" data-screen-label="06 Reclutamiento">
      <div className="card">
        <div className="row between">
          <div>
            <div className="eyebrow">{t("section.recruit")}</div>
            <h2 className="serif" style={{ fontSize: 30, margin: "6px 0 0", letterSpacing: "-0.01em" }}>
              {t("lang")==="ES"?"Pipeline activo de talento":"Active talent pipeline"}
            </h2>
          </div>
          <button className="btn brand"><Icon name="plus" size={14}/>{t("lang")==="ES"?"Nueva vacante":"New role"}</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: 12, marginTop: 18 }}>
          {stages.map((s, i) => (
            <div key={s.k} style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 12 }}>
              <div className="row between">
                <span className="dot" style={{ background: s.color, width: 8, height: 8 }}/>
                <span className="muted tnum" style={{ fontSize: 11 }}>{i+1}/{stages.length}</span>
              </div>
              <div className="serif" style={{ fontSize: 32, marginTop: 8, letterSpacing: "-0.02em" }}>{s.n}</div>
              <div className="muted" style={{ fontSize: 12 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-flush">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <h3 className="h-section">{t("lang")==="ES"?"Candidatos activos":"Active candidates"}</h3>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("lang")==="ES"?"Candidato":"Candidate"}</th>
              <th>{t("lang")==="ES"?"Vacante":"Role"}</th>
              <th>{t("lang")==="ES"?"Etapa":"Stage"}</th>
              <th>{t("lang")==="ES"?"Antigüedad":"Age"}</th>
              <th>{t("lang")==="ES"?"Próximo paso":"Next step"}</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={i} style={{ cursor: "default" }}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar person={c} size="sm"/>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{c.loc}</div>
                    </div>
                  </div>
                </td>
                <td>{c.role}</td>
                <td>
                  <span className={`pill ${c.stage === "offer" ? "brand" : c.stage === "hired" ? "olive" : c.stage === "interview" ? "plum" : c.stage === "screening" ? "sky" : "ghost"}`}>
                    {stages.find(s => s.k === c.stage).l}
                  </span>
                </td>
                <td className="muted tnum">{c.applied}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{c.stage === "interview" ? (t("lang")==="ES"?"Entrevista técnica":"Tech interview") : c.stage === "offer" ? (t("lang")==="ES"?"Esperando respuesta":"Awaiting response") : (t("lang")==="ES"?"Revisar CV":"Review CV")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Floating chat button — abre el chatbot React en un modal (iframe a /chat/).
// Para abrirlo en página completa: /chat/.
function ChatFAB({ t, landing = false }) {
  const [hovered, setHovered] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const label = (t("lang") === "EN") ? "Ask GenteCR" : "Pregunta a GenteCR";
  const tip = (t("lang") === "EN") ? "AI assistant" : "Asistente IA";

  // Bloquea scroll del body cuando el modal está abierto.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button"
         onClick={() => setOpen(true)}
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
         title={tip}
         aria-label={label}
         style={{
           position: "fixed",
           right: 20,
           bottom: 20,
           zIndex: 55,
           display: "inline-flex",
           alignItems: "center",
           gap: 10,
           padding: hovered ? "0 18px 0 14px" : 0,
           height: 52,
           width: hovered ? "auto" : 52,
           borderRadius: 999,
           background: "linear-gradient(180deg, #1E40AF 0%, #1E3A8A 100%)",
           color: "#FFFFFF",
           boxShadow: "0 12px 28px -8px rgba(30,58,138,0.45), 0 4px 8px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.18)",
           fontWeight: 600,
           fontSize: 13.5,
           letterSpacing: "-0.005em",
           border: "1px solid rgba(255,255,255,0.12)",
           transition: "width .22s cubic-bezier(.32,.72,0,1), padding .22s cubic-bezier(.32,.72,0,1), transform .12s, box-shadow .15s",
           overflow: "hidden",
           whiteSpace: "nowrap",
           transform: hovered ? "translateY(-1px)" : "none",
           cursor: "pointer",
           fontFamily: "inherit"
         }}>
        <span style={{
          width: 52, height: 52, flexShrink: 0,
          display: "grid", placeItems: "center",
          position: "relative"
        }}>
          {/* Pulse ring */}
          <span aria-hidden style={{
            position: "absolute", inset: 8, borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.45)",
            animation: "fabPulse 2.4s ease-out infinite"
          }}/>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-11.6 7.16L4 21l1.84-5.4A8 8 0 1 1 21 12Z"/>
            <circle cx="9" cy="12" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
          {/* Online dot */}
          <span aria-hidden style={{
            position: "absolute", top: 8, right: 8,
            width: 10, height: 10, borderRadius: 999,
            background: "#22C55E",
            border: "2px solid #1E3A8A"
          }}/>
        </span>
        {hovered && (
          <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.15, textAlign: "left" }}>
            <span>{label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.75, letterSpacing: "0.02em" }}>
              {t("lang") === "EN" ? "AI assistant · 24/7" : "Asistente IA · 24/7"}
            </span>
          </span>
        )}
        <style>{`@keyframes fabPulse {
          0% { transform: scale(1); opacity: 0.7; }
          80% { transform: scale(1.45); opacity: 0; }
          100% { transform: scale(1.45); opacity: 0; }
        }`}</style>
      </button>

      {open && <ChatModal t={t} onClose={() => setOpen(false)} />}
    </>
  );
}

// Modal con iframe al chatbot React (/chat/). Se adapta mobile-first.
function ChatModal({ t, onClose }) {
  const closeLabel = (t("lang") === "EN") ? "Close chat" : "Cerrar chat";
  const titleLabel = (t("lang") === "EN") ? "GenteCR Assistant" : "Asistente GenteCR";
  const openFullLabel = (t("lang") === "EN") ? "Open full page" : "Abrir en página completa";

  return (
    <div role="dialog" aria-modal="true" aria-label={titleLabel}
         onClick={onClose}
         style={{
           position: "fixed", inset: 0, zIndex: 60,
           background: "rgba(15, 23, 42, 0.45)",
           backdropFilter: "blur(2px)",
           display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
           padding: "min(24px, 4vw)"
         }}>
      <div onClick={(e) => e.stopPropagation()}
           style={{
             width: "min(420px, 100%)",
             height: "min(640px, calc(100vh - 32px))",
             background: "#FFFFFF",
             borderRadius: 16,
             boxShadow: "0 24px 60px -12px rgba(15,23,42,0.35), 0 8px 16px rgba(15,23,42,0.12)",
             overflow: "hidden",
             display: "flex", flexDirection: "column",
             border: "1px solid rgba(15,23,42,0.08)"
           }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
          background: "linear-gradient(180deg, #1E40AF 0%, #1E3A8A 100%)",
          color: "#FFFFFF"
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
            display: "grid", placeItems: "center"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8 8 0 0 1-11.6 7.16L4 21l1.84-5.4A8 8 0 1 1 21 12Z"/>
            </svg>
          </span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{titleLabel}</span>
          <a href="/chat/index.html" target="_blank" rel="noopener"
             title={openFullLabel} aria-label={openFullLabel}
             style={{
               marginLeft: "auto",
               color: "rgba(255,255,255,0.8)",
               display: "grid", placeItems: "center",
               width: 28, height: 28, borderRadius: 8,
               textDecoration: "none"
             }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7"/><path d="M8 7h9v9"/>
            </svg>
          </a>
          <button type="button" onClick={onClose}
                  aria-label={closeLabel} title={closeLabel}
                  style={{
                    background: "transparent", border: 0,
                    color: "#FFFFFF", cursor: "pointer",
                    width: 28, height: 28, borderRadius: 8,
                    display: "grid", placeItems: "center"
                  }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <iframe src="/chat/index.html" title={titleLabel}
                style={{ flex: 1, width: "100%", border: 0, background: "#FFFFFF" }} />
      </div>
    </div>
  );
}

window.ChatFAB = ChatFAB;
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);