// Data layer for the US-stock quant dashboard.
// Primary source: Twelve Data (free key, CORS-enabled, returns JSON OHLCV).
// Falls back to a built-in demo series so the page works with no key.

const BASE = "https://api.twelvedata.com/time_series";

export const PERIODS = {
  "6M": 130,
  "1Y": 252,
  "2Y": 504,
  "5Y": 1260,
};

// outputsize -> Twelve Data caps at 5000 on free tier
function outputForPeriod(period) {
  // pull a little extra so indicators that warm up (ADX/MACD) have history
  return Math.min((PERIODS[period] || 252) + 80, 5000);
}

// Parse Twelve Data response into OLD->NEW ordered rows.
function parseTwelveData(json) {
  if (!json || json.status === "error") {
    throw new Error(json?.message || "API error");
  }
  if (!Array.isArray(json.values)) throw new Error("No data returned");
  return json.values
    .map((v) => ({
      date: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume || 0),
    }))
    .reverse(); // Twelve Data returns NEW->OLD
}

// ---- Flow data (FMP, current "/stable" API) -----------------------------
// Only a subset of "flow" metrics has a free, browser-reachable source.
// Insider net is the reliable one; institutional (13F holder count) is
// best-effort and needs a recent filed quarter. Returns a partial object of
// { insider, instOwn } — missing keys stay manual.
const FMP = "https://financialmodelingprep.com/stable";

// 13F for a quarter is filed ~45 days after it ends, so the current quarter
// isn't available yet — step back from the previous quarter and try a few.
function recentQuarters(n = 3) {
  const d = new Date();
  let y = d.getUTCFullYear();
  let q = Math.floor(d.getUTCMonth() / 3) + 1;
  const out = [];
  for (let i = 0; i < n; i++) {
    q--;
    if (q < 1) {
      q = 4;
      y--;
    }
    out.push({ year: y, quarter: q });
  }
  return out;
}

export async function fetchFlow(symbol, fmpKey) {
  const out = {};
  const key = fmpKey?.trim();
  if (!key) return out;
  const sym = symbol.toUpperCase();

  // Insider net: sum acquired (A) − disposed (D) securities over recent Form 4s.
  try {
    const res = await fetch(
      `${FMP}/insider-trading/search?symbol=${sym}&page=0&limit=100&apikey=${key}`
    );
    const json = await res.json();
    if (Array.isArray(json) && json.length) {
      let net = 0;
      for (const t of json) {
        const qty = Number(t.securitiesTransacted) || 0;
        const ad = (t.acquisitionOrDisposition || "").toUpperCase();
        const type = (t.transactionType || "").toUpperCase();
        const isBuy = ad === "A" || type.startsWith("P"); // P-Purchase / A=acquired
        net += isBuy ? qty : -qty;
      }
      out.insider = Math.round(net);
    }
  } catch {
    /* leave insider manual */
  }

  // Institutional (13F): number of institutions holding, from the most recent
  // available quarter (investorsHolding).
  for (const { year, quarter } of recentQuarters()) {
    try {
      const res = await fetch(
        `${FMP}/institutional-ownership/symbol-positions-summary?symbol=${sym}&year=${year}&quarter=${quarter}&apikey=${key}`
      );
      const json = await res.json();
      const row = Array.isArray(json) ? json[0] : json;
      const holders = row && (row.investorsHolding ?? row.investorsHoldingChange);
      if (holders != null && !Number.isNaN(Number(holders))) {
        out.instOwn = Number(row.investorsHolding);
        break;
      }
    } catch {
      /* try the next quarter */
    }
  }

  return out;
}

// ---- Universe scoring data ----------------------------------------------
// Curated AI / 半導體 / 成長 default universe (kept small for free-tier rate
// limits: Twelve Data free = 8 req/min).
export const DEFAULT_UNIVERSE = [
  "NVDA", "AMD", "AVGO", "TSM", "MU", "ASML",
  "MSFT", "GOOGL", "META", "AMZN", "TSLA", "PLTR",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Live fetch of a whole universe, throttled to stay under the free rate limit.
// onProgress(done, total) drives a progress bar. Returns { rows, errors }.
export async function fetchUniverse(symbols, apiKey, onProgress, period = "1Y", fmpKey = "") {
  const key = apiKey?.trim();
  const rows = [];
  const errors = [];
  const BATCH = 7;
  const GAP = 61000; // free tier resets per minute
  let done = 0;
  for (let i = 0; i < symbols.length; i += BATCH) {
    const batch = symbols.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (sym) => {
        try {
          const s = await fetchSeries(sym, period, key);
          return { symbol: sym, series: s };
        } catch (e) {
          errors.push({ symbol: sym, msg: e.message });
          return null;
        }
      })
    );
    results.forEach((r) => r && rows.push(r));
    done += batch.length;
    onProgress?.(Math.min(done, symbols.length), symbols.length);
    if (i + BATCH < symbols.length) await sleep(GAP);
  }
  // optional fundamentals (separate FMP free key) — attach to price rows
  if (fmpKey?.trim()) {
    await Promise.all(
      rows.map(async (r) => {
        if (r.symbol !== "QQQ") r.fund = await fetchFundamentals(r.symbol, fmpKey);
      })
    );
  }
  return { rows, errors };
}

