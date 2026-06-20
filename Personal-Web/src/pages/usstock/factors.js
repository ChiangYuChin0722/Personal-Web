// Factor-scoring engine: turn a universe of stocks into a ranked leaderboard.
// Flow: raw factors per stock -> cross-sectional scores (0-100) -> weighted
// total -> rank -> buy/hold/avoid signal. Plus a market-regime risk overlay.
// Education, NOT investment advice.

import { rsi } from "./quant.js";

const closes = (s) => s.map((d) => d.close);

function ma(series, n) {
  const c = closes(series);
  if (c.length < n) return null;
  let sum = 0;
  for (let i = c.length - n; i < c.length; i++) sum += c[i];
  return sum / n;
}

function ret(series, n) {
  const c = closes(series);
  if (c.length <= n) return null;
  return c[c.length - 1] / c[c.length - 1 - n] - 1;
}

function avgVol(series, n, skip = 0) {
  const v = series.map((d) => d.volume || 0);
  const end = v.length - skip;
  if (end < n) return null;
  let sum = 0;
  for (let i = end - n; i < end; i++) sum += v[i];
  return sum / n;
}

// ---- raw factor values for one stock ----
export function rawFactors(series) {
  const c = closes(series);
  const last = c[c.length - 1];
  const r20 = ret(series, 20);
  const r60 = ret(series, 60);
  const mom =
    r20 != null && r60 != null ? 0.5 * r20 + 0.5 * r60 : r20 ?? r60 ?? 0;
  const ma50 = ma(series, 50);
  const trend = ma50 ? last / ma50 - 1 : 0;
  const recentV = avgVol(series, 5);
  const baseV = avgVol(series, 60, 5);
  const vol = baseV ? recentV / baseV : 1;
  const rsiVal = rsi(series);
  return { last, mom, trend, vol, rsi: rsiVal, aboveMA50: trend > 0, ma50 };
}

// ---- cross-sectional percentile scoring (0..100) ----
function pctRankScores(values) {
  const present = values.map((v, i) => [v, i]).filter((x) => x[0] != null && !Number.isNaN(x[0]));
  const sorted = [...present].sort((a, b) => a[0] - b[0]);
  const out = values.map(() => 50);
  sorted.forEach(([, i], rank) => {
    out[i] = present.length > 1 ? (rank / (present.length - 1)) * 100 : 50;
  });
  return out;
}

// RSI is judged on an absolute "sweet spot" (健康偏強但不過熱), not by rank.
function rsiScore(v) {
  if (v == null) return 50;
  if (v >= 45 && v <= 65) return 100;
  if (v < 45) return Math.max(25, 100 - (45 - v) * 1.8); // 偏冷：動能不足
  return Math.max(0, 100 - (v - 65) * 3.2); // 過熱：扣分
}

export const DEFAULT_WEIGHTS = { mom: 40, trend: 30, vol: 20, rsi: 10 };

function normWeights(w) {
  const sum = (w.mom + w.trend + w.vol + w.rsi) || 1;
  return { mom: w.mom / sum, trend: w.trend / sum, vol: w.vol / sum, rsi: w.rsi / sum };
}

// rows: [{ symbol, series }]
export function scoreUniverse(rows, weights = DEFAULT_WEIGHTS) {
  const raw = rows.map((r) => ({ ...r, f: rawFactors(r.series) }));
  const momS = pctRankScores(raw.map((r) => r.f.mom));
  const trendS = pctRankScores(raw.map((r) => r.f.trend));
  const volS = pctRankScores(raw.map((r) => r.f.vol));
  const rsiS = raw.map((r) => rsiScore(r.f.rsi));
  const W = normWeights(weights);

  const scored = raw.map((r, i) => {
    const breakdown = { mom: momS[i], trend: trendS[i], vol: volS[i], rsi: rsiS[i] };
    const total =
      W.mom * momS[i] + W.trend * trendS[i] + W.vol * volS[i] + W.rsi * rsiS[i];
    return { symbol: r.symbol, raw: r.f, breakdown, total };
  });

  scored.sort((a, b) => b.total - a.total);
  scored.forEach((s, i) => (s.rank = i + 1));
  return scored;
}

// Buy/hold/avoid per the user's rules: top-N buy (only if above MA50),
// fall out of top-2N or below MA50 -> drop.
export function applySignals(scored, topN) {
  const hold = topN * 2;
  return scored.map((s) => {
    let signal;
    if (!s.raw.aboveMA50) signal = "avoid"; // 跌破 MA50 直接不做
    else if (s.rank <= topN) signal = "buy";
    else if (s.rank <= hold) signal = "watch";
    else signal = "avoid";
    return { ...s, signal };
  });
}

// ---- market regime (risk overlay) ----
// qqqSeries: QQQ daily series; vix: latest VIX value (or null).
export function marketRegime(qqqSeries, vix) {
  const c = qqqSeries ? closes(qqqSeries) : [];
  const ma200 = qqqSeries ? ma(qqqSeries, 200) : null;
  const last = c[c.length - 1] ?? null;
  const aboveMA200 = ma200 != null && last != null ? last > ma200 : null;

  let level, guidance, tone, posCap;
  if (aboveMA200 === false || (vix != null && vix > 30)) {
    level = "Risk-Off · 防禦";
    guidance = "QQQ 跌破 MA200 或 VIX>30 → 減倉、暫停新的做多，只留最強的部位。";
    tone = "bad";
    posCap = "建議總部位 ≤ 40%";
  } else if (vix != null && vix >= 20) {
    level = "Caution · 謹慎";
    guidance = "VIX 20–30 → 波動升高，部位略縮、嚴設停損，別追高。";
    tone = "ok";
    posCap = "建議總部位 ≤ 70%";
  } else {
    level = "Risk-On · 偏多";
    guidance = "QQQ 在 MA200 之上、VIX<20 → 環境偏多，可正常布局前段排名。";
    tone = "good";
    posCap = "總部位可達 100%";
  }
  return { aboveMA200, vix, ma200, last, level, guidance, tone, posCap };
}
