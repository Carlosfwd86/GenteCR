// Shared components, icons, helpers for GenteCR
const { useState, useEffect, useMemo, useRef } = React;

// ---------- Tiny inline icons (24x24 stroke) ----------
const Icon = ({ name, size = 18, stroke = "currentColor", strokeWidth = 1.6, style }) => {
  const paths = {
    home:   "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z",
    dash:   "M4 13h6V4H4Zm0 7h6v-4H4Zm10 0h6V11h-6Zm0-13v5h6V7Z",
    chart:  "M4 20V8m6 12V4m6 16v-7m6 7V11",
    people: "M16 14a4 4 0 1 0-8 0M5 21c0-3.866 3.134-6 7-6s7 2.134 7 6M19 8a3 3 0 1 1-3-3M5 8a3 3 0 1 0 3-3",
    bell:   "M6 8a6 6 0 1 1 12 0v4l1.5 3h-15L6 12Zm3 10a3 3 0 0 0 6 0",
    chat:   "M21 12a8 8 0 1 1-3.6-6.66L21 4l-1.34 3.6A7.96 7.96 0 0 1 21 12Z",
    plus:   "M12 5v14M5 12h14",
    search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm9 2-4.3-4.3",
    star:   "m12 4 2.4 5 5.6.6-4.1 3.8 1.2 5.6L12 16.6 6.9 19l1.2-5.6L4 9.6 9.6 9Z",
    settings:"M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 3 2-1-2-3-2 1-2-1V5h-4v2l-2 1-2-1-2 3 2 1v2l-2 1 2 3 2-1 2 1v2h4v-2l2-1 2 1 2-3-2-1Z",
    send:   "M3 20 22 12 3 4l3 8-3 8Zm3-8h13",
    pin:    "M12 16v6m4-8V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v10l-2 2v2h12v-2Z",
    arrow:  "M5 12h14m-5-5 5 5-5 5",
    arrowDown: "M12 5v14m-5-5 5 5 5-5",
    arrowUp:   "M12 19V5M5 12l7-7 7 7",
    check:  "m4 12 5 5L20 6",
    x:      "M6 6l12 12M18 6 6 18",
    alert:  "M12 9v5M12 17.5h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    smile:  "M9 10h.01M15 10h.01M8.5 14a4 4 0 0 0 7 0M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z",
    sparkle:"M12 3v6m0 6v6M3 12h6m6 0h6M5.6 5.6l4.2 4.2m4.4 4.4 4.2 4.2M5.6 18.4l4.2-4.2m4.4-4.4 4.2-4.2",
    eye:    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    cal:    "M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3-2v4m8-4v4",
    filter: "M4 5h16l-6 8v6l-4-2v-4Z",
    sort:   "M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0 3 3m-3-3-3 3",
    heart:  "M12 21s-7-4.5-9.5-9C.7 8.3 3 5 6.3 5c1.9 0 3.5 1 4.7 2.5C12.2 6 13.8 5 15.7 5 19 5 21.3 8.3 19.5 12 17 16.5 12 21 12 21Z",
    moon:   "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10Z",
    spark:  "m13 2-2 8H4l7 4-2 8 7-6 7 6-2-8 7-4h-7Z",
    grid:   "M4 4h7v7H4Zm9 0h7v7h-7ZM4 13h7v7H4Zm9 0h7v7h-7Z",
    list:   "M4 6h16M4 12h16M4 18h10",
    download:"M12 4v12m-5-5 5 5 5-5M4 20h16",
    upload: "M12 20V8m-5 5 5-5 5 5M4 4h16",
    paper:  "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8M8 17h5",
    target: "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-4a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-4a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z",
    coffee: "M3 8h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Zm14 1h3a2 2 0 0 1 0 4h-3M6 2v3m4-3v3m4-3v3",
    leaf:   "M5 21c0-9 7-15 16-15 0 9-7 15-16 15Zm0 0 8-8"
  };
  const d = paths[name] || paths.dash;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
};