// Fundamentals (ROE / PE / gross margin) from FMP /stable/ratios-ttm.
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export async function fetchFundamentals(symbol, fmpKey) {
  const key = fmpKey?.trim();
  if (!key) return null;
  try {
    const res = await fetch(
      `${FMP}/ratios-ttm?symbol=${symbol.toUpperCase()}&apikey=${key}`
    );
    const json = await res.json();
    const r = Array.isArray(json) ? json[0] : json;
    if (!r || r["Error Message"]) return null;
    return {
      roe: toNum(r.returnOnEquityTTM ?? r.returnOnEquity),
      pe: toNum(r.priceToEarningsRatioTTM ?? r.priceEarningsRatioTTM ?? r.peRatioTTM),
      gm: toNum(r.grossProfitMarginTTM ?? r.grossProfitMargin),
    };
  } catch {
    return null;
  }
}

export function demoFundamentals(symbol) {
  let h = 11;
  for (const ch of symbol.toUpperCase()) h = (h * 31 + ch.charCodeAt(0)) | 0;
  h = Math.abs(h);
  return {
    roe: 0.08 + (h % 45) / 100, // 0.08 .. 0.53
    pe: 12 + ((h >> 4) % 60), // 12 .. 72
    gm: 0.3 + ((h >> 8) % 55) / 100, // 0.30 .. 0.85
  };
}

export function demoUniverse(symbols) {
  return symbols.map((sym) => ({
    symbol: sym,
    series: demoSeries(sym),
    fund: demoFundamentals(sym),
  }));
}

// Rough VIX proxy from a benchmark series (annualised 20-day vol, ×100),
// used when a real VIX quote isn't available (demo, or free tier without it).
export function vixProxy(series) {
  if (!series || series.length < 21) return null;
  const c = series.map((d) => d.close);
  const r = [];
  for (let i = c.length - 20; i < c.length; i++) r.push(c[i] / c[i - 1] - 1);
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  const sd = Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1));
  return Math.round(sd * Math.sqrt(252) * 100 * 10) / 10;
}

