import React, { useState, useEffect } from "react";
import { DEFAULT_UNIVERSE, demoQuotes, fetchQuotes } from "./data.js";

const LS_UNI = "usstock_universe";

const fmtPrice = (v) => (v == null ? "—" : v >= 100 ? v.toFixed(2) : v.toFixed(2));
const fmtChg = (v) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2)}%`);

// TradingView-style watchlist: universe symbols with price + change, click to load.
export default function WatchList({ current, apiKey, onPick }) {
  const [uniText, setUniText] = useState(
    () => localStorage.getItem(LS_UNI) || DEFAULT_UNIVERSE.join(", ")
  );
  const [editing, setEditing] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [src, setSrc] = useState("demo");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const symbols = Array.from(
    new Set([current, ...uniText.split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean)])
  ).filter(Boolean);

  // demo quotes immediately whenever the list changes
  useEffect(() => {
    setQuotes(demoQuotes(symbols));
    setSrc("demo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniText, current]);

  function saveUni(v) {
    setUniText(v);
    localStorage.setItem(LS_UNI, v);
  }

  async function refreshLive() {
    if (!apiKey.trim()) {
      setErr("需要 key 才能更新即時報價");
      return;
    }
    if (symbols.length > 8) {
      setErr("≤8 檔才能一次更新（免費限速）");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const q = await fetchQuotes(symbols, apiKey);
      setQuotes(q);
      setSrc("live");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="watch">
      <div className="watch-head">
        <span className="watch-title">觀察清單</span>
        <span className={`watch-src src-${src}`}>{src === "live" ? "● LIVE" : "○ DEMO"}</span>
        <button className="watch-edit" onClick={() => setEditing((e) => !e)} title="編輯清單">✎</button>
        <button className="watch-refresh" onClick={refreshLive} disabled={loading} title="用 key 更新即時報價">
          {loading ? "…" : "⟳"}
        </button>
      </div>

      {editing && (
        <textarea
          className="watch-edit-box"
          value={uniText}
          onChange={(e) => saveUni(e.target.value)}
          spellCheck={false}
          placeholder="NVDA, AMD, ..."
        />
      )}
      {err && <div className="watch-err">{err}</div>}

      <div className="watch-cols">
        <span>商品</span>
        <span>最新價</span>
        <span>漲跌%</span>
      </div>
      <div className="watch-rows">
        {quotes.map((q) => (
          <button
            key={q.symbol}
            className={`watch-row ${q.symbol === current ? "active" : ""}`}
            onClick={() => onPick(q.symbol)}
          >
            <span className="watch-sym">{q.symbol}</span>
            <span className="watch-price">{fmtPrice(q.price)}</span>
            <span className={`watch-chg ${q.changePct >= 0 ? "pos" : "neg"}`}>{fmtChg(q.changePct)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
