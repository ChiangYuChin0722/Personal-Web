import React, { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

// Simple moving average line data for overlays.
function maLine(series, n) {
  const out = [];
  for (let i = n - 1; i < series.length; i++) {
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += series[j].close;
    out.push({ time: series[i].date, value: s / n });
  }
  return out;
}

// Interactive candlestick chart (drag to pan, wheel/pinch to zoom, crosshair).
export default function CandleChart({ series, height = 380, light = false }) {
  const wrapRef = useRef(null);
  const [legend, setLegend] = useState(null);

  useEffect(() => {
    if (!wrapRef.current || !series || series.length < 2) return;
    const el = wrapRef.current;

    const txt = light ? "#334155" : "#cbd5e1";
    const grid = light ? "#eef1f7" : "#1a212c";
    const up = "#22c55e";
    const down = "#ef4444";

    const chart = createChart(el, {
      height,
      layout: { background: { color: "transparent" }, textColor: txt, fontFamily: "Inter, sans-serif" },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      rightPriceScale: { borderColor: grid },
      timeScale: { borderColor: grid, timeVisible: false, rightOffset: 4 },
      crosshair: { mode: CrosshairMode.Normal },
      handleScroll: true,
      handleScale: true,
    });

    const candle = chart.addCandlestickSeries({
      upColor: up, downColor: down, borderUpColor: up, borderDownColor: down,
      wickUpColor: up, wickDownColor: down,
    });
    candle.setData(
      series.map((d) => ({ time: d.date, open: d.open, high: d.high, low: d.low, close: d.close }))
    );

    // volume on its own bottom scale
    const vol = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
      color: light ? "#cbd5e1" : "#334155",
    });
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    vol.setData(
      series.map((d) => ({
        time: d.date,
        value: d.volume || 0,
        color: d.close >= d.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
      }))
    );

    // MA overlays
    if (series.length >= 20) {
      const ma20 = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      ma20.setData(maLine(series, 20));
    }
    if (series.length >= 50) {
      const ma50 = chart.addLineSeries({ color: "#f59e0b", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      ma50.setData(maLine(series, 50));
    }

    chart.timeScale().fitContent();

    // crosshair OHLC legend
    const onMove = (param) => {
      if (!param || !param.time || !param.seriesData) {
        setLegend(null);
        return;
      }
      const c = param.seriesData.get(candle);
      if (c) {
        const chg = ((c.close - c.open) / c.open) * 100;
        setLegend({ time: param.time, ...c, chg });
      }
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w > 0) {
        chart.applyOptions({ width: w });
        chart.timeScale().fitContent(); // refill bars across the new width
      }
    });
    ro.observe(el);
    chart.applyOptions({ width: el.clientWidth });

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [series, height, light]);

  return (
    <div className="candle-wrap">
      <div className="candle-legend">
        {legend ? (
          <>
            <span>{legend.time}</span>
            <span>O {legend.open?.toFixed(2)}</span>
            <span>H {legend.high?.toFixed(2)}</span>
            <span>L {legend.low?.toFixed(2)}</span>
            <span>C {legend.close?.toFixed(2)}</span>
            <span className={legend.chg >= 0 ? "pos" : "neg"}>
              {legend.chg >= 0 ? "+" : ""}{legend.chg?.toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="candle-hint">拖曳平移 · 滾輪縮放 · 移到圖上看 OHLC　|　<b style={{ color: "#60a5fa" }}>— MA20</b> <b style={{ color: "#f59e0b" }}>— MA50</b></span>
        )}
      </div>
      <div ref={wrapRef} style={{ width: "100%" }} />
    </div>
  );
}
