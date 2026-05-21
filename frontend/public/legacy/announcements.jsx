// Announcements view — composer + feed with comments
function AnnouncementsView({ t }) {
  const D = window.GenteCR;
  const [draft, setDraft] = React.useState("");
  const [audience, setAudience] = React.useState("everyone");
  const [posts, setPosts] = React.useState(D.ANNOUNCEMENTS);
  const [composedToast, setComposedToast] = React.useState(false);
  const [reacted, setReacted] = React.useState({});

  const send = () => {
    if (!draft.trim()) return;
    const newPost = {
      id: "A-" + String(15 + posts.length).padStart(3,"0"),
      author: D.EMPLOYEES.find(e => e.name.startsWith("Andrea")) || { name: "Andrea Vargas", initials: "AV", hue: 1, role: "People Lead", dept: "People" },
      title: { es: draft.split("\n")[0].slice(0, 80) || "Anuncio", en: draft.split("\n")[0].slice(0, 80) || "Announcement" },
      body: { es: draft, en: draft },
      postedAt: "ahora", postedAt_en: "now",
      audience: { es: t("label.everyone"), en: "Whole company" },
      reactions: {},
      readPct: 0,
      comments: []
    };
    setPosts([newPost, ...posts]);
    setDraft("");
    setComposedToast(true);
    setTimeout(() => setComposedToast(false), 2200);
  };

  const react = (postId, emo) => {
    const key = `${postId}-${emo}`;
    setReacted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="main" data-screen-label="04 Anuncios" style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
      {/* Composer */}
      <div className="card-flush">
        <div style={{ padding: "16px 18px 0" }}>
          <div className="row between">
            <div>
              <h3 className="h-section">{t("section.composer")}</h3>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{t("section.composer.sub")}</div>
            </div>
            <Avatar person={{ initials: "AV", hue: 1 }} />
          </div>
        </div>
        <div style={{ padding: "12px 18px" }}>
          <textarea
            value={draft} onChange={e => setDraft(e.target.value)}
            placeholder={t("comp.placeholder")}
            style={{
              width: "100%", minHeight: 90,
              border: "1px solid var(--line)", borderRadius: 12,
              padding: 12, font: "inherit", outline: "none", resize: "vertical",
              background: "var(--bg-2)", color: "var(--ink)"
            }}/>
        </div>
        <div style={{ padding: "0 18px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="row" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>{t("comp.audience")}:</span>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              style={{
                border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px", height: 28,
                background: "var(--paper)", fontSize: 12, fontFamily: "inherit"
              }}>
              <option value="everyone">{t("label.everyone")}</option>
              {D.DEPTS.map(d => <option key={d} value={d}>{t("lang")==="ES"?"Equipo":"Team"} · {d}</option>)}
              <option value="managers">{t("lang")==="ES"?"Solo managers":"Managers only"}</option>
            </select>
          </div>
          <button className="btn sm ghost"><Icon name="paper" size={12}/>{t("comp.attach")}</button>
          <button className="btn sm ghost"><Icon name="target" size={12}/>{t("comp.poll")}</button>
          <button className="btn sm ghost"><Icon name="cal" size={12}/>{t("comp.schedule")}</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 11.5 }}>{draft.length}/2000</span>
            <button className="btn sm">{t("label.draft")}</button>
            <button className="btn brand sm" onClick={send} disabled={!draft.trim()}>
              <Icon name="send" size={13}/>{t("label.send")}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {composedToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--ink)", color: "var(--bg-2)", padding: "10px 16px",
          borderRadius: 999, fontSize: 13, fontWeight: 500, zIndex: 100,
          boxShadow: "0 12px 32px rgba(26,22,18,0.25)"
        }}>
          ✓ {t("lang")==="ES"?"Anuncio enviado a tu equipo":"Announcement sent to your team"}
        </div>
      )}

      {/* Feed */}
      <div className="col" style={{ gap: 14 }}>
        {posts.map(a => (
          <Announcement key={a.id} post={a} t={t} reacted={reacted} onReact={react}/>
        ))}
      </div>
    </div>
  );
}

