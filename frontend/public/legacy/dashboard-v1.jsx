// Dashboard variation 1 — "Editorial": warm, generous, magazine-like
function DashboardEditorial({ t, openEmployee, openSurvey, setRoute }) {
  const D = window.GenteCR;
  const depts = D.aggByDept();
  const atRisk = D.EMPLOYEES.filter(e => e.status === "at-risk").slice(0, 4);
  const watch = D.EMPLOYEES.filter(e => e.status === "watch").slice(0, 3);
  const sat = deltaArrow(D.COMPANY.satisfaction, D.COMPANY.satisfactionPrev);
  const enpsD = deltaArrow(D.COMPANY.eNPS, D.COMPANY.eNPSPrev);
  const respD = deltaArrow(D.COMPANY.responseRate, D.COMPANY.responseRatePrev);

  const [o, setO] = React.useState({
    hero: true, kpis: true, alerts: true, depts: true,
    sugg: true, survey: true, workload: true, announce: true, recruit: true
  });
  const tog = k => setO(prev => ({ ...prev, [k]: !prev[k] }));
  const anim = k => ({
    overflow: "hidden",
    maxHeight: o[k] ? "3000px" : "0",
    opacity: o[k] ? 1 : 0,
    transition: "max-height .32s cubic-bezier(.4,0,.2,1), opacity .18s"
  });
  const Chev = ({ k }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, transition: "transform .22s", transform: o[k] ? "rotate(0deg)" : "rotate(-90deg)", color: "var(--ink-3)" }}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );

  return (
    <div className="main" data-screen-label="02 Dashboard · Editorial">

      {/* Hero — Trend + gráfico */}
      <div className="card" style={{ padding: 24, background: "var(--paper)", position: "relative", overflow: "hidden" }}>
        <div style={{ position:"absolute", right:-40, top:-40, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle, var(--brand-soft) 0%, transparent 70%)", opacity:0.8, pointerEvents:"none" }}/>
        <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("hero")}>
          <div className="eyebrow">{t("section.trend")}</div>
          <Chev k="hero"/>
        </div>
        <div style={anim("hero")}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:32, marginTop:14, alignItems:"end" }}>
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
                <div className="serif" style={{ fontSize:60, lineHeight:1, letterSpacing:"-0.04em", fontWeight:600 }}>{D.COMPANY.satisfaction.toFixed(1)}</div>
                <div className="muted serif" style={{ fontSize:22, lineHeight:1, fontWeight:500 }}>/ 5</div>
                <span className={`pill ${sat.up?"olive":"rose"}`} style={{ marginLeft:6 }}>
                  <Icon name={sat.up?"arrowUp":"arrowDown"} size={11}/> {sat.val}
                </span>
              </div>
              <p style={{ marginTop:14, maxWidth:340, color:"var(--ink-2)", fontSize:13, lineHeight:1.55 }}>
                {t("lang")==="ES"
                  ? <>El equipo subió por <b style={{color:"var(--ink)"}}>séptima semana consecutiva</b>. La carga de trabajo bajó dos puntos.</>
                  : <>The team is up for the <b style={{color:"var(--ink)"}}>seventh week in a row</b>. Workload pressure dropped two points.</>}
              </p>
            </div>
            <div><LineChart data={D.COMPANY.trend} height={150}/></div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div>
        <div className="row between" style={{ cursor:"pointer", padding:"2px 2px 10px" }} onClick={() => tog("kpis")}>
          <div className="eyebrow" style={{ marginBottom:0 }}>KPIs</div>
          <Chev k="kpis"/>
        </div>
        <div style={anim("kpis")}>
          <div className="grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
            {[
              { k:t("kpi.enps"),      v:enpsD.up?`+${D.COMPANY.eNPS}`:`${D.COMPANY.eNPS}`, sub:t("kpi.enps.sub"),      d:enpsD,               accent:"var(--olive)", spark:[12,18,22,28,30,36,40,42] },
              { k:t("kpi.response"),  v:`${D.COMPANY.responseRate}%`,                        sub:t("kpi.response.sub"),  d:respD,               accent:"var(--sky)",   spark:[70,75,78,76,80,83,84,85] },
              { k:t("kpi.atrisk"),    v:D.COMPANY.atRisk,                                    sub:t("kpi.atrisk.sub"),    d:{up:false,val:"-1"}, accent:"var(--rose)",  spark:[5,4,5,4,4,3,4,3] },
              { k:t("kpi.headcount"), v:D.COMPANY.headcount,                                 sub:t("kpi.headcount.sub"), d:{up:true,val:"+3"},  accent:"var(--plum)",  spark:[42,42,43,43,45,45,47,48] }
            ].map((kpi, i) => (
              <div key={i} className="card">
                <div className="eyebrow" style={{ marginBottom:8 }}>{kpi.k}</div>
                <div className="row between" style={{ alignItems:"baseline" }}>
                  <div className="stat-num sm">{kpi.v}</div>
                  <span className={`stat-delta ${kpi.d.up?"up":"down"}`}>
                    <Icon name={kpi.d.up?"arrowUp":"arrowDown"} size={11}/>{kpi.d.val}
                    <span className="muted" style={{ fontSize:10.5, marginLeft:2 }}>{t("since.lastMonth")}</span>
                  </span>
                </div>
                <div className="muted" style={{ fontSize:12, marginTop:8 }}>{kpi.sub}</div>
                <div style={{ marginTop:10 }}>
                  <Sparkline data={kpi.spark} color={kpi.accent} fill="rgba(0,0,0,0.04)" range={[Math.min(...kpi.spark)*0.9,Math.max(...kpi.spark)*1.1]} height={28}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas + Departamentos */}
      <div className="grid" style={{ gridTemplateColumns:"1.2fr 1fr" }}>

        <div className="card-flush">
          <div style={{ padding:"18px 20px 12px", borderBottom: o.alerts?"1px solid var(--line)":"none", cursor:"pointer" }} onClick={() => tog("alerts")}>
            <div className="row between">
              <div>
                <div className="row" style={{ gap:10 }}>
                  <h3 className="h-section">{t("section.alerts")}</h3>
                  <span className="pill rose">{atRisk.length} {t("label.atRisk").toLowerCase()}</span>
                  <span className="pill amber">{watch.length} {t("label.watch").toLowerCase()}</span>
                </div>
                <div className="muted" style={{ fontSize:12.5, marginTop:4 }}>{t("section.alerts.sub")}</div>
              </div>
              <div className="row" style={{ gap:8 }}>
                <button className="btn sm ghost" onClick={e=>{e.stopPropagation();setRoute("employees")}}>{t("label.viewAll")}</button>
                <Chev k="alerts"/>
              </div>
            </div>
          </div>
          <div style={anim("alerts")}>
            {[...atRisk,...watch].map((e,i) => (
              <div key={e.id} style={{ padding:"var(--pad-row)", borderBottom:i<atRisk.length+watch.length-1?"1px solid var(--line-2)":"0", display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:14, alignItems:"center" }}>
                <Avatar person={e}/>
                <div>
                  <div className="row" style={{ gap:8 }}>
                    <div style={{ fontWeight:600, fontSize:13.5 }}>{e.name}</div>
                    <StatusPill status={e.status} t={t}/>
                  </div>
                  <div className="muted" style={{ fontSize:12, marginTop:2 }}>
                    {e.role} · {e.dept} · {t("lang")==="ES"?`Última respuesta hace ${e.lastResp}d`:`Last response ${e.lastResp}d ago`}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div className="row" style={{ justifyContent:"flex-end", gap:6 }}>
                    <MoodDot value={e.happiness}/>
                    <span className="tnum" style={{ fontSize:13, fontWeight:600 }}>{e.happiness.toFixed(1)}</span>
                  </div>
                  <div style={{ width:100, marginTop:4 }}><Sparkline data={e.trend} height={18}/></div>
                </div>
                <div className="row" style={{ gap:6 }}>
                  <button className="btn sm" title={t("act.message")}><Icon name="chat" size={12}/></button>
                  <button className="btn sm" title={t("act.schedule")}><Icon name="cal" size={12}/></button>
                  <button className="btn sm" onClick={()=>openEmployee(e)} title={t("label.profile")}><Icon name="eye" size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer", alignItems:"flex-start" }} onClick={() => tog("depts")}>
            <div>
              <h3 className="h-section">{t("section.depts")}</h3>
              <div className="muted" style={{ fontSize:12.5, marginTop:4 }}>{t("section.depts.sub")}</div>
            </div>
            <div className="row" style={{ gap:8 }}>
              <span className="pill ghost">{depts.length}</span>
              <Chev k="depts"/>
            </div>
          </div>
          <div style={anim("depts")}>
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:14 }}>
              {depts.map(d => {
                const pct = (d.sat-1)/4;
                const color = pct>0.7?"var(--olive)":pct>0.5?"var(--amber)":"var(--rose)";
                return (
                  <div key={d.dept}>
                    <div className="row between" style={{ marginBottom:6 }}>
                      <div className="row" style={{ gap:10 }}>
                        <div style={{ fontWeight:500, fontSize:13.5 }}>{d.dept}</div>
                        <span className="muted" style={{ fontSize:12 }}>{d.count} {t("lang")==="ES"?"personas":"people"}</span>
                      </div>
                      <div className="row" style={{ gap:12 }}>
                        <span className="tnum" style={{ fontSize:13, fontWeight:600 }}>{d.sat.toFixed(1)}</span>
                        <span className="tnum muted" style={{ fontSize:12, width:38, textAlign:"right" }}>{d.eNPS>=0?"+":""}{d.eNPS}</span>
                      </div>
                    </div>
                    <div className="bar"><i style={{ width:`${pct*100}%`, background:color }}/></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sugerencias + Última encuesta */}
      <div className="grid" style={{ gridTemplateColumns:"1fr 1fr" }}>

        <div className="card" style={{ background:"var(--bg-2)" }}>
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("sugg")}>
            <div className="row" style={{ gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"var(--ink)", color:"var(--bg-2)", display:"grid", placeItems:"center" }}>
                <Icon name="sparkle" size={16}/>
              </div>
              <div>
                <h3 className="h-section">{t("section.suggestions")}</h3>
                <div className="muted" style={{ fontSize:12.5 }}>{t("section.suggestions.sub")}</div>
              </div>
            </div>
            <Chev k="sugg"/>
          </div>
          <div style={anim("sugg")}>
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { tone:"rose",  txt:t("lang")==="ES"?"3 personas en Operaciones no respondieron 2 pulses seguidos.":"3 people in Ops haven't answered 2 pulses in a row.", cta:t("lang")==="ES"?"Enviar recordatorio":"Send reminder" },
                { tone:"amber", txt:t("lang")==="ES"?"La carga en Ingeniería subió 12% esta semana.":"Eng workload is up 12% this week.", cta:t("lang")==="ES"?"Crear pulse de carga":"Create workload pulse" },
                { tone:"olive", txt:t("lang")==="ES"?"Diseño está en 4.4/5: buen momento para reconocer al equipo.":"Design is at 4.4/5: good time to recognize the team.", cta:t("lang")==="ES"?"Redactar anuncio":"Draft announcement" }
              ].map((s,i) => (
                <div key={i} className="row between" style={{ padding:12, background:"var(--paper)", borderRadius:10, border:"1px solid var(--line)" }}>
                  <div className="row" style={{ alignItems:"flex-start", gap:10 }}>
                    <span className={`pill ${s.tone}`} style={{ padding:"3px 8px" }}>{i+1}</span>
                    <div style={{ fontSize:13, color:"var(--ink-2)" }}>{s.txt}</div>
                  </div>
                  <button className="btn sm">{s.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("survey")}>
            <div>
              <div className="eyebrow">{t("section.last")}</div>
              <h3 className="h-section" style={{ marginTop:4 }}>{D.SURVEYS[0].title[t("lang").toLowerCase()]}</h3>
            </div>
            <div className="row" style={{ gap:8 }}>
              <button className="btn sm" onClick={e=>{e.stopPropagation();openSurvey(D.SURVEYS[0])}}>{t("label.openSurvey")}<Icon name="arrow" size={12}/></button>
              <Chev k="survey"/>
            </div>
          </div>
          <div style={anim("survey")}>
            <div className="row" style={{ marginTop:14, gap:18 }}>
              <Donut value={D.SURVEYS[0].responses} max={D.SURVEYS[0].sent} color="var(--brand)" label={`${Math.round(D.SURVEYS[0].responses/D.SURVEYS[0].sent*100)}%`}/>
              <div style={{ flex:1 }}>
                <div className="muted" style={{ fontSize:12 }}>{D.SURVEYS[0].responses}/{D.SURVEYS[0].sent} {t("lang")==="ES"?"respondieron":"answered"}</div>
                <div className="row" style={{ gap:8, marginTop:8, alignItems:"baseline" }}>
                  <div className="serif" style={{ fontSize:32, lineHeight:1 }}>{D.SURVEYS[0].avgSat}</div>
                  <span className="muted">/ 5</span>
                  <span className="pill olive" style={{ marginLeft:8 }}><Icon name="arrowUp" size={10}/> +0.2</span>
                </div>
                <div style={{ marginTop:10 }}>
                  <LikertBar avg={D.SURVEYS[0].avgSat} total={D.SURVEYS[0].responses}/>
                  <div className="row between muted" style={{ fontSize:10.5, marginTop:4 }}>
                    <span>1 · {t("lang")==="ES"?"Mal":"Bad"}</span>
                    <span>5 · {t("lang")==="ES"?"Increíble":"Great"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="divider" style={{ margin:"18px 0 14px" }}/>
            <div className="eyebrow" style={{ marginBottom:10 }}>{t("section.text")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {D.TEXT_RESPONSES.slice(0,2).map((r,i) => (
                <div key={i} className="row" style={{ alignItems:"flex-start", gap:10 }}>
                  <Avatar person={r.who} size="sm"/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"var(--ink-2)", lineHeight:1.45 }}>"{r.text[t("lang").toLowerCase()]}"</div>
                    <div className="row" style={{ gap:8, marginTop:4 }}>
                      <span className="muted" style={{ fontSize:11.5 }}>— {r.who.dept}</span>
                      <span className={`pill ${r.sentiment==="positive"?"olive":r.sentiment==="negative"?"rose":""}`} style={{ fontSize:10.5, padding:"1px 7px" }}>{t(`sentiment.${r.sentiment}`)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Carga + Anuncios + Reclutamiento */}
      <div className="grid" style={{ gridTemplateColumns:"0.9fr 1.1fr 1fr" }}>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("workload")}>
            <div className="eyebrow">{t("section.workload")}</div>
            <Chev k="workload"/>
          </div>
          <div style={anim("workload")}>
            <div className="row between" style={{ alignItems:"baseline", marginTop:8 }}>
              <div className="stat-num sm">{D.WORKLOAD_TREND[D.WORKLOAD_TREND.length-1]}%</div>
              <span className="pill amber"><Icon name="arrowUp" size={10}/> +4</span>
            </div>
            <div className="muted" style={{ fontSize:12, marginBottom:14 }}>{t("section.workload.sub")}</div>
            <MiniBars data={D.WORKLOAD_TREND} color="var(--brand)" height={64}/>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("announce")}>
            <h3 className="h-section">{t("section.announcements")}</h3>
            <div className="row" style={{ gap:8 }}>
              <button className="btn sm ghost" onClick={e=>{e.stopPropagation();setRoute("announce")}}>{t("label.viewAll")}</button>
              <Chev k="announce"/>
            </div>
          </div>
          <div style={anim("announce")}>
            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:12 }}>
              {D.ANNOUNCEMENTS.slice(0,2).map(a => (
                <div key={a.id} style={{ padding:"10px 0", borderBottom:"1px solid var(--line-2)" }}>
                  <div className="row" style={{ gap:8 }}>
                    <Avatar person={a.author} size="sm"/>
                    <div style={{ fontWeight:500, fontSize:12.5 }}>{a.author.name}</div>
                    <span className="muted" style={{ fontSize:11.5, marginLeft:"auto" }}>{t("lang")==="ES"?a.postedAt:a.postedAt_en}</span>
                  </div>
                  <div style={{ fontSize:13.5, fontWeight:500, marginTop:6 }}>{a.title[t("lang").toLowerCase()]}</div>
                  <div className="row" style={{ gap:10, marginTop:6 }}>
                    <span className="muted" style={{ fontSize:11.5 }}>{Math.round(a.readPct*100)}% {t("label.read")}</span>
                    <span className="muted" style={{ fontSize:11.5 }}>· {a.comments.length} {t("label.comments")}</span>
                    <div className="row" style={{ marginLeft:"auto", gap:4 }}>
                      {Object.entries(a.reactions).map(([emo,n]) => (
                        <span key={emo} className="pill ghost" style={{ fontSize:11, padding:"1px 7px" }}>{emo} {n}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("recruit")}>
            <div>
              <div className="eyebrow">{t("section.recruit")}</div>
              <div className="muted" style={{ fontSize:12, marginTop:4 }}>{t("section.recruit.sub")}</div>
            </div>
            <Chev k="recruit"/>
          </div>
          <div style={anim("recruit")}>
            <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[
                { label:t("recruit.applied"),   v:124, c:"var(--ink-3)" },
                { label:t("recruit.interview"), v:18,  c:"var(--sky)" },
                { label:t("recruit.offer"),     v:5,   c:"var(--brand)" },
                { label:t("recruit.hired"),     v:2,   c:"var(--olive)" }
              ].map((r,i) => (
                <div key={i} style={{ padding:10, border:"1px solid var(--line)", borderRadius:10, textAlign:"center" }}>
                  <div className="serif" style={{ fontSize:24, color:r.c, letterSpacing:"-0.01em" }}>{r.v}</div>
                  <div className="muted" style={{ fontSize:11 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin:"14px 0 10px" }}/>
            <div className="eyebrow" style={{ marginBottom:10 }}>{t("lang")==="ES"?"Próximas entrevistas":"Upcoming interviews"}</div>
            {[
              { who:{initials:"MS",hue:2}, role:"Sr. Engineer · Ingeniería", when:t("lang")==="ES"?"Hoy 14:00":"Today 2:00 PM" },
              { who:{initials:"LP",hue:3}, role:"Designer · Diseño",         when:t("lang")==="ES"?"Mañana 10:30":"Tomorrow 10:30 AM" }
            ].map((r,i) => (
              <div key={i} className="row" style={{ padding:"6px 0", gap:10 }}>
                <Avatar person={r.who} size="sm"/>
                <div style={{ fontSize:12.5 }}>
                  <div style={{ fontWeight:500 }}>{r.role.split(" · ")[0]}</div>
                  <div className="muted" style={{ fontSize:11 }}>{r.role.split(" · ")[1]}</div>
                </div>
                <span className="pill" style={{ marginLeft:"auto", fontSize:11 }}>{r.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashboardEditorial = DashboardEditorial;