// ---------- Avatar with deterministic warm color ----------
const Avatar = ({ person, size = "md" }) => {
  const cls = size === "sm" ? "avatar sm" : size === "lg" ? "avatar lg" : size === "xl" ? "avatar xl" : "avatar";
  const palette = [
    { bg: "#EFF6FF", fg: "#1E3A8A" }, // navy
    { bg: "#F1F5F9", fg: "#334155" }, // slate
    { bg: "#ECFEFF", fg: "#155E75" }, // cyan/teal
    { bg: "#DCFCE7", fg: "#14532D" }, // emerald
    { bg: "#FEF3C7", fg: "#78350F" }, // amber
    { bg: "#EDE9FE", fg: "#5B21B6" }, // violet
  ];
  const c = palette[(person?.hue || 0) % palette.length];
  return (
    <span className={cls} style={{ background: c.bg, color: c.fg }}>
      {person?.initials || "·"}
    </span>
  );
};

// ---------- Mood dot ----------
const MoodDot = ({ value, size = 10 }) => {
  const colors = ["#B91C1C","#EA580C","#CA8A04","#65A30D","#15803D"];
  const idx = Math.max(0, Math.min(4, Math.round(value) - 1));
  return <span className="dot" style={{ width: size, height: size, background: colors[idx] }} />;
};

// ---------- Status pill ----------
const StatusPill = ({ status, t }) => {
  if (status === "healthy") return <span className="pill olive"><span className="dot" style={{background:"#15803D"}}/>{t("label.healthy")}</span>;
  if (status === "watch")   return <span className="pill amber"><span className="dot" style={{background:"#B45309"}}/>{t("label.watch")}</span>;
  return <span className="pill rose"><span className="dot" style={{background:"#B91C1C"}}/>{t("label.atRisk")}</span>;
};

// ---------- Sparkline ----------
const Sparkline = ({ data, color = "var(--brand)", fill = "rgba(30,64,175,0.08)", height = 32, range = [1,5] }) => {
  const w = 120, h = height;
  if (!data || !data.length) return <svg className="spark" viewBox={`0 0 ${w} ${h}`} />;
  const [lo, hi] = range;
  const xs = data.length - 1;
  const points = data.map((v, i) => {
    const x = (i / xs) * w;
    const y = h - ((v - lo) / (hi - lo)) * (h - 4) - 2;
    return [x, y];
  });
  const d = points.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const a = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={a} fill={fill} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="2.5" fill={color} />
    </svg>
  );
};

// ---------- Bar mini chart (for workload) ----------
const MiniBars = ({ data, color = "var(--ink)", height = 56 }) => {
  if (!data || !data.length) return null;
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          width: 8, height: `${(v/max)*100}%`,
          background: color, borderRadius: 3, opacity: 0.4 + (v/max)*0.6
        }} />
      ))}
    </div>
  );
};

// ---------- Donut (single value) ----------
const Donut = ({ value, max = 100, color = "var(--brand)", track = "var(--mist)", size = 84, stroke = 9, label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      {label && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          fontFamily: "var(--font-display)", fontSize: size * 0.32, letterSpacing: "-0.02em"
        }}>{label}</div>
      )}
    </div>
  );
};

// ---------- Line chart (large) ----------
const LineChart = ({ data, height = 160, color = "var(--brand)", fill = "rgba(30,64,175,0.07)", range = [1,5], yLabels = true }) => {
  const w = 720;
  const h = height;
  const padL = yLabels ? 28 : 4, padR = 8, padT = 12, padB = 24;
  const [lo, hi] = range;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const xs = data.length - 1;
  const pts = data.map((v, i) => {
    const x = padL + (i / xs) * innerW;
    const y = padT + (1 - (v - lo) / (hi - lo)) * innerH;
    return [x, y];
  });
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const a = `${d} L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`;
  const yTicks = [hi, (lo+hi)/2, lo];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{display:"block"}}>
      {yTicks.map((v, i) => {
        const y = padT + (i/(yTicks.length-1)) * innerH;
        return (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--line)" strokeDasharray="2 4" />
            {yLabels && <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="10" fill="var(--ink-3)">{v.toFixed(1)}</text>}
          </g>
        );
      })}
      <path d={a} fill={fill} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5} fill={color} stroke="var(--paper)" strokeWidth="2" />
      ))}
      {data.map((v, i) => {
        const x = padL + (i / xs) * innerW;
        return <text key={i} x={x} y={h - 6} textAnchor="middle" fontSize="10" fill="var(--ink-3)">{`s${i+1}`}</text>;
      })}
    </svg>
  );
};

