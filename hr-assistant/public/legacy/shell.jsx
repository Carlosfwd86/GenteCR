// App chrome: Sidebar + Topbar
function Sidebar({ t, route, setRoute, variant }) {
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
      <Logo />
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
          <Avatar person={{ initials: "AV", hue: 1 }} size="sm" />
          <div style={{ fontSize: 12.5, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600 }}>Andrea Vargas</div>
            <div className="muted" style={{ fontSize: 11 }}>People Lead</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ t, route, variant, setVariant }) {
  const titleMap = {
    dashboard: { es: "Dashboard", en: "Dashboard", crumb: t("good.morning") + ", Andrea" },
    surveys: { es: "Encuestas", en: "Surveys", crumb: t("section.responses.sub") },
    announce: { es: "Anuncios", en: "Announcements", crumb: t("lang")==="ES"?"Conversación con tu equipo":"Conversation with your team" },
    employees: { es: "Equipo", en: "Team", crumb: t("lang")==="ES"?`${48} personas activas`:`${48} active people` },
    recruit: { es: "Reclutamiento", en: "Recruiting", crumb: t("lang")==="ES"?"Pipeline esta semana":"Pipeline this week" }
  };
  const m = titleMap[route] || titleMap.dashboard;
  return (
    <div className="topbar">
      <div className="crumb">
        <h1>{t(`nav.${route === "announce" ? "announcements" : route}`) || m.es}</h1>
        <span className="small">· {m.crumb}</span>
      </div>
      <div className="right">
        <div className="input" style={{ display:"flex", alignItems:"center", gap: 8, padding: "0 12px", width: 280 }}>
          <Icon name="search" size={14} stroke="var(--ink-3)" />
          <input style={{
            border: 0, background: "transparent", outline: "none",
            font: "inherit", color: "inherit", flex: 1, height: "100%"
          }} placeholder={t("topbar.search")} />
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
