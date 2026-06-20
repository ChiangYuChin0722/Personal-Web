// Quant engine — pure functions over a price series.
// Input series are ordered OLD -> NEW. Each row: { date, open, high, low, close, volume }.
// Annualization assumes ~252 trading days.

const TRADING_DAYS = 252;

const closes = (s) => s.map((d) => d.close);

export function dailyReturns(series) {
  const c = closes(series);
  const r = [];
  for (let i = 1; i < c.length; i++) r.push(c[i] / c[i - 1] - 1);
  return r;
}

export function mean(a) {
  if (!a.length) return 0;
  return a.reduce((x, y) => x + y, 0) / a.length;
}

export function stddev(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  const v = a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
  return Math.sqrt(v);
}

export function covariance(a, b) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a.slice(-n));
  const mb = mean(b.slice(-n));
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[a.length - n + i] - ma) * (b[b.length - n + i] - mb);
  return s / (n - 1);
}

export function correlation(a, b) {
  const sa = stddev(a);
  const sb = stddev(b);
  if (!sa || !sb) return 0;
  return covariance(a, b) / (sa * sb);
}

// ---- Return ----
export function totalReturn(series) {
  const c = closes(series);
  if (c.length < 2) return 0;
  return c[c.length - 1] / c[0] - 1;
}

export function cagr(series) {
  const c = closes(series);
  if (c.length < 2) return 0;
  const years = (c.length - 1) / TRADING_DAYS;
  if (years <= 0) return 0;
  return (c[c.length - 1] / c[0]) ** (1 / years) - 1;
}

// Annualized return of the asset vs annualized return of benchmark.
export function alpha(series, benchSeries) {
  return cagr(series) - cagr(benchSeries);
}

// ---- Risk ----
export function volatility(series) {
  return stddev(dailyReturns(series)) * Math.sqrt(TRADING_DAYS);
}

export function maxDrawdown(series) {
  const c = closes(series);
  let peak = -Infinity;
  let mdd = 0;
  let peakIdx = 0;
  let troughIdx = 0;
  let curPeakIdx = 0;
  for (let i = 0; i < c.length; i++) {
    if (c[i] > peak) {
      peak = c[i];
      curPeakIdx = i;
    }
    const dd = c[i] / peak - 1;
    if (dd < mdd) {
      mdd = dd;
      peakIdx = curPeakIdx;
      troughIdx = i;
    }
  }
  return { mdd, peakIdx, troughIdx };
}

// Series of drawdown values for charting.
export function drawdownSeries(series) {
  const c = closes(series);
  let peak = -Infinity;
  return c.map((p) => {
    if (p > peak) peak = p;
    return p / peak - 1;
  });
}

export function beta(series, benchSeries) {
  const ra = dailyReturns(series);
  const rb = dailyReturns(benchSeries);
  const vb = stddev(rb) ** 2;
  if (!vb) return 0;
  return covariance(ra, rb) / vb;
}

// ---- Risk-adjusted ----
// rf = annual risk-free rate (e.g. 0.04)
export function sharpe(series, rf = 0.04) {
  const r = dailyReturns(series);
  const sd = stddev(r);
  if (!sd) return 0;
  const excessDaily = mean(r) - rf / TRADING_DAYS;
  return (excessDaily / sd) * Math.sqrt(TRADING_DAYS);
}

export function sortino(series, rf = 0.04) {
  const r = dailyReturns(series);
  const target = rf / TRADING_DAYS;
  const downside = r.filter((x) => x < target).map((x) => x - target);
  if (!downside.length) return 0;
  const dd = Math.sqrt(mean(downside.map((x) => x * x)));
  if (!dd) return 0;
  const excessDaily = mean(r) - target;
  return (excessDaily / dd) * Math.sqrt(TRADING_DAYS);
}

export function calmar(series) {
  const { mdd } = maxDrawdown(series);
  if (!mdd) return 0;
  return cagr(series) / Math.abs(mdd);
}

// ---- Momentum ----
export function momentum(series, lookback) {
  const c = closes(series);
  if (c.length <= lookback) return null;
  return c[c.length - 1] / c[c.length - 1 - lookback] - 1;
}

