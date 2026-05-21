// Employees grid view + Employee detail drawer
function EmployeesView({ t, openEmployee }) {
  const D = window.GenteCR;
  const [view, setView] = React.useState("grid");
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const filtered = D.EMPLOYEES.filter(e => {
    if (filter !== "all" && filter !== "atrisk" && filter !== "watch" && e.dept !== filter) return false;
    if (filter === "atrisk" && e.status !== "at-risk") return false;
    if (filter === "watch" && e.status !== "watch") return false;
    if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="main" data-screen-label="05 Equipo">
      {/* Toolbar */}
      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <div className="input" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", width: 280, height: 36 }}>
            <Icon name="search" size={14} stroke="var(--ink-3)"/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t("lang")==="ES"?"Buscar persona…":"Search person…"}
              style={{ border: 0, background: "transparent", outline: "none", font: "inherit", flex: 1, color: "inherit" }}/>
          </div>
          <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 8, padding: 2 }}>
            {[
              { k: "all", l: t("filter.all"), n: D.EMPLOYEES.length },
              { k: "atrisk", l: t("label.atRisk"), n: D.EMPLOYEES.filter(e=>e.status==="at-risk").length },
              { k: "watch", l: t("label.watch"), n: D.EMPLOYEES.filter(e=>e.status==="watch").length }
            ].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{
                border: 0, padding: "5px 10px", borderRadius: 6,
                background: filter === f.k ? "var(--ink)" : "transparent",
                color: filter === f.k ? "var(--bg-2)" : "var(--ink-2)",
                fontSize: 12, fontWeight: 500, cursor: "pointer"
              }}>{f.l} <span style={{ opacity: 0.6 }}>· {f.n}</span></button>
            ))}
          </div>
          <select value={D.DEPTS.includes(filter) ? filter : "all-d"} onChange={e => setFilter(e.target.value === "all-d" ? "all" : e.target.value)}
            style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", height: 32, background: "var(--paper)", fontSize: 12.5 }}>
            <option value="all-d">{t("filter.dept")}</option>
            {D.DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="muted" style={{ fontSize: 12.5, marginLeft: 4 }}>{filtered.length} {t("lang")==="ES"?"personas":"people"}</span>
          <div style={{ marginLeft: "auto", display: "inline-flex", gap: 4 }}>
            <button className={`btn sm ${view==="grid"?"":"ghost"}`} onClick={() => setView("grid")}><Icon name="grid" size={12}/></button>
            <button className={`btn sm ${view==="list"?"":"ghost"}`} onClick={() => setView("list")}><Icon name="list" size={12}/></button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {filtered.map(e => (
            <div key={e.id} className="card" style={{ padding: 16, cursor: "pointer" }} onClick={() => openEmployee(e)}>
              <div className="row between" style={{ alignItems: "flex-start" }}>
                <Avatar person={e} size="lg"/>
                <StatusPill status={e.status} t={t}/>
              </div>
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 14 }}>{e.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{e.role}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{e.dept} · {e.loc}</div>
              <div className="divider" style={{ margin: "12px 0" }}/>
              <div className="row between" style={{ alignItems: "center" }}>
                <div className="row" style={{ gap: 6 }}>
                  <MoodDot value={e.happiness} size={9}/>
                  <span className="tnum serif" style={{ fontSize: 20, letterSpacing: "-0.01em" }}>{e.happiness.toFixed(1)}</span>
                </div>
                <div style={{ width: 80 }}>
                  <Sparkline data={e.trend} height={22}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-flush">
          <div style={{ maxHeight: 600, overflow: "auto" }} className="scrl">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t("table.name")}</th>
                  <th>{t("table.dept")}</th>
                  <th>{t("table.role")}</th>
                  <th>{t("table.sat")}</th>
                  <th>{t("table.tenure")}</th>
                  <th>{t("table.status")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} onClick={() => openEmployee(e)}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar person={e} size="sm"/>
                        <div style={{ fontWeight: 500 }}>{e.name}</div>
                      </div>
                    </td>
                    <td className="muted">{e.dept}</td>
                    <td className="muted">{e.role}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <MoodDot value={e.happiness}/>
                        <span className="tnum" style={{ fontWeight: 600 }}>{e.happiness.toFixed(1)}</span>
                        <div style={{ width: 60 }}><Sparkline data={e.trend} height={16}/></div>
                      </div>
                    </td>
                    <td className="muted">{fmtTenure(e.tenureM, t)}</td>
                    <td><StatusPill status={e.status} t={t}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeDrawer({ employee: e, onClose, t }) {
  React.useEffect(() => {
    const onKey = (ev) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!e) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(26,22,18,0.45)", backdropFilter: "blur(2px)",
      display: "flex", justifyContent: "flex-end",
      animation: "fade .14s ease"
    }} onClick={onClose}>
      <style>{`@keyframes fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide { from { transform: translateX(8%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
      <div onClick={ev => ev.stopPropagation()} style={{
        width: "min(640px, 92vw)", height: "100%", overflow: "auto",
        background: "var(--bg)", borderLeft: "1px solid var(--line)",
        animation: "slide .22s ease"
      }} className="scrl">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1 }}>
          <div className="row" style={{ gap: 14 }}>
            <Avatar person={e} size="xl"/>
            <div>
              <div className="row" style={{ gap: 8 }}>
                <h2 className="serif" style={{ fontSize: 26, margin: 0, letterSpacing: "-0.01em" }}>{e.name}</h2>
                <StatusPill status={e.status} t={t}/>
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{e.role} · {e.dept} · {e.loc}</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>{e.email}</div>
            </div>
          </div>
          <button className="btn icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Actions */}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn brand"><Icon name="chat" size={14}/>{t("label.message")}</button>
            <button className="btn"><Icon name="cal" size={14}/>{t("label.schedule")}</button>
            <button className="btn"><Icon name="send" size={14}/>{t("lang")==="ES"?"Pulse 1:1":"1:1 pulse"}</button>
          </div>

          {/* Stats */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 11 }}>{t("table.sat")}</div>
              <div className="row" style={{ gap: 6, alignItems: "baseline", marginTop: 4 }}>
                <span className="serif" style={{ fontSize: 24, letterSpacing: "-0.01em" }}>{e.happiness.toFixed(1)}</span>
                <span className="muted" style={{ fontSize: 11 }}>/5</span>
              </div>
              <Sparkline data={e.trend} height={22}/>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 11 }}>eNPS</div>
              <div className="serif" style={{ fontSize: 24, marginTop: 4, letterSpacing: "-0.01em" }}>{e.eNPS > 0 ? "+" : ""}{e.eNPS}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                {e.eNPS >= 30 ? (t("lang")==="ES"?"Promotor":"Promoter") :
                 e.eNPS >= 0  ? (t("lang")==="ES"?"Pasivo":"Passive") :
                                (t("lang")==="ES"?"Detractor":"Detractor")}
              </div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 11 }}>{t("table.workload")}</div>
              <div className="serif tnum" style={{ fontSize: 24, marginTop: 4, letterSpacing: "-0.01em" }}>{e.workload}%</div>
              <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${e.workload}%`, background: e.workload > 80 ? "var(--rose)" : e.workload > 65 ? "var(--amber)" : "var(--olive)" }}/></div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="muted" style={{ fontSize: 11 }}>{t("table.tenure")}</div>
              <div className="serif" style={{ fontSize: 24, marginTop: 4, letterSpacing: "-0.01em" }}>{fmtTenure(e.tenureM, t)}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{t("lang")==="ES"?"Manager":"Manager"}: {e.manager}</div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="card">
            <div className="row between" style={{ marginBottom: 8 }}>
              <h3 className="h-section">{t("lang")==="ES"?"Pulso individual":"Personal pulse"}</h3>
              <span className="muted" style={{ fontSize: 11.5 }}>{t("lang")==="ES"?"últimas 8 semanas":"last 8 weeks"}</span>
            </div>
            <LineChart data={e.trend} height={130} color="var(--brand)" fill="rgba(200,85,61,0.10)"/>
          </div>

          {/* Recent responses */}
          <div className="card-flush">
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <h3 className="h-section">{t("lang")==="ES"?"Respuestas recientes":"Recent responses"}</h3>
            </div>
            <table className="tbl">
              <tbody>
                {window.GenteCR.SURVEYS.slice(0, 3).map((s, i) => (
                  <tr key={s.id} style={{ cursor: "default" }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.title[t("lang").toLowerCase()]}</div>
                      <div className="muted mono" style={{ fontSize: 11 }}>{s.id}</div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <MoodDot value={Math.max(1, Math.min(5, e.happiness + (i-1)*0.3))}/>
                        <span className="tnum">{Math.max(1, Math.min(5, e.happiness + (i-1)*0.3)).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="muted tnum" style={{ fontSize: 12 }}>{s.sentAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note */}
          <div className="card" style={{ background: "var(--bg-2)" }}>
            <div className="eyebrow">{t("lang")==="ES"?"Nota privada del manager":"Manager private note"}</div>
            <textarea defaultValue={t("lang")==="ES"
              ? "Hablar de feedback de la última review en el próximo 1:1. Notar carga alta esta semana."
              : "Discuss feedback from the last review in next 1:1. Note high workload this week."}
              style={{
                width: "100%", marginTop: 8, padding: 10,
                border: "1px solid var(--line)", borderRadius: 10,
                font: "inherit", outline: "none", background: "var(--paper)",
                color: "var(--ink-2)", resize: "vertical", minHeight: 70, fontSize: 13
              }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

window.EmployeesView = EmployeesView;
window.EmployeeDrawer = EmployeeDrawer;
