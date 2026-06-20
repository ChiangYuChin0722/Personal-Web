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

// Returns { values: {insider?, instOwn?}, notes: [string] }. notes surfaces the
// real FMP message (e.g. "Exclusive Endpoint" on free plan) so failures explain
// themselves instead of a generic "沒抓到".
export async function fetchFlow(symbol, fmpKey) {
  const out = { values: {}, notes: [] };
  const key = fmpKey?.trim();
  if (!key) return out;
  const sym = symbol.toUpperCase();

  // Insider net: sum acquired (A) − disposed (D) securities over recent Form 4s.
  try {
    const res = await fetch(
      `${FMP}/insider-trading/search?symbol=${sym}&page=0&limit=100&apikey=${key}`
    );
    const json = await res.json();
    const errMsg = json && !Array.isArray(json) && (json["Error Message"] || json.message);
    if (errMsg) {
      out.notes.push(`Insider：${String(errMsg).slice(0, 90)}`);
    } else if (Array.isArray(json) && json.length) {
      let net = 0;
      for (const t of json) {
        const qty = Number(t.securitiesTransacted) || 0;
        const ad = (t.acquisitionOrDisposition || "").toUpperCase();
        const type = (t.transactionType || "").toUpperCase();
        const isBuy = ad === "A" || type.startsWith("P"); // P-Purchase / A=acquired
        net += isBuy ? qty : -qty;
      }
      out.values.insider = Math.round(net);
    } else {
      out.notes.push("Insider：無近期內部人交易資料");
    }
  } catch (e) {
    out.notes.push(`Insider：${e.message}`);
  }

  // Institutional (13F): number of institutions holding, most recent quarter.
  let instErr = null;
  for (const { year, quarter } of recentQuarters()) {
    try {
      const res = await fetch(
        `${FMP}/institutional-ownership/symbol-positions-summary?symbol=${sym}&year=${year}&quarter=${quarter}&apikey=${key}`
      );
      const json = await res.json();
      const errMsg = json && !Array.isArray(json) && (json["Error Message"] || json.message);
      if (errMsg) {
        instErr = String(errMsg).slice(0, 90);
        continue;
      }
      const row = Array.isArray(json) ? json[0] : json;
      const holders = row && (row.investorsHolding ?? row.investorsHoldingChange);
      if (holders != null && !Number.isNaN(Number(holders))) {
        out.values.instOwn = Number(row.investorsHolding);
        instErr = null;
        break;
      }
    } catch (e) {
      instErr = e.message;
    }
  }
  if (out.values.instOwn == null) out.notes.push(`機構：${instErr || "無可用季度資料"}`);

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
// onProgress(done, total, waitSec) drives a progress bar; waitSec>0 means it's
// counting down the per-minute rate-limit reset (so it doesn't look frozen).
// Returns { rows, errors }.
export async function fetchUniverse(symbols, apiKey, onProgress, period = "1Y", fmpKey = "") {
  const key = apiKey?.trim();
  const rows = [];
  const errors = [];
  const BATCH = 8; // Twelve Data free = 8 credits/min → ≤8 symbols run in one go
  const GAP = 62; // seconds to wait for the free-tier minute to reset
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
    onProgress?.(Math.min(done, symbols.length), symbols.length, 0);
    // visible countdown while waiting for the rate-limit minute to reset
    if (i + BATCH < symbols.length) {
      for (let s = GAP; s > 0; s--) {
        onProgress?.(Math.min(done, symbols.length), symbols.length, s);
        await sleep(1000);
      }
    }
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
    // ratios-ttm has no returnOnEquityTTM field — derive it from per-share data
    // (ROE = net income per share / book value per share).
    let roe = toNum(r.returnOnEquityTTM ?? r.returnOnEquity);
    if (roe == null) {
      const nips = toNum(r.netIncomePerShareTTM);
      const bvps = toNum(r.bookValuePerShareTTM);
      if (nips != null && bvps) roe = nips / bvps;
    }
    return {
      roe,
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

// ---- Watchlist quotes ---------------------------------------------------
// Demo quotes (instant) from the synthetic series.
export function demoQuotes(symbols) {
  return symbols.map((sym) => {
    const s = demoSeries(sym); // default length — same series the single-stock view uses
    const last = s[s.length - 1].close;
    const prev = s[s.length - 2].close;
    return { symbol: sym, price: last, changePct: last / prev - 1 };
  });
}

// Live quotes via Twelve Data /quote (one request, comma-separated symbols).
// Keep the list ≤8 to stay within the free 8-credits/min limit.
export async function fetchQuotes(symbols, apiKey) {
  const key = apiKey?.trim();
  if (!key) throw new Error("需要 Twelve Data key");
  const url = `https://api.twelvedata.com/quote?symbol=${symbols
    .map((s) => encodeURIComponent(s))
    .join(",")}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return symbols.map((sym) => {
    const q = json[sym] || (symbols.length === 1 ? json : null);
    if (q && !q.code && q.close) {
      const price = parseFloat(q.close);
      const chg =
        q.percent_change != null
          ? parseFloat(q.percent_change) / 100
          : q.previous_close
          ? price / parseFloat(q.previous_close) - 1
          : 0;
      return { symbol: sym, price, changePct: chg };
    }
    return { symbol: sym, price: null, changePct: null };
  });
}

export function demoUniverse(symbols, bars = 340) {
  return symbols.map((sym) => ({
    symbol: sym,
    series: demoSeries(sym, bars),
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

// A shared market (SPY) daily-return path of length n — the common factor that
// ties every demo ticker to the benchmark (Beta / Alpha stay meaningful).
function marketReturns(n) {
  const rand = mulberry32(404);
  const r = [];
  for (let i = 0; i < n; i++) r.push(0.0004 + 0.009 * (rand() - 0.5) * 2);
  return r;
}

// Build an n-day price series: dailyReturn = beta*marketReturn + alpha + noise.
// SPY itself is { beta: 1, alpha: 0, idioVol: 0 } -> exactly the market path.
function makeFactorSeries({ start, beta, alpha = 0, idioVol, seed }, n = N_DEMO) {
  const rand = mulberry32(seed);
  const mkt = marketReturns(n);
  const rows = [];
  let price = start;
  for (let i = 0; i < n; i++) {
    const shock = (rand() - 0.5) * 2; // -1..1
    const ret = beta * mkt[i] + alpha + idioVol * shock;
    price = Math.max(1, price * (1 + ret));
    const intraday = (Math.abs(ret) + idioVol) * (0.4 + rand() * 0.6);
    const high = price * (1 + intraday * rand());
    const low = price * (1 - intraday * rand());
    const open = low + (high - low) * rand();
    rows.push({
      date: dayLabel(n - i),
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

// tuned factor loadings for well-known names; others derived from the symbol.
const DEMO_PARAMS = {
  NVDA: { start: 95, beta: 1.6, alpha: 0.0009, idioVol: 0.014, seed: 101 },
  AAPL: { start: 210, beta: 1.05, alpha: 0.0002, idioVol: 0.008, seed: 202 },
  TSLA: { start: 240, beta: 1.8, alpha: 0.0004, idioVol: 0.02, seed: 303 },
  SPY: { start: 520, beta: 1, alpha: 0, idioVol: 0, seed: 404 },
  QQQ: { start: 480, beta: 1.05, alpha: 0.0003, idioVol: 0.004, seed: 505 },
};
function demoParams(symbol) {
  const up = symbol.toUpperCase();
  if (DEMO_PARAMS[up]) return DEMO_PARAMS[up];
  let seed = 7;
  for (const ch of up) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  const h = Math.abs(seed) || 7;
  return {
    start: 100,
    beta: 0.8 + (h % 120) / 100, // 0.8 .. 2.0
    alpha: (((h >> 7) % 11) - 4) * 0.0001, // -0.0004 .. +0.0006
    idioVol: 0.008 + ((h >> 3) % 16) * 0.001, // 0.008 .. 0.023
    seed: h,
  };
}

export const DEMO = {
  NVDA: makeFactorSeries(DEMO_PARAMS.NVDA),
  AAPL: makeFactorSeries(DEMO_PARAMS.AAPL),
  TSLA: makeFactorSeries(DEMO_PARAMS.TSLA),
  SPY: makeFactorSeries(DEMO_PARAMS.SPY),
};

// n controls history length (default ~1.3y for single-stock; universe passes
// PERIODS[period] so the backtest length follows the user's choice).
export function demoSeries(symbol, n = N_DEMO) {
  return makeFactorSeries(demoParams(symbol), n);
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
