// Landing page for GenteCR — public site
const { useState: lUseState } = React;

function Landing({ t, onEnter }) {
  const stats = [
    { num: "120+", label: t("land.stats.companies") },
    { num: "1.4M", label: t("land.stats.surveys") },
    { num: "91%", label: t("land.stats.retention") }
  ];
  const features = [
    { icon: "paper",  title: t("land.f1.title"), body: t("land.f1.body"), tint: "var(--brand-soft)", fg: "var(--brand-deep)" },
    { icon: "alert",  title: t("land.f2.title"), body: t("land.f2.body"), tint: "var(--olive-soft)", fg: "#3F5424" },
    { icon: "chat",   title: t("land.f3.title"), body: t("land.f3.body"), tint: "var(--sky-soft)", fg: "#244258" }
  ];
  return (
    <div className="land" data-screen-label="01 Landing pública">
      {/* Nav */}
      <div className="land-nav">
        <Logo size={28} />
        <div style={{ display:"flex", gap: 22, marginLeft: 24 }}>
          <a href="#producto">{t("lang") === "ES" ? "Producto" : "Product"}</a>
          <a href="#beneficios">{t("lang") === "ES" ? "Beneficios" : "Why us"}</a>
          <a href="#clientes">{t("lang") === "ES" ? "Clientes" : "Customers"}</a>
          <a href="#precios">{t("lang") === "ES" ? "Precios" : "Pricing"}</a>
        </div>
        <div style={{ marginLeft: "auto", display:"flex", gap: 8 }}>
          <button className="btn ghost sm">{t("lang") === "ES" ? "Ingresar" : "Sign in"}</button>
          <button className="btn brand sm" onClick={onEnter}>{t("land.cta")}</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        gap: 48,
        padding: "48px 48px 64px",
        alignItems: "center",
        maxWidth: 1280,
        margin: "0 auto"
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap: 8, padding: "4px 10px", background: "var(--brand-soft)", color: "var(--brand-deep)", borderRadius: 999, fontSize: 11, letterSpacing: "0.08em" }}>
              <span className="dot" style={{ background: "var(--brand)" }} /> {t("land.kicker")}
            </span>
          </div>
          <h1 className="h-display" style={{ fontSize: 62, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-0.04em" }}>
            {t("land.hero1")} <span style={{ color: "var(--brand)", position: "relative" }}>{t("land.hero2")}</span><br/>
            {t("land.hero3")}
          </h1>
          <p style={{ marginTop: 20, fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 520 }}>
            {t("land.sub")}
          </p>
          <div style={{ display:"flex", gap: 10, marginTop: 26 }}>
            <button className="btn brand" onClick={onEnter}>
              {t("land.cta")} <Icon name="arrow" size={14} />
            </button>
            <button className="btn" onClick={onEnter}>{t("land.cta2")}</button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 36 }}>
            {stats.map((s,i) => (
              <div key={i}>
                <div className="serif" style={{ fontSize: 26, lineHeight: 1, letterSpacing: "-0.03em", fontWeight: 600 }}>{s.num}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero mock — dashboard preview */}
        <div style={{ position: "relative" }}>
          <div className="card" style={{
            padding: 0, overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
            transform: "rotate(-1deg)"
          }}>
            <div style={{ background:"var(--bg-2)", padding:"10px 14px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", gap: 8 }}>
              <div style={{ display:"flex", gap: 6 }}>
                {["#F87171","#FBBF24","#34D399"].map((c,i)=><span key={i} style={{width:11,height:11,borderRadius:999,background:c}}/>)}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 8 }}>app.gentecr.com/dashboard</div>
            </div>
            <div style={{ padding: 20, background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>{t("kpi.satisfaction")}</div>
                  <div className="stat-num">3.8<span style={{fontSize:18,color:"var(--ink-3)"}}>/5</span></div>
                </div>
                <span className="pill olive"><Icon name="arrowUp" size={11}/> +0.2</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <Sparkline data={[3.2,3.3,3.1,3.4,3.5,3.4,3.6,3.5,3.6,3.7,3.7,3.8]} height={48}/>
              </div>
              <div className="divider" style={{ margin: "16px 0" }}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  {label:"eNPS", v:"+42", c:"olive"},
                  {label:t("kpi.response"), v:"85%", c:"sky"},
                  {label:t("kpi.atrisk"), v:"3", c:"rose"},
                  {label:t("kpi.headcount"), v:"48", c:"plum"}
                ].map((k,i)=> (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", border:"1px solid var(--line)", borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{k.label}</div>
                    <span className={`pill ${k.c}`} style={{ fontSize: 11.5 }}>{k.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card" style={{
            position:"absolute", right: -16, bottom: -28, width: 280,
            padding: 16,
            transform: "rotate(2.4deg)",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div className="row" style={{ marginBottom: 10 }}>
              <Avatar person={{initials:"SR", hue:0}} size="sm" />
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Sofía Rojas</div>
              <span className="pill rose" style={{ marginLeft: "auto", fontSize: 11 }}>2.1/5</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
              "{t("lang") === "ES" ? "Sigo esperando feedback de la última review. Me ayudaría tener claridad." : "Still waiting on feedback from the last review. Some clarity would help."}"
            </div>
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <button className="btn sm" style={{height:26, fontSize:11.5}}><Icon name="chat" size={12}/>{t("act.message")}</button>
              <button className="btn sm" style={{height:26, fontSize:11.5}}><Icon name="cal" size={12}/>{t("act.schedule")}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo strip */}
      <div style={{
        borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
        padding: "20px 48px", background: "var(--bg-2)"
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap" }}>
          <div className="eyebrow">{t("lang") === "ES" ? "Confían en GenteCR" : "Trusted by"}</div>
          {["MORADO","Pulpe","Frondex","Crater Labs","Mejorito","Tica & Co"].map((b,i) => (
            <div key={i} className="serif" style={{ fontSize: 22, color: "var(--ink-3)", letterSpacing: "-0.01em", opacity: 0.85 }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div id="producto" style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 48px 24px" }}>
        <div className="eyebrow">{t("lang") === "ES" ? "Cómo funciona" : "How it works"}</div>
        <h2 className="h-title" style={{ fontSize: 40, marginTop: 10, maxWidth: 760, letterSpacing: "-0.03em" }}>
          {t("lang") === "ES"
            ? <>Tres cosas que tu equipo ya quería <span style={{ color: "var(--brand)" }}>antes</span> de que lo notaras.</>
            : <>Three things your team already wanted <span style={{ color: "var(--brand)" }}>before</span> you noticed.</>}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 36 }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: 28, minHeight: 220 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: f.tint, color: f.fg,
                display:"grid", placeItems: "center", marginBottom: 18
              }}>
                <Icon name={f.icon} size={22} strokeWidth={1.7} />
              </div>
              <h3 className="h-section" style={{ marginBottom: 8 }}>{f.title}</h3>
              <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quote */}
      <div id="clientes" style={{ maxWidth: 980, margin: "80px auto 0", padding: "0 48px" }}>
        <div className="card" style={{ padding: 44, background: "var(--paper)" }}>
          <Icon name="sparkle" size={24} style={{ color: "var(--brand)" }} />
          <p className="serif" style={{ fontSize: 28, lineHeight: 1.3, margin: "16px 0 24px", letterSpacing: "-0.025em", fontWeight: 500 }}>
            "{t("land.quote")}"
          </p>
          <div className="row">
            <Avatar person={{ initials: "AV", hue: 1 }} size="lg" />
            <div>
              <div style={{ fontWeight: 600 }}>{t("land.quoteWho").split(" · ")[0]}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{t("land.quoteWho").split(" · ")[1]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div id="precios" style={{ maxWidth: 1280, margin: "80px auto 0", padding: "0 48px 80px" }}>
        <div style={{
          background: "var(--ink)", color: "var(--bg-2)",
          borderRadius: 24, padding: "56px 56px 64px",
          display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center"
        }}>
          <div>
            <h2 className="serif" style={{ fontSize: 42, lineHeight: 1.08, margin: 0, letterSpacing: "-0.035em", fontWeight: 600 }}>
              {t("lang") === "ES" ? <>Empieza esta semana.<br/>El próximo lunes el equipo te lo agradece.</> : <>Start this week.<br/>Your team thanks you on Monday.</>}
            </h2>
            <div style={{ display:"flex", gap: 12, marginTop: 28 }}>
              <button className="btn brand" onClick={onEnter}>{t("land.cta")} <Icon name="arrow" size={16} /></button>
              <button className="btn ghost" style={{ color: "var(--bg-2)", borderColor: "rgba(246,241,232,0.25)" }} onClick={onEnter}>
                {t("land.cta2")}
              </button>
            </div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(246,241,232,0.15)", paddingLeft: 32 }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                t("lang") === "ES" ? "Integración con Google Forms en 5 minutos" : "Google Forms integration in 5 minutes",
                t("lang") === "ES" ? "Hasta 200 personas en el plan Inicial" : "Up to 200 people on the Starter plan",
                t("lang") === "ES" ? "Onboarding asistido por una persona real" : "Onboarding assisted by a real person",
                t("lang") === "ES" ? "Datos en LATAM, no salen de la región" : "LATAM-based data, never leaves the region"
              ].map((line, i) => (
                <li key={i} className="row" style={{ gap: 10 }}>
                  <span style={{ width:18, height:18, borderRadius:999, background:"var(--brand)", display:"grid", placeItems:"center" }}>
                    <Icon name="check" size={12} stroke="#FFF6EE" strokeWidth={2.2}/>
                  </span>
                  <span style={{ fontSize: 14.5 }}>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line)", padding: "24px 48px", display: "flex", justifyContent: "space-between" }}>
        <div className="muted" style={{ fontSize: 12.5 }}>{t("land.footer")}</div>
        <div className="row" style={{ gap: 16 }}>
          <a className="muted" style={{ fontSize: 12.5 }}>{t("lang")==="ES"?"Privacidad":"Privacy"}</a>
          <a className="muted" style={{ fontSize: 12.5 }}>{t("lang")==="ES"?"Términos":"Terms"}</a>
          <a className="muted" style={{ fontSize: 12.5 }}>hola@gentecr.com</a>
        </div>
      </div>
    </div>
  );
}

window.Landing = Landing;
