import React, { useState, useCallback } from "react";
import {
  DEFAULT_UNIVERSE,
  demoUniverse,
  fetchUniverse,
  vixProxy,
  PERIODS,
} from "./data.js";
import {
  scoreUniverse,
  applySignals,
  marketRegime,
  backtest,
  DEFAULT_WEIGHTS,
  FACTOR_META,
  FACTOR_ORDER,
} from "./factors.js";
import { PriceChart } from "./Charts.jsx";
import Collapsible from "./Collapsible.jsx";

const LS_W = "usstock_weights";
const LS_UNI = "usstock_universe";

const pct = (v, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);

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

const YEARS = ["1Y", "2Y", "5Y"];

export default function StrategyPanel({ apiKey, fmpKey }) {
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
  const [years, setYears] = useState("2Y"); // history / backtest length
  const [rows, setRows] = useState(null); // fetched price+fund rows
  const [result, setResult] = useState(null); // { scored:[], active:[] }
  const [regime, setRegime] = useState(null);
  const [ranSource, setRanSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [errors, setErrors] = useState([]);
  const [bt, setBt] = useState(null);

  const wSum = FACTOR_ORDER.reduce((s, k) => s + (weights[k] || 0), 0) || 1;

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
    (fetched) => {
      setRows(fetched);
      const scoredRows = fetched.filter((r) => r.symbol !== "QQQ");
      const { scored, active } = scoreUniverse(scoredRows, weights);
      setResult({ scored: applySignals(scored, topN), active });
      const qqq = fetched.find((r) => r.symbol === "QQQ");
      setRegime(qqq ? marketRegime(qqq.series, vixProxy(qqq.series)) : null);
      setBt(null);
    },
    [weights, topN]
  );

  function runDemo() {
    setErrors([]);
    setLoading(true);
    compute(demoUniverse([...symbols, "QQQ"], PERIODS[years]));
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
      const { rows: fetched, errors: errs } = await fetchUniverse(
        [...symbols, "QQQ"],
        apiKey,
        (done, total) => setProgress({ done, total }),
        years,
        fmpKey
      );
      setErrors(errs);
      if (fetched.length) compute(fetched);
      setRanSource("live");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  function runBacktest() {
    const data = rows && rows.length ? rows : demoUniverse([...symbols, "QQQ"], PERIODS[years]);
    setBt(backtest(data, weights, topN) || { error: true });
  }

  const active = result?.active || [];
  const gridCols = `26px 54px 1.4fr ${active.map(() => "minmax(50px,1fr)").join(" ")} 50px`;
  const eqSeries =
    bt && !bt.error
      ? bt.equity.map((v, i) => ({ date: bt.dates[i], open: v, high: v, low: v, close: v, volume: 0 }))
      : null;

  return (
    <div className="us-strat">
      {/* how it works */}
      <Collapsible variant="guide" title="因子評分系統怎麼運作" sub="假設 → 因子 → 打分 → 風控" defaultOpen={false}>
        <div className="strat-steps">
          <span><b>1 假設</b> 強者恆強</span>
          <span>→</span>
          <span><b>2 因子</b> 找能驗證假設的 3–5 個</span>
          <span>→</span>
          <span><b>3 打分</b> 跨股票排名加權</span>
          <span>→</span>
          <span><b>4 風控</b> Regime + 回測 + 部位上限</span>
        </div>
      </Collapsible>

      {/* weights */}
      <div className="strat-card">
        <div className="strat-card-head">
          <span>因子權重</span>
          <span className="strat-hint">拉一拉看排名怎麼變 · 自動正規化 · 品質/價值需 FMP key</span>
        </div>
        <div className="strat-weights">
          {FACTOR_ORDER.map((k) => {
            const f = FACTOR_META[k];
            return (
              <div key={k} className="wrow">
                <div className="wrow-top">
                  <span className="wrow-name">
                    {f.label} <span className="wrow-zh">{f.zh}</span>
                    {f.fund && <span className="wrow-tag">需 FMP</span>}
                  </span>
                  <span className="wrow-pct">{Math.round(((weights[k] || 0) / wSum) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[k] || 0}
                  onChange={(e) => setW(k, e.target.value)}
                />
                <div className="wrow-desc">{f.desc}</div>
              </div>
            );
          })}
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
          <div className="strat-years">
            <span>回測期間</span>
            {YEARS.map((y) => (
              <button key={y} className={y === years ? "active" : ""} onClick={() => setYears(y)}>
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="strat-run">
          <button className="strat-btn demo" onClick={runDemo} disabled={loading}>
            用 demo 試跑（即時）
          </button>
          <button className="strat-btn live" onClick={runLive} disabled={loading}>
            {loading && progress ? `抓取中 ${progress.done}/${progress.total}…` : "用我的 key 跑 live"}
          </button>
          <button className="strat-btn bt" onClick={runBacktest} disabled={loading}>
            回測這個策略
          </button>
        </div>
        {symbols.length < 2 && (
          <div className="strat-note">⚠️ 因子是「跨股票排名」，選股池至少要 2 檔以上才有意義（回測也是）。</div>
        )}
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

      {/* backtest */}
      {bt && (
        <div className="strat-card strat-bt">
          <div className="strat-card-head">
            <span>回測 Backtest</span>
            <span className="strat-hint">
              {years} · 每週重新評分、持有前 {topN} 名 · 價格類因子 · {ranSource === "live" ? "真實" : "demo"} 歷史
            </span>
          </div>
          {bt.error ? (
            <div className="strat-note">資料不足以回測（需要更長歷史，試 1Y 以上）。</div>
          ) : (
            <>
              {eqSeries && <PriceChart series={eqSeries} height={150} />}
              <div className="bt-metrics">
                <div className="bt-m"><span>年化 CAGR</span><b className={bt.cagr >= 0 ? "pos" : "neg"}>{pct(bt.cagr)}</b></div>
                <div className="bt-m"><span>Sharpe</span><b className={bt.sharpe >= 1 ? "pos" : ""}>{bt.sharpe.toFixed(2)}</b></div>
                <div className="bt-m"><span>最大回撤</span><b className="neg">{pct(bt.mdd)}</b></div>
                <div className="bt-m"><span>勝率</span><b>{pct(bt.winRate, 0)}</b></div>
                <div className="bt-m"><span>總報酬</span><b className={bt.totalReturn >= 0 ? "pos" : "neg"}>{pct(bt.totalReturn)}</b></div>
                <div className="bt-m"><span>等權買持 CAGR</span><b>{pct(bt.benchCagr)}</b></div>
              </div>
              <div className="bt-verdict">
                {bt.cagr > bt.benchCagr
                  ? `✅ 策略 ${pct(bt.cagr)} 勝過「整池買著不動」${pct(bt.benchCagr)} — 選股有加值。`
                  : `⚠️ 策略 ${pct(bt.cagr)} 沒贏過「整池買著不動」${pct(bt.benchCagr)} — 不如直接全買。`}
                　共 {bt.nRebals} 次再平衡。
              </div>
            </>
          )}
        </div>
      )}

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
              {!active.includes("quality") && "（品質/價值未計入 — 需 FMP key）"}
            </span>
          </div>
          <div className="board-cols" style={{ gridTemplateColumns: gridCols }}>
            <span className="bc-rank">#</span>
            <span className="bc-sym">代號</span>
            <span className="bc-total">總分</span>
            {active.map((k) => (
              <span key={k} className="bc-fac">{FACTOR_META[k].zh}</span>
            ))}
            <span className="bc-sig">訊號</span>
          </div>
          {result.scored.map((s) => {
            const sig = SIGNAL[s.signal];
            return (
              <div
                key={s.symbol}
                className={`board-row ${s.signal === "buy" ? "is-buy" : ""}`}
                style={{ gridTemplateColumns: gridCols }}
              >
                <span className="bc-rank">{s.rank}</span>
                <span className="bc-sym">{s.symbol}</span>
                <span className="bc-total">
                  <b>{s.total.toFixed(0)}</b>
                  <ScoreBar value={s.total} tone={s.signal === "buy" ? "good" : "accent"} />
                </span>
                {active.map((k) => (
                  <span key={k} className="bc-fac">
                    <ScoreBar value={s.breakdown[k] ?? 50} />
                    <i>{(s.breakdown[k] ?? 50).toFixed(0)}</i>
                  </span>
                ))}
                <span className="bc-sig"><span className={`sig ${sig.cls}`}>{sig.txt}</span></span>
              </div>
            );
          })}
          <div className="board-rules">
            賣出規則：跌破 MA50 自動標「避開」，或排名掉出前 {topN * 2} 名。每週重新評分一次。
          </div>
        </div>
      )}

      {!result && !bt && (
        <div className="us-empty">
          按「用 demo 試跑」立刻看排名，或「回測這個策略」看歷史績效（Sharpe / 回撤 / 勝率）。
        </div>
      )}
    </div>
  );
}