function Announcement({ post: a, t, reacted, onReact }) {
  const [expanded, setExpanded] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [comments, setComments] = React.useState(a.comments);

  const submitComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      who: { initials: "AV", hue: 1, name: "Andrea Vargas" },
      body: { es: newComment, en: newComment },
      when: "ahora", when_en: "now", isAuthor: true
    }]);
    setNewComment("");
    setExpanded(true);
  };

  const emojis = ["❤", "🎉", "👏", "🙌", "💡"];
  return (
    <div className="card-flush" style={{ overflow: "visible" }}>
      <div style={{ padding: "18px 20px" }}>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="row" style={{ gap: 12 }}>
            <Avatar person={a.author} size="lg"/>
            <div>
              <div style={{ fontWeight: 600 }}>{a.author.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {a.author.role} · <span>{t("lang")==="ES"?a.postedAt:a.postedAt_en}</span> · {a.audience[t("lang").toLowerCase()]}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            {a.pinned && <span className="pill brand" style={{ fontSize: 11 }}><Icon name="pin" size={10}/> {t("label.pinned")}</span>}
            <button className="btn sm ghost" style={{ width: 30, padding: 0 }}>···</button>
          </div>
        </div>

        <h3 className="serif" style={{ fontSize: 24, margin: "14px 0 8px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          {a.title[t("lang").toLowerCase()]}
        </h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>
          {a.body[t("lang").toLowerCase()]}
        </p>

        {/* Read receipt + reactions */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div className="row" style={{ gap: 8 }}>
            <div className="bar" style={{ width: 80 }}>
              <i style={{ width: `${a.readPct*100}%`, background: "var(--olive)" }}/>
            </div>
            <span className="muted tnum" style={{ fontSize: 12 }}>{Math.round(a.readPct*100)}% {t("label.read")}</span>
          </div>
          <div className="row" style={{ gap: 6, marginLeft: "auto" }}>
            {emojis.map(emo => {
              const baseN = a.reactions[emo] || 0;
              const me = reacted[`${a.id}-${emo}`];
              const n = baseN + (me ? 1 : 0);
              return (
                <button key={emo} onClick={() => onReact(a.id, emo)} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  border: `1px solid ${me ? "var(--brand)" : "var(--line)"}`,
                  background: me ? "var(--brand-soft)" : "var(--paper)",
                  borderRadius: 999, padding: "4px 9px", fontSize: 12.5,
                  cursor: "pointer", color: "var(--ink-2)"
                }}>{emo} {n > 0 && <span className="tnum">{n}</span>}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comments */}
      {(comments.length > 0 || expanded) && (
        <div style={{ background: "var(--bg-2)", borderTop: "1px solid var(--line)", padding: "12px 20px" }}>
          {comments.map((c, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, padding: "10px 0",
              borderBottom: i < comments.length - 1 ? "1px solid var(--line-2)" : "0"
            }}>
              <Avatar person={c.who} size="sm"/>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{c.who.name || (c.who.initials === "AV" ? "Andrea Vargas" : "")}</div>
                  {c.isAuthor && <span className="pill" style={{ fontSize: 10, padding: "1px 6px" }}>{t("lang")==="ES"?"Autor":"Author"}</span>}
                  <span className="muted" style={{ fontSize: 11 }}>{t("lang")==="ES"?c.when:c.when_en}</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 2, color: "var(--ink-2)" }}>{c.body[t("lang").toLowerCase()]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment composer */}
      <div style={{
        borderTop: comments.length > 0 ? "1px solid var(--line-2)" : "1px solid var(--line)",
        background: "var(--bg-2)", padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10
      }}>
        <Avatar person={{ initials: "AV", hue: 1 }} size="sm"/>
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submitComment()}
          placeholder={t("lang")==="ES"?"Comentar…":"Comment…"}
          style={{
            flex: 1, border: 0, background: "transparent",
            font: "inherit", outline: "none", color: "var(--ink)"
          }}/>
        <button className="btn sm" onClick={submitComment} disabled={!newComment.trim()}>
          <Icon name="send" size={12}/>
        </button>
        {comments.length > 0 && (
          <button className="btn sm ghost" onClick={() => setExpanded(!expanded)}>
            {comments.length} {t("label.comments")}
          </button>
        )}
      </div>
    </div>
  );
}

window.AnnouncementsView = AnnouncementsView;
