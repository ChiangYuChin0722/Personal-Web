// Catalog of selectable quant metrics ("strategies"). Each item knows how to
// render its live value/colour from the metric pack `m`, plus a beginner
// explanation: what it is ("這是什麼") and how to read it ("怎麼看").
// The left sidebar checkboxes are built from this; the main area renders a
// card per selected item.

const pct = (v, d = 1) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);
const num = (v, d = 2) => (v == null ? "—" : v.toFixed(d));
const signed = (v, d = 1) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(d)}%`);
const tRet = (v) => (v == null ? "neutral" : v > 0 ? "good" : "bad");

export const CATALOG = [
  {
    cat: "報酬 Return",
    items: [
      {
        id: "cagr",
        name: "CAGR",
        zh: "年化報酬率",
        what: "把整段期間的總報酬，換算成「平均每年賺幾 %」。",
        how: ">20% 很猛、0–20% 普通、<0 是虧錢。要跟你的目標報酬和大盤一起比。",
        val: (m) => pct(m.cagr),
        tone: (m) => tRet(m.cagr),
      },
      {
        id: "totalReturn",
        name: "Total Return",
        zh: "期間總報酬",
        what: "這段期間從頭到尾總共漲跌幾 %（沒有年化）。",
        how: "一定要搭配時間長度看：5 年漲 50% 跟 1 年漲 50% 完全不同。",
        val: (m) => pct(m.totalReturn),
        tone: (m) => tRet(m.totalReturn),
      },
      {
        id: "alpha",
        name: "Alpha",
        zh: "超額報酬 vs SPY",
        what: "扣掉「大盤本來就會給的報酬」之後，這檔自己多賺(或少賺)的部分。",
        how: ">0 代表贏大盤、<0 代表輸大盤（那不如直接買指數）。",
        val: (m) => signed(m.alpha),
        tone: (m) => tRet(m.alpha),
      },
    ],
  },
  {
    cat: "風險 Risk",
    items: [
      {
        id: "volatility",
        name: "Volatility",
        zh: "波動率 σ",
        what: "報酬上下擺動的幅度（年化）。越高越刺激、帳面起伏越大。",
        how: "<20% 溫和、20–40% 中等、>40% 劇烈。波動越高，部位就該越小。",
        val: (m) => pct(m.volatility),
        tone: () => "neutral",
      },
      {
        id: "maxDrawdown",
        name: "Max Drawdown",
        zh: "最大回撤",
        what: "歷史上從最高點跌到最低點的最大幅度。很多基金最在意這個。",
        how: "越接近 0 越穩。-30% 以上代表你得忍受帳面像腰斬一樣的波動。",
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
        what: "跟大盤的連動程度。大盤動 1%，它平均跟著動幾 %。",
        how: "=1 同步、>1 比大盤兇、<1 比大盤抗跌、<0 反向走。",
        val: (m) => num(m.beta),
        tone: () => "neutral",
      },
    ],
  },
  {
    cat: "風險調整後 Risk-Adjusted",
    items: [
      {
        id: "sharpe",
        name: "Sharpe",
        zh: "夏普值",
        what: "每承擔一單位風險，換到多少超額報酬。最有名的「效率」指標。",
        how: "<1 普通、>1.5 不錯、>2 很強、>3 神級。",
        val: (m) => num(m.sharpe),
        tone: (m) =>
          m.sharpe >= 2 ? "great" : m.sharpe >= 1.5 ? "good" : m.sharpe >= 1 ? "ok" : "bad",
      },
      {
        id: "sortino",
        name: "Sortino",
        zh: "索提諾",
        what: "Sharpe 的升級版——分母只算「下跌」的波動（上漲的波動你不討厭）。",
        how: "比 Sharpe 高，代表下跌風險控制得好。判讀門檻比 Sharpe 略高一點。",
        val: (m) => num(m.sortino),
        tone: (m) =>
          m.sortino >= 2.5 ? "great" : m.sortino >= 1.8 ? "good" : m.sortino >= 1 ? "ok" : "bad",
      },
      {
        id: "calmar",
        name: "Calmar",
        zh: "卡瑪",
        what: "年化報酬 ÷ 最大回撤。趨勢型 / CTA 基金很愛用。",
        how: ">1 很好、0.5–1 不錯、<0.3 偏弱。",
        val: (m) => num(m.calmar),
        tone: (m) =>
          m.calmar >= 1 ? "great" : m.calmar >= 0.5 ? "good" : m.calmar >= 0.3 ? "ok" : "bad",
      },
    ],
  },
  {
    cat: "趨勢 Trend",
    items: [
      {
        id: "rsi",
        name: "RSI(14)",
        zh: "相對強弱",
        what: "近 14 天漲勢 vs 跌勢的比值（0–100）。看短線過熱或過冷。",
        how: ">70 超買（小心追高）、<30 超賣（可能反彈）、中間是中性。",
        val: (m) => num(m.rsi, 0),
        tone: (m) => (m.rsi == null ? "neutral" : m.rsi > 70 || m.rsi < 30 ? "warn" : "neutral"),
        gauge: (m) => m.rsi,
      },
      {
        id: "macd",
        name: "MACD",
        zh: "均線差動能",
        what: "快慢均線的差，看趨勢轉折。柱狀圖(histogram)代表動能強弱。",
        how: "柱 >0 偏多、<0 偏空；由負翻正常是轉強訊號。",
        val: (m) => (m.macd ? num(m.macd.histogram, 2) : "—"),
        tone: (m) => (m.macd ? (m.macd.histogram >= 0 ? "good" : "bad") : "neutral"),
      },
      {
        id: "adx",
        name: "ADX(14)",
        zh: "趨勢強度",
        what: "衡量「有沒有明確趨勢」，不管方向往上還往下。",
        how: ">25 有趨勢（適合順勢操作）、<20 盤整（適合區間操作）。",
        val: (m) => num(m.adx, 0),
        tone: (m) => (m.adx == null ? "neutral" : m.adx >= 25 ? "good" : m.adx < 20 ? "neutral" : "ok"),
      },
    ],
  },
  {
    cat: "動能 Momentum",
    items: [
      {
        id: "mom20",
        name: "Momentum 20d",
        zh: "20 日動能",
        what: "最近約一個月的漲跌幅。短期動能。",
        how: "正=短線偏多、負=短線偏空。",
        val: (m) => signed(m.mom20),
        tone: (m) => tRet(m.mom20),
      },
      {
        id: "mom60",
        name: "Momentum 60d",
        zh: "60 日動能",
        what: "最近約三個月的漲跌幅。中期動能。",
        how: "跟 20 日一起看：都正=趨勢健康；一正一負=可能轉折。",
        val: (m) => signed(m.mom60),
        tone: (m) => tRet(m.mom60),
      },
    ],
  },
  {
    cat: "波動 Volatility",
    items: [
      {
        id: "atr",
        name: "ATR(14)",
        zh: "真實波動範圍",
        what: "每天平均上下波動多少（美元）。常用來抓停損距離。",
        how: "停損常設 1.5–2 倍 ATR；ATR 越大，停損就要拉越寬。",
        val: (m) => (m.atr == null ? "—" : `$${num(m.atr)}`),
        sub: (m) => (m.atrPct == null ? "" : `${pct(m.atrPct)} / day`),
        tone: () => "neutral",
      },
      {
        id: "bollPctB",
        name: "Bollinger %B",
        zh: "布林通道位置",
        what: "現價在布林通道(中軌 ±2σ)的相對位置：0=貼下軌、1=貼上軌。",
        how: ">1 衝出上軌(強但可能過熱)、<0 跌破下軌(弱但可能超賣)、0.5 在中間。",
        val: (m) => (m.bollinger ? num(m.bollinger.pctB, 2) : "—"),
        tone: (m) =>
          !m.bollinger ? "neutral" : m.bollinger.pctB > 1 || m.bollinger.pctB < 0 ? "warn" : "neutral",
      },
    ],
  },
  {
    cat: "進階 Advanced",
    items: [
      {
        id: "composite",
        name: "Composite Score",
        zh: "綜合評分",
        what: "把趨勢、動能、風險報酬、RSI 健康度、回撤合成一個 0–100 的「整體體質分」。",
        how: ">75 體質很強、50–75 中等、<40 偏弱。一個數字快速判斷這檔好不好。",
        val: (m) => num(m.composite, 0),
        tone: (m) =>
          m.composite == null ? "neutral" : m.composite >= 75 ? "great" : m.composite >= 55 ? "good" : m.composite >= 40 ? "ok" : "bad",
      },
      {
        id: "zscore",
        name: "Z-Score (60d)",
        zh: "價格 Z 分數",
        what: "現價離自己 60 日均價幾個標準差。衡量「漲/跌過頭」的程度。",
        how: ">+2 漲太多(留意回檔)、<−2 跌太深(可能超賣反彈)、−1~+1 正常。均值回歸常看這個。",
        val: (m) => num(m.zscore60, 2),
        tone: (m) =>
          m.zscore60 == null ? "neutral" : Math.abs(m.zscore60) > 2 ? "warn" : "neutral",
      },
      {
        id: "relStrength",
        name: "Relative Strength",
        zh: "相對強度 vs SPY",
        what: "近 60 日的報酬「贏大盤多少」。RS 正=比大盤強、負=比大盤弱。",
        how: ">0 強勢股(資金偏好)、<0 弱勢股。法人選股最愛挑 RS 高的。",
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
