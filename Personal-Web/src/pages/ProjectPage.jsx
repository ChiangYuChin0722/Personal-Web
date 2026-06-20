import React, { useState } from "react";
import "./ProjectPage.css";

const CATS = ["All", "AI / Data", "Web", "Mobile", "Quant / Finance", "Media / Writing"];

// Edit these freely — fill in real links / metrics where you have them.
const PROJECTS = [
  {
    name: "Quant Dashboard",
    cat: "Quant / Finance",
    year: "2026",
    oneLiner: "A mini TradingView + factor-scoring quant system for US equities.",
    tech: ["React", "Vite", "lightweight-charts", "Twelve Data API", "Firebase"],
    role: "Solo — product, engineering, quant logic",
    problem: "散戶看得到一堆指標，卻不知道怎麼把它們組合成可以被驗證的策略。",
    solution:
      "把市場狀態分類器、流派買賣規則、16 因子評分、回測（Sharpe / MDD / Kelly）、相關性熱圖與股票篩選器整合成純瀏覽器端系統，免後端。",
    impact: "從「看指標」變成「假設 → 因子 → 打分 → 回測 → 風控」的完整流程；Google 登入可雲端儲存策略。",
    links: { demo: "/USstock" },
  },
  {
    name: "Supply-chain Investment Analysis",
    cat: "Quant / Finance",
    year: "2025",
    oneLiner: "用「供應鏈卡點」視角找被市場低估的投資標的。",
    tech: ["Research", "Python", "Data analysis"],
    role: "Researcher / Analyst",
    problem: "熱門題材人人都看得到，真正的瓶頸與議價力卻藏在產業鏈深處。",
    solution: "系統化拆解 AI / 半導體價值鏈，標出卡點環節、驗證證據鏈、建立研究優先序。",
    impact: "把模糊的「我覺得會漲」變成有證據、可排序、可被挑戰的研究流程。",
    links: {},
  },
  {
    name: "Personal Web Platform",
    cat: "Web",
    year: "2025",
    oneLiner: "chianghebe.com — 一個多儀表板的個人網站平台。",
    tech: ["React 19", "Vite", "Path routing", "GitHub Pages"],
    role: "Solo — design + engineering",
    problem: "想把多個獨立作品（dashboard、量化系統、好友系統…）放在同一個自有網域下。",
    solution: "用 React + Vite 單頁應用 + 路徑路由，建成可擴充的多頁平台，部署到 GitHub Pages + 自訂網域。",
    impact: "一個網域承載多個產品，新作品只要加一條路由就上線。",
    links: { demo: "/" },
  },
  {
    name: "KidsDay — React Native App",
    cat: "Mobile",
    year: "2025",
    oneLiner: "把兒童活動 App 遷移／重構到 React Native + Expo。",
    tech: ["React Native", "Expo", "Firebase", "OAuth"],
    role: "Mobile developer",
    problem: "舊版 App 維護困難、跨平台體驗不一致。",
    solution: "以 Expo 重建，整合 Google / Apple 登入、雲端資料與通知，統一 iOS / Android 體驗。",
    impact: "更好維護的單一程式碼庫，可在模擬器一鍵預覽（demo 模式免 OAuth）。",
    links: {},
  },
  {
    name: "Fashion AI App",
    cat: "AI / Data",
    year: "2024",
    oneLiner: "用 AI 做穿搭 / 時尚推薦的產品概念。",
    tech: ["Computer Vision", "Recommendation", "Python"],
    role: "Concept + prototype",
    problem: "穿搭建議高度個人化，難以規模化。",
    solution: "結合影像理解與推薦邏輯，把「風格」變成可計算、可推薦的特徵。",
    impact: "一個把主觀美感轉成資料問題的產品雛形。",
    links: {},
  },
  {
    name: "UNet Image Segmentation Lab",
    cat: "AI / Data",
    year: "2024",
    oneLiner: "用 UNet 做影像語意分割的研究實驗。",
    tech: ["Python", "PyTorch", "UNet", "CNN"],
    role: "ML researcher",
    problem: "要把影像中每個像素分類到正確的區域（醫療 / 視覺任務常見）。",
    solution: "實作並訓練 UNet 編碼-解碼架構，調整資料增強與損失函數提升 IoU。",
    impact: "掌握分割模型從資料、訓練到評估的完整流程。",
    links: {},
  },
  {
    name: "DQN Reinforcement Learning Lab",
    cat: "AI / Data",
    year: "2024",
    oneLiner: "用 Deep Q-Network 訓練 agent 自己學會決策。",
    tech: ["Python", "PyTorch", "OpenAI Gym", "DQN"],
    role: "ML researcher",
    problem: "在沒有標準答案的環境裡，agent 要靠獎勵自己學會最佳策略。",
    solution: "實作 DQN（experience replay、target network），在 Gym 環境訓練並調參。",
    impact: "理解強化學習的核心：探索 vs 利用、獎勵設計、收斂穩定性。",
    links: {},
  },
  {
    name: "IELTS / Writing System",
    cat: "Media / Writing",
    year: "2023",
    oneLiner: "輔助英文寫作與批改的系統。",
    tech: ["NLP", "Writing", "Automation"],
    role: "Builder",
    problem: "寫作練習缺乏即時、結構化的回饋。",
    solution: "建立可重複使用的寫作框架與檢查流程，把「怎麼寫得更好」變成可操作的步驟。",
    impact: "把模糊的寫作建議變成可執行、可衡量的系統。",
    links: {},
  },
  {
    name: "Media Production Project",
    cat: "Media / Writing",
    year: "2023",
    oneLiner: "新聞 / 影音專題製作。",
    tech: ["Video", "Editing", "Storytelling"],
    role: "Producer / Creator",
    problem: "複雜的資訊要變成大眾看得懂、看得下去的內容。",
    solution: "從企劃、拍攝到剪輯，把資料與故事結合成有節奏的影音敘事。",
    impact: "跨出純技術，培養把「複雜變清楚」的內容力。",
    links: {},
  },
];

