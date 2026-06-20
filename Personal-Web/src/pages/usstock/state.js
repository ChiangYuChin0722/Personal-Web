// Market-state machine: classify a stock into a discrete state (Breakout /
// Uptrend / Pullback / Range / Overheated / Downtrend / Capitulation) with a
// star rating, and evaluate buy/sell under a chosen "school" (流派).
// Education, NOT investment advice.

import { rsi, adx, momentum, bollinger } from "./quant.js";

function ma(series, n) {
  const c = series.map((d) => d.close);
  if (c.length < n) return null;
  let s = 0;
  for (let i = c.length - n; i < c.length; i++) s += c[i];
  return s / n;
}

// Build the indicator context the classifier + schools read from.
export function buildContext(series) {
  const c = series.map((d) => d.close);
  return {
    price: c[c.length - 1],
    ma20: ma(series, 20),
    ma50: ma(series, 50),
    ma200: ma(series, 200),
    mom20: momentum(series, 20),
    mom60: momentum(series, 60),
    adx: adx(series),
    rsi: rsi(series),
    pctB: bollinger(series)?.pctB ?? null,
  };
}

// fit = which schools (流派) naturally suit this state.
export const STATES = {
  breakout: { label: "BREAKOUT", zh: "突破", stars: 4, tone: "good", fit: ["momentum", "trend"], desc: "剛突破前高 / 衝出布林上軌，動能啟動。順勢偏多，但小心假突破。" },
  uptrend: { label: "UPTREND", zh: "上升趨勢", stars: 5, tone: "great", fit: ["momentum", "trend"], desc: "均線多頭排列（MA20>50>200）、趨勢明確。最舒服的續抱狀態。" },
  pullback: { label: "PULLBACK", zh: "回調", stars: 3, tone: "ok", fit: ["trend", "meanrev"], desc: "大趨勢仍偏多但短線拉回。常是順勢加碼的機會，但要等止穩。" },
  range: { label: "RANGE", zh: "盤整", stars: 2, tone: "neutral", fit: ["meanrev"], desc: "沒方向、區間來回（ADX 低）。適合低買高賣，真突破才追。" },
  overheated: { label: "OVERHEATED", zh: "過熱", stars: 1, tone: "warn", fit: [], desc: "RSI 過高、漲過頭。追高容易被回檔修理，等拉回比較安全。" },
  downtrend: { label: "DOWNTREND", zh: "下降趨勢", stars: 1, tone: "bad", fit: [], desc: "均線空頭排列、趨勢往下。新手先避開，別接刀。" },
  capitulation: { label: "CAPITULATION", zh: "恐慌", stars: 2, tone: "bad", fit: ["meanrev"], desc: "急殺、RSI 極低。風險高，但也是長線潛在反彈區，需分批 + 嚴設停損。" },
  neutral: { label: "NEUTRAL", zh: "中性", stars: 2, tone: "neutral", fit: [], desc: "訊號不明確，觀望為宜。" },
};

export function classifyState(c) {
  const { price, ma20, ma50, ma200, mom20, mom60, adx: adxV, rsi: rsiV, pctB } = c;
  const up = ma20 != null && ma50 != null && ma200 != null && ma20 > ma50 && ma50 > ma200;
  const down = ma20 != null && ma50 != null && ma200 != null && ma20 < ma50 && ma50 < ma200;
  const aboveMA200 = ma200 != null && price > ma200;

  // precedence: extremes first, then trend structure, then range
  if (mom20 != null && mom20 < -0.12 && rsiV != null && rsiV < 28) return "capitulation";
  if (rsiV != null && rsiV >= 78) return "overheated";
  if (pctB != null && pctB > 0.98 && mom20 != null && mom20 > 0.04 && (adxV == null || adxV >= 18))
    return "breakout";
  if (up && (adxV == null || adxV >= 22) && (mom60 ?? 0) > 0) {
    if ((mom20 != null && mom20 < 0) || (ma20 != null && price < ma20)) return "pullback";
    return "uptrend";
  }
  if ((ma50 != null && ma200 != null && ma50 > ma200) && aboveMA200 && ((mom20 != null && mom20 < 0) || (rsiV != null && rsiV < 45)))
    return "pullback";
  if (down || (!aboveMA200 && (mom60 ?? 0) < -0.02)) return "downtrend";
  if (adxV != null && adxV < 20) return "range";
  return "neutral";
}

export function stars(n) {
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}

