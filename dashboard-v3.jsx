// Dashboard variation 3 — "Bento": dark theme, large visual cards, asymmetric
function DashboardBento({ t, openEmployee, openSurvey, setRoute }) {
  const D = window.GenteCR;
  const depts = D.aggByDept();
  const top = depts[0];
  const bot = depts[depts.length-1];
  const atRisk = D.EMPLOYEES.filter(e => e.status === "at-risk").slice(0, 3);
  const sat = deltaArrow(D.COMPANY.satisfaction, D.COMPANY.satisfactionPrev);

  return (
    <div className="main theme-ink" data-screen-label="02 Dashboard · Bento" style={{ background: "var(--bg)", color: "var(--ink)", margin: "-28px", padding: 28, minHeight: "calc(100vh - 64px)" }}>
      {/* Greeting strip */}
      <div className="row between" style={{ marginBottom: 4 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--brand)" }}>{t("good.morning").toUpperCase()}, ANDREA</div>
          <h2 className="serif" style={{ fontSize: 38, lineHeight: 1.1, margin: "6px 0 0", letterSpacing: "-0.01em" }}>
            {t("lang") === "ES"
              ? <>El equipo está <span style={{ color: "var(--brand)" }}>3.8/5</span>. Lo mejor en lo que va del año.</>
              : <>The team is at <span style={{ color: "var(--brand)" }}>3.8/5</span>. Best so far this year.</>}
          </h2>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" style={{ background: "var(--paper)", borderColor: "var(--line)", color: "var(--ink)" }}>
            <Icon name="cal" size={14}/>{t("lang")==="ES"?"Mayo, S3":"May, W3"}
          </button>
          <button className="btn brand"><Icon name="plus" size={14}/>{t("topbar.compose")}</button>
        </div>
      </div>

      {/* Bento grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridAutoRows: "minmax(120px, auto)",
        gap: 14
      }}>
        {/* Big hero — satisfaction */}
        <div className="card" style={{
          gridColumn: "span 5", gridRow: "span 2",
          background: "linear-gradient(160deg, #1E293B 0%, #0F172A 60%)",
          padding: 22,
          position: "relative", overflow: "hidden", borderColor: "rgba(96,165,250,0.16)"
        }}>
          <div style={{
            position: "absolute", right: -60, top: -60, width: 280, height: 280, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.28) 0%, transparent 60%)"
          }}/>
          <div className="eyebrow" style={{ color: "var(--brand)" }}>{t("kpi.satisfaction")}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 18 }}>
            <div className="serif" style={{ fontSize: 110, lineHeight: 0.95, letterSpacing: "-0.045em", color: "#FAFAFA", fontWeight: 600 }}>
              {D.COMPANY.satisfaction.toFixed(1)}
            </div>
            <div>
              <div className="muted serif" style={{ fontSize: 32 }}>/ 5</div>
              <span className="pill olive" style={{ marginTop: 8 }}><Icon name="arrowUp" size={10}/> {sat.val}</span>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 12, maxWidth: 320 }}>
            {t("lang")==="ES"
              ? "Subimos 0.2 puntos vs el mes anterior. La carga bajó. Vamos por buen camino."
              : "Up 0.2 points vs last month. Workload pressure dropped. Good direction."}
          </div>
          <div style={{ marginTop: 24, marginRight: -24 }}>
            <LineChart data={D.COMPANY.trend} height={140} color="var(--brand)" fill="rgba(96,165,250,0.14)" yLabels={false}/>
          </div>
        </div>

        {/* Compact KPIs */}
        {[
          { k: t("kpi.enps"),     v: `+${D.COMPANY.eNPS}`, d: "+24", color: "var(--olive-soft)", icon: "heart" },
          { k: t("kpi.response"), v: `${D.COMPANY.responseRate}%`, d: "+7%", color: "var(--sky-soft)", icon: "paper" },
          { k: t("kpi.atrisk"),   v: D.COMPANY.atRisk, d: "-1", color: "var(--rose-soft)", icon: "alert" },
          { k: t("kpi.headcount"),v: D.COMPANY.headcount, d: "+3", color: "var(--plum-soft)", icon: "people" }
        ].map((kpi, i) => (
          <div key={i} className="card" style={{
            gridColumn: "span 3 / span 3",
            gridColumn: i < 2 ? "span 4" : "span 3",
            padding: 18
          }}>
            <div className="row between">
              <div style={{ width: 32, height: 32, borderRadius: 10, background: kpi.color, display: "grid", placeItems: "center", color: "var(--ink)" }}>
                <Icon name={kpi.icon} size={14}/>
              </div>
              <span className="pill" style={{ background: "rgba(255,255,255,0.05)", color: "var(--ink-2)", fontSize: 11 }}>{kpi.d}</span>
            </div>
            <div className="serif" style={{ fontSize: 40, lineHeight: 1, marginTop: 14, letterSpacing: "-0.02em" }}>{kpi.v}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{kpi.k}</div>
          </div>
        ))}

        {/* Workload */}
        <div className="card" style={{ gridColumn: "span 3", padding: 18 }}>
          <div className="eyebrow">{t("section.workload")}</div>
          <div className="row between" style={{ alignItems: "baseline", marginTop: 4 }}>
            <div className="serif" style={{ fontSize: 32, letterSpacing: "-0.01em" }}>{D.WORKLOAD_TREND[D.WORKLOAD_TREND.length-1]}%</div>
            <span className="pill amber" style={{ fontSize: 11 }}><Icon name="arrowUp" size={10}/>+4</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <MiniBars data={D.WORKLOAD_TREND} color="var(--brand)" height={48}/>
          </div>
        </div>

        {/* Departments — list */}
        <div className="card" style={{ gridColumn: "span 5", gridRow: "span 2", padding: 22 }}>
          <div className="row between">
            <div>
              <h3 className="h-section">{t("section.depts")}</h3>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{t("section.depts.sub")}</div>
            </div>
            <span className="pill" style={{ background: "rgba(255,255,255,0.05)", color: "var(--ink-2)" }}>{depts.length}</span>
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {depts.map(d => {
              const pct = (d.sat - 1) / 4;
              const color = pct > 0.7 ? "#15803D" : pct > 0.5 ? "#CA8A04" : "#EA580C";
              return (
                <div key={d.dept}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <span style={{ fontWeight: 500, fontSize: 13.5 }}>{d.dept}</span>
                      <span className="muted" style={{ fontSize: 11.5 }}>{d.count}</span>
                    </div>
                    <div className="row" style={{ gap: 14 }}>
                      <span className="tnum serif" style={{ fontSize: 18, color, letterSpacing: "-0.01em" }}>{d.sat.toFixed(1)}</span>
                      <span className="tnum muted" style={{ fontSize: 12, width: 36, textAlign: "right" }}>{d.eNPS >= 0 ? "+" : ""}{d.eNPS}</span>
                    </div>
                  </div>
                  <div className="bar" style={{ background: "rgba(255,255,255,0.06)" }}><i style={{ width: `${pct*100}%`, background: color }}/></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* At risk */}
        <div className="card" style={{ gridColumn: "span 4", gridRow: "span 2", padding: 20 }}>
          <div className="row between">
            <div>
              <h3 className="h-section">{t("section.alerts")}</h3>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{atRisk.length} {t("lang")==="ES"?"requieren acción":"need action"}</div>
            </div>
            <span className="dot" style={{ background: "var(--brand)", width: 10, height: 10 }}/>
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {atRisk.map(e => (
              <div key={e.id} style={{
                padding: 12,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                cursor: "pointer"
              }} onClick={() => openEmployee(e)}>
                <div className="row" style={{ gap: 10 }}>
                  <Avatar person={e} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.name}</div>
                    </div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{e.role} · {e.dept}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="serif" style={{ fontSize: 22, color: "#EA580C", lineHeight: 1, fontWeight: 600 }}>{e.happiness.toFixed(1)}</div>
                    <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>/ 5</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Sparkline data={e.trend} height={20} color="var(--brand)" fill="rgba(96,165,250,0.10)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Big quote */}
        <div className="card" style={{ gridColumn: "span 4", padding: 22, background: "linear-gradient(135deg, rgba(96,165,250,0.10), rgba(96,165,250,0.02))" }}>
          <div className="eyebrow" style={{ color: "var(--brand)" }}>{t("lang")==="ES"?"COMENTARIO DESTACADO":"FEATURED COMMENT"}</div>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1.35, margin: "10px 0 12px", letterSpacing: "-0.01em" }}>
            "{D.TEXT_RESPONSES[1].text[t("lang").toLowerCase()]}"
          </p>
          <div className="row" style={{ gap: 8 }}>
            <Avatar person={D.TEXT_RESPONSES[1].who} size="sm"/>
            <div className="muted" style={{ fontSize: 12 }}>{D.TEXT_RESPONSES[1].who.name} · {D.TEXT_RESPONSES[1].who.dept}</div>
          </div>
        </div>

        {/* Latest survey */}
        <div className="card" style={{ gridColumn: "span 4", padding: 22 }}>
          <div className="row between">
            <div>
              <div className="eyebrow">{t("section.last")}</div>
              <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14.5 }}>{D.SURVEYS[0].title[t("lang").toLowerCase()]}</div>
            </div>
            <button className="btn sm" style={{ background: "rgba(255,255,255,0.06)", borderColor: "transparent", color: "var(--ink)" }} onClick={() => openSurvey(D.SURVEYS[0])}>
              <Icon name="arrow" size={11}/>
            </button>
          </div>
          <div className="row" style={{ marginTop: 14, gap: 16 }}>
            <Donut value={D.SURVEYS[0].responses} max={D.SURVEYS[0].sent} color="var(--brand)" track="rgba(255,255,255,0.08)" label={`${Math.round(D.SURVEYS[0].responses/D.SURVEYS[0].sent*100)}%`} size={76}/>
            <div style={{ flex: 1 }}>
              <div className="muted" style={{ fontSize: 11.5 }}>{D.SURVEYS[0].responses}/{D.SURVEYS[0].sent} {t("lang")==="ES"?"respondieron":"answered"}</div>
              <div className="serif" style={{ fontSize: 26, marginTop: 4, letterSpacing: "-0.01em" }}>{D.SURVEYS[0].avgSat}<span className="muted" style={{ fontSize: 14 }}> /5</span></div>
              <LikertBar avg={D.SURVEYS[0].avgSat}/>
            </div>
          </div>
        </div>

        {/* Recruit + announcements */}
        <div className="card" style={{ gridColumn: "span 4", padding: 20 }}>
          <div className="row between">
            <h3 className="h-section">{t("section.recruit")}</h3>
            <Icon name="spark" size={14} stroke="var(--brand)"/>
          </div>
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[
              { l: t("recruit.applied"), v: 124, c: "var(--ink-2)" },
              { l: t("recruit.interview"), v: 18, c: "#60A5FA" },
              { l: t("recruit.offer"), v: 5, c: "var(--brand)" },
              { l: t("recruit.hired"), v: 2, c: "#15803D" }
            ].map((r, i) => (
              <div key={i} style={{ padding: 12, background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                <div className="muted" style={{ fontSize: 11 }}>{r.l}</div>
                <div className="serif" style={{ fontSize: 26, color: r.c, marginTop: 4, letterSpacing: "-0.01em" }}>{r.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcement */}
        <div className="card" style={{ gridColumn: "span 4", padding: 20 }}>
          <div className="eyebrow" style={{ color: "var(--brand)" }}>{t("label.pinned").toUpperCase()}</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 6 }}>{D.ANNOUNCEMENTS[0].title[t("lang").toLowerCase()]}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {D.ANNOUNCEMENTS[0].body[t("lang").toLowerCase()]}
          </div>
          <div className="row" style={{ gap: 6, marginTop: 12 }}>
            {Object.entries(D.ANNOUNCEMENTS[0].reactions).map(([emo, n]) => (
              <span key={emo} style={{ padding: "3px 9px", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 999, fontSize: 12 }}>{emo} {n}</span>
            ))}
            <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>{Math.round(D.ANNOUNCEMENTS[0].readPct*100)}% {t("label.read")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashboardBento = DashboardBento;
