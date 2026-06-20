import React, { useState, useCallback } from "react";
import {
  DEFAULT_UNIVERSE,
  demoUniverse,
  fetchUniverse,
  vixProxy,
} from "./data.js";
import {
  scoreUniverse,
  applySignals,
  marketRegime,
  DEFAULT_WEIGHTS,
} from "./factors.js";

const LS_W = "usstock_weights";
const LS_UNI = "usstock_universe";

const FACTORS = [
  { key: "mom", label: "Momentum", zh: "動能", desc: "20/60 日漲幅 — 強者恆強" },
  { key: "trend", label: "Trend", zh: "趨勢", desc: "現價 / MA50 — 是否站上均線" },
  { key: "vol", label: "Volume", zh: "資金", desc: "近期量 / 均量 — 有沒有資金進來" },
  { key: "rsi", label: "RSI", zh: "過熱", desc: "健康偏強加分、過熱(>70)扣分" },
];

function ScoreBar({ value, tone = "accent" }) {
  return (
    <div className="sb-track">
      <div className={`sb-fill sb-${tone}`} style={{ width: `${Math.max(2, value)}%` }} />
    </div>
  );
}

const SIGNAL = {
  buy: { txt: "買進", cls: "sig-buy" },
  watch: { txt: "觀察", cls: "sig-watch" },
  avoid: { txt: "避開", cls: "sig-avoid" },
};