// ---- schools (流派) ----
export const SCHOOLS = {
  momentum: {
    key: "momentum",
    label: "動能派",
    desc: "強者恆強——追上漲、有量、有趨勢的股票。",
    rules: (c) => [
      { label: "Momentum60 > 15%", ok: (c.mom60 ?? -1) > 0.15, pts: 25 },
      { label: "Momentum20 > 0", ok: (c.mom20 ?? -1) > 0, pts: 25 },
      { label: "ADX > 25", ok: (c.adx ?? 0) > 25, pts: 20 },
      { label: "RSI 40~70", ok: c.rsi != null && c.rsi >= 40 && c.rsi <= 70, pts: 15 },
      { label: "價格 > MA50", ok: c.ma50 != null && c.price > c.ma50, pts: 15 },
    ],
    buy: (c) => (c.mom60 ?? -1) > 0.15 && (c.mom20 ?? -1) > 0 && (c.adx ?? 0) > 25,
    sell: (c) => (c.mom20 ?? 0) < 0,
    buyText: "Momentum60>15% 且 Momentum20>0 且 ADX>25",
    sellText: "Momentum20 翻負",
  },
  meanrev: {
    key: "meanrev",
    label: "均值回歸派",
    desc: "超賣時買、超買時賣——賺區間來回。",
    rules: (c) => [
      { label: "RSI < 30（超賣）", ok: (c.rsi ?? 100) < 30, pts: 35 },
      { label: "貼近布林下緣 %B<0.15", ok: c.pctB != null && c.pctB < 0.15, pts: 30 },
      { label: "RSI < 45", ok: (c.rsi ?? 100) < 45, pts: 20 },
      { label: "未跌破 MA200", ok: c.ma200 != null && c.price > c.ma200, pts: 15 },
    ],
    buy: (c) => (c.rsi ?? 100) < 30 && c.pctB != null && c.pctB < 0.15,
    sell: (c) => (c.rsi ?? 0) > 60,
    buyText: "RSI<30 且 貼近布林下緣",
    sellText: "RSI>60",
  },
  trend: {
    key: "trend",
    label: "趨勢派",
    desc: "順著均線多頭排列做多，跌破均線就走。",
    rules: (c) => [
      { label: "MA20 > MA50", ok: c.ma20 != null && c.ma50 != null && c.ma20 > c.ma50, pts: 30 },
      { label: "MA50 > MA200", ok: c.ma50 != null && c.ma200 != null && c.ma50 > c.ma200, pts: 30 },
      { label: "價格 > MA50", ok: c.ma50 != null && c.price > c.ma50, pts: 25 },
      { label: "ADX > 20", ok: (c.adx ?? 0) > 20, pts: 15 },
    ],
    buy: (c) => c.ma20 != null && c.ma50 != null && c.ma200 != null && c.ma20 > c.ma50 && c.ma50 > c.ma200,
    sell: (c) => c.ma50 != null && c.price < c.ma50,
    buyText: "MA20 > MA50 > MA200（多頭排列）",
    sellText: "跌破 MA50",
  },
};

// 0-100 scorecard + tier + buy/sell triggers for a school.
export function evaluateSchool(c, schoolKey) {
  const school = SCHOOLS[schoolKey] || SCHOOLS.momentum;
  const rules = school.rules(c);
  const score = rules.reduce((s, r) => s + (r.ok ? r.pts : 0), 0);
  const tier =
    score >= 80 ? { txt: "強買", tone: "great" } :
    score >= 60 ? { txt: "觀察", tone: "good" } :
    score >= 40 ? { txt: "等待", tone: "ok" } :
    { txt: "不碰", tone: "bad" };
  const buy = school.buy(c);
  const sell = school.sell(c);
  let action;
  if (sell) action = { txt: "賣出 / 避開", tone: "bad" };
  else if (buy) action = { txt: "符合買進條件", tone: "great" };
  else action = { txt: tier.txt, tone: tier.tone };
  return { school, rules, score, tier, buy, sell, action };
}

// TradingView-style technical rating: aggregate several indicators into a
// -1..+1 score and a 強力賣出/賣出/中立/買入/強力買入 verdict.
export function techRating(m, ctx) {
  let s = 0;
  let n = 0;
  const add = (v) => {
    s += v;
    n++;
  };
  if (ctx.ma20 != null) add(ctx.price > ctx.ma20 ? 1 : -1);
  if (ctx.ma50 != null) add(ctx.price > ctx.ma50 ? 1 : -1);
  if (ctx.ma200 != null) add(ctx.price > ctx.ma200 ? 1 : -1);
  if (ctx.ma20 != null && ctx.ma50 != null) add(ctx.ma20 > ctx.ma50 ? 1 : -1);
  if (m.rsi != null) add(m.rsi < 30 ? 1 : m.rsi > 70 ? -1 : 0);
  if (m.macd) add(m.macd.histogram > 0 ? 1 : -1);
  if (m.mom20 != null) add(m.mom20 > 0 ? 1 : -1);
  if (m.adx != null && m.adx > 25 && m.mom60 != null) add(m.mom60 > 0 ? 1 : -1);
  const score = n ? s / n : 0;
  const label =
    score > 0.5 ? "強力買入" : score > 0.15 ? "買入" : score < -0.5 ? "強力賣出" : score < -0.15 ? "賣出" : "中立";
  const tone = score > 0.15 ? "good" : score < -0.15 ? "bad" : "neutral";
  return { score, label, tone };
}

// Convenience: state + default-school signal from a series.
export function classify(series, schoolKey = "momentum") {
  const c = buildContext(series);
  const stateKey = classifyState(c);
  return { ctx: c, stateKey, state: STATES[stateKey], eval: evaluateSchool(c, schoolKey) };
}