// timeline order (earliest → latest)
const TIMELINE = [
  "IELTS / Writing System",
  "Media Production Project",
  "UNet Image Segmentation Lab",
  "DQN Reinforcement Learning Lab",
  "Fashion AI App",
  "KidsDay — React Native App",
  "Supply-chain Investment Analysis",
  "Quant Dashboard",
];

function ProjectCard({ p }) {
  return (
    <div className="pj-card">
      <div className="pj-card-top">
        <span className="pj-card-cat">{p.cat}</span>
        <span className="pj-card-year">{p.year}</span>
      </div>
      <h3 className="pj-card-name">{p.name}</h3>
      <p className="pj-card-one">{p.oneLiner}</p>

      <div className="pj-tech">
        {p.tech.map((t) => (
          <span key={t} className="pj-chip">{t}</span>
        ))}
      </div>

      <div className="pj-role"><span>Role</span>{p.role}</div>

      <div className="pj-psi">
        <div><b className="psi-p">Problem</b>{p.problem}</div>
        <div><b className="psi-s">Solution</b>{p.solution}</div>
        <div><b className="psi-i">Impact</b>{p.impact}</div>
      </div>

      {(p.links.demo || p.links.github || p.links.report) && (
        <div className="pj-links">
          {p.links.demo && <a href={p.links.demo} className="pj-btn primary">Demo →</a>}
          {p.links.github && <a href={p.links.github} className="pj-btn" target="_blank" rel="noreferrer">GitHub</a>}
          {p.links.report && <a href={p.links.report} className="pj-btn" target="_blank" rel="noreferrer">Report</a>}
        </div>
      )}
    </div>
  );
}

export default function ProjectPage() {
  const [cat, setCat] = useState("All");
  const shown = cat === "All" ? PROJECTS : PROJECTS.filter((p) => p.cat === cat);
  const byName = Object.fromEntries(PROJECTS.map((p) => [p.name, p]));

  return (
    <div className="pj">
      <div className="pj-bg" />
      <div className="pj-wrap">
        <a href="/" className="pj-home">← chianghebe.com</a>

        {/* Hero */}
        <header className="pj-hero">
          <h1>
            Projects I've Built Across <span className="grad">Data, AI, Web, Mobile, and Finance</span>
          </h1>
          <p className="pj-sub">
            從資料分析、AI 模型、React Native App、量化交易策略，到新聞與影音專題，我的作品都圍繞一件事：
            <b> 把複雜問題變成可以被使用、被理解、被驗證的系統。</b>
          </p>
        </header>

        {/* Filter */}
        <div className="pj-filter">
          {CATS.map((c) => (
            <button key={c} className={c === cat ? "active" : ""} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* Featured cards */}
        <div className="pj-grid">
          {shown.map((p) => (
            <ProjectCard key={p.name} p={p} />
          ))}
        </div>

        {/* Timeline */}
        <h2 className="pj-tl-title">Timeline</h2>
        <p className="pj-tl-sub">不是只做一個領域 —— 是跨領域解問題。</p>
        <div className="pj-timeline">
          {TIMELINE.map((name) => {
            const p = byName[name];
            return (
              <div key={name} className="pj-tl-item">
                <span className="pj-tl-dot" />
                <div className="pj-tl-body">
                  <div className="pj-tl-head">
                    <span className="pj-tl-name">{name}</span>
                    <span className="pj-tl-cat">{p?.cat}</span>
                    <span className="pj-tl-year">{p?.year}</span>
                  </div>
                  <div className="pj-tl-one">{p?.oneLiner}</div>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="pj-foot">© {new Date().getFullYear()} YuChin Chiang · chianghebe.com</footer>
      </div>
    </div>
  );
}