export default function StrategyPanel({ apiKey, period }) {
  const [weights, setWeights] = useState(() => {
    try {
      return { ...DEFAULT_WEIGHTS, ...JSON.parse(localStorage.getItem(LS_W) || "{}") };
    } catch {
      return DEFAULT_WEIGHTS;
    }
  });
  const [uniText, setUniText] = useState(
    () => localStorage.getItem(LS_UNI) || DEFAULT_UNIVERSE.join(", ")
  );
  const [topN, setTopN] = useState(5);
  const [result, setResult] = useState(null);
  const [regime, setRegime] = useState(null);
  const [ranSource, setRanSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [errors, setErrors] = useState([]);

  const wSum = weights.mom + weights.trend + weights.vol + weights.rsi || 1;

  function setW(key, val) {
    const next = { ...weights, [key]: Number(val) };
    setWeights(next);
    localStorage.setItem(LS_W, JSON.stringify(next));
  }

  const symbols = uniText
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  function saveUni(v) {
    setUniText(v);
    localStorage.setItem(LS_UNI, v);
  }

  const compute = useCallback(
    (rows) => {
      const qqqRow = rows.find((r) => r.symbol === "QQQ");
      const scoredRows = rows.filter((r) => r.symbol !== "QQQ");
      const scored = applySignals(scoreUniverse(scoredRows, weights), topN);
      setResult(scored);
      const qseries = qqqRow ? qqqRow.series : null;
      setRegime(qseries ? marketRegime(qseries, vixProxy(qseries)) : null);
    },
    [weights, topN]
  );

  function runDemo() {
    setErrors([]);
    setLoading(true);
    const rows = demoUniverse([...symbols, "QQQ"]);
    compute(rows);
    setRanSource("demo");
    setLoading(false);
  }

  async function runLive() {
    if (!apiKey.trim()) {
      setErrors([{ symbol: "—", msg: "需要 Twelve Data key 才能跑 live；先用 demo 試。" }]);
      return;
    }
    setErrors([]);
    setLoading(true);
    setProgress({ done: 0, total: symbols.length + 1 });
    try {
      const { rows, errors: errs } = await fetchUniverse(
        [...symbols, "QQQ"],
        apiKey,
        (done, total) => setProgress({ done, total }),
        period
      );
      setErrors(errs);
      if (rows.length) compute(rows);
      setRanSource("live");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="us-strat">
      {/* how it works */}
      <div className="strat-how">
        <div className="strat-how-title">因子評分系統怎麼運作</div>
        <div className="strat-steps">
          <span><b>1 假設</b> 強者恆強</span>
          <span>→</span>
          <span><b>2 因子</b> 找能驗證假設的 3–5 個</span>
          <span>→</span>
          <span><b>3 打分</b> 跨股票排名加權</span>
          <span>→</span>
          <span><b>4 風控</b> Regime + 部位上限</span>
        </div>
      </div>

      {/* weights */}
      <div className="strat-card">
        <div className="strat-card-head">
          <span>因子權重</span>
          <span className="strat-hint">拉一拉看排名怎麼變 · 自動正規化成 100%</span>
        </div>
        <div className="strat-weights">
          {FACTORS.map((f) => (
            <div key={f.key} className="wrow">
              <div className="wrow-top">
                <span className="wrow-name">
                  {f.label} <span className="wrow-zh">{f.zh}</span>
                </span>
                <span className="wrow-pct">{Math.round((weights[f.key] / wSum) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={weights[f.key]}
                onChange={(e) => setW(f.key, e.target.value)}
              />
              <div className="wrow-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* universe + run */}
      <div className="strat-card">
        <div className="strat-card-head">
          <span>選股池 Universe</span>
          <span className="strat-hint">{symbols.length} 檔 · AI / 半導體 / 成長</span>
        </div>
        <textarea
          className="strat-uni"
          value={uniText}
          onChange={(e) => saveUni(e.target.value)}
          spellCheck={false}
          placeholder="NVDA, AMD, AVGO, ..."
        />
        <div className="strat-run">
          <label className="strat-topn">
            買進前
            <input
              type="number"
              min="1"
              max="20"
              value={topN}
              onChange={(e) => setTopN(Math.max(1, Number(e.target.value) || 1))}
            />
            名
          </label>
          <button className="strat-btn demo" onClick={runDemo} disabled={loading}>
            用 demo 試跑（即時）
          </button>
          <button className="strat-btn live" onClick={runLive} disabled={loading}>
            {loading && progress ? `抓取中 ${progress.done}/${progress.total}…` : "用我的 key 跑 live"}
          </button>
        </div>
        {progress && (
          <div className="strat-prog">
            <div className="strat-prog-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
        {loading && progress && (
          <div className="strat-note">免費 API 限速 8 次/分，約需 1–2 分鐘，請別關頁面。</div>
        )}
        {errors.length > 0 && (
          <div className="strat-errs">
            {errors.map((e, i) => (
              <span key={i}>{e.symbol}: {e.msg}</span>
            ))}
          </div>
        )}
      </div>

      {/* regime */}
      {regime && (
        <div className={`strat-regime tone-${regime.tone}`}>
          <div className="regime-top">
            <span className="regime-label">市場 Regime：{regime.level}</span>
            <span className="regime-meta">
              QQQ {regime.aboveMA200 == null ? "—" : regime.aboveMA200 ? "在 MA200 之上" : "跌破 MA200"} · VIX≈{regime.vix ?? "—"}（估算）
            </span>
          </div>
          <div className="regime-guide">{regime.guidance}</div>
          <div className="regime-cap">{regime.posCap}　·　單筆停損 &lt;2%　·　單一股票 &lt;20%</div>
        </div>
      )}

      {/* leaderboard */}
      {result && (
        <div className="strat-board">
          <div className="board-head">
            <span>排名 Leaderboard</span>
            <span className="strat-hint">
              {ranSource === "demo" ? "DEMO 假資料" : "LIVE 真實資料"} · 前 {topN} 名 = 買進候選
            </span>
          </div>
          <div className="board-cols">
            <span className="bc-rank">#</span>
            <span className="bc-sym">代號</span>
            <span className="bc-total">總分</span>
            <span className="bc-fac">動能</span>
            <span className="bc-fac">趨勢</span>
            <span className="bc-fac">資金</span>
            <span className="bc-fac">過熱</span>
            <span className="bc-sig">訊號</span>
          </div>
          {result.map((s) => {
            const sig = SIGNAL[s.signal];
            return (
              <div key={s.symbol} className={`board-row ${s.signal === "buy" ? "is-buy" : ""}`}>
                <span className="bc-rank">{s.rank}</span>
                <span className="bc-sym">{s.symbol}</span>
                <span className="bc-total">
                  <b>{s.total.toFixed(0)}</b>
                  <ScoreBar value={s.total} tone={s.signal === "buy" ? "good" : "accent"} />
                </span>
                <span className="bc-fac"><ScoreBar value={s.breakdown.mom} /><i>{s.breakdown.mom.toFixed(0)}</i></span>
                <span className="bc-fac"><ScoreBar value={s.breakdown.trend} /><i>{s.breakdown.trend.toFixed(0)}</i></span>
                <span className="bc-fac"><ScoreBar value={s.breakdown.vol} /><i>{s.breakdown.vol.toFixed(0)}</i></span>
                <span className="bc-fac"><ScoreBar value={s.breakdown.rsi} /><i>{s.breakdown.rsi.toFixed(0)}</i></span>
                <span className="bc-sig"><span className={`sig ${sig.cls}`}>{sig.txt}</span></span>
              </div>
            );
          })}
          <div className="board-rules">
            賣出規則：跌破 MA50 自動標「避開」，或排名掉出前 {topN * 2} 名。每週重新評分一次。
          </div>
        </div>
      )}

      {!result && (
        <div className="us-empty">
          按上面「用 demo 試跑」立刻看排名，或填好你的 Twelve Data key 跑真實資料。
        </div>
      )}
    </div>
  );
}