export async function fetchSeries(symbol, period, apiKey) {
  const key = apiKey?.trim() || "demo";
  const url = `${BASE}?symbol=${encodeURIComponent(
    symbol
  )}&interval=1day&outputsize=${outputForPeriod(period)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const rows = parseTwelveData(json);
  // trim to requested window
  const n = PERIODS[period] || 252;
  return rows.slice(-n - 1);
}

// ---- Demo data ----------------------------------------------------------
// Deterministic synthetic series (geometric random-ish walk via a seeded PRNG)
// so the dashboard renders instantly without a key or network.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N_DEMO = 340;

// One shared market (SPY) daily-return path — the common factor that ties every
// demo ticker to the benchmark, so Beta / Alpha vs SPY are meaningful in demo mode.
const MKT = (() => {
  const rand = mulberry32(404);
  const r = [];
  for (let i = 0; i < N_DEMO; i++) r.push(0.0004 + 0.009 * (rand() - 0.5) * 2);
  return r;
})();

// Build a price series as: dailyReturn = beta * marketReturn + alpha + idio noise.
// SPY itself is { beta: 1, alpha: 0, idioVol: 0 } -> exactly the market path.
function makeFactorSeries({ start, beta, alpha = 0, idioVol, seed }) {
  const rand = mulberry32(seed);
  const rows = [];
  let price = start;
  for (let i = 0; i < N_DEMO; i++) {
    const shock = (rand() - 0.5) * 2; // -1..1
    const ret = beta * MKT[i] + alpha + idioVol * shock;
    price = Math.max(1, price * (1 + ret));
    const intraday = (Math.abs(ret) + idioVol) * (0.4 + rand() * 0.6);
    const high = price * (1 + intraday * rand());
    const low = price * (1 - intraday * rand());
    const open = low + (high - low) * rand();
    rows.push({
      date: dayLabel(N_DEMO - i),
      open: round(open),
      high: round(Math.max(high, price, open)),
      low: round(Math.min(low, price, open)),
      close: round(price),
      volume: Math.round(30_000_000 + rand() * 40_000_000),
    });
  }
  return rows;
}

function round(x) {
  return Math.round(x * 100) / 100;
}

// fabricate a plausible YYYY-MM-DD label going back `back` trading days
function dayLabel(back) {
  // anchor: 2026-06-18, ~ skip weekends roughly by *1.4 calendar days
  const anchor = Date.UTC(2026, 5, 18);
  const ms = anchor - Math.round(back * 1.4) * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export const DEMO = {
  // high-beta growth names carry positive alpha so they visibly outperform SPY
  NVDA: makeFactorSeries({ start: 95, beta: 1.6, alpha: 0.0009, idioVol: 0.014, seed: 101 }),
  AAPL: makeFactorSeries({ start: 210, beta: 1.05, alpha: 0.0002, idioVol: 0.008, seed: 202 }),
  TSLA: makeFactorSeries({ start: 240, beta: 1.8, alpha: 0.0004, idioVol: 0.02, seed: 303 }),
  SPY: makeFactorSeries({ start: 520, beta: 1, alpha: 0, idioVol: 0, seed: 404 }),
};

export function demoSeries(symbol) {
  const up = symbol.toUpperCase();
  if (DEMO[up]) return DEMO[up];
  // derive stable, plausible factor loadings from the symbol so any ticker
  // yields a deterministic demo that is still correlated with the market.
  let seed = 7;
  for (const ch of up) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const h = Math.abs(seed) || 7;
  const beta = 0.8 + ((h % 120) / 100); // 0.8 .. 2.0
  const alpha = (((h >> 7) % 11) - 4) * 0.0001; // -0.0004 .. +0.0006
  const idioVol = 0.008 + ((h >> 3) % 16) * 0.001; // 0.008 .. 0.023
  return makeFactorSeries({ start: 100, beta, alpha, idioVol, seed: h });
}

// ---- CSV parsing (manual fallback) --------------------------------------
// Accepts headered CSV with date,open,high,low,close[,volume] in any order,
// or a single column / comma list of close prices.
export function parseCSV(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) throw new Error("Empty input");

  // single comma-separated list of numbers on one line -> closes
  if (lines.length === 1 && lines[0].includes(",")) {
    const nums = lines[0].split(",").map((x) => parseFloat(x)).filter((x) => !isNaN(x));
    if (nums.length > 2) return closesToSeries(nums);
  }

  const header = lines[0].toLowerCase();
  const hasHeader = /date|close|open|price/.test(header);
  if (!hasHeader) {
    // assume one close price per line
    const nums = lines.map((l) => parseFloat(l)).filter((x) => !isNaN(x));
    if (nums.length > 2) return closesToSeries(nums);
    throw new Error("Could not parse numbers");
  }

  const cols = header.split(/[,\t;]/).map((c) => c.trim());
  const idx = (names) => cols.findIndex((c) => names.some((n) => c.includes(n)));
  const di = idx(["date"]);
  const ci = idx(["close", "adj", "price"]);
  const oi = idx(["open"]);
  const hi = idx(["high"]);
  const li = idx(["low"]);
  const vi = idx(["volume", "vol"]);
  if (ci < 0) throw new Error("No close/price column found");

  const rows = lines.slice(1).map((line) => {
    const p = line.split(/[,\t;]/);
    const close = parseFloat(p[ci]);
    return {
      date: di >= 0 ? p[di] : "",
      open: oi >= 0 ? parseFloat(p[oi]) : close,
      high: hi >= 0 ? parseFloat(p[hi]) : close,
      low: li >= 0 ? parseFloat(p[li]) : close,
      close,
      volume: vi >= 0 ? parseFloat(p[vi]) : 0,
    };
  }).filter((r) => !isNaN(r.close));

  if (rows.length < 3) throw new Error("Not enough rows");
  // sort old->new if dates look parseable
  if (di >= 0 && rows[0].date && rows[0].date > rows[rows.length - 1].date) rows.reverse();
  return rows;
}

function closesToSeries(closes) {
  return closes.map((close, i) => ({
    date: dayLabel(closes.length - i),
    open: close,
    high: close,
    low: close,
    close,
    volume: 0,
  }));
}
