// Factor-scoring engine: turn a universe of stocks into a ranked leaderboard.
// Flow: raw factors per stock -> cross-sectional scores (0-100) -> weighted
// total -> rank -> buy/hold/avoid signal. Plus a market-regime risk overlay.
// Education, NOT investment advice.

import { rsi, sharpe, volatility, priceZScore } from "./quant.js";

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
export function rawFactors(series, fund) {
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
  // quality = ROE blended with gross margin; value = PE (lower is better)
  const roe = fund?.roe ?? null;
  const gm = fund?.gm ?? null;
  const quality = roe == null && gm == null ? null : (roe ?? 0) + (gm ?? 0) * 0.3;
  const value = fund?.pe != null && fund.pe > 0 ? fund.pe : null;
  // extra price-only factors
  const sharpeVal = sharpe(series);
  const annVol = volatility(series);
  const zscore = priceZScore(series, 60);
  return {
    last, mom, trend, vol, rsi: rsiVal, aboveMA50: trend > 0, ma50,
    roe, pe: value, gm, quality,
    sharpe: sharpeVal, annVol, zscore,
  };
}

// metadata for every factor (drives sliders + leaderboard columns)
export const FACTOR_META = {
  mom: { label: "Momentum", zh: "動能", desc: "20/60 日漲幅 — 強者恆強（也就是相對強度）" },
  trend: { label: "Trend", zh: "趨勢", desc: "現價 / MA50 — 是否站上均線" },
  vol: { label: "Volume", zh: "資金", desc: "近期量 / 均量 — 資金流入" },
  rsi: { label: "RSI", zh: "過熱", desc: "健康偏強加分、過熱(>70)扣分" },
  sharpe: { label: "Sharpe", zh: "風險報酬", desc: "每單位風險的報酬，越高越好（效率）" },
  lowvol: { label: "Low Vol", zh: "低波動", desc: "波動越低分越高（防禦因子）" },
  meanrev: { label: "Mean-Rev", zh: "均值回歸", desc: "越超賣(Z-score 越低)分越高 — 撿便宜" },
  quality: { label: "Quality", zh: "品質", desc: "ROE + 毛利 — 賺錢效率（需 FMP）", fund: true },
  value: { label: "Value", zh: "價值", desc: "PE 越低越好（需 FMP）", fund: true },
};
export const FACTOR_ORDER = ["mom", "trend", "vol", "rsi", "sharpe", "lowvol", "meanrev", "quality", "value"];

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

export const DEFAULT_WEIGHTS = {
  mom: 30, trend: 20, vol: 15, rsi: 10,
  sharpe: 0, lowvol: 0, meanrev: 0,
  quality: 15, value: 10,
};

// how each factor maps a raw value to a comparable number (dir<0 = lower better)
const FACTOR_CALC = {
  mom: { get: (f) => f.mom, dir: 1 },
  trend: { get: (f) => f.trend, dir: 1 },
  vol: { get: (f) => f.vol, dir: 1 },
  rsi: { special: (f) => rsiScore(f.rsi) },
  sharpe: { get: (f) => f.sharpe, dir: 1 },
  lowvol: { get: (f) => f.annVol, dir: -1 }, // lower volatility = higher score
  meanrev: { get: (f) => f.zscore, dir: -1 }, // more oversold (low Z) = higher score
  quality: { get: (f) => f.quality, dir: 1 },
  value: { get: (f) => f.pe, dir: -1 },
};

