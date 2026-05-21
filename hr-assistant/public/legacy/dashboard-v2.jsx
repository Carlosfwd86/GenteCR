// Dashboard variation 2 — "Operativo": dense, table-forward, ops-grade
function DashboardOps({ t, openEmployee, openSurvey, setRoute }) {
  const D = window.GenteCR;
  const depts = D.aggByDept();
  const allEmp = D.EMPLOYEES.slice().sort((a,b) => a.happiness - b.happiness);
  const [filter, setFilter] = React.useState("all");
  const filtered = allEmp.filter(e => filter==="all" ? true : filter==="atrisk" ? e.status==="at-risk" : filter==="watch" ? e.status==="watch" : e.dept===filter);

  const [o, setO] = React.useState({
    kpis: true, team: true, trend: true, depts: true,
    surveys: true, sugg: true, workload: true
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
         style={{ flexShrink:0, transition:"transform .22s", transform:o[k]?"rotate(0deg)":"rotate(-90deg)", color:"var(--ink-3)" }}>
      <path d="M6 9l6 6 6-6"/>
    </svg>
  );

  return (
    <div className="main" data-screen-label="02 Dashboard · Operativo" style={{ gap:16 }}>

      {/* KPI strip */}
      <div className="card-flush">
        <div style={{ padding:"10px 16px 6px", borderBottom: o.kpis?"1px solid var(--line)":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}
             onClick={() => tog("kpis")}>
          <div className="eyebrow" style={{ marginBottom:0 }}>KPIs</div>
          <Chev k="kpis"/>
        </div>
        <div style={anim("kpis")}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)" }}>
            {[
              { k:t("kpi.satisfaction"), v:D.COMPANY.satisfaction.toFixed(1), unit:"/5", d:"+0.2", up:true,  spark:D.COMPANY.trend },
              { k:t("kpi.enps"),         v:`+${D.COMPANY.eNPS}`,               unit:"",   d:"+24",  up:true,  spark:[12,18,22,28,30,36,40,42] },
              { k:t("kpi.response"),     v:`${D.COMPANY.responseRate}`,         unit:"%",  d:"+7%",  up:true,  spark:[70,75,78,76,80,83,84,85] },
              { k:t("kpi.atrisk"),       v:D.COMPANY.atRisk,                    unit:"",   d:"-1",   up:true,  spark:[5,4,5,4,4,3,4,3] },
              { k:t("lang")==="ES"?"Carga media":"Avg workload", v:`${D.WORKLOAD_TREND[D.WORKLOAD_TREND.length-1]}`, unit:"%", d:"+4%", up:false, spark:D.WORKLOAD_TREND },
              { k:t("kpi.headcount"),    v:D.COMPANY.headcount,                 unit:"",   d:"+3",   up:true,  spark:[42,42,43,43,45,45,47,48] }
            ].map((kpi,i,arr) => (
              <div key={i} style={{ padding:16, borderRight:i<arr.length-1?"1px solid var(--line)":"0", display:"flex", flexDirection:"column", gap:6 }}>
                <div className="muted" style={{ fontSize:11, letterSpacing:"0.04em" }}>{kpi.k}</div>
                <div className="row between" style={{ alignItems:"baseline" }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                    <span className="tnum" style={{ fontSize:22, fontWeight:600, letterSpacing:"-0.01em" }}>{kpi.v}</span>
                    <span className="muted" style={{ fontSize:12 }}>{kpi.unit}</span>
                  </div>
                  <span className={`stat-delta ${kpi.up?"up":"down"}`} style={{ fontSize:11 }}>
                    <Icon name={kpi.up?"arrowUp":"arrowDown"} size={10}/>{kpi.d}
                  </span>
                </div>
                <Sparkline data={kpi.spark} height={24} range={[Math.min(...kpi.spark)*0.85,Math.max(...kpi.spark)*1.05]} color="var(--ink-2)" fill="rgba(0,0,0,0.05)"/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla equipo + paneles laterales */}
      <div className="grid" style={{ gridTemplateColumns:"1.5fr 1fr", gap:16 }}>

        <div className="card-flush">
          <div style={{ padding:"12px 16px", borderBottom: o.team?"1px solid var(--line)":"none", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", cursor:"pointer" }}
               onClick={() => tog("team")}>
            <h3 className="h-section">{t("section.team")}</h3>
            <span className="pill ghost">{filtered.length}</span>
            <div style={{ marginLeft:8, display:"inline-flex", border:"1px solid var(--line)", borderRadius:8, padding:2 }} onClick={e=>e.stopPropagation()}>
              {[{k:"all",l:t("filter.all")},{k:"atrisk",l:t("label.atRisk")},{k:"watch",l:t("label.watch")}].map(f => (
                <button key={f.k} onClick={()=>setFilter(f.k)} style={{ border:0, padding:"5px 10px", borderRadius:6, background:filter===f.k?"var(--ink)":"transparent", color:filter===f.k?"var(--bg-2)":"var(--ink-2)", fontSize:11.5, fontWeight:500, cursor:"pointer" }}>{f.l}</button>
              ))}
            </div>
            <select value={filter.startsWith("dept-")?filter:"all-dept"} onChange={e=>setFilter(e.target.value==="all-dept"?"all":e.target.value)}
              onClick={e=>e.stopPropagation()}
              style={{ border:"1px solid var(--line)", borderRadius:8, padding:"5px 10px", background:"var(--paper)", fontSize:11.5, color:"var(--ink-2)", height:28 }}>
              <option value="all-dept">{t("filter.dept")}</option>
              {D.DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <div style={{ marginLeft:"auto", display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
              <button className="btn sm"><Icon name="filter" size={12}/>{t("lang")==="ES"?"Filtros":"Filters"}</button>
              <button className="btn sm"><Icon name="download" size={12}/>{t("lang")==="ES"?"Exportar":"Export"}</button>
            </div>
            <Chev k="team"/>
          </div>
          <div style={anim("team")}>
            <div style={{ maxHeight:480, overflow:"auto" }} className="scrl">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{width:"26%"}}>{t("table.name")}</th>
                    <th style={{width:"14%"}}>{t("table.dept")}</th>
                    <th style={{width:"14%"}}>{t("table.sat")}</th>
                    <th style={{width:"10%"}}>{t("table.eNPS")}</th>
                    <th style={{width:"12%"}}>{t("table.workload")}</th>
                    <th style={{width:"10%"}}>{t("table.last")}</th>
                    <th style={{width:"14%"}}>{t("table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0,14).map(e => (
                    <tr key={e.id} onClick={()=>openEmployee(e)}>
                      <td>
                        <div className="row" style={{gap:10}}>
                          <Avatar person={e} size="sm"/>
                          <div>
                            <div style={{fontWeight:500}}>{e.name}</div>
                            <div className="muted" style={{fontSize:11}}>{e.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted" style={{fontSize:12.5}}>{e.dept}</td>
                      <td>
                        <div className="row" style={{gap:8}}>
                          <MoodDot value={e.happiness} size={8}/>
                          <span className="tnum" style={{fontWeight:600}}>{e.happiness.toFixed(1)}</span>
                          <div style={{width:60}}><Sparkline data={e.trend} height={18}/></div>
                        </div>
                      </td>
                      <td className="tnum">{e.eNPS>0?"+":""}{e.eNPS}</td>
                      <td>
                        <div className="row" style={{gap:6}}>
                          <div className="bar" style={{width:60}}><i style={{width:`${e.workload}%`, background:e.workload>80?"var(--rose)":e.workload>65?"var(--amber)":"var(--olive)"}}/></div>
                          <span className="tnum muted" style={{fontSize:11}}>{e.workload}%</span>
                        </div>
                      </td>
                      <td className="muted tnum" style={{fontSize:12}}>{e.lastResp}d</td>
                      <td><StatusPill status={e.status} t={t}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:"10px 16px", borderTop:"1px solid var(--line)", display:"flex", alignItems:"center", gap:10 }}>
              <span className="muted" style={{fontSize:12}}>{t("lang")==="ES"?`Mostrando 14 de ${filtered.length}`:`Showing 14 of ${filtered.length}`}</span>
              <button className="btn sm ghost" style={{marginLeft:"auto"}} onClick={()=>setRoute("employees")}>{t("label.viewAll")}<Icon name="arrow" size={11}/></button>
            </div>
          </div>
        </div>

        {/* Paneles laterales */}
        <div className="col" style={{ gap:16 }}>

          <div className="card">
            <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("trend")}>
              <div>
                <h3 className="h-section">{t("section.trend")}</h3>
                <div className="muted" style={{fontSize:12}}>{t("section.trend.sub")}</div>
              </div>
              <div className="row" style={{gap:8}}>
                <span className="pill olive"><Icon name="arrowUp" size={10}/> +0.2</span>
                <Chev k="trend"/>
              </div>
            </div>
            <div style={anim("trend")}>
              <div style={{marginTop:10}}><LineChart data={D.COMPANY.trend} height={120}/></div>
            </div>
          </div>

          <div className="card-flush">
            <div style={{ padding:"14px 16px 10px", borderBottom: o.depts?"1px solid var(--line)":"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}
                 onClick={() => tog("depts")}>
              <h3 className="h-section">{t("section.depts")}</h3>
              <Chev k="depts"/>
            </div>
            <div style={anim("depts")}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t("table.dept")}</th>
                    <th style={{width:60}}>#</th>
                    <th>{t("table.sat")}</th>
                    <th style={{width:80}}>{t("table.eNPS")}</th>
                    <th style={{width:80}}>{t("lang")==="ES"?"Resp.":"Resp."}</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map(d => (
                    <tr key={d.dept} style={{cursor:"default"}}>
                      <td style={{fontWeight:500}}>{d.dept}</td>
                      <td className="muted tnum">{d.count}</td>
                      <td>
                        <div className="row" style={{gap:6}}>
                          <div className="bar" style={{width:60}}><i style={{width:`${((d.sat-1)/4)*100}%`, background:d.sat>4?"var(--olive)":d.sat>3?"var(--amber)":"var(--rose)"}}/></div>
                          <span className="tnum" style={{fontSize:12,fontWeight:600}}>{d.sat.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="tnum">{d.eNPS>=0?"+":""}{d.eNPS}</td>
                      <td className="tnum muted">{d.responseRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Encuestas + Sugerencias + Carga */}
      <div className="grid" style={{ gridTemplateColumns:"1.2fr 1fr 0.8fr", gap:16 }}>

        <div className="card-flush">
          <div style={{ padding:"14px 16px", borderBottom: o.surveys?"1px solid var(--line)":"none", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
               onClick={() => tog("surveys")}>
            <h3 className="h-section">{t("section.upcoming")}</h3>
            <div className="row" style={{gap:8}}>
              <button className="btn sm ghost" onClick={e=>{e.stopPropagation();setRoute("surveys")}}>{t("label.viewAll")}</button>
              <Chev k="surveys"/>
            </div>
          </div>
          <div style={anim("surveys")}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t("lang")==="ES"?"Encuesta":"Survey"}</th>
                  <th>{t("lang")==="ES"?"Tipo":"Type"}</th>
                  <th>{t("lang")==="ES"?"Resp.":"Resp."}</th>
                  <th>{t("lang")==="ES"?"Promedio":"Average"}</th>
                  <th>{t("lang")==="ES"?"Cierra":"Closes"}</th>
                </tr>
              </thead>
              <tbody>
                {D.SURVEYS.map(s => {
                  const pct = Math.round(s.responses/s.sent*100);
                  return (
                    <tr key={s.id} onClick={()=>openSurvey(s)}>
                      <td>
                        <div style={{fontWeight:500}}>{s.title[t("lang").toLowerCase()]}</div>
                        <div className="muted mono" style={{fontSize:11}}>{s.id}</div>
                      </td>
                      <td><span className="pill ghost">{s.type[t("lang").toLowerCase()]}</span></td>
                      <td>
                        <div className="row" style={{gap:6}}>
                          <div className="bar" style={{width:60}}><i style={{width:`${pct}%`,background:"var(--brand)"}}/></div>
                          <span className="tnum" style={{fontSize:12}}>{s.responses}/{s.sent}</span>
                        </div>
                      </td>
                      <td>
                        <div className="row" style={{gap:6}}>
                          <MoodDot value={s.avgSat} size={8}/>
                          <span className="tnum">{s.avgSat.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="muted tnum">{s.closesAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("sugg")}>
            <h3 className="h-section">{t("section.suggestions")}</h3>
            <div className="row" style={{gap:8}}>
              <Icon name="sparkle" size={14} stroke="var(--brand)"/>
              <Chev k="sugg"/>
            </div>
          </div>
          <div style={anim("sugg")}>
            <div style={{marginTop:12, display:"flex", flexDirection:"column", gap:8}}>
              {[
                {tone:"rose",  txt:t("lang")==="ES"?"3 personas en Ops sin responder (2 pulses).":"3 Ops people skipped 2 pulses."},
                {tone:"amber", txt:t("lang")==="ES"?"Eng workload +12% — revisa carga.":"Eng workload +12% — review."},
                {tone:"olive", txt:t("lang")==="ES"?"Diseño 4.4/5 — buen momento para reconocer.":"Design at 4.4/5 — recognize the team."},
                {tone:"sky",   txt:t("lang")==="ES"?"Onboarding 30d: 6/6 respondieron — feedback positivo.":"30d onboarding: 6/6 answered — positive."}
              ].map((s,i) => (
                <div key={i} className="row" style={{alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:i<3?"1px solid var(--line-2)":"0"}}>
                  <span className={`pill ${s.tone}`} style={{fontSize:10,padding:"2px 7px"}}>{i+1}</span>
                  <div style={{fontSize:12.5,color:"var(--ink-2)",flex:1}}>{s.txt}</div>
                  <Icon name="arrow" size={12} stroke="var(--ink-3)"/>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row between" style={{ cursor:"pointer" }} onClick={() => tog("workload")}>
            <div className="eyebrow">{t("section.workload")}</div>
            <Chev k="workload"/>
          </div>
          <div style={anim("workload")}>
            <div className="row between" style={{alignItems:"baseline",marginTop:6}}>
              <div className="tnum" style={{fontSize:28,fontWeight:600,letterSpacing:"-0.01em"}}>{D.WORKLOAD_TREND[D.WORKLOAD_TREND.length-1]}%</div>
              <span className="pill amber"><Icon name="arrowUp" size={10}/> +4</span>
            </div>
            <div className="muted" style={{fontSize:11.5,marginTop:4}}>{t("section.workload.sub")}</div>
            <div style={{marginTop:14}}>
              <MiniBars data={D.WORKLOAD_TREND} color="var(--ink)" height={70}/>
            </div>
            <div className="row between muted" style={{fontSize:10.5,marginTop:6}}>
              <span>{t("lang")==="ES"?"hace 14d":"14d ago"}</span>
              <span>{t("lang")==="ES"?"hoy":"today"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashboardOps = DashboardOps;
