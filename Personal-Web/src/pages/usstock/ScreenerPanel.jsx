import React, { useState, useCallback } from "react";
import { DEFAULT_UNIVERSE, demoUniverse, fetchUniverse, PERIODS } from "./data.js";
import { computeMetrics } from "./quant.js";
import { buildContext, classifyState, STATES } from "./state.js";
import { basketSeries } from "./factors.js";

const LS_UNI = "usstock_universe";

const pct = (v, d = 1) => (v == null || Number.isNaN(v) ? "—" : `${(v * 100).toFixed(d)}%`);
const num = (v, d = 2) => (v == null || Number.isNaN(v) ? "—" : v.toFixed(d));

// column definitions: key, label, how to render, numeric (for sort + align)
const COLS = [
  { key: "symbol", label: "代號", num: false, fmt: (v) => v },
  { key: "price", label: "價格", fmt: (v) => (v == null ? "—" : `$${num(v)}`) },
  { key: "chg", label: "漲跌%", fmt: (v) => pct(v, 2), tone: (v) => (v >= 0 ? "pos" : "neg") },
  { key: "composite", label: "綜合", fmt: (v) => num(v, 0), tone: (v) => (v >= 75 ? "great" : v >= 55 ? "good" : v >= 40 ? "ok" : "bad") },
  { key: "mom60", label: "動能60", fmt: (v) => pct(v), tone: (v) => (v >= 0 ? "pos" : "neg") },
  { key: "sharpe", label: "Sharpe", fmt: (v) => num(v, 2) },
  { key: "rsi", label: "RSI", fmt: (v) => num(v, 0), tone: (v) => (v > 70 || v < 30 ? "warn" : "") },
  { key: "beta", label: "Beta", fmt: (v) => num(v, 2) },
  { key: "vol", label: "波動", fmt: (v) => pct(v) },
  { key: "pe", label: "P/E", fmt: (v) => num(v, 1) },
  { key: "roe", label: "ROE", fmt: (v) => pct(v, 0) },
  { key: "stateZh", label: "狀態", num: false, fmt: (v) => v, tone: (_, row) => `state-${row.tone}` },
];

export default function ScreenerPanel({ apiKey, fmpKey, onPick }) {
  const [uniText, setUniText] = useState(() => localStorage.getItem(LS_UNI) || DEFAULT_UNIVERSE.join(", "));
  const [years, setYears] = useState("1Y");
  const [rows, setRows] = useState([]);
  const [sort, setSort] = useState({ key: "composite", dir: -1 });
  const [minComp, setMinComp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [src, setSrc] = useState("");
  const [errors, setErrors] = useState([]);

  const symbols = uniText.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);

  function saveUni(v) {
    setUniText(v);
    localStorage.setItem(LS_UNI, v);
  }

  const process = useCallback((fetched) => {
    const qqq = fetched.find((r) => r.symbol === "QQQ");
    const bench = qqq ? qqq.series : basketSeries(fetched);
    const out = fetched
      .filter((r) => r.symbol !== "QQQ")
      .map((r) => {
        const m = computeMetrics(r.series, bench);
        const ctx = buildContext(r.series);
        const stateKey = classifyState(ctx);
        return {
          symbol: r.symbol,
          price: m.last,
          chg: m.dayChangePct,
          composite: m.composite,
          mom60: m.mom60,
          sharpe: m.sharpe,
          rsi: m.rsi,
          beta: m.beta,
          vol: m.volatility,
          pe: r.fund?.pe ?? null,
          roe: r.fund?.roe ?? null,
          stateZh: STATES[stateKey].zh,
          tone: STATES[stateKey].tone,
        };
      });
    setRows(out);
  }, []);

  function runDemo() {
    setErrors([]);
    setLoading(true);
    process(demoUniverse([...symbols, "QQQ"], PERIODS[years]));
    setSrc("demo");
    setLoading(false);
  }

  async function runLive() {
    if (!apiKey.trim()) {
      setErrors([{ symbol: "—", msg: "需要 Twelve Data key" }]);
      return;
    }
    setErrors([]);
    setLoading(true);
    // QQQ omitted: relative metrics use the universe basket; ≤8 → one batch, no wait
    setProgress({ done: 0, total: symbols.length });
    try {
      const { rows: fetched, errors: errs } = await fetchUniverse(
        symbols,
        apiKey,
        (done, total, wait) => setProgress({ done, total, wait }),
        years,
        fmpKey
      );
      setErrors(errs);
      if (fetched.length) process(fetched);
      setSrc("live");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function clickSort(key) {
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === "symbol" ? 1 : -1 }));
  }

  const view = rows
    .filter((r) => (r.composite ?? 0) >= minComp)
    .sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string") return sort.dir * av.localeCompare(bv);
      return sort.dir * (av - bv);
    });

  return (
    <div className="us-screener">
      <div className="strat-card">
        <div className="strat-card-head">
          <span>股票篩選器 Screener</span>
          <span className="strat-hint">{symbols.length} 檔 · 點欄位標題排序 · 點代號載入個股</span>
        </div>
        <textarea className="strat-uni" value={uniText} onChange={(e) => saveUni(e.target.value)} spellCheck={false} />
        <div className="strat-run">
          <div className="strat-years">
            <span>期間</span>
            {["1Y", "2Y", "5Y"].map((y) => (
              <button key={y} className={y === years ? "active" : ""} onClick={() => setYears(y)}>{y}</button>
            ))}
          </div>
          <label className="strat-topn">
            綜合分 ≥
            <input type="number" min="0" max="100" value={minComp} onChange={(e) => setMinComp(Number(e.target.value) || 0)} />
          </label>
          <button className="strat-btn demo" onClick={runDemo} disabled={loading}>用 demo 試跑</button>
          <button className="strat-btn live" onClick={runLive} disabled={loading}>
            {loading && progress ? (progress.wait ? `限速等待 ${progress.wait}s…` : `抓取中 ${progress.done}/${progress.total}…`) : "用我的 key 跑 live"}
          </button>
        </div>
        {progress && <div className="strat-prog"><div className="strat-prog-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>}
        {errors.length > 0 && <div className="strat-errs">{errors.map((e, i) => <span key={i}>{e.symbol}: {e.msg}</span>)}</div>}
      </div>

      {view.length > 0 && (
        <div className="scr-tablewrap">
          <table className="scr-table">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} className={c.num === false ? "" : "n"} onClick={() => clickSort(c.key)}>
                    {c.label}
                    {sort.key === c.key ? (sort.dir < 0 ? " ↓" : " ↑") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r.symbol}>
                  {COLS.map((c) => {
                    const v = r[c.key];
                    const toneCls = c.tone ? (typeof c.tone(v, r) === "string" ? c.tone(v, r) : "") : "";
                    if (c.key === "symbol") {
                      return <td key={c.key} className="scr-sym"><button onClick={() => onPick?.(r.symbol)}>{r.symbol}</button></td>;
                    }
                    return (
                      <td key={c.key} className={`${c.num === false ? "" : "n"} ${toneCls}`}>{c.fmt(v, r)}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="scr-note">
            {src === "demo" ? "DEMO 假資料" : "LIVE 真實資料"} · {view.length} 檔
            {(rows.length && rows.every((r) => r.pe == null)) ? "　·　P/E、ROE 需 FMP key（live 才會帶）" : ""}
          </div>
        </div>
      )}

      {view.length === 0 && (
        <div className="us-empty">按「用 demo 試跑」立刻看篩選表，或填 key 跑真實資料。點欄位標題可排序。</div>
      )}
    </div>
  );
}
