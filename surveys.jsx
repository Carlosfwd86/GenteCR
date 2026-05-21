// Surveys view — resumen + tabla drill-down
function SurveysView({ t, openEmployee, currentSurvey }) {
  const D = window.GenteCR;
  const [selected, setSelected] = React.useState(currentSurvey || D.SURVEYS[0]);
  const [tab, setTab] = React.useState("summary");
  const survey = selected;
  const responsesEmps = D.EMPLOYEES.slice(0, survey.responses || 6).map((e, i) => ({
    e, q1: Math.max(1, Math.min(5, e.happiness + (Math.sin(i*7)*0.6))),
    q2: Math.max(1, Math.min(5, e.happiness - (e.workload-60)/30 + 0.5)),
    q3: Math.max(1, Math.min(5, e.happiness + (Math.cos(i*3)*0.8))),
    q4: Math.max(1, Math.min(5, 3 + e.eNPS/30))
  }));

  return (
    <div className="main" data-screen-label="03 Encuestas">
      {/* Survey switcher */}
      <div className="card-flush">
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="row between">
            <div>
              <div className="eyebrow">{t("section.responses")}</div>
              <h2 className="serif" style={{ fontSize: 28, margin: "6px 0 0", letterSpacing: "-0.01em" }}>
                {survey.title[t("lang").toLowerCase()]}
              </h2>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                <span className="mono">{survey.id}</span> · {t("lang")==="ES"?"Enviada":"Sent"} {survey.sentAt} · {t("lang")==="ES"?"cierra":"closes"} {survey.closesAt}
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <select value={survey.id} onChange={(e) => setSelected(D.SURVEYS.find(s => s.id === e.target.value))}
                style={{
                  border: "1px solid var(--line)", borderRadius: 10, padding: "0 12px",
                  height: 36, background: "var(--paper)", fontSize: 13, fontFamily: "inherit"
                }}>
                {D.SURVEYS.map(s => <option key={s.id} value={s.id}>{s.title[t("lang").toLowerCase()]}</option>)}
              </select>
              <button className="btn"><Icon name="download" size={14}/>{t("lang")==="ES"?"Exportar":"Export"}</button>
              <button className="btn primary"><Icon name="send" size={14}/>{t("lang")==="ES"?"Recordar":"Remind"}</button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display:"inline-flex", gap: 4, marginTop: 14, borderBottom: "1px solid transparent", position: "relative", top: 12 }}>
            {[
              { k: "summary", l: t("tab.summary") },
              { k: "responses", l: t("tab.responses") },
              { k: "questions", l: t("tab.questions") },
              { k: "text", l: t("tab.text") }
            ].map(x => (
              <button key={x.k} onClick={() => setTab(x.k)} style={{
                background: "transparent", border: 0, borderBottom: `2px solid ${tab === x.k ? "var(--ink)" : "transparent"}`,
                color: tab === x.k ? "var(--ink)" : "var(--ink-3)", fontSize: 13, fontWeight: 500,
                padding: "10px 14px", cursor: "pointer", marginBottom: -1
              }}>{x.l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {tab === "summary" && <SurveySummary survey={survey} t={t}/>}
          {tab === "responses" && <SurveyResponses survey={survey} rows={responsesEmps} t={t} openEmployee={openEmployee}/>}
          {tab === "questions" && <SurveyQuestions survey={survey} t={t}/>}
          {tab === "text" && <SurveyText t={t} openEmployee={openEmployee}/>}
        </div>
      </div>
    </div>
  );
}

function SurveySummary({ survey, t }) {
  const D = window.GenteCR;
  const depts = D.aggByDept();
  return (
    <div>
      {/* Headline */}
      <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ background: "var(--bg-2)" }}>
          <div className="eyebrow">{t("lang")==="ES"?"Respuesta total":"Total responses"}</div>
          <div className="row" style={{ alignItems: "center", gap: 16, marginTop: 10 }}>
            <Donut value={survey.responses} max={survey.sent} color="var(--brand)" size={88} label={`${Math.round(survey.responses/survey.sent*100)}%`}/>
            <div>
              <div className="serif" style={{ fontSize: 38, letterSpacing: "-0.02em" }}>{survey.responses}<span className="muted" style={{ fontSize: 18 }}>/{survey.sent}</span></div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{t("lang")==="ES"?"personas respondieron":"people answered"}</div>
            </div>
          </div>
        </div>
        {[
          { k: t("lang")==="ES"?"Satisfacción promedio":"Avg satisfaction", v: survey.avgSat.toFixed(1), unit: "/5", d: "+0.2", up: true },
          { k: t("lang")==="ES"?"Mejor pregunta":"Top question", v: "4.1", unit: "/5", d: t("lang")==="ES"?"Recomendaría":"Would recommend", up: true, isText: true },
          { k: t("lang")==="ES"?"Más baja":"Lowest", v: "3.1", unit: "/5", d: t("lang")==="ES"?"Reconocimiento":"Recognition", up: false, isText: true }
        ].map((k, i) => (
          <div key={i} className="card">
            <div className="eyebrow">{k.k}</div>
            <div className="row between" style={{ marginTop: 8, alignItems: "baseline" }}>
              <div className="serif" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>{k.v}<span className="muted" style={{ fontSize: 16 }}>{k.unit}</span></div>
            </div>
            <div className={`muted ${k.isText ? "" : "stat-delta"} ${k.up ? "up" : "down"}`} style={{ fontSize: 12, marginTop: 6 }}>
              {!k.isText && <Icon name={k.up?"arrowUp":"arrowDown"} size={11}/>} {k.d}
            </div>
          </div>
        ))}
      </div>

      {/* Per question */}
      <div className="eyebrow" style={{ marginBottom: 12 }}>{t("section.questions")}</div>
      <div className="card-flush" style={{ marginBottom: 24 }}>
        {(survey.questions || []).map((q, i, arr) => (
          <div key={q.id} className="q-row" style={{ padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid var(--line-2)" : "0", display: "grid", gridTemplateColumns: "1fr 160px 80px", gap: 18, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{q.text[t("lang").toLowerCase()]}</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>{q.id} · {q.type}</div>
            </div>
            <div>
              {q.type === "text" ? <span className="pill ghost">{t("lang")==="ES"?"texto libre":"free text"}</span> : <LikertBar avg={q.avg} total={survey.responses}/>}
            </div>
            <div style={{ textAlign: "right" }}>
              {q.type !== "text" ? (
                <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                  <MoodDot value={q.avg} size={9}/>
                  <span className="tnum serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{q.avg.toFixed(1)}</span>
                </div>
              ) : (
                <span className="muted" style={{ fontSize: 12 }}>14 {t("lang")==="ES"?"respuestas":"answers"}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* By dept */}
      <div className="eyebrow" style={{ marginBottom: 12 }}>{t("lang")==="ES"?"Por equipo":"By team"}</div>
      <div className="card-flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t("table.dept")}</th>
              <th style={{ width: 80 }}>{t("lang")==="ES"?"Personas":"People"}</th>
              <th style={{ width: 100 }}>{t("lang")==="ES"?"Resp.":"Resp."}</th>
              <th>{t("table.sat")}</th>
              <th style={{ width: 100 }}>{t("table.eNPS")}</th>
            </tr>
          </thead>
          <tbody>
            {depts.map(d => (
              <tr key={d.dept} style={{ cursor: "default" }}>
                <td style={{ fontWeight: 500 }}>{d.dept}</td>
                <td className="muted tnum">{d.count}</td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <div className="bar" style={{ width: 60 }}><i style={{ width: `${d.responseRate}%`, background: "var(--sky)" }}/></div>
                    <span className="tnum" style={{ fontSize: 12 }}>{d.responseRate}%</span>
                  </div>
                </td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="bar" style={{ width: 100 }}><i style={{
                      width: `${((d.sat-1)/4)*100}%`,
                      background: d.sat > 4 ? "var(--olive)" : d.sat > 3 ? "var(--amber)" : "var(--rose)"
                    }}/></div>
                    <MoodDot value={d.sat}/>
                    <span className="tnum" style={{ fontWeight: 600 }}>{d.sat.toFixed(1)}</span>
                  </div>
                </td>
                <td className="tnum">{d.eNPS >= 0 ? "+" : ""}{d.eNPS}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveyResponses({ survey, rows, t, openEmployee }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 12, gap: 10 }}>
        <span className="pill ghost">{t("lang")==="ES"?"Vista anónima por defecto":"Anonymous view by default"}</span>
        <button className="btn sm ghost"><Icon name="filter" size={12}/>{t("lang")==="ES"?"Filtros":"Filters"}</button>
        <button className="btn sm" style={{ marginLeft: "auto" }}><Icon name="download" size={12}/>CSV</button>
      </div>
      <div className="card-flush">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: "26%" }}>{t("lang")==="ES"?"Persona":"Person"}</th>
              {(survey.questions||[]).filter(q=>q.type!=="text").map(q => (
                <th key={q.id} title={q.text[t("lang").toLowerCase()]}>
                  <div className="mono" style={{ fontWeight: 600, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>{q.id}</div>
                </th>
              ))}
              <th style={{ width: 100 }}>{t("lang")==="ES"?"Cuando":"When"}</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map(({ e, q1, q2, q3, q4 }) => (
              <tr key={e.id} onClick={() => openEmployee(e)}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar person={e} size="sm"/>
                    <div>
                      <div style={{ fontWeight: 500 }}>{e.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{e.dept}</div>
                    </div>
                  </div>
                </td>
                {[q1, q2, q3, q4].map((v, i) => (
                  <td key={i}>
                    <div className="row" style={{ gap: 6 }}>
                      <MoodDot value={v} size={8}/>
                      <span className="tnum" style={{ fontSize: 12.5 }}>{v.toFixed(1)}</span>
                    </div>
                  </td>
                ))}
                <td className="muted tnum" style={{ fontSize: 11.5 }}>{Math.floor(Math.random()*3)+1}d</td>
                <td><Icon name="arrow" size={12} stroke="var(--ink-3)"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveyQuestions({ survey, t }) {
  if (!survey.questions) return <div className="muted">{t("lang")==="ES"?"Esta encuesta no tiene preguntas detalladas.":"This survey has no detailed questions."}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {survey.questions.filter(q => q.type !== "text").map(q => (
        <div key={q.id} className="card">
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">{q.id}</div>
              <div className="serif" style={{ fontSize: 22, marginTop: 6, letterSpacing: "-0.01em" }}>{q.text[t("lang").toLowerCase()]}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{q.type === "likert5" ? "Likert 1-5" : "NPS"} · {survey.responses} {t("lang")==="ES"?"respuestas":"answers"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="serif" style={{ fontSize: 42, letterSpacing: "-0.02em", lineHeight: 1 }}>{q.avg.toFixed(1)}</div>
              <div className="muted" style={{ fontSize: 12 }}>/ 5</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <LikertBar avg={q.avg} total={survey.responses}/>
            <div className="row between" style={{ marginTop: 6 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{ textAlign: "center", flex: 1 }}>
                  <MoodDot value={n} size={7}/>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SurveyText({ t, openEmployee }) {
  const D = window.GenteCR;
  const [filter, setFilter] = React.useState("all");
  const filtered = D.TEXT_RESPONSES.filter(r => filter === "all" || r.sentiment === filter);
  const counts = {
    positive: D.TEXT_RESPONSES.filter(r => r.sentiment === "positive").length,
    neutral: D.TEXT_RESPONSES.filter(r => r.sentiment === "neutral").length,
    negative: D.TEXT_RESPONSES.filter(r => r.sentiment === "negative").length
  };
  return (
    <div>
      <div className="row" style={{ gap: 10, marginBottom: 14 }}>
        {[
          { k: "all", l: t("lang")==="ES"?"Todos":"All", n: D.TEXT_RESPONSES.length, c: "ghost" },
          { k: "positive", l: t("sentiment.positive"), n: counts.positive, c: "olive" },
          { k: "neutral", l: t("sentiment.neutral"), n: counts.neutral, c: "ghost" },
          { k: "negative", l: t("sentiment.negative"), n: counts.negative, c: "rose" }
        ].map(f => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            border: "1px solid var(--line)", borderRadius: 999, padding: "6px 12px",
            background: filter === f.k ? "var(--ink)" : "var(--paper)",
            color: filter === f.k ? "var(--bg-2)" : "var(--ink-2)",
            fontSize: 12.5, cursor: "pointer", fontWeight: 500
          }}>{f.l} <span style={{ opacity: 0.6 }}>· {f.n}</span></button>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {filtered.map((r, i) => (
          <div key={i} className="card" style={{
            borderLeft: `4px solid ${r.sentiment === "positive" ? "var(--olive)" : r.sentiment === "negative" ? "var(--rose)" : "var(--mist-2)"}`
          }}>
            <div className="row" style={{ gap: 10 }}>
              <Avatar person={r.who} />
              <div style={{ flex: 1 }}>
                <div className="row between">
                  <div style={{ fontWeight: 500 }}>{r.who.name}</div>
                  <span className={`pill ${r.sentiment === "positive" ? "olive" : r.sentiment === "negative" ? "rose" : ""}`} style={{ fontSize: 10.5 }}>
                    {t(`sentiment.${r.sentiment}`)}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 11.5 }}>{r.who.role} · {r.who.dept}</div>
              </div>
            </div>
            <p className="serif" style={{ fontSize: 18, lineHeight: 1.4, margin: "12px 0 8px", letterSpacing: "-0.005em" }}>
              "{r.text[t("lang").toLowerCase()]}"
            </p>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn sm" onClick={() => openEmployee(r.who)}><Icon name="eye" size={12}/>{t("label.profile")}</button>
              <button className="btn sm"><Icon name="chat" size={12}/>{t("act.message")}</button>
              <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>{t("lang")==="ES"?"Hace":"Ago"} {i+1}d</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.SurveysView = SurveysView;
