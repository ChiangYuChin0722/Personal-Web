// Turn the raw metric pack into plain-language, beginner-friendly guidance.
// Returns { mood, archetype, reads[], cautions[] } or null.
// This is education, NOT investment advice.

const fmtPct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;

export function interpret(m) {
  if (!m) return null;

  const vol = m.volatility ?? 0;
  const sharpe = m.sharpe ?? 0;
  const adx = m.adx;
  const rsi = m.rsi;
  const mom20 = m.mom20 ?? 0;
  const mom60 = m.mom60 ?? 0;
  const mdd = m.maxDrawdown ?? 0;

  // --- buckets ---
  const trending = adx != null && adx >= 25;
  const choppy = adx != null && adx < 20;
  const momUp = mom60 > 0.02 && mom20 > -0.04;
  const momDown = mom60 < -0.02 && mom20 < 0.02;
  const volHigh = vol > 0.4;
  const volMid = vol > 0.22 && vol <= 0.4;

  // ---------- strategy archetype (the "strategy combination") ----------
  let archetype;
  if (trending && momUp) {
    archetype = {
      tag: "趨勢動能股",
      en: "Momentum / Trend-following",
      emoji: "🚀",
      plain: "現在是「有方向、而且往上衝」的盤。趨勢明確（ADX 高）、近一兩個月都在漲。",
      play: "順勢做多最順手：跟著漲、等趨勢轉弱（跌破均線、ADX 掉下來、動能轉負）再考慮出場。不要去猜頂。",
    };
  } else if (trending && momDown) {
    archetype = {
      tag: "下降趨勢股",
      en: "Downtrend",
      emoji: "🔻",
      plain: "有明確方向，但方向是「往下」。趨勢強、近期在跌。",
      play: "新手最好先「不碰、觀望」。接刀（猜底買進）風險很高，等它止跌、趨勢翻正再說。",
    };
  } else if (choppy) {
    archetype = {
      tag: "盤整／區間股",
      en: "Range / Mean-reversion",
      emoji: "↔️",
      plain: "沒有明確方向，在一個區間裡上上下下（ADX 低）。",
      play: "適合「區間操作」：靠近區間低點、RSI 偏冷時分批買，靠近高點、RSI 偏熱時減；真正突破區間才追。",
    };
  } else {
    archetype = {
      tag: "中性／轉折中",
      en: "Neutral / Transition",
      emoji: "⚖️",
      plain: "趨勢不夠強也不算純盤整，可能正在轉變方向。",
      play: "訊號不明時，最好的動作常常是「少動、等更清楚的訊號」。",
    };
  }

  // volatility / position-sizing overlay
  let sizing;
  if (volHigh)
    sizing = "波動很大 → 部位要小、分批進、設停損，不然帳面會大起大落很難抱。";
  else if (volMid)
    sizing = "波動中等 → 正常控管即可，記得設好停損點。";
  else sizing = "波動偏低 → 相對穩，可以抱大一點的部位，但報酬通常也比較慢。";
  archetype.sizing = sizing;

  // ---------- one-line mood ----------
  const dir = momUp ? "偏多" : momDown ? "偏空" : "中性";
  const eff =
    sharpe >= 1.5 ? "效率好" : sharpe >= 1 ? "效率普通" : "效率偏低";
  const mood = `${archetype.emoji} 一句話：這是一檔「${archetype.tag}」，目前方向${dir}、風險報酬${eff}。`;

  // ---------- plain reads of each metric ----------
  const reads = [];

  reads.push({
    k: "賺多少",
    plain:
      m.cagr >= 0.2
        ? `年化報酬 ${fmtPct(m.cagr)}，這段時間賺得很猛。`
        : m.cagr >= 0
        ? `年化報酬 ${fmtPct(m.cagr)}，有賺但不算特別快。`
        : `年化報酬 ${fmtPct(m.cagr)}，這段時間其實是虧的。`,
  });

  reads.push({
    k: "多會晃",
    plain:
      volHigh
        ? `波動率 ${fmtPct(vol)}：一年內上下晃動很劇烈，心臟要夠強。`
        : volMid
        ? `波動率 ${fmtPct(vol)}：中等晃動，還在多數人能接受的範圍。`
        : `波動率 ${fmtPct(vol)}：晃動溫和，相對好抱。`,
  });

  reads.push({
    k: "最慘賠多少",
    plain: `最大回撤 ${fmtPct(mdd)}：歷史上最慘曾從高點往下 ${fmtPct(
      Math.abs(mdd)
    )}。問自己「帳面真的少這麼多，我抱得住嗎？」`,
  });

  reads.push({
    k: "划不划算",
    plain:
      sharpe >= 1.5
        ? `Sharpe ${sharpe.toFixed(2)}：每冒一分風險換到的報酬不錯，算划算。`
        : sharpe >= 1
        ? `Sharpe ${sharpe.toFixed(2)}：風險報酬普通。`
        : `Sharpe ${sharpe.toFixed(2)}：承擔的風險相對沒換到足夠報酬，偏不划算。`,
  });

  if (m.beta != null) {
    reads.push({
      k: "跟大盤比",
      plain:
        m.beta > 1.3
          ? `Beta ${m.beta.toFixed(2)}：大盤漲跌時，它通常更兇（放大版大盤）。`
          : m.beta < 0.7
          ? `Beta ${m.beta.toFixed(2)}：比大盤溫和，大盤大跌時相對抗跌。`
          : `Beta ${m.beta.toFixed(2)}：大致跟著大盤同步。`,
    });
  }

  if (rsi != null) {
    reads.push({
      k: "短線冷熱",
      plain:
        rsi > 70
          ? `RSI ${rsi.toFixed(0)}：短線偏熱（超買），追高容易被回檔修理，等拉回比較安全。`
          : rsi < 30
          ? `RSI ${rsi.toFixed(0)}：短線偏冷（超賣），有機會反彈，但別接還在下墜的刀。`
          : `RSI ${rsi.toFixed(0)}：不冷不熱，沒有明顯的超買超賣訊號。`,
    });
  }

  // ---------- cautions ----------
  const cautions = [];
  if (mdd < -0.3)
    cautions.push("這檔歷史回撤超過 30%——別一次重押，分批 + 停損很重要。");
  if (volHigh) cautions.push("高波動股不適合放大槓桿或借錢買。");
  if (rsi != null && rsi > 75)
    cautions.push("RSI 過熱，短線追高風險高。");
  if (m.alpha != null && m.alpha < 0)
    cautions.push("Alpha 為負：這段時間其實「輸給大盤」，不如直接買指數。");

  return { mood, archetype, reads, cautions };
}
