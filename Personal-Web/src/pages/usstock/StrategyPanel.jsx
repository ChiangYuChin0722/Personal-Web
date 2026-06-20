import React, { useState, useCallback, useEffect, useRef } from "react";
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
  correlationMatrix,
  basketSeries,
  DEFAULT_WEIGHTS,
  FACTOR_META,
  FACTOR_ORDER,
} from "./factors.js";

// weight presets — quick ways to build a strategy
const PRESETS = {
  動能: { mom: 30, trend: 20, vol: 10, rsi: 5, relstr: 20, adx: 15 },
  防禦: { sharpe: 25, lowvol: 30, lowdd: 20, lowbeta: 15, calmar: 10 },
  價值: { value: 35, quality: 30, lowdd: 15, sortino: 10, meanrev: 10 },
  全因子: FACTOR_ORDER.reduce((o, k) => ((o[k] = 1), o), {}),
};
import { PriceChart } from "./Charts.jsx";
import Collapsible from "./Collapsible.jsx";
import { buildContext, classifyState, STATES } from "./state.js";
import { fsLoad, fsSave, STRATEGIES_DOC } from "./cloud.js";

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

export default function StrategyPanel({ apiKey, fmpKey, user }) {
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
  const [states, setStates] = useState({}); // symbol -> state key
  const [regime, setRegime] = useState(null);
  const [corr, setCorr] = useState(null);
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
  function applyPreset(name) {
    const next = { ...PRESETS[name] };
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
      const sm = {};
      scoredRows.forEach((r) => {
        try {
          sm[r.symbol] = classifyState(buildContext(r.series));
        } catch {
          sm[r.symbol] = "neutral";
        }
      });
      setStates(sm);
      // regime from QQQ if present, else from the universe's own equal-weight basket
      const qqq = fetched.find((r) => r.symbol === "QQQ");
      const mkt = qqq ? qqq.series : basketSeries(fetched);
      setRegime(mkt ? marketRegime(mkt, vixProxy(mkt)) : null);
      setCorr(scoredRows.length >= 2 ? correlationMatrix(fetched) : null);
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
    // QQQ omitted on purpose: regime is computed from the universe basket, so a
    // ≤8-symbol universe fetches in a single batch with no rate-limit wait.
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
      if (fetched.length) compute(fetched);
      setRanSource("live");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  const [saveMsg, setSaveMsg] = useState("");
  async function saveStrategy() {
    if (!user) {
      setSaveMsg("先在右上角用 Google 登入，才能把策略存到雲端。");
      return;
    }
    const name = window.prompt("策略名稱？", "我的策略");
    if (!name) return;
    const entry = { name, weights, universe: uniText, topN, years, savedAt: new Date().toISOString() };
    const existing = (await fsLoad(user.uid, STRATEGIES_DOC)) || [];
    const next = Array.isArray(existing) ? [...existing, entry] : [entry];
    fsSave(user.uid, STRATEGIES_DOC, next);
    setSaveMsg(`✅ 已存「${name}」到「我的」。`);
  }

  function runBacktest() {
    const data = rows && rows.length ? rows : demoUniverse([...symbols, "QQQ"], PERIODS[years]);
    setBt(backtest(data, weights, topN) || { error: true });
  }

  // share the current strategy as a link (encodes weights + universe + topN + years)
  function shareStrategy() {
    try {
      const payload = { w: weights, u: uniText, n: topN, y: years };
      const enc = btoa(encodeURIComponent(JSON.stringify(payload)));
      const url = `${window.location.origin}/USstock#s=${enc}`;
      navigator.clipboard?.writeText(url);
      setSaveMsg("🔗 已複製分享連結！別人開這個連結就會載入這個策略。");
    } catch {
      setSaveMsg("分享連結產生失敗。");
    }
  }

  // on mount: decode a shared strategy from the URL hash, then auto-run; or
  // auto-run after loading a saved strategy.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const hash = window.location.hash;
    const m = hash.match(/#s=([^&]+)/);
    if (m) {
      try {
        const p = JSON.parse(decodeURIComponent(atob(m[1])));
        if (p.w) setWeights(p.w);
        if (p.u) setUniText(p.u);
        if (p.n) setTopN(p.n);
        if (p.y) setYears(p.y);
        history.replaceState(null, "", window.location.pathname);
        setTimeout(() => runDemo(), 50);
      } catch {
        /* ignore bad link */
      }
      return;
    }
    if (sessionStorage.getItem("usstock_autorun")) {
      sessionStorage.removeItem("usstock_autorun");
      setTimeout(() => runDemo(), 50); // instant + never rate-limited; user can then click live
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="strat-presets">
          <span className="strat-presets-k">預設</span>
          {Object.keys(PRESETS).map((p) => (
            <button key={p} onClick={() => applyPreset(p)}>{p === "全因子" ? "全因子 ✦" : p}</button>
          ))}
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
            {loading && progress
              ? progress.wait
                ? `限速等待 ${progress.wait}s…`
                : `抓取中 ${progress.done}/${progress.total}…`
              : "用我的 key 跑 live"}
          </button>
          <button className="strat-btn bt" onClick={runBacktest} disabled={loading}>
            回測這個策略
          </button>
          <button className="strat-btn save" onClick={saveStrategy} disabled={loading}>
            💾 存成我的策略
          </button>
          <button className="strat-btn share" onClick={shareStrategy} disabled={loading}>
            🔗 分享連結
          </button>
        </div>
        {saveMsg && <div className="strat-note">{saveMsg}</div>}
        {symbols.length < 2 && (
          <div className="strat-note">⚠️ 因子是「跨股票排名」，選股池至少要 2 檔以上才有意義（回測也是）。</div>
        )}
        {progress && (
          <div className="strat-prog">
            <div className="strat-prog-fill" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
        {loading && progress && (
          <div className="strat-note">
            {progress.wait
              ? `免費 API 限速 8 次/分，正在等額度重置 ${progress.wait}s（沒當機，請別關頁面）。`
              : "抓取中…"}
            　選股池 ≤7 檔可一次抓完、免等待。
          </div>
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
              <div className="bt-kelly">
                <div className="bt-k"><span>報酬/風險 R</span><b>{bt.rr.toFixed(2)}</b><i>平均賺 ÷ 平均賠</i></div>
                <div className="bt-k"><span>Kelly 倉位</span><b className="pos">{pct(bt.kelly, 0)}</b><i>數學最佳下注比例</i></div>
                <div className="bt-k"><span>半 Kelly（穩健）</span><b>{pct(bt.kellyHalf, 0)}</b><i>實務多用一半，較不暴衝</i></div>
              </div>
              <div className="bt-note">
                Kelly = 勝率 − (1−勝率)/R。它告訴你「每次該押總資金的幾 %」——全 Kelly 波動大，多數人用半 Kelly。
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

      {/* correlation heatmap */}
      {corr && corr.symbols.length >= 2 && (
        <div className="strat-card">
          <div className="strat-card-head">
            <span>相關性熱圖 Correlation</span>
            <span className="strat-hint">
              平均相關 {corr.avg.toFixed(2)} ·{" "}
              {corr.avg > 0.7 ? "太集中、分散效果差" : corr.avg > 0.4 ? "中等" : "分散得不錯"}
            </span>
          </div>
          <p className="strat-corr-note">紅=一起漲跌（同進同退、分散差）· 藍=各走各的（分散好）。挑相關低的搭配能降低風險。</p>
          <div className="corr-wrap">
            <table className="corr-table">
              <thead>
                <tr>
                  <th />
                  {corr.symbols.map((s) => <th key={s}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                {corr.matrix.map((row, i) => (
                  <tr key={corr.symbols[i]}>
                    <th>{corr.symbols[i]}</th>
                    {row.map((v, j) => {
                      const a = Math.min(0.85, Math.abs(v));
                      const bg = v >= 0 ? `rgba(239,68,68,${a})` : `rgba(59,130,246,${a})`;
                      return (
                        <td key={j} style={{ background: bg }}>{v.toFixed(2)}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <span className="bc-sym">
                  {s.symbol}
                  {states[s.symbol] && (
                    <span className={`bc-state tone-${STATES[states[s.symbol]].tone}`}>
                      {STATES[states[s.symbol]].zh}
                    </span>
                  )}
                </span>
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
