import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./USStockPage.css";
import { fetchSeries, fetchFundamentals, demoSeries, parseCSV, PERIODS, vixProxy } from "./usstock/data.js";
import { computeMetrics, drawdownSeries } from "./usstock/quant.js";
import { marketRegime } from "./usstock/factors.js";
import { interpret } from "./usstock/interpret.js";
import { classify, SCHOOLS, stars, techRating } from "./usstock/state.js";
import { CATALOG, CATALOG_BY_ID, DEFAULT_SELECTED } from "./usstock/metricsCatalog.js";
import StrategyPanel from "./usstock/StrategyPanel.jsx";
import ScreenerPanel from "./usstock/ScreenerPanel.jsx";
import Collapsible from "./usstock/Collapsible.jsx";
import CandleChart from "./usstock/CandleChart.jsx";
import WatchList from "./usstock/WatchList.jsx";
import { DrawdownChart, Gauge } from "./usstock/Charts.jsx";

const LS_KEY = "usstock_apikey";
const LS_FMP = "usstock_fmpkey";
const LS_FLOW = "usstock_flow";
const LS_THEME = "usstock_theme";
const LS_SCHOOL = "usstock_school";
const LS_SEL = "usstock_selected";
const BENCH = "SPY";

// ---------- formatting helpers ----------
const pct = (v, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);
const num = (v, d = 2) => (v == null ? "—" : v.toFixed(d));
const signed = (v, d = 1) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(d)}%`);

// Selected-metric card: live value + "這是什麼" + "怎麼看".
function MetricExplain({ item, m }) {
  const tone = item.tone(m);
  const sub = item.sub ? item.sub(m) : "";
  return (
    <div className="explain">
      <div className="explain-top">
        <div className="explain-id">
          <span className="explain-name">{item.name}</span>
          <span className="explain-zh">{item.zh}</span>
        </div>
        <div className="explain-valwrap">
          <span className={`explain-val tone-${tone}`}>{item.val(m)}</span>
          {sub && <span className="explain-sub">{sub}</span>}
        </div>
      </div>
      {item.gauge && <div className="explain-gauge"><Gauge value={item.gauge(m)} /></div>}
      <p className="explain-what">{item.what}</p>
      <p className="explain-how">
        <span className="explain-how-k">怎麼看</span>
        {item.how}
      </p>
    </div>
  );
}

// ---------- flow config ----------
// src: "auto" = auto-fetchable from FMP free key, "paid" = needs paid feed
// (Unusual Whales etc.), "manual" = enter by hand. Honest about each.
const FLOW_FIELDS = [
  { key: "insider", label: "Insider (net)", zh: "內部人淨買賣", suffix: "", src: "paid", warn: (v) => v < 0 },
  { key: "instOwn", label: "Institutional", zh: "機構持股(家數)", suffix: "", src: "paid", warn: () => false },
  { key: "shortInt", label: "Short Interest %", zh: "放空比例", suffix: "%", src: "manual", warn: (v) => v >= 20 },
  { key: "daysToCover", label: "Days to Cover", zh: "軋空天數", suffix: "", src: "manual", warn: (v) => v >= 5 },
  { key: "ivRank", label: "IV Rank", zh: "隱含波動位階", suffix: "", src: "paid", warn: (v) => v >= 70 || v <= 20 },
  { key: "pcr", label: "Put/Call", zh: "情緒", suffix: "", src: "paid", warn: (v) => v >= 1 || v <= 0.6 },
  { key: "gex", label: "Gamma Exp (GEX)", zh: "$bn", suffix: "", src: "paid", warn: (v) => v < 0 },
  { key: "darkpool", label: "Dark Pool %", zh: "暗池占比", suffix: "%", src: "paid", warn: (v) => v >= 45 },
];

const SRC_TAG = {
  auto: { txt: "AUTO", cls: "tag-auto" },
  manual: { txt: "手動", cls: "tag-manual" },
  paid: { txt: "付費", cls: "tag-paid" },
};

export default function USStockPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || "dark");
  const [mode, setMode] = useState("single"); // single | strategy

  function toggleTheme() {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    localStorage.setItem(LS_THEME, t);
  }
  const [symbol, setSymbol] = useState("NVDA");
  const [input, setInput] = useState("NVDA");
  const [period, setPeriod] = useState("1Y");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [showKey, setShowKey] = useState(false);
  const [rf, setRf] = useState(0.04);

  const [series, setSeries] = useState(null);
  const [bench, setBench] = useState(null);
  const [source, setSource] = useState("demo"); // demo | live | csv
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const [fmpKey, setFmpKey] = useState(() => localStorage.getItem(LS_FMP) || "");
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowMsg, setFlowMsg] = useState("");

  const [selected, setSelected] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_SEL) || "null");
      return Array.isArray(s) ? s : DEFAULT_SELECTED;
    } catch {
      return DEFAULT_SELECTED;
    }
  });

  const [flow, setFlow] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_FLOW) || "{}");
    } catch {
      return {};
    }
  });

  // ---- load demo on first mount ----
  const loadDemo = useCallback((sym, per) => {
    setSeries(trimToPeriod(demoSeries(sym), per));
    setBench(trimToPeriod(demoSeries(BENCH), per));
    setSource("demo");
    setError("");
  }, []);

  useEffect(() => {
    // if a key is set, open straight into LIVE data; otherwise demo
    if (apiKey.trim()) loadLive("NVDA", "1Y", apiKey);
    else loadDemo("NVDA", "1Y");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function trimToPeriod(rows, per) {
    const n = PERIODS[per] || 252;
    return rows.slice(-n - 1);
  }

  // ---- live fetch ----
  const loadLive = useCallback(
    async (sym, per, key) => {
      setLoading(true);
      setError("");
      try {
        const [s, b] = await Promise.all([
          fetchSeries(sym, per, key),
          fetchSeries(BENCH, per, key),
        ]);
        if (!s || s.length < 5) throw new Error("Not enough data");
        setSeries(s);
        setBench(b);
        setSource("live");
        setSymbol(sym);
      } catch (e) {
        setError(
          `${e.message}. ${
            !key ? "免費 demo key 只支援部分代號 — 填入你自己的 key。" : "已退回 demo 資料。"
          }`
        );
        loadDemo(sym, per);
        setSymbol(sym);
      } finally {
        setLoading(false);
      }
    },
    [loadDemo]
  );

  function handleGo() {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    setSymbol(sym);
    loadLive(sym, period, apiKey);
  }

  // load a symbol picked from the watchlist (live if a key is set, else demo)
  function pickSymbol(sym) {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setInput(s);
    setSymbol(s);
    if (apiKey.trim()) loadLive(s, period, apiKey);
    else loadDemo(s, period);
  }

  function handlePeriod(per) {
    setPeriod(per);
    if (source === "csv") return;
    if (apiKey.trim()) loadLive(symbol, per, apiKey);
    else loadDemo(symbol, per);
  }

  function saveKey(v) {
    setApiKey(v);
    localStorage.setItem(LS_KEY, v);
  }

  function loadCsv() {
    try {
      const rows = parseCSV(csvText);
      setSeries(rows);
      setBench(null);
      setSource("csv");
      setError("");
      setCsvOpen(false);
    } catch (e) {
      setError(`CSV 解析失敗：${e.message}`);
    }
  }

  function setFlowVal(key, val) {
    const next = { ...flow, [key]: val };
    setFlow(next);
    localStorage.setItem(LS_FLOW, JSON.stringify(next));
  }

  function saveFmpKey(v) {
    setFmpKey(v);
    localStorage.setItem(LS_FMP, v);
  }

  // ---- metric selection (left sidebar) ----
  function persistSel(next) {
    setSelected(next);
    localStorage.setItem(LS_SEL, JSON.stringify(next));
  }
  function toggleMetric(id) {
    persistSel(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  function toggleCat(group) {
    const ids = group.items.map((i) => i.id);
    const allOn = ids.every((id) => selected.includes(id));
    persistSel(
      allOn ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])]
    );
  }
  function selectAll() {
    persistSel(Object.keys(CATALOG_BY_ID));
  }
  function clearAll() {
    persistSel([]);
  }

  // Test the FMP key against the free ratios-ttm endpoint (the same data that
  // powers the Quality/Value factors in 策略評分). Insider/13F need a paid plan.
  async function testFmp() {
    if (!fmpKey.trim()) {
      setFlowMsg("先填 FMP key（免費）");
      return;
    }
    const sym = source === "csv" ? input.trim().toUpperCase() : symbol;
    if (!sym) return;
    setFlowLoading(true);
    setFlowMsg("");
    try {
      const f = await fetchFundamentals(sym, fmpKey);
      if (f && (f.roe != null || f.pe != null)) {
        setFlowMsg(
          `✅ ${sym} key 正常：ROE ${f.roe != null ? (f.roe * 100).toFixed(0) + "%" : "—"} · PE ${
            f.pe != null ? f.pe.toFixed(1) : "—"
          } · 毛利 ${f.gm != null ? (f.gm * 100).toFixed(0) + "%" : "—"}　→「策略評分」的品質/價值已可用。`
        );
      } else {
        setFlowMsg(`${sym}：沒拿到基本面（key 無效，或免費方案受限）。`);
      }
    } catch (e) {
      setFlowMsg(`測試失敗：${e.message}`);
    } finally {
      setFlowLoading(false);
    }
  }

  // ---- compute ----
  const m = useMemo(() => (series ? computeMetrics(series, bench, rf) : null), [series, bench, rf]);
  const dd = useMemo(() => (series ? drawdownSeries(series) : []), [series]);
  const guide = useMemo(() => interpret(m), [m]);

  const [school, setSchool] = useState(() => localStorage.getItem(LS_SCHOOL) || "momentum");
  function pickSchool(k) {
    setSchool(k);
    localStorage.setItem(LS_SCHOOL, k);
  }
  const state = useMemo(
    () => (series && series.length > 30 ? classify(series, school) : null),
    [series, school]
  );
  const regime = useMemo(
    () => (bench && bench.length > 50 ? marketRegime(bench, vixProxy(bench)) : null),
    [bench]
  );

  return (
    <div className={`usstock ${theme === "light" ? "light" : ""}`}>
      <div className="us-wrap">
        {/* ---------------- header ---------------- */}
        <header className="us-topbar">
          <div className="us-brand">
            <span className="us-logo">◧</span>
            <div>
              <h1>Quant Dashboard</h1>
              <p>US Equities · 小型對沖基金式監控面板</p>
            </div>
          </div>
          <div className="us-topright">
            <button className="us-theme" onClick={toggleTheme} title="切換明亮 / 暗黑">
              {theme === "dark" ? "☀️ 明亮" : "🌙 暗黑"}
            </button>
            <a href="/dashboard" className="us-back">
              ← dashboard
            </a>
          </div>
        </header>

        {/* ---------------- mode tabs (sticky) ---------------- */}
        <div className="us-tabs">
          <button className={mode === "single" ? "active" : ""} onClick={() => setMode("single")}>
            個股分析
          </button>
          <button className={mode === "screener" ? "active" : ""} onClick={() => setMode("screener")}>
            篩選器
          </button>
          <button className={mode === "strategy" ? "active" : ""} onClick={() => setMode("strategy")}>
            策略評分
          </button>
        </div>

        {mode === "strategy" && <StrategyPanel apiKey={apiKey} fmpKey={fmpKey} period={period} />}
        {mode === "screener" && (
          <ScreenerPanel
            apiKey={apiKey}
            fmpKey={fmpKey}
            onPick={(s) => {
              pickSymbol(s);
              setMode("single");
            }}
          />
        )}

        {mode === "single" && (
        <>
        {/* ---------------- controls ---------------- */}
        <div className="us-controls">
          <div className="us-search">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
              placeholder="Ticker e.g. NVDA"
              spellCheck={false}
            />
            <button className="us-go" onClick={handleGo} disabled={loading}>
              {loading ? "…" : "Analyze"}
            </button>
          </div>

          <div className="us-periods">
            {Object.keys(PERIODS).map((p) => (
              <button
                key={p}
                className={p === period ? "active" : ""}
                onClick={() => handlePeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button className="us-link" onClick={() => setShowKey((s) => !s)}>
            {apiKey ? "🔑 key set" : "🔑 add key"}
          </button>
          <button className="us-link" onClick={() => setCsvOpen((s) => !s)}>
            ⇪ CSV
          </button>
        </div>

        {showKey && (
          <div className="us-keybox">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              placeholder="Twelve Data API key (免費 800/day)"
              spellCheck={false}
            />
            <a href="https://twelvedata.com/pricing" target="_blank" rel="noreferrer">
              取得免費 key →
            </a>
            <span className="us-keyhint">存在你瀏覽器 localStorage，不會上傳。</span>
          </div>
        )}

        {csvOpen && (
          <div className="us-csvbox">
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"貼上券商匯出的 CSV（date,open,high,low,close,volume）\n或一行一個收盤價，或逗號分隔的價格序列"}
            />
            <div className="us-csvactions">
              <button onClick={loadCsv}>計算</button>
              <button className="ghost" onClick={() => setCsvOpen(false)}>
                取消
              </button>
            </div>
          </div>
        )}

        {/* ---------------- status ---------------- */}
        <div className="us-status">
          <span className={`us-badge src-${source}`}>
            {source === "live" ? "● LIVE" : source === "csv" ? "● CSV" : "○ DEMO"}
          </span>
          {m && (
            <>
              <span className="us-sym">{source === "csv" ? "CSV" : symbol}</span>
              {source !== "csv" && (
                <span className="us-price">
                  ${num(m.last)}{" "}
                  <span className={m.dayChangePct >= 0 ? "pos" : "neg"}>{signed(m.dayChangePct, 2)}</span>
                </span>
              )}
              <span className="us-range">
                {m.startDate} → {m.endDate} · {m.bars} bars
              </span>
            </>
          )}
          {source === "demo" && apiKey.trim() && (
            <button className="us-golive" onClick={() => { setSymbol(input.trim().toUpperCase() || symbol); loadLive(input.trim().toUpperCase() || symbol, period, apiKey); }}>
              你有 key → 點這裡抓真實資料
            </button>
          )}
        </div>

        {error && <div className="us-error">{error}</div>}

        {/* ---------------- regime engine (market backdrop) ---------------- */}
        {regime && (
          <div className={`us-regime tone-${regime.tone}`}>
            <span className="us-regime-dot" />
            <span className="us-regime-label">市場環境：{regime.level}</span>
            <span className="us-regime-meta">
              SPY {regime.aboveMA200 == null ? "—" : regime.aboveMA200 ? "在 MA200 之上" : "跌破 MA200"} · VIX≈{regime.vix ?? "—"}
            </span>
            <span className="us-regime-guide">{regime.posCap}</span>
          </div>
        )}

        {/* ---------------- market state machine ---------------- */}
        {state && (
          <div className={`us-state tone-${state.state.tone}`}>
            <div className="state-top">
              <div className="state-id">
                <span className="state-badge">
                  {state.state.label} <span className="state-zh">{state.state.zh}</span>
                </span>
                <span className="state-stars">{stars(state.state.stars)}</span>
              </div>
              <div className={`state-action tone-${state.eval.action.tone}`}>
                {state.eval.action.txt}
              </div>
            </div>
            <p className="state-desc">{state.state.desc}</p>

            <div className="state-schools">
              <span className="state-schools-k">流派</span>
              {Object.values(SCHOOLS).map((s) => {
                const fit = state.state.fit.includes(s.key);
                return (
                  <button
                    key={s.key}
                    className={`${s.key === school ? "active" : ""} ${fit ? "fit" : ""}`}
                    onClick={() => pickSchool(s.key)}
                    title={fit ? `${s.desc}（適合目前狀態）` : s.desc}
                  >
                    {s.label}{fit ? " ✦" : ""}
                  </button>
                );
              })}
              <span className="state-schools-tip">✦ = 適合目前狀態</span>
            </div>

            <div className="state-score">
              <div className="state-rules">
                {state.eval.rules.map((r) => (
                  <div key={r.label} className={`state-rule ${r.ok ? "ok" : "no"}`}>
                    <span className="state-rule-mark">{r.ok ? "✓" : "✕"}</span>
                    <span className="state-rule-label">{r.label}</span>
                    <span className="state-rule-pts">{r.ok ? `+${r.pts}` : "0"}</span>
                  </div>
                ))}
              </div>
              <div className="state-total">
                <div className={`state-total-num tone-${state.eval.tier.tone}`}>
                  {state.eval.score}
                  <span>/100</span>
                </div>
                <div className={`state-tier tone-${state.eval.tier.tone}`}>{state.eval.tier.txt}</div>
                <div className="state-triggers">
                  <span className={state.eval.buy ? "trg-on" : "trg-off"}>買 {state.eval.buy ? "✓" : "—"}</span>
                  <span className={state.eval.sell ? "trg-sell" : "trg-off"}>賣 {state.eval.sell ? "✓" : "—"}</span>
                </div>
              </div>
            </div>
            <div className="state-foot">
              <span><b>{state.eval.school.label}</b> 買：{state.eval.school.buyText}　·　賣：{state.eval.school.sellText}</span>
            </div>
            {!state.state.fit.includes(school) && (
              <div className="state-hint">
                💡 這檔現在是「{state.state.zh}」，
                {state.state.fit.length
                  ? `比較適合 ${state.state.fit.map((k) => SCHOOLS[k].label).join("、")}。你選的「${state.eval.school.label}」要等「${state.eval.school.buyText}」才出手——目前不符合，所以「不碰」是正常的，不是壞掉。`
                  : "多數流派都不建議進場，觀望為宜。"}
              </div>
            )}
          </div>
        )}

        {/* ---------------- plain-language guide ---------------- */}
        {guide && (
          <Collapsible variant="guide" title="📖 白話解讀" sub="看不懂數字？先讀這裡 · 教學非投資建議">
            <div className="us-mood">{guide.mood}</div>

            <div className="us-arch">
              <div className="us-arch-tag">
                <span className="us-arch-emoji">{guide.archetype.emoji}</span>
                <div>
                  <div className="us-arch-name">
                    你的策略組合：{guide.archetype.tag}
                    <span className="us-arch-en">{guide.archetype.en}</span>
                  </div>
                  <div className="us-arch-plain">{guide.archetype.plain}</div>
                </div>
              </div>
              <div className="us-arch-row">
                <span className="us-arch-k">怎麼打</span>
                <span>{guide.archetype.play}</span>
              </div>
              <div className="us-arch-row">
                <span className="us-arch-k">部位</span>
                <span>{guide.archetype.sizing}</span>
              </div>
            </div>

            <div className="us-reads">
              {guide.reads.map((r) => (
                <div key={r.k} className="us-read">
                  <span className="us-read-k">{r.k}</span>
                  <span className="us-read-v">{r.plain}</span>
                </div>
              ))}
            </div>

            {guide.cautions.length > 0 && (
              <ul className="us-cautions">
                {guide.cautions.map((c, i) => (
                  <li key={i}>⚠️ {c}</li>
                ))}
              </ul>
            )}
          </Collapsible>
        )}

        {/* ---------------- pro layout: chart + watchlist ---------------- */}
        {m && (
          <div className="pro-grid">
            <div className="pro-chart">
              <div className="pro-chart-head">
                <span className="pro-sym">{source === "csv" ? "CSV" : symbol}</span>
                {source !== "csv" && (
                  <span className="pro-quote">
                    ${num(m.last)}{" "}
                    <span className={m.dayChangePct >= 0 ? "pos" : "neg"}>{signed(m.dayChangePct, 2)}</span>
                  </span>
                )}
                <span className="pro-range">{m.startDate} → {m.endDate}</span>
              </div>
              <CandleChart series={series} light={theme === "light"} height={420} />
              <div className="pro-dd-head">
                <span>回撤 Drawdown</span>
                <span className="neg">MDD {pct(m.maxDrawdown)}</span>
              </div>
              <DrawdownChart dd={dd} />
            </div>

            <aside className="pro-side">
              {state && (() => {
                const tr = techRating(m, state.ctx);
                const pos = Math.round((tr.score + 1) * 50); // 0..100
                return (
                  <div className="pro-tech">
                    <div className="pro-tech-title">技術評級</div>
                    <div className={`pro-tech-verdict tone-${tr.tone}`}>{tr.label}</div>
                    <div className="pro-tech-meter">
                      <div className="pro-tech-track">
                        <span className="seg sell" />
                        <span className="seg neu" />
                        <span className="seg buy" />
                        <span className="pro-tech-mark" style={{ left: `calc(${pos}% - 2px)` }} />
                      </div>
                      <div className="pro-tech-ends"><span>賣出</span><span>中立</span><span>買入</span></div>
                    </div>
                  </div>
                );
              })()}
              <WatchList current={symbol} apiKey={apiKey} onPick={pickSymbol} />
              <div className="pro-stats">
                <div className="pro-stats-title">關鍵數據</div>
                <div className="pro-stat"><span>區間高</span><b>${num(Math.max(...series.map((d) => d.high)))}</b></div>
                <div className="pro-stat"><span>區間低</span><b>${num(Math.min(...series.map((d) => d.low)))}</b></div>
                <div className="pro-stat"><span>波動率</span><b>{pct(m.volatility)}</b></div>
                <div className="pro-stat"><span>Beta</span><b>{num(m.beta)}</b></div>
                <div className="pro-stat"><span>RSI</span><b>{num(m.rsi, 0)}</b></div>
                <div className="pro-stat"><span>ATR</span><b>${num(m.atr)}</b></div>
                <div className="pro-stat"><span>Sharpe</span><b>{num(m.sharpe)}</b></div>
                <div className="pro-stat"><span>綜合分</span><b>{num(m.composite, 0)}</b></div>
              </div>
              {m.atr != null && (
                <div className="pro-rr">
                  <div className="pro-rr-title">風險報酬 R/R<span>停損 1.5×ATR · 目標 3×ATR</span></div>
                  <div className="pro-rr-row"><span>進場</span><b>${num(m.last)}</b></div>
                  <div className="pro-rr-row"><span>停損</span><b className="neg">${num(m.last - 1.5 * m.atr)}</b></div>
                  <div className="pro-rr-row"><span>目標</span><b className="pos">${num(m.last + 3 * m.atr)}</b></div>
                  <div className="pro-rr-row big"><span>報酬:風險</span><b className="pos">2.0 : 1</b></div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ---------------- selectable strategies (sidebar + main) ---------------- */}
        {m && (
          <div className="us-body">
            <aside className="us-sidebar">
              <div className="us-sidebar-head">
                <span className="us-sidebar-title">策略選單</span>
                <span className="us-sidebar-count">{selected.length} 個</span>
              </div>
              <p className="us-sidebar-hint">勾你想看的，右邊就顯示數值＋怎麼看</p>
              <div className="us-sidebar-actions">
                <button onClick={selectAll}>全選</button>
                <button onClick={clearAll}>清空</button>
              </div>
              {CATALOG.map((g) => {
                const ids = g.items.map((i) => i.id);
                const allOn = ids.every((id) => selected.includes(id));
                const someOn = ids.some((id) => selected.includes(id));
                return (
                  <div key={g.cat} className="sb-group">
                    <label className="sb-cat">
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={(el) => el && (el.indeterminate = !allOn && someOn)}
                        onChange={() => toggleCat(g)}
                      />
                      <span>{g.cat}</span>
                    </label>
                    {g.items.map((it) => (
                      <label key={it.id} className="sb-item">
                        <input
                          type="checkbox"
                          checked={selected.includes(it.id)}
                          onChange={() => toggleMetric(it.id)}
                        />
                        <span className="sb-name">{it.name}</span>
                        <span className="sb-zh">{it.zh}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </aside>

            <div className="us-main">
              {selected.length === 0 && (
                <div className="us-empty">← 從左邊勾選你想看的策略，這裡會顯示「數值 + 這是什麼 + 怎麼看」</div>
              )}
              {CATALOG.map((g) => {
                const items = g.items.filter((it) => selected.includes(it.id));
                if (!items.length) return null;
                return (
                  <div key={g.cat} className="main-group">
                    <div className="main-cat">{g.cat}</div>
                    <div className="explain-grid">
                      {items.map((it) => (
                        <MetricExplain key={it.id} item={it} m={m} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- flow ---------------- */}
        <Collapsible title="Flow · Options · Positioning" sub="資金流 / 選擇權 · 進階" defaultOpen={false}>
          <p className="us-flow-note">
            <b className="tag-manual">手動</b> = 自己填 ·
            <b className="tag-paid">付費</b> = 需付費資料（含 FMP 的 Insider/13F、Unusual Whales 的 GEX/暗池），免費抓不到。資料存在你瀏覽器。
          </p>

          <div className="us-flow-fetch">
            <input
              type="text"
              value={fmpKey}
              onChange={(e) => saveFmpKey(e.target.value)}
              placeholder="FMP API key（免費）→ 啟用「策略評分」的 品質/價值 因子"
              spellCheck={false}
            />
            <button onClick={testFmp} disabled={flowLoading}>
              {flowLoading ? "…" : "測試 FMP key"}
            </button>
            <a href="https://site.financialmodelingprep.com/developer/docs" target="_blank" rel="noreferrer">
              取得免費 key →
            </a>
          </div>
          {flowMsg && <div className="us-flow-msg">{flowMsg}</div>}

          <div className="metric-grid flow-grid">
            {FLOW_FIELDS.map((f) => {
              const raw = flow[f.key];
              const v = raw === "" || raw == null ? null : parseFloat(raw);
              const warn = v != null && f.warn(v);
              const tag = SRC_TAG[f.src];
              return (
                <div key={f.key} className={`metric flow-cell src-${f.src} ${warn ? "flow-warn" : ""}`}>
                  <div className="metric-label">
                    {f.label} <span className="flow-zh">{f.zh}</span>
                    <span className={`flow-tag ${tag.cls}`}>{tag.txt}</span>
                  </div>
                  <div className="flow-input">
                    <input
                      type="number"
                      value={raw ?? ""}
                      onChange={(e) => setFlowVal(f.key, e.target.value)}
                      placeholder="—"
                    />
                    {f.suffix && <span>{f.suffix}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible>
        </>
        )}

        <footer className="us-footer">
          <span>
            指標由 {mode === "strategy" ? "因子評分" : source === "csv" ? "你的 CSV" : "Twelve Data"} 即時計算 ·
            教學，非投資建議
          </span>
          <span>rf {pct(rf, 0)}</span>
        </footer>
      </div>
    </div>
  );
}