// rows: [{ symbol, series, fund? }]. Returns { scored, active } where active is
// the list of factor keys that actually contributed (had weight + data).
export function scoreUniverse(rows, weights = DEFAULT_WEIGHTS) {
  const raw = rows.map((r) => ({ symbol: r.symbol, f: rawFactors(r.series, r.fund) }));

  // per-factor 0..100 score arrays
  const scores = {};
  for (const key of FACTOR_ORDER) {
    const calc = FACTOR_CALC[key];
    if (calc.special) {
      scores[key] = raw.map((r) => calc.special(r.f));
    } else {
      const vals = raw.map((r) => {
        const v = calc.get(r.f);
        return v == null || Number.isNaN(v) ? null : calc.dir < 0 ? -v : v;
      });
      const present = vals.filter((v) => v != null).length;
      scores[key] = present >= 2 ? pctRankScores(vals) : raw.map(() => null);
    }
  }

  // effective weights: only factors with weight>0 AND data
  const W = {};
  let wsum = 0;
  for (const key of FACTOR_ORDER) {
    const w = weights[key] || 0;
    const hasData = scores[key].some((v) => v != null);
    if (w > 0 && hasData) {
      W[key] = w;
      wsum += w;
    }
  }
  wsum = wsum || 1;
  const active = Object.keys(W);

  const scored = raw.map((r, i) => {
    const breakdown = {};
    let total = 0;
    for (const key of active) {
      const s = scores[key][i] ?? 50;
      breakdown[key] = s;
      total += (W[key] / wsum) * s;
    }
    return { symbol: r.symbol, raw: r.f, breakdown, total };
  });

  scored.sort((a, b) => b.total - a.total);
  scored.forEach((s, i) => (s.rank = i + 1));
  return { scored, active };
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

// ---- backtest -----------------------------------------------------------
// Walk forward: every `rebalDays`, rank the universe using ONLY data up to
// that day (price factors — fundamentals are a point-in-time snapshot and
// can't be replayed on free data), hold equal-weight top-N, chain returns.
// Compares against equal-weight buy & hold of the whole universe.
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a) => {
  if (a.length < 2) return 0;
  const m = avg(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};
function maxDD(equity) {
  let peak = -Infinity;
  let mdd = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    mdd = Math.min(mdd, v / peak - 1);
  }
  return mdd;
}

export function backtest(rows, weights, topN, rebalDays = 5) {
  const universe = rows.filter((r) => r.symbol !== "QQQ");
  if (universe.length < 2) return null;
  const maps = universe.map((r) => ({
    symbol: r.symbol,
    m: new Map(r.series.map((b) => [b.date, b])),
  }));
  // common date axis across all names
  let dates = universe[0].series.map((b) => b.date).filter((d) => maps.every((x) => x.m.has(d)));
  dates.sort();
  const n = dates.length;
  const start = 60; // warm-up for MA50 + momentum
  if (n < start + rebalDays + 1) return null;

  const closeAt = (sym, d) => maps.find((x) => x.symbol === sym).m.get(d)?.close;
  const seriesUpTo = (mp, t) => dates.slice(0, t + 1).map((d) => mp.get(d));

  const rets = [];
  const equity = [1];
  const eqDates = [dates[start]];
  const benchEquity = [1];

  for (let t = start; t + rebalDays < n; t += rebalDays) {
    const snap = maps.map((x) => ({ symbol: x.symbol, series: seriesUpTo(x.m, t) }));
    const { scored } = scoreUniverse(snap, weights);
    const buyable = scored.filter((s) => s.raw.aboveMA50);
    const picks = (buyable.length ? buyable : scored).slice(0, topN);

    let r = 0;
    for (const p of picks) {
      const c0 = closeAt(p.symbol, dates[t]);
      const c1 = closeAt(p.symbol, dates[t + rebalDays]);
      if (c0 && c1) r += (c1 / c0 - 1) / picks.length;
    }
    rets.push(r);
    equity.push(equity[equity.length - 1] * (1 + r));
    eqDates.push(dates[t + rebalDays]);

    // equal-weight buy & hold benchmark
    let br = 0;
    for (const x of maps) {
      const c0 = x.m.get(dates[t])?.close;
      const c1 = x.m.get(dates[t + rebalDays])?.close;
      if (c0 && c1) br += (c1 / c0 - 1) / maps.length;
    }
    benchEquity.push(benchEquity[benchEquity.length - 1] * (1 + br));
  }

  const periodsPerYear = 252 / rebalDays;
  const years = (eqDates.length - 1) / periodsPerYear;
  const finalEq = equity[equity.length - 1];
  const benchFinal = benchEquity[benchEquity.length - 1];
  return {
    equity,
    benchEquity,
    dates: eqDates,
    nRebals: rets.length,
    cagr: years > 0 ? finalEq ** (1 / years) - 1 : 0,
    totalReturn: finalEq - 1,
    sharpe: sd(rets) ? (avg(rets) / sd(rets)) * Math.sqrt(periodsPerYear) : 0,
    mdd: maxDD(equity),
    winRate: rets.length ? rets.filter((x) => x > 0).length / rets.length : 0,
    benchCagr: years > 0 ? benchFinal ** (1 / years) - 1 : 0,
  };
}