// ---------- Distribution bar (likert) ----------
const LikertBar = ({ avg, total = 41 }) => {
  const seed = Math.round(avg * 10) || 35;
  const r = (n) => {
    let x = Math.sin(seed * (n+1)) * 1000;
    return Math.abs(x - Math.floor(x));
  };
  const dist = [1,2,3,4,5].map((b) => {
    const dx = Math.abs(b - avg);
    return Math.max(1, Math.round((1.4 - dx) * (total * 0.32) + r(b) * 5));
  });
  const sum = dist.reduce((a,b)=>a+b,0);
  const norm = dist.map(d => Math.round(d/sum * total));
  const colors = ["#B91C1C","#EA580C","#CA8A04","#65A30D","#15803D"];
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", border: "1px solid var(--line)" }}>
      {norm.map((n, i) => (
        <div key={i} title={`${i+1}: ${n}`} style={{ flex: n || 0.0001, background: colors[i] }} />
      ))}
    </div>
  );
};

// ---------- Brand mark + logo ----------
const Logo = ({ size = 28 }) => (
  <div className="brand-mark" style={{ padding: 0, display: "flex", alignItems: "center" }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 250" style={{ height: size, width: "auto", display: "block" }}>
      <g transform="translate(30, 20)">
        <path d="M 120,40 C 170,30 200,90 190,130 C 180,170 120,200 80,180 C 40,160 70,50 120,40 Z"
              fill="none" stroke="#2D3134" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 70,50 C 30,80 25,140 50,170 C 75,200 150,160 170,120 C 190,80 110,20 70,50 Z"
              fill="none" stroke="#0074C4" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M 110,25 C 145,25 150,100 135,150 C 120,200 70,210 55,175 C 40,140 75,25 110,25 Z"
              fill="none" stroke="#F15A24" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <g fill="currentColor">
        <text x="245" y="155" fontFamily="'Segoe UI', var(--font-display), 'DM Sans', sans-serif" fontWeight="400" fontSize="115">GenteCR</text>
        <text x="250" y="200" fontFamily="'Segoe UI', var(--font-display), 'DM Sans', sans-serif" fontWeight="600" fontSize="29" letterSpacing="1">MENOS PANTALLAS, MÁS CONVERSACIONES</text>
      </g>
    </svg>
  </div>
);

// ---------- Util ----------
function fmtTenure(months, t) {
  if (months < 12) return `${months} ${t("months")}`;
  const y = Math.floor(months/12);
  const m = months % 12;
  return m ? `${y}.${Math.round(m/12*10)} ${y===1?"año":"años"}` : `${y} ${y===1?"año":"años"}`;
}

function deltaArrow(curr, prev) {
  const diff = Math.round((curr - prev) * 10) / 10;
  if (Math.abs(diff) < 0.05) return { up: false, val: "0" };
  const isInt = Math.abs(diff) >= 1 || diff === Math.round(diff);
  const txt = isInt && diff === Math.round(diff)
    ? `${diff > 0 ? "+" : ""}${Math.round(diff)}`
    : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}`;
  return { up: diff > 0, val: txt };
}

Object.assign(window, {
  Icon, Avatar, MoodDot, StatusPill, Sparkline, MiniBars, Donut, LineChart, LikertBar, Logo,
  fmtTenure, deltaArrow
});