// ---- Trend: RSI ----
export function rsi(series, period = 14) {
  const c = closes(series);
  if (c.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = c[i] - c[i - 1];
    if (ch >= 0) gain += ch;
    else loss -= ch;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < c.length; i++) {
    const ch = c[i] - c[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(ch, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-ch, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// EMA helper -> full series
function emaSeries(values, period) {
  const k = 2 / (period + 1);
  const out = [];
  let prev;
  values.forEach((v, i) => {
    if (i === 0) {
      prev = v;
    } else {
      prev = v * k + prev * (1 - k);
    }
    out.push(prev);
  });
  return out;
}

// ---- Trend: MACD ----
export function macd(series, fast = 12, slow = 26, signal = 9) {
  const c = closes(series);
  if (c.length < slow + signal) return null;
  const emaFast = emaSeries(c, fast);
  const emaSlow = emaSeries(c, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = emaSeries(macdLine, signal);
  const i = c.length - 1;
  return {
    macd: macdLine[i],
    signal: signalLine[i],
    histogram: macdLine[i] - signalLine[i],
  };
}

// ---- Trend: ADX ----
export function adx(series, period = 14) {
  if (series.length < period * 2) return null;
  const tr = [];
  const plusDM = [];
  const minusDM = [];
  for (let i = 1; i < series.length; i++) {
    const cur = series[i];
    const prev = series[i - 1];
    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(
      Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      )
    );
  }
  // Wilder smoothing
  const smooth = (arr) => {
    let sum = arr.slice(0, period).reduce((a, b) => a + b, 0);
    const out = [sum];
    for (let i = period; i < arr.length; i++) {
      sum = sum - sum / period + arr[i];
      out.push(sum);
    }
    return out;
  };
  const trS = smooth(tr);
  const plusS = smooth(plusDM);
  const minusS = smooth(minusDM);
  const dx = [];
  for (let i = 0; i < trS.length; i++) {
    if (!trS[i]) {
      dx.push(0);
      continue;
    }
    const plusDI = (100 * plusS[i]) / trS[i];
    const minusDI = (100 * minusS[i]) / trS[i];
    const sum = plusDI + minusDI;
    dx.push(sum ? (100 * Math.abs(plusDI - minusDI)) / sum : 0);
  }
  if (dx.length < period) return null;
  // ADX = smoothed DX
  let adxVal = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dx.length; i++) {
    adxVal = (adxVal * (period - 1) + dx[i]) / period;
  }
  return adxVal;
}

// ---- Volatility: ATR ----
export function atr(series, period = 14) {
  if (series.length < period + 1) return null;
  const tr = [];
  for (let i = 1; i < series.length; i++) {
    const cur = series[i];
    const prev = series[i - 1];
    tr.push(
      Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      )
    );
  }
  let a = tr.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < tr.length; i++) {
    a = (a * (period - 1) + tr[i]) / period;
  }
  return a;
}

// ---- Volatility: Bollinger Bands (last value + full mid series) ----
export function bollinger(series, period = 20, mult = 2) {
  const c = closes(series);
  if (c.length < period) return null;
  const mid = [];
  const upper = [];
  const lower = [];
  for (let i = 0; i < c.length; i++) {
    if (i < period - 1) {
      mid.push(null);
      upper.push(null);
      lower.push(null);
      continue;
    }
    const win = c.slice(i - period + 1, i + 1);
    const m = win.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(win.reduce((a, b) => a + (b - m) ** 2, 0) / period);
    mid.push(m);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  const last = c.length - 1;
  const pctB =
    upper[last] !== lower[last]
      ? (c[last] - lower[last]) / (upper[last] - lower[last])
      : 0.5;
  return { mid, upper, lower, pctB, last: { mid: mid[last], upper: upper[last], lower: lower[last] } };
}

// Compute the full metric pack for a series (+ optional benchmark).
export function computeMetrics(series, bench, rf = 0.04) {
  const c = closes(series);
  const last = c[c.length - 1];
  const prev = c[c.length - 2] ?? last;
  const hasBench = bench && bench.length > 5;
  const { mdd } = maxDrawdown(series);
  const md = macd(series);
  const bb = bollinger(series);
  return {
    last,
    dayChangePct: last / prev - 1,
    bars: series.length,
    startDate: series[0]?.date,
    endDate: series[series.length - 1]?.date,
    // return
    totalReturn: totalReturn(series),
    cagr: cagr(series),
    alpha: hasBench ? alpha(series, bench) : null,
    // risk
    volatility: volatility(series),
    maxDrawdown: mdd,
    beta: hasBench ? beta(series, bench) : null,
    // risk-adjusted
    sharpe: sharpe(series, rf),
    sortino: sortino(series, rf),
    calmar: calmar(series),
    // momentum / trend
    mom20: momentum(series, 20),
    mom60: momentum(series, 60),
    rsi: rsi(series),
    macd: md,
    adx: adx(series),
    // volatility detail
    atr: atr(series),
    atrPct: (() => {
      const a = atr(series);
      return a != null ? a / last : null;
    })(),
    bollinger: bb,
  };
}
