// App chrome: Sidebar + Topbar
function Sidebar({ t, route, setRoute, variant, user }) {
  const me = user || { initials: "AV", hue: 1, name: "Andrea Vargas", role: "People Lead" };
  const items = [
    { key: "dashboard", icon: "dash",   label: t("nav.dashboard") },
    { key: "surveys",   icon: "paper",  label: t("nav.surveys"), count: 4 },
    { key: "announce",  icon: "bell",   label: t("nav.announcements"), count: 2 }
  ];
  const peopleItems = [
    { key: "employees", icon: "people", label: t("nav.employees"), count: 48 },
    { key: "recruit",   icon: "spark",  label: t("nav.recruit") }
  ];
  return (
    <aside className="sidebar">
      <Logo size={53} />
      <button className="btn brand" style={{ width: "100%", justifyContent: "center" }}>
        <Icon name="plus" size={14} />
        {t("topbar.compose")}
      </button>
      <nav className="nav">
        <div className="nav-section">{t("nav.section.work")}</div>
        {items.map((it) => (
          <button key={it.key} className={`nav-item ${route === it.key ? "active" : ""}`} onClick={() => setRoute(it.key)}>
            <Icon name={it.icon} size={16} />
            {it.label}
            {it.count != null && <span className="count">{it.count}</span>}
          </button>
        ))}
        <div className="nav-section">{t("nav.section.people")}</div>
        {peopleItems.map((it) => (
          <button key={it.key} className={`nav-item ${route === it.key ? "active" : ""}`} onClick={() => setRoute(it.key)}>
            <Icon name={it.icon} size={16} />
            {it.label}
            {it.count != null && <span className="count">{it.count}</span>}
          </button>
        ))}
      </nav>
      <div style={{ marginTop: "auto", borderTop: "1px solid var(--line)", paddingTop: 14, display:"flex", flexDirection:"column", gap: 12 }}>
        <button className="nav-item">
          <Icon name="settings" size={16} />
          {t("nav.settings")}
        </button>
        <div className="row" style={{ padding: "4px 10px" }}>
          <Avatar person={{ initials: me.initials, hue: me.hue }} size="sm" />
          <div style={{ fontSize: 12.5, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600 }}>{me.name}</div>
            <div className="muted" style={{ fontSize: 11 }}>{me.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ t, route, variant, setVariant, user, setRoute, openEmployee, openSurvey }) {
  const firstName = user ? user.name.split(" ")[0] : "Andrea";
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return t("good.morning");
    if (h >= 12 && h < 20) return t("good.afternoon");
    return t("good.night");
  };
  const titleMap = {
    dashboard: { es: "Dashboard", en: "Dashboard", crumb: getGreeting() + ", " + firstName },
    surveys: { es: "Encuestas", en: "Surveys", crumb: t("section.responses.sub") },
    announce: { es: "Anuncios", en: "Announcements", crumb: t("lang")==="ES"?"Conversación con tu equipo":"Conversation with your team" },
    employees: { es: "Equipo", en: "Team", crumb: t("lang")==="ES"?`${48} personas activas`:`${48} active people` },
    recruit: { es: "Reclutamiento", en: "Recruiting", crumb: t("lang")==="ES"?"Pipeline esta semana":"Pipeline this week" }
  };
  const m = titleMap[route] || titleMap.dashboard;

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  const D = window.GenteCR;
  const lang = t("lang") === "ES" ? "es" : "en";
  const q = query.toLowerCase().trim();

  const empResults   = q ? D.EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)
  ).slice(0, 5) : [];
  const survResults  = q ? D.SURVEYS.filter(s =>
    s.title[lang].toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
  ).slice(0, 3) : [];
  const annResults   = q ? (D.ANNOUNCEMENTS || []).filter(a =>
    a.title[lang].toLowerCase().includes(q)
  ).slice(0, 3) : [];
  const hasResults = empResults.length + survResults.length + annResults.length > 0;

  React.useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKey = (e) => { if (e.key === "Escape") { setQuery(""); setOpen(false); } };

  const goEmp = (e) => { setQuery(""); setOpen(false); openEmployee(e); };
  const goSurvey = (s) => { setQuery(""); setOpen(false); openSurvey(s); };
  const goAnnounce = () => { setQuery(""); setOpen(false); setRoute("announce"); };

  const pillStyle = { fontSize: 10.5, padding: "2px 7px", borderRadius: 999, background: "var(--bg-2)", color: "var(--ink-3)", border: "1px solid var(--line-2)" };
  const rowStyle = { display:"flex", alignItems:"center", gap: 10, padding: "8px 12px", cursor:"pointer", borderRadius: 8, transition:"background .1s" };

  return (
    <div className="topbar">
      <div className="crumb">
        <h1>{t(`nav.${route === "announce" ? "announcements" : route}`) || m.es}</h1>
        <span className="small">· {m.crumb}</span>
      </div>
      <div className="right">
        <div ref={wrapRef} style={{ position: "relative" }}>
          <div className="input" style={{ display:"flex", alignItems:"center", gap: 8, padding: "0 12px", width: 280,
            boxShadow: open ? "0 0 0 2px var(--brand)" : "none", transition: "box-shadow .15s" }}>
            <Icon name="search" size={14} stroke="var(--ink-3)" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKey}
              style={{ border: 0, background: "transparent", outline: "none", font: "inherit", color: "inherit", flex: 1, height: "100%" }}
              placeholder={t("topbar.search")}
            />
            {query && (
              <button onClick={() => { setQuery(""); setOpen(false); }} style={{ background:"transparent", border:0, cursor:"pointer", color:"var(--ink-3)", display:"grid", placeItems:"center", padding:0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          {open && q && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, width: 360, zIndex: 100,
              background: "var(--paper)", border: "1px solid var(--line)",
              borderRadius: 14, boxShadow: "0 12px 32px -8px rgba(15,23,42,0.18), 0 4px 8px rgba(15,23,42,0.08)",
              padding: "8px 6px", maxHeight: 420, overflowY: "auto"
            }}>
              {!hasResults && (
                <div style={{ padding: "20px 12px", textAlign:"center", color:"var(--ink-3)", fontSize: 13 }}>
                  {t("lang")==="ES" ? `Sin resultados para "${query}"` : `No results for "${query}"`}
                </div>
              )}

              {empResults.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", color:"var(--ink-3)", padding: "6px 12px 4px", textTransform:"uppercase" }}>
                    {t("lang")==="ES" ? "Personas" : "People"}
                  </div>
                  {empResults.map(e => (
                    <div key={e.id} style={rowStyle} onClick={() => goEmp(e)}
                      onMouseEnter={ev => ev.currentTarget.style.background="var(--bg-2)"}
                      onMouseLeave={ev => ev.currentTarget.style.background="transparent"}>
                      <Avatar person={e} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{e.name}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{e.role} · {e.dept}</div>
                      </div>
                      <span style={pillStyle}>{e.loc}</span>
                    </div>
                  ))}
                </>
              )}

              {survResults.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", color:"var(--ink-3)", padding: "8px 12px 4px", textTransform:"uppercase", borderTop: empResults.length ? "1px solid var(--line-2)" : "none", marginTop: empResults.length ? 4 : 0 }}>
                    {t("lang")==="ES" ? "Encuestas" : "Surveys"}
                  </div>
                  {survResults.map(s => (
                    <div key={s.id} style={rowStyle} onClick={() => goSurvey(s)}
                      onMouseEnter={ev => ev.currentTarget.style.background="var(--bg-2)"}
                      onMouseLeave={ev => ev.currentTarget.style.background="transparent"}>
                      <span style={{ width:32, height:32, borderRadius:8, background:"var(--brand-soft)", display:"grid", placeItems:"center", flexShrink:0 }}>
                        <Icon name="paper" size={15} stroke="var(--brand)" />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.title[lang]}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{s.id} · {s.responses}/{s.sent} {t("lang")==="ES"?"resp.":"resp."}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {annResults.length > 0 && (
                <>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", color:"var(--ink-3)", padding: "8px 12px 4px", textTransform:"uppercase", borderTop: "1px solid var(--line-2)", marginTop: 4 }}>
                    {t("lang")==="ES" ? "Anuncios" : "Announcements"}
                  </div>
                  {annResults.map(a => (
                    <div key={a.id} style={rowStyle} onClick={goAnnounce}
                      onMouseEnter={ev => ev.currentTarget.style.background="var(--bg-2)"}
                      onMouseLeave={ev => ev.currentTarget.style.background="transparent"}>
                      <span style={{ width:32, height:32, borderRadius:8, background:"var(--olive-soft, #F0FDF4)", display:"grid", placeItems:"center", flexShrink:0 }}>
                        <Icon name="bell" size={15} stroke="#3F5424" />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.title[lang]}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{a.author?.name} · {a.postedAt}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {route === "dashboard" && (
          <div style={{
            display:"inline-flex", border:"1px solid var(--line)", borderRadius: 999,
            padding: 3, background: "var(--paper)"
          }}>
            {["editorial","ops","bento"].map(v => (
              <button key={v} onClick={() => setVariant(v)} style={{
                border:0, background: variant===v ? "var(--ink)" : "transparent",
                color: variant===v ? "var(--bg-2)" : "var(--ink-2)",
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, cursor:"pointer"
              }}>{t(`view.${v}`)}</button>
            ))}
          </div>
        )}
        <button className="btn icon" title="Notificaciones">
          <Icon name="bell" size={16} />
        </button>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
