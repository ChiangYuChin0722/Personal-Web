import React from "react";

// Build an SVG path "d" from an array of [x,y] points.
function toPath(pts) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
}

// Price line + optional Bollinger band overlay.
export function PriceChart({ series, bollinger, height = 220 }) {
  const W = 720;
  const H = height;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 18;
  const closes = series.map((d) => d.close);
  const n = closes.length;
  if (n < 2) return null;

  // y-range includes bands if present
  let lo = Math.min(...closes);
  let hi = Math.max(...closes);
  if (bollinger) {
    bollinger.upper.forEach((v) => v != null && (hi = Math.max(hi, v)));
    bollinger.lower.forEach((v) => v != null && (lo = Math.min(lo, v)));
  }
  const pad = (hi - lo) * 0.06 || 1;
  lo -= pad;
  hi += pad;

  const x = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

  const linePts = closes.map((c, i) => [x(i), y(c)]);
  const up = closes[n - 1] >= closes[0];
  const stroke = up ? "#34d399" : "#f87171";

  let bandPath = null;
  if (bollinger) {
    const upPts = [];
    const loPts = [];
    bollinger.upper.forEach((v, i) => {
      if (v != null) upPts.push([x(i), y(v)]);
    });
    for (let i = bollinger.lower.length - 1; i >= 0; i--) {
      const v = bollinger.lower[i];
      if (v != null) loPts.push([x(i), y(v)]);
    }
    if (upPts.length) bandPath = toPath(upPts) + " " + toPath(loPts).replace("M", "L") + " Z";
  }

  // x labels (start / mid / end)
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="pcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {bandPath && <path d={bandPath} fill="#60a5fa" fillOpacity="0.08" stroke="none" />}
      {bollinger && (
        <path
          d={toPath(bollinger.mid.map((v, i) => (v != null ? [x(i), y(v)] : null)).filter(Boolean))}
          fill="none"
          stroke="#60a5fa"
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      {/* area under price */}
      <path
        d={`${toPath(linePts)} L${x(n - 1)} ${H - padB} L${x(0)} ${H - padB} Z`}
        fill="url(#pcFill)"
        stroke="none"
      />
      <path d={toPath(linePts)} fill="none" stroke={stroke} strokeWidth="1.6" />
      {labelIdx.map((i) => (
        <text key={i} x={Math.min(Math.max(x(i), 22), W - 22)} y={H - 5} fontSize="9" fill="#64748b" textAnchor="middle">
          {series[i].date}
        </text>
      ))}
    </svg>
  );
}

// Drawdown area chart (values <= 0).
export function DrawdownChart({ dd, height = 110 }) {
  const W = 720;
  const H = height;
  const padT = 8;
  const padB = 14;
  const n = dd.length;
  if (n < 2) return null;
  const lo = Math.min(...dd, -0.001);
  const x = (i) => (i / (n - 1)) * W;
  const y = (v) => padT + (v / lo) * (H - padT - padB);
  const pts = dd.map((v, i) => [x(i), y(v)]);
  const area = `${toPath(pts)} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={area} fill="#f87171" fillOpacity="0.16" stroke="none" />
      <path d={toPath(pts)} fill="none" stroke="#f87171" strokeWidth="1.3" />
      <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="#334155" strokeWidth="0.5" />
      <text x="4" y={H - 3} fontSize="9" fill="#64748b">
        {(lo * 100).toFixed(1)}%
      </text>
    </svg>
  );
}

// Tiny inline sparkline gauge for RSI (0-100).
export function Gauge({ value, lo = 30, hi = 70, min = 0, max = 100 }) {
  if (value == null) return null;
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--panel2)", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: `${(lo / max) * 100}%`,
          width: `${((hi - lo) / max) * 100}%`,
          top: 0,
          bottom: 0,
          background: "var(--border)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `calc(${pct * 100}% - 2px)`,
          top: -2,
          width: 3,
          height: 10,
          borderRadius: 2,
          background: value > hi ? "#f87171" : value < lo ? "#34d399" : "#93c5fd",
        }}
      />
    </div>
  );
}
