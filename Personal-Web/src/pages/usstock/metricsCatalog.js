// Catalog of selectable quant metrics ("strategies"). Each item knows how to
// render its live value/colour from the metric pack `m`, plus a beginner
// explanation: what it is ("這是什麼") and how to read it ("怎麼看").
// `cat`, `what`, `how` carry both languages as {en, zh}; components resolve
// them with L() from lang.jsx so the language toggle switches text live.
// The left sidebar checkboxes are built from this; the main area renders a
// card per selected item.

const pct = (v, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);
const num = (v, d = 2) => (v == null ? "—" : v.toFixed(d));
const signed = (v, d = 1) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(d)}%`);
const tRet = (v) => (v == null ? "neutral" : v > 0 ? "good" : "bad");

export const CATALOG = [
  {
    cat: { en: "Return", zh: "報酬 Return" },
    items: [
      {
        id: "cagr",
        name: "CAGR",
        zh: "年化報酬率",
        what: {
          en: "Total return over the whole period, converted to an average % earned per year.",
          zh: "把整段期間的總報酬，換算成「平均每年賺幾 %」。",
        },
        how: {
          en: ">20% is strong, 0–20% average, <0 is losing money. Always compare to your target and the index.",
          zh: ">20% 很猛、0–20% 普通、<0 是虧錢。要跟你的目標報酬和大盤一起比。",
        },
        val: (m) => pct(m.cagr),
        tone: (m) => tRet(m.cagr),
      },
      {
        id: "totalReturn",
        name: "Total Return",
        zh: "期間總報酬",
        what: {
          en: "Total % gain/loss across the whole period (not annualised).",
          zh: "這段期間從頭到尾總共漲跌幾 %（沒有年化）。",
        },
        how: {
          en: "Must read it with the time span: +50% over 5 years ≠ +50% over 1 year.",
          zh: "一定要搭配時間長度看：5 年漲 50% 跟 1 年漲 50% 完全不同。",
        },
        val: (m) => pct(m.totalReturn),
        tone: (m) => tRet(m.totalReturn),
      },
      {
        id: "alpha",
        name: "Alpha",
        zh: "超額報酬 vs SPY",
        what: {
          en: "What this stock earned (or lost) on its own, after stripping out the return the market would give anyway.",
          zh: "扣掉「大盤本來就會給的報酬」之後，這檔自己多賺(或少賺)的部分。",
        },
        how: {
          en: ">0 beats the market, <0 lags it (then you might as well just buy the index).",
          zh: ">0 代表贏大盤、<0 代表輸大盤（那不如直接買指數）。",
        },
        val: (m) => signed(m.alpha),
        tone: (m) => tRet(m.alpha),
      },
    ],
  },
  {
    cat: { en: "Risk", zh: "風險 Risk" },
    items: [
      {
        id: "volatility",
        name: "Volatility",
        zh: "波動率 σ",
        what: {
          en: "How much the returns swing up and down (annualised). Higher = wilder ride, bigger paper swings.",
          zh: "報酬上下擺動的幅度（年化）。越高越刺激、帳面起伏越大。",
        },
        how: {
          en: "<20% mild, 20–40% moderate, >40% violent. The higher the vol, the smaller your position should be.",
          zh: "<20% 溫和、20–40% 中等、>40% 劇烈。波動越高，部位就該越小。",
        },
        val: (m) => pct(m.volatility),
        tone: () => "neutral",
      },
      {
        id: "maxDrawdown",
        name: "Max Drawdown",
        zh: "最大回撤",
        what: {
          en: "The largest peak-to-trough fall in history. Many funds care about this most.",
          zh: "歷史上從最高點跌到最低點的最大幅度。很多基金最在意這個。",
        },
        how: {
          en: "Closer to 0 = steadier. Worse than -30% means you must stomach a near-halving on paper.",
          zh: "越接近 0 越穩。-30% 以上代表你得忍受帳面像腰斬一樣的波動。",
        },
        val: (m) => pct(m.maxDrawdown),
        tone: (m) =>
          m.maxDrawdown == null
            ? "neutral"
            : m.maxDrawdown > -0.1
            ? "great"
            : m.maxDrawdown > -0.2
            ? "good"
            : m.maxDrawdown > -0.35
            ? "ok"
            : "bad",
      },
      {
        id: "beta",
        name: "Beta",
        zh: "與大盤連動",
        what: {
          en: "How much it moves with the market. When the market moves 1%, it moves this much on average.",
          zh: "跟大盤的連動程度。大盤動 1%，它平均跟著動幾 %。",
        },
        how: {
          en: "=1 in sync, >1 wilder than the market, <1 more defensive, <0 moves the opposite way.",
          zh: "=1 同步、>1 比大盤兇、<1 比大盤抗跌、<0 反向走。",
        },
        val: (m) => num(m.beta),
        tone: () => "neutral",
      },
    ],
  },
  {
    cat: { en: "Risk-Adjusted", zh: "風險調整後 Risk-Adjusted" },
    items: [
      {
        id: "sharpe",
        name: "Sharpe",
        zh: "夏普值",
        what: {
          en: "How much excess return you get per unit of risk taken. The most famous 'efficiency' metric.",
          zh: "每承擔一單位風險，換到多少超額報酬。最有名的「效率」指標。",
        },
        how: {
          en: "<1 average, >1.5 good, >2 strong, >3 elite.",
          zh: "<1 普通、>1.5 不錯、>2 很強、>3 神級。",
        },
        val: (m) => num(m.sharpe),
        tone: (m) =>
          m.sharpe >= 2 ? "great" : m.sharpe >= 1.5 ? "good" : m.sharpe >= 1 ? "ok" : "bad",
      },
      {
        id: "sortino",
        name: "Sortino",
        zh: "索提諾",
        what: {
          en: "An upgraded Sharpe — the denominator only counts downside volatility (you don't mind upside swings).",
          zh: "Sharpe 的升級版——分母只算「下跌」的波動（上漲的波動你不討厭）。",
        },
        how: {
          en: "Higher than Sharpe means downside risk is well controlled. Thresholds run a bit above Sharpe's.",
          zh: "比 Sharpe 高，代表下跌風險控制得好。判讀門檻比 Sharpe 略高一點。",
        },
        val: (m) => num(m.sortino),
        tone: (m) =>
          m.sortino >= 2.5 ? "great" : m.sortino >= 1.8 ? "good" : m.sortino >= 1 ? "ok" : "bad",
      },
      {
        id: "calmar",
        name: "Calmar",
        zh: "卡瑪",
        what: {
          en: "Annualised return ÷ max drawdown. A favourite of trend-following / CTA funds.",
          zh: "年化報酬 ÷ 最大回撤。趨勢型 / CTA 基金很愛用。",
        },
        how: {
          en: ">1 very good, 0.5–1 decent, <0.3 weak.",
          zh: ">1 很好、0.5–1 不錯、<0.3 偏弱。",
        },
        val: (m) => num(m.calmar),
        tone: (m) =>
          m.calmar >= 1 ? "great" : m.calmar >= 0.5 ? "good" : m.calmar >= 0.3 ? "ok" : "bad",
      },
    ],
  },
  {
    cat: { en: "Trend", zh: "趨勢 Trend" },
    items: [
      {
        id: "rsi",
        name: "RSI(14)",
        zh: "相對強弱",
        what: {
          en: "Ratio of gains vs losses over the last 14 days (0–100). Reads short-term overheating/overcooling.",
          zh: "近 14 天漲勢 vs 跌勢的比值（0–100）。看短線過熱或過冷。",
        },
        how: {
          en: ">70 overbought (careful chasing), <30 oversold (may bounce), middle is neutral.",
          zh: ">70 超買（小心追高）、<30 超賣（可能反彈）、中間是中性。",
        },
        val: (m) => num(m.rsi, 0),
        tone: (m) => (m.rsi == null ? "neutral" : m.rsi > 70 || m.rsi < 30 ? "warn" : "neutral"),
        gauge: (m) => m.rsi,
      },
      {
        id: "macd",
        name: "MACD",
        zh: "均線差動能",
        what: {
          en: "The gap between fast & slow moving averages — spots trend turns. The histogram shows momentum strength.",
          zh: "快慢均線的差，看趨勢轉折。柱狀圖(histogram)代表動能強弱。",
        },
        how: {
          en: "Bar >0 bullish, <0 bearish; flipping from negative to positive is a turn-up signal.",
          zh: "柱 >0 偏多、<0 偏空；由負翻正常是轉強訊號。",
        },
        val: (m) => (m.macd ? num(m.macd.histogram, 2) : "—"),
        tone: (m) => (m.macd ? (m.macd.histogram >= 0 ? "good" : "bad") : "neutral"),
      },
      {
        id: "adx",
        name: "ADX(14)",
        zh: "趨勢強度",
        what: {
          en: "Measures whether there's a clear trend at all, regardless of up or down direction.",
          zh: "衡量「有沒有明確趨勢」，不管方向往上還往下。",
        },
        how: {
          en: ">25 trending (good for trend-following), <20 ranging (good for range trading).",
          zh: ">25 有趨勢（適合順勢操作）、<20 盤整（適合區間操作）。",
        },
        val: (m) => num(m.adx, 0),
        tone: (m) => (m.adx == null ? "neutral" : m.adx >= 25 ? "good" : m.adx < 20 ? "neutral" : "ok"),
      },
    ],
  },
  {
    cat: { en: "Momentum", zh: "動能 Momentum" },
    items: [
      {
        id: "mom20",
        name: "Momentum 20d",
        zh: "20 日動能",
        what: {
          en: "Return over roughly the last month. Short-term momentum.",
          zh: "最近約一個月的漲跌幅。短期動能。",
        },
        how: {
          en: "Positive = short-term bullish, negative = short-term bearish.",
          zh: "正=短線偏多、負=短線偏空。",
        },
        val: (m) => signed(m.mom20),
        tone: (m) => tRet(m.mom20),
      },
      {
        id: "mom60",
        name: "Momentum 60d",
        zh: "60 日動能",
        what: {
          en: "Return over roughly the last three months. Medium-term momentum.",
          zh: "最近約三個月的漲跌幅。中期動能。",
        },
        how: {
          en: "Read with the 20-day: both positive = healthy trend; mixed = possible turn.",
          zh: "跟 20 日一起看：都正=趨勢健康；一正一負=可能轉折。",
        },
        val: (m) => signed(m.mom60),
        tone: (m) => tRet(m.mom60),
      },
    ],
  },
  {
    cat: { en: "Volatility", zh: "波動 Volatility" },
    items: [
      {
        id: "atr",
        name: "ATR(14)",
        zh: "真實波動範圍",
        what: {
          en: "Average daily up/down range (in dollars). Often used to size stop-loss distance.",
          zh: "每天平均上下波動多少（美元）。常用來抓停損距離。",
        },
        how: {
          en: "Stops are often set 1.5–2× ATR; the bigger the ATR, the wider the stop needs to be.",
          zh: "停損常設 1.5–2 倍 ATR；ATR 越大，停損就要拉越寬。",
        },
        val: (m) => (m.atr == null ? "—" : `$${num(m.atr)}`),
        sub: (m) => (m.atrPct == null ? "" : `${pct(m.atrPct)} / day`),
        tone: () => "neutral",
      },
      {
        id: "bollPctB",
        name: "Bollinger %B",
        zh: "布林通道位置",
        what: {
          en: "Where price sits inside the Bollinger band (mid ±2σ): 0 = on the lower band, 1 = on the upper.",
          zh: "現價在布林通道(中軌 ±2σ)的相對位置：0=貼下軌、1=貼上軌。",
        },
        how: {
          en: ">1 broke above (strong but maybe overheated), <0 broke below (weak but maybe oversold), 0.5 mid.",
          zh: ">1 衝出上軌(強但可能過熱)、<0 跌破下軌(弱但可能超賣)、0.5 在中間。",
        },
        val: (m) => (m.bollinger ? num(m.bollinger.pctB, 2) : "—"),
        tone: (m) =>
          !m.bollinger ? "neutral" : m.bollinger.pctB > 1 || m.bollinger.pctB < 0 ? "warn" : "neutral",
      },
    ],
  },
  {
    cat: { en: "Advanced", zh: "進階 Advanced" },
    items: [
      {
        id: "composite",
        name: "Composite Score",
        zh: "綜合評分",
        what: {
          en: "Blends trend, momentum, risk-reward, RSI health and drawdown into one 0–100 'overall fitness' score.",
          zh: "把趨勢、動能、風險報酬、RSI 健康度、回撤合成一個 0–100 的「整體體質分」。",
        },
        how: {
          en: ">75 very strong, 50–75 average, <40 weak. One number to judge a stock fast.",
          zh: ">75 體質很強、50–75 中等、<40 偏弱。一個數字快速判斷這檔好不好。",
        },
        val: (m) => num(m.composite, 0),
        tone: (m) =>
          m.composite == null ? "neutral" : m.composite >= 75 ? "great" : m.composite >= 55 ? "good" : m.composite >= 40 ? "ok" : "bad",
      },
      {
        id: "zscore",
        name: "Z-Score (60d)",
        zh: "價格 Z 分數",
        what: {
          en: "How many standard deviations the price is from its own 60-day mean. Gauges how 'overdone' a move is.",
          zh: "現價離自己 60 日均價幾個標準差。衡量「漲/跌過頭」的程度。",
        },
        how: {
          en: ">+2 risen too far (watch for a pullback), <−2 fallen too deep (possible oversold bounce), −1~+1 normal. Mean-reversion watches this.",
          zh: ">+2 漲太多(留意回檔)、<−2 跌太深(可能超賣反彈)、−1~+1 正常。均值回歸常看這個。",
        },
        val: (m) => num(m.zscore60, 2),
        tone: (m) =>
          m.zscore60 == null ? "neutral" : Math.abs(m.zscore60) > 2 ? "warn" : "neutral",
      },
      {
        id: "relStrength",
        name: "Relative Strength",
        zh: "相對強度 vs SPY",
        what: {
          en: "How much the last-60-day return beats the market. Positive RS = stronger than the market, negative = weaker.",
          zh: "近 60 日的報酬「贏大盤多少」。RS 正=比大盤強、負=比大盤弱。",
        },
        how: {
          en: ">0 a leader (money prefers it), <0 a laggard. Institutions love picking high-RS names.",
          zh: ">0 強勢股(資金偏好)、<0 弱勢股。法人選股最愛挑 RS 高的。",
        },
        val: (m) => (m.relStrength == null ? "—" : signed(m.relStrength)),
        tone: (m) => (m.relStrength == null ? "neutral" : m.relStrength > 0 ? "good" : "bad"),
      },
    ],
  },
];

// flat id -> item lookup
export const CATALOG_BY_ID = {};
CATALOG.forEach((g) => g.items.forEach((it) => (CATALOG_BY_ID[it.id] = { ...it, cat: g.cat })));

// sensible starter set (mirrors the "你現在就能用的 dashboard" list)
export const DEFAULT_SELECTED = [
  "composite",
  "relStrength",
  "zscore",
  "cagr",
  "alpha",
  "maxDrawdown",
  "beta",
  "sharpe",
  "calmar",
  "rsi",
  "adx",
  "mom20",
  "mom60",
  "atr",
];
