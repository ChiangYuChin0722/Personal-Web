import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "./ChiangversePage.css";

function hex(n) {
  return "#" + n.toString(16).padStart(6, "0");
}

// Real-life surface colours per planet type (木星米黃 / 火星鏽紅 / 地球藍 / 熔岩暗 / 月球灰…)
const STYLE_COLOR = { gas: 0xd9b48a, ice: 0xbfe0ec, rocky: 0xb07050, swirl: 0xe6d6a0, lava: 0x3a160c, ocean: 0x2f6fb5, desert: 0xcb9a5c, crater: 0x9a9aa6, neptune: 0x2a52be, toxic: 0xaecb4a, forest: 0x2f7a4a, metallic: 0x9aa3b0, storm: 0x57617e };
function blend(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (((ar + (br - ar) * t) | 0) << 16) | (((ag + (bg - ag) * t) | 0) << 8) | ((ab + (bb - ab) * t) | 0);
}

// Shade variation of a base colour that PRESERVES the hue — so every planet in a
// system shares one colour tone, just lighter/darker. t>0 = toward white, t<0 = darker.
function varyColor(base, i) {
  const t = [0.0, 0.26, -0.18, 0.42, -0.08, 0.14][i % 6];
  let r = (base >> 16) & 255, g = (base >> 8) & 255, b = base & 255;
  if (t >= 0) { r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
  else { const f = 1 + t; r *= f; g *= f; b *= f; }
  return ((r | 0) << 16) | ((g | 0) << 8) | (b | 0);
}

// ── Five systems. Each is its own little solar system: a star + orbiting planets. ──
const SYSTEMS = [
  {
    key: "work", name: "作品 · Projects", color: 0x7b61ff, center: [0, 2, -40], r0: 6, dr: 3.2,
    planets: [
      { name: "AI", color: 0x7b61ff, kind: "project", style: "swirl", tagline: "電腦視覺 · 深度學習 · 強化學習", tags: ["PyTorch", "Computer Vision", "Deep Learning", "RL"], projects: [
        { name: "UNet Pet Segmentation", desc: "用 UNet 編碼-解碼架構做影像語意分割，調資料增強與損失函數提升 IoU。", tech: ["Python", "PyTorch", "UNet"], role: "ML researcher", impact: "掌握分割從資料、訓練到評估的完整流程。", links: {} },
        { name: "DQN Reinforcement Learning", desc: "用 Deep Q-Network 在 Gym 環境訓練 agent 自己學會決策。", tech: ["Python", "PyTorch", "DQN"], role: "ML researcher", impact: "理解探索 vs 利用、獎勵設計、收斂穩定性。", links: {} },
        { name: "Fashion AI App", desc: "結合影像理解與推薦邏輯，把「風格」變成可計算的特徵。", tech: ["Computer Vision", "Recommendation"], role: "Concept + prototype", impact: "把主觀美感轉成資料問題的雛形。", links: {} },
      ] },
      { name: "Quant", color: 0xffd166, kind: "project", style: "gas", ring: true, tagline: "量化交易 · 因子研究 · 風控", tags: ["Quant", "Trading", "Finance", "Research"], projects: [
        { name: "NASDAQ Quant Strategy Dashboard", desc: "市場狀態分類 + 流派買賣規則 + 16 因子評分 + 回測（Sharpe/MDD/Kelly），純前端免後端。", tech: ["React", "Vite", "lightweight-charts", "Twelve Data"], role: "Solo — 產品 + 工程 + 量化", impact: "從「看指標」變成完整研究流程。", links: { demo: "/USstock" } },
        { name: "Supply-chain Investment Framework", desc: "用「供應鏈卡點」視角拆解 AI / 半導體價值鏈，標出卡點、驗證證據鏈、建立研究優先序。", tech: ["Research", "Python"], role: "Researcher / Analyst", impact: "把「我覺得會漲」變成有證據、可排序的流程。", links: {} },
      ] },
      { name: "Web", color: 0x00d4ff, kind: "project", style: "ocean", tagline: "前端工程 · 儀表板 · UI/UX", tags: ["React", "Vite", "Vue", "UI/UX"], projects: [
        { name: "The Chiangverse / Portfolio", desc: "chianghebe.com — React + Vite 單頁應用 + 路徑路由，部署到 GitHub Pages + 自訂網域。", tech: ["React 19", "Vite", "three.js"], role: "Solo — 設計 + 工程", impact: "新作品加一條路由就上線。", links: { demo: "/cv" } },
        { name: "Quant Dashboard Frontend", desc: "瀏覽器端的因子評分量化系統（迷你 TradingView）。", tech: ["React", "lightweight-charts", "Firebase"], role: "Frontend", impact: "純前端、可雲端儲存策略。", links: { demo: "/USstock" } },
      ] },
      { name: "Mobile", color: 0x46e8a0, kind: "project", style: "crater", tagline: "跨平台 App · 推播 · 雲端", tags: ["React Native", "Expo", "Firebase"], projects: [
        { name: "KidsDay React Native Migration", desc: "把兒童活動 App 以 Expo 重建，整合 Google / Apple 登入、雲端資料與推播。", tech: ["React Native", "Expo", "Firebase"], role: "Mobile developer", impact: "更好維護的單一程式碼庫。", links: {} },
        { name: "Notification & Album Upload", desc: "推播通知系統與相簿上傳流程，串接雲端儲存與即時同步。", tech: ["React Native", "Firebase"], role: "Mobile developer", impact: "把零散功能整合成順暢流程。", links: {} },
      ] },
      { name: "Media", color: 0xff6ec7, kind: "project", style: "lava", tagline: "敘事 · 影音製作 · 新聞", tags: ["Storytelling", "Video", "Research"], projects: [
        { name: "AI Fashion Education Video", desc: "把 AI 與時尚教育結合，用影音把複雜概念講清楚。", tech: ["Video", "Storytelling"], role: "Producer / Creator", impact: "把「複雜變清楚」的內容力。", links: {} },
        { name: "K-pop Sustainability · Journalism", desc: "新聞 / 影音專題：從企劃、拍攝到剪輯，把資料與故事結合成有節奏的敘事。", tech: ["Video", "Editing"], role: "Producer / Creator", impact: "培養內容敘事力。", links: {} },
      ] },
    ],
  },
  {
    key: "edu", name: "學歷 · Education", color: 0x5bc8ff, center: [-46, 16, 16], r0: 5, dr: 3,
    planets: [
      { name: "University of Warwick", kind: "edu", sub: "MSc Data Analytics · 英國", period: "2025 – 2027", extra: "預期優等 Distinction", bullets: ["機器學習演算法與實務、資料分析基礎", "自然語言處理、高效能運算、進階電腦安全", "演算法賽局理論、研究方法"] },
      { name: "Chang Gung University", kind: "edu", sub: "資訊管理（雙主修：資訊工程）· 台灣", period: "2021 – 2025", extra: "GPA 3.8 / 4.0", bullets: [] },
    ],
  },
  {
    key: "exp", name: "經歷 · Experience", color: 0xffc04d, center: [48, -14, 18], r0: 5, dr: 2.4,
    planets: [
      { name: "網銀國際 Wanin", kind: "exp", sub: "遊戲數據分析師 & 網頁開發 · 台灣", period: "2024 – 2025", bullets: ["分析 50,000+ 事件以驗證 RNG 公平性並偵測異常", "改善獎勵演算法，公平性感知提升 15%", "以 Python 和 Excel 提供平衡建議"] },
      { name: "Kidsday Xgree", kind: "exp", sub: "數據分析師（軟體部門）· 台灣", period: "2023 – 2025", bullets: ["以 Python 建立分析工具追蹤留存、健康指標與產品表現", "建立儀表板與自動化報表供利害關係人使用", "跨部門協作推動數據導向的產品決策"] },
      { name: "長庚大學 · 學生滿意度研究", kind: "exp", sub: "數據分析師 · 台灣", period: "2023 – 2024", bullets: ["分析大規模學生問卷，找出滿意度與留存驅動因素", "建立儀表板與統計摘要支持機構決策", "向學術與行政團隊提供數據支持的建議"] },
      { name: "長庚大學 · 量化交易", kind: "exp", sub: "量化交易研究助理 · 台灣", period: "2022 – 2023", bullets: ["以 Python 分析資產報酬與策略行為", "建立回測流程並評估模擬投組的風險回報", "向學術督導呈現研究結果輔助模型開發"] },
      { name: "KBI Food Machinery", kind: "exp", sub: "軟體工程師 · 台中，台灣", period: "2021 – 2023", bullets: ["導入大數據處理技術，優化網站效能、安全性與即時分析"] },
    ],
  },
  {
    key: "cert", name: "證照 · Certificates", color: 0x8ae65c, center: [6, 24, 46], r0: 5, dr: 2.1,
    planets: [
      { name: "IBM Data Science", kind: "cert", sub: "資料分析 & 機器學習基礎" },
      { name: "DeepLearning.AI ML", kind: "cert", sub: "監督式學習、決策樹、神經網路" },
      { name: "IELTS Academic", kind: "cert", sub: "總分 7.5" },
      { name: "Google Data Analytics", kind: "cert", sub: "資料清理、視覺化、SQL、Tableau" },
      { name: "Duolingo English Test", kind: "cert", sub: "英語語言能力認證" },
      { name: "AWS Cloud Practitioner", kind: "cert", sub: "進行中 · 預計 2026 / 04" },
      { name: "CFA Level I Candidate", kind: "cert", sub: "進行中 · 預計 2026 / 08" },
    ],
  },
  {
    key: "contact", name: "聯絡 · Contact", color: 0xff73b5, center: [-28, -20, 42], r0: 5, dr: 2.4,
    planets: [
      { name: "Email", kind: "contact", sub: "hebe4090409@gmail.com", link: "mailto:hebe4090409@gmail.com" },
      { name: "LinkedIn", kind: "contact", sub: "江昱瑾", link: "https://www.linkedin.com/in/%E6%98%B1%E7%91%BE-%E6%B1%9F-3a5720222/" },
      { name: "GitHub", kind: "contact", sub: "ChiangYuChin0722", link: "https://github.com/ChiangYuChin0722" },
      { name: "LeetCode", kind: "contact", sub: "ChiangYuChin", link: "https://leetcode.com/u/ChiangYuChin/" },
      { name: "Instagram", kind: "contact", sub: "@chiang_hebe", link: "https://www.instagram.com/chiang_hebe/" },
    ],
  },
];

const STYLES = ["rocky", "gas", "ice", "swirl", "desert", "crater", "ocean", "lava", "neptune", "toxic", "forest", "metallic", "storm"];
const PLANETS = [];
let _styleCursor = 0; // global cursor so all 13 styles get used across the (small) systems
SYSTEMS.forEach((s) => {
  s.planets.forEach((p, i) => {
    const style = p.style || STYLES[_styleCursor++ % STYLES.length]; // cycle through every type
    PLANETS.push({
      ...p,
      color: varyColor(s.color, i), // one tone per system (incl. 作品) — shades, not different hues
      systemKey: s.key, systemName: s.name, systemColor: s.color,
      style,
      ring: p.ring || (style === "gas"), // gas worlds also get a ring
      size: p.kind === "project" ? 1.9 : 1.4,
      center: s.center,
      localRadius: s.r0 + i * s.dr,
      baseAngle: i * 2.39996,
      localY: (i % 2 ? 1 : -1) * 1.1,
      orbitSpeed: (s.key === "work" ? 0.06 : 0.12) * (1 - i * 0.04),
    });
  });
});

export default function ChiangversePage() {
  const mountRef = useRef(null);
  const nearRef = useRef(-1);
  const [near, setNear] = useState(-1);
  const [openIdx, setOpenIdx] = useState(-1);
  const [visited, setVisited] = useState(() => new Set());
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [err, setErr] = useState(null);

  const enter = useCallback(() => {
    const i = nearRef.current;
    if (i < 0) return;
    setOpenIdx(i);
    setVisited((prev) => new Set(prev).add(i));
    mountRef.current?._audio?.blip();
  }, []);
  const enterRef = useRef(enter);
  useEffect(() => { enterRef.current = enter; }, [enter]);

  const begin = useCallback(() => {
    setStarted(true); startedRef.current = true;
    mountRef.current?._audio?.init();
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let W = mount.clientWidth, H = mount.clientHeight;
    const noBloom = new URLSearchParams(window.location.search).has("nobloom"); // ?nobloom = skip postprocessing

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap DPR — bloom is costly at huge buffers
    renderer.setSize(W, H);
    // Recover gracefully if the GPU drops the WebGL context (prevents a permanent black screen)
    renderer.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Soft vertical gradient sky (cleaner, brighter — Bruno-ish) instead of flat black
    const bgTex = (() => {
      const c = document.createElement("canvas"); c.width = 4; c.height = 256;
      const ctx = c.getContext("2d"); const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "#0a0f24"); g.addColorStop(0.5, "#0d1230"); g.addColorStop(1, "#171540");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    scene.background = bgTex;
    scene.fog = new THREE.FogExp2(0x0c1030, 0.0026);
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);

    // Bright enough to SEE the whole surface + a strong angled key light so the bumps/relief
    // actually show (micro-shadows) and planets read as 3D — not flat, not too dark.
    scene.add(new THREE.AmbientLight(0x6b7aa6, 0.5));
    scene.add(new THREE.HemisphereLight(0x8b9bcf, 0x161228, 0.4));
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.5);
    keyLight.position.set(40, 48, 22); scene.add(keyLight);

    // ── Bloom composer ──
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.5, 0.92)); // softer, higher threshold = less blown-out cores
    composer.addPass(new OutputPass());

    // ── helpers ──
    const glowTex = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const glow = (color, size) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      s.scale.set(size, size, 1); return s;
    };
    const makeLabel = (text, color, scale) => {
      const fontPx = 64, padX = 30, h = 140;
      const meas = document.createElement("canvas").getContext("2d");
      meas.font = `600 ${fontPx}px sans-serif`;
      const w = Math.ceil(meas.measureText(text).width) + padX * 2; // size canvas to the text → no clipping
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.font = `600 ${fontPx}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.85)"; ctx.shadowBlur = 10; // readable over bright planets
      ctx.fillStyle = "#ffffff"; ctx.fillText(text, w / 2, h / 2);
      ctx.shadowBlur = 0; ctx.fillStyle = hex(color); ctx.globalAlpha = 0.9; ctx.fillText(text, w / 2, h / 2); ctx.globalAlpha = 1;
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      const worldH = 2.1 * scale;
      s.scale.set(worldH * (w / h), worldH, 1); return s; // keep aspect → no stretching
    };
    const shade = (h, f) => {
      const r = Math.min(255, ((h >> 16) & 255) * f) | 0, g = Math.min(255, ((h >> 8) & 255) * f) | 0, b = Math.min(255, (h & 255) * f) | 0;
      return `rgb(${r},${g},${b})`;
    };
    const planetTexture = (color, style) => {
      const Wt = 512, Ht = 256;
      const cv = document.createElement("canvas"); cv.width = Wt; cv.height = Ht;
      const x = cv.getContext("2d");
      x.fillStyle = shade(color, 0.5); x.fillRect(0, 0, Wt, Ht);
      if (style === "gas") {
        for (let y = 0; y < Ht; y += 2) { const f = 0.42 + 0.58 * Math.abs(Math.sin(y * 0.05 + Math.sin(y * 0.014) * 2.6)); x.fillStyle = shade(color, 0.3 + f * 0.95); x.fillRect(0, y, Wt, 2); }
        for (let i = 0; i < 26; i++) { x.globalAlpha = 0.16; x.fillStyle = shade(color, 0.5 + Math.random() * 0.9); x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 30 + Math.random() * 70, 4 + Math.random() * 7, 0, 0, 7); x.fill(); }
        for (let i = 0; i < 5; i++) { x.globalAlpha = 0.3; x.fillStyle = "rgba(245,238,222,0.9)"; x.fillRect(0, Math.random() * Ht, Wt, 3 + Math.random() * 5); } // cream bands (Jupiter)
        x.globalAlpha = 0.6; x.fillStyle = "rgba(190,95,60,0.85)"; x.beginPath(); x.ellipse(Wt * 0.66, Ht * 0.6, 46, 24, 0, 0, 7); x.fill(); // great red spot
        x.globalAlpha = 0.4; x.fillStyle = "rgba(150,70,45,0.8)"; x.beginPath(); x.ellipse(Wt * 0.66, Ht * 0.6, 30, 15, 0, 0, 7); x.fill(); x.globalAlpha = 1;
      } else if (style === "swirl") {
        // marble / Venus-like turbulent swirls
        for (let i = 0; i < 70; i++) { x.globalAlpha = 0.12; x.fillStyle = shade(color, 0.4 + Math.random() * 0.95); x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 22 + Math.random() * 65, 8 + Math.random() * 30, Math.random() * Math.PI, 0, 7); x.fill(); }
        x.globalAlpha = 1;
      } else if (style === "lava") {
        // dark crust + REAL molten-rock cracks (orange→yellow, glowing)
        x.fillStyle = shade(color, 0.45); x.fillRect(0, 0, Wt, Ht);
        for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(255,${(110 + Math.random() * 110) | 0},${(20 + Math.random() * 40) | 0},${0.65 + Math.random() * 0.35})`; x.globalAlpha = 1; x.lineWidth = 1 + Math.random() * 2.5; x.beginPath(); let sx = Math.random() * Wt, sy = Math.random() * Ht; x.moveTo(sx, sy); for (let k = 0; k < 5; k++) { sx += Math.random() * 44 - 22; sy += Math.random() * 30 - 15; x.lineTo(sx, sy); } x.stroke(); }
        for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,${(180 + Math.random() * 60) | 0},${(60 + Math.random() * 60) | 0},0.9)`; x.beginPath(); x.arc(Math.random() * Wt, Math.random() * Ht, 1 + Math.random() * 3, 0, 7); x.fill(); }
      } else if (style === "ocean") {
        x.fillStyle = shade(color, 0.85); x.fillRect(0, 0, Wt, Ht); // blue water
        const land = ["#3f7a3f", "#4f7a36", "#6e5a38", "#8a7048"]; // real green / brown continents
        for (let i = 0; i < 16; i++) { x.globalAlpha = 0.85; x.fillStyle = land[i % land.length]; x.beginPath(); x.ellipse(Math.random() * Wt, 36 + Math.random() * (Ht - 72), 22 + Math.random() * 50, 16 + Math.random() * 28, Math.random(), 0, 7); x.fill(); }
        for (let i = 0; i < 24; i++) { x.globalAlpha = 0.2; x.fillStyle = "rgba(255,255,255,0.95)"; x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 22 + Math.random() * 42, 6 + Math.random() * 11, Math.random(), 0, 7); x.fill(); } // clouds
        x.globalAlpha = 0.9; x.fillStyle = "rgba(244,249,255,0.95)"; x.beginPath(); x.ellipse(Wt / 2, 6, Wt * 0.5, 20, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(Wt / 2, Ht - 6, Wt * 0.5, 20, 0, 0, 7); x.fill(); x.globalAlpha = 1;
      } else if (style === "desert") {
        for (let y = 0; y < Ht; y += 2) { const f = 0.55 + 0.45 * Math.sin(y * 0.04 + Math.sin(y * 0.1)); x.fillStyle = shade(color, 0.55 + f * 0.55); x.fillRect(0, y, Wt, 2); }
        for (let i = 0; i < 30; i++) { x.globalAlpha = 0.18; x.strokeStyle = shade(color, 0.4); x.lineWidth = 1 + Math.random() * 2; const yy = Math.random() * Ht; x.beginPath(); x.moveTo(0, yy); x.bezierCurveTo(Wt * 0.3, yy + 22, Wt * 0.6, yy - 22, Wt, yy + Math.random() * 20 - 10); x.stroke(); } x.globalAlpha = 1;
      } else if (style === "crater") {
        for (let i = 0; i < 2400; i++) { x.fillStyle = shade(color, 0.4 + Math.random() * 0.7); x.fillRect(Math.random() * Wt, Math.random() * Ht, 2, 2); }
        for (let i = 0; i < 64; i++) { const cx = Math.random() * Wt, cy = Math.random() * Ht, rr = 4 + Math.random() * 16; x.globalAlpha = 0.4; x.fillStyle = shade(color, 0.35); x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); x.globalAlpha = 0.5; x.strokeStyle = shade(color, 1.15); x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke(); } x.globalAlpha = 1;
      } else if (style === "neptune") {
        // ice giant: smooth deep-blue bands + a dark storm
        for (let y = 0; y < Ht; y += 2) { const f = 0.6 + 0.4 * Math.sin(y * 0.04); x.fillStyle = shade(color, 0.6 + f * 0.6); x.fillRect(0, y, Wt, 2); }
        x.globalAlpha = 0.4; x.fillStyle = shade(color, 0.4); x.beginPath(); x.ellipse(Wt * 0.4, Ht * 0.42, 40, 22, 0, 0, 7); x.fill();
        for (let i = 0; i < 8; i++) { x.globalAlpha = 0.2; x.fillStyle = "rgba(255,255,255,0.7)"; x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 18 + Math.random() * 30, 3 + Math.random() * 4, 0, 0, 7); x.fill(); } x.globalAlpha = 1;
      } else if (style === "toxic") {
        // acid / sulfur world: yellow-green hazy swirls
        for (let i = 0; i < 80; i++) { x.globalAlpha = 0.12; x.fillStyle = shade(color, 0.5 + Math.random() * 0.9); x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 24 + Math.random() * 60, 8 + Math.random() * 24, Math.random() * Math.PI, 0, 7); x.fill(); }
        for (let i = 0; i < 12; i++) { x.globalAlpha = 0.18; x.fillStyle = "rgba(90,120,30,0.8)"; x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 16 + Math.random() * 30, 12 + Math.random() * 20, 0, 0, 7); x.fill(); } x.globalAlpha = 1;
      } else if (style === "forest") {
        // lush world: heavy green land + blue water + a few clouds
        x.fillStyle = "#27568a"; x.fillRect(0, 0, Wt, Ht);
        const greens = ["#2f7a44", "#3c8a3a", "#4f7a36", "#256b3a"];
        for (let i = 0; i < 22; i++) { x.globalAlpha = 0.9; x.fillStyle = greens[i % greens.length]; x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 26 + Math.random() * 56, 18 + Math.random() * 34, Math.random(), 0, 7); x.fill(); }
        for (let i = 0; i < 16; i++) { x.globalAlpha = 0.18; x.fillStyle = "rgba(255,255,255,0.9)"; x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 20 + Math.random() * 38, 6 + Math.random() * 10, Math.random(), 0, 7); x.fill(); } x.globalAlpha = 1;
      } else if (style === "metallic") {
        x.fillStyle = shade(color, 0.7); x.fillRect(0, 0, Wt, Ht);
        for (let i = 0; i < 40; i++) { x.globalAlpha = 0.3; x.fillStyle = shade(color, 0.6 + Math.random() * 0.8); x.fillRect(Math.random() * Wt, Math.random() * Ht, 6 + Math.random() * 60, 2 + Math.random() * 5); } // panel streaks
        for (let i = 0; i < 30; i++) { x.globalAlpha = 0.35; x.strokeStyle = shade(color, 1.2); x.lineWidth = 1; x.strokeRect(Math.random() * Wt, Math.random() * Ht, 10 + Math.random() * 40, 8 + Math.random() * 30); } x.globalAlpha = 1;
      } else if (style === "storm") {
        for (let y = 0; y < Ht; y += 2) { const f = 0.4 + 0.6 * Math.abs(Math.sin(y * 0.06 + Math.sin(y * 0.02) * 3)); x.fillStyle = shade(color, 0.25 + f * 0.8); x.fillRect(0, y, Wt, 2); }
        for (let i = 0; i < 30; i++) { x.globalAlpha = 0.7; x.strokeStyle = "rgba(220,235,255,0.9)"; x.lineWidth = 1; x.beginPath(); let sx = Math.random() * Wt, sy = Math.random() * Ht; x.moveTo(sx, sy); for (let k = 0; k < 3; k++) { sx += Math.random() * 26 - 13; sy += Math.random() * 20 - 6; x.lineTo(sx, sy); } x.stroke(); } x.globalAlpha = 1;
      } else if (style === "ice") {
        x.fillStyle = shade(color, 0.85); x.fillRect(0, 0, Wt, Ht);
        for (let i = 0; i < 120; i++) { x.strokeStyle = shade(color, 0.4); x.globalAlpha = 0.3; x.lineWidth = 1 + Math.random(); const sx = Math.random() * Wt, sy = Math.random() * Ht; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.random() * 80 - 40, sy + Math.random() * 50 - 25); x.stroke(); }
        for (let i = 0; i < 30; i++) { x.globalAlpha = 0.25; x.fillStyle = shade(color, 1.2); x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 18 + Math.random() * 30, 14 + Math.random() * 20, 0, 0, 7); x.fill(); } x.globalAlpha = 1;
      } else {
        for (let i = 0; i < 5200; i++) { x.fillStyle = shade(color, 0.3 + Math.random() * 0.9); x.fillRect(Math.random() * Wt, Math.random() * Ht, 2, 2); }
        for (let i = 0; i < 14; i++) { x.globalAlpha = 0.3; x.fillStyle = shade(color, 0.55 + Math.random() * 0.6); x.beginPath(); x.ellipse(Math.random() * Wt, Math.random() * Ht, 22 + Math.random() * 46, 16 + Math.random() * 30, Math.random(), 0, 7); x.fill(); }
        x.globalAlpha = 0.85; x.fillStyle = "rgba(235,242,255,0.9)"; x.beginPath(); x.ellipse(Wt / 2, 6, Wt * 0.5, 22, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(Wt / 2, Ht - 6, Wt * 0.5, 22, 0, 0, 7); x.fill(); x.globalAlpha = 1;
      }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
    };

    // ── Starfield + nebulae ──
    const sg = new THREE.BufferGeometry(); const Ns = 2400, sp = new Float32Array(Ns * 3);
    for (let i = 0; i < Ns; i++) { const r = 150 + Math.random() * 340, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); sp[i * 3] = r * Math.sin(ph) * Math.cos(th); sp[i * 3 + 1] = r * Math.cos(ph) * 0.7; sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th); }
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcdd6ff, size: 0.85, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
    scene.add(stars);
    [[0x3a2a7a, 90, -60, 14, -60], [0x10406b, 110, 70, -10, -70], [0x5a2a6b, 80, -50, -24, 60]].forEach(([col, size, x, y, z]) => { const nb = glow(col, size); nb.position.set(x, y, z); nb.material.opacity = 0.4; scene.add(nb); });

    // ── Central heart-star of the Chiangverse ──
    const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 3), new THREE.MeshStandardMaterial({ color: 0xeaf2ff, emissive: 0xbcd2ff, emissiveIntensity: 1.1, roughness: 0.3 }));
    scene.add(heart);
    const heartHalo = glow(0xbcd2ff, 9); heartHalo.material.opacity = 0.7; scene.add(heartHalo);
    scene.add(new THREE.PointLight(0xcfe0ff, 1.8, 240, 1.3));

    // ── Build a sun + planets for each system ──
    const planetObjs = [];
    const suns = [];
    SYSTEMS.forEach((s) => {
      const [cx, cy, cz] = s.center;
      // system sun
      const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: s.color, emissiveIntensity: 0.85, roughness: 0.4 }));
      sun.position.set(cx, cy, cz); scene.add(sun);
      const sh = glow(s.color, 8); sh.material.opacity = 0.7; sh.position.set(cx, cy, cz); scene.add(sh);
      const sl = new THREE.PointLight(s.color, 2.8, 170, 1.4); sl.position.set(cx, cy, cz); scene.add(sl); // strong light (low ambient) → real terminator on planets
      const lab = makeLabel(s.name, s.color, 1.5); lab.position.set(cx, cy + s.r0 + s.dr * (s.planets.length - 1) + 6, cz); scene.add(lab);
      suns.push({ sun, halo: sh });
    });

    PLANETS.forEach((p) => {
      const grp = new THREE.Group();
      // surface = almost pure REAL colour for its type (only a hint of system tint)
      const surfaceColor = blend(STYLE_COLOR[p.style] || p.color, p.color, 0.06);
      const tex = planetTexture(surfaceColor, p.style);
      const bs = { crater: 0.6, rocky: 0.55, lava: 0.5, desert: 0.35, gas: 0.3, swirl: 0.28, storm: 0.3, toxic: 0.28, forest: 0.3, neptune: 0.2, ice: 0.2, ocean: 0.16, metallic: 0.14 }[p.style] ?? 0.3;
      const shiny = p.style === "metallic", wet = p.style === "ocean" || p.style === "forest";
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 64, 48), new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: bs, roughness: shiny ? 0.28 : wet ? 0.55 : 0.82, metalness: shiny ? 0.85 : wet ? 0.2 : 0.08, emissive: surfaceColor, emissiveIntensity: 0.04 }));
      mesh.rotation.z = (Math.random() - 0.5) * 0.5; mesh.rotation.x = 0.3; // slight axial tilt
      grp.add(mesh);
      // atmosphere rim
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(p.size * 1.14, 32, 32), new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.09, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      grp.add(atmo);
      // optional ring (Saturn-like)
      if (p.ring) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(p.size * 1.5, p.size * 2.5, 56), new THREE.MeshBasicMaterial({ color: shadeHex(p.color, 1.2), transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2.3; ring.rotation.y = 0.2; grp.add(ring);
      }
      const halo = glow(p.color, p.size * 2.1); halo.material.opacity = 0.16; grp.add(halo); // subtle system-colour glow (surface colour stays dominant)
      // little moon(s) orbiting the bigger (project) planets
      const moons = [];
      const moonN = p.kind === "project" ? (p.ring ? 1 : 2) : 0;
      for (let m = 0; m < moonN; m++) {
        const mm = new THREE.Mesh(new THREE.SphereGeometry(p.size * (0.16 + m * 0.04), 16, 14), new THREE.MeshStandardMaterial({ color: 0xcfd5e4, roughness: 0.95, bumpMap: tex, bumpScale: 0.06 }));
        grp.add(mm);
        moons.push({ mesh: mm, r: p.size * (2.4 + m * 0.9), a: m * 2.1, tilt: 0.3 + m * 0.4, speed: 0.7 - m * 0.2 });
      }
      const label = makeLabel(p.name, p.color, p.kind === "project" ? 0.95 : 0.7);
      label.position.y = p.size + 1.6; grp.add(label);
      const c = p.center;
      grp.position.set(c[0] + Math.cos(p.baseAngle) * p.localRadius, c[1] + p.localY, c[2] + Math.sin(p.baseAngle) * p.localRadius);
      scene.add(grp);
      // faint orbit path
      const orb = new THREE.Mesh(new THREE.RingGeometry(p.localRadius - 0.05, p.localRadius + 0.05, 80), new THREE.MeshBasicMaterial({ color: p.systemColor, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
      orb.rotation.x = -Math.PI / 2; orb.position.set(c[0], c[1] + p.localY, c[2]); scene.add(orb);
      planetObjs.push({ grp, mesh, atmo, halo, label, moons, data: p, ang: p.baseAngle });
    });
    function shadeHex(h, f) { const r = Math.min(255, ((h >> 16) & 255) * f) | 0, g = Math.min(255, ((h >> 8) & 255) * f) | 0, b = Math.min(255, (h & 255) * f) | 0; return (r << 16) | (g << 8) | b; }

    // ── Spaceship ──
    const ship = new THREE.Group();
    const pitchG = new THREE.Group(); ship.add(pitchG);
    const bankG = new THREE.Group(); pitchG.add(bankG);
    // X-wing style starfighter (built from primitives — no model file)
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xccd0d8, roughness: 0.5, metalness: 0.55 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x363b44, roughness: 0.6, metalness: 0.4 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd8453b, roughness: 0.5, metalness: 0.3, emissive: 0x3a0d0a, emissiveIntensity: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x13242f, roughness: 0.1, metalness: 0.6, emissive: 0x0c2c3c, emissiveIntensity: 0.5 });
    // fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 2.6), hullMat); bankG.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.5, 4), hullMat); nose.rotation.x = Math.PI / 2; nose.rotation.z = Math.PI / 4; nose.position.z = 2.0; bankG.add(nose);
    const noseBand = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.16), redMat); noseBand.position.z = 1.2; bankG.add(noseBand);
    // cockpit canopy
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat); canopy.scale.set(1, 0.85, 1.5); canopy.position.set(0, 0.24, 0.25); bankG.add(canopy);
    // R2 astromech
    const r2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe2e6ed, roughness: 0.5 })); r2.position.set(0, 0.26, -0.55); bankG.add(r2);
    const r2eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.02), new THREE.MeshStandardMaterial({ color: 0x3b7fd2, emissive: 0x3b7fd2, emissiveIntensity: 0.6 })); r2eye.position.set(0, 0.32, -0.41); bankG.add(r2eye);
    // rear engine deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.7), darkMat); deck.position.z = -1.25; bankG.add(deck);
    // 4 S-foil wings (X), each with a forward laser cannon + an engine
    const engineGlows = [];
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => {
      const wing = new THREE.Group();
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.82), hullMat); panel.position.set(sx * 1.05, 0, -0.6); wing.add(panel);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.075, 0.82), redMat); stripe.position.set(sx * 1.68, 0, -0.6); wing.add(stripe);
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), darkMat); cannon.rotation.x = Math.PI / 2; cannon.position.set(sx * 1.95, 0, 0.35); wing.add(cannon);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.34, 8), new THREE.MeshStandardMaterial({ color: 0xff5a3c, emissive: 0xff3a1a, emissiveIntensity: 0.7 })); tip.rotation.x = Math.PI / 2; tip.position.set(sx * 1.95, 0, 1.6); wing.add(tip);
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.78, 16), darkMat); eng.rotation.x = Math.PI / 2; eng.position.set(sx * 0.58, 0, -1.02); wing.add(eng);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0x14181f, metalness: 0.6, roughness: 0.4 })); nozzle.rotation.x = Math.PI / 2; nozzle.position.set(sx * 0.58, 0, -1.42); wing.add(nozzle);
      const intake = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 18), new THREE.MeshStandardMaterial({ color: 0x20262f })); intake.position.set(sx * 0.58, 0, -0.62); wing.add(intake);
      // glowing thruster flare cone
      const flare = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.1, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x9af0ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); flare.rotation.x = -Math.PI / 2; flare.position.set(sx * 0.58, 0, -2.05); wing.add(flare);
      const eg = glow(0x6ee3ff, 1.2); eg.position.set(sx * 0.58, 0, -1.5); wing.add(eg); engineGlows.push(eg);
      wing.rotation.z = sx * sy * 0.32; // splay into an X
      bankG.add(wing);
    });
    ship.scale.setScalar(0.82);
    ship.position.set(0, 4, -18); scene.add(ship);

    // ── Space easter eggs (太空梗) ──
    // Flying saucer
    const ufo = new THREE.Group();
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x9aa3b8, metalness: 0.75, roughness: 0.3 }));
    saucer.scale.set(1, 1, 1.2); ufo.add(saucer);
    const ufoRim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 10, 28), new THREE.MeshStandardMaterial({ color: 0x49546e, metalness: 0.6 })); ufoRim.rotation.x = Math.PI / 2; ufo.add(ufoRim);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8fe6ff, emissive: 0x2a6a8a, emissiveIntensity: 0.7, transparent: true, opacity: 0.85 })); dome.position.y = 0.16; ufo.add(dome);
    const ufoLights = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const l = glow(0x6effa0, 0.7); l.position.set(Math.cos(a) * 1.2, -0.18, Math.sin(a) * 1.2); ufo.add(l); ufoLights.push(l); }
    ufo.position.set(-64, 34, -22); scene.add(ufo);

    // Floating astronaut
    const astro = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0xf0f2f6, roughness: 0.65 });
    astro.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.5, 6, 12), suitMat));
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 16), new THREE.MeshStandardMaterial({ color: 0xe6ecf4, roughness: 0.3, metalness: 0.4 })); helmet.position.y = 0.62; astro.add(helmet);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12, 0, Math.PI * 2, Math.PI * 0.16, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: 0x12202e, metalness: 0.7, roughness: 0.1, emissive: 0x0a2030, emissiveIntensity: 0.4 })); visor.position.set(0, 0.64, 0.18); visor.rotation.x = 0.3; astro.add(visor);
    [0.55, -0.55].forEach((ox) => { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.42, 4, 8), suitMat); arm.position.set(ox, 0.08, 0); arm.rotation.z = ox > 0 ? 0.6 : -0.6; astro.add(arm); });
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.26), new THREE.MeshStandardMaterial({ color: 0xb8bcc4 })); pack.position.set(0, 0.06, -0.36); astro.add(pack);
    astro.position.set(58, -8, 58); astro.scale.setScalar(1.4); scene.add(astro);

    // Comet streaking by
    const comet = new THREE.Group();
    comet.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe6f3ff, emissive: 0x9fd8ff, emissiveIntensity: 1.4, roughness: 0.4 })));
    const cometTail = glow(0xa8ddff, 9); cometTail.position.set(0, 0, 3.6); cometTail.scale.set(3, 9, 1); comet.add(cometTail);
    scene.add(comet);

    // Star Wars × data pun, floating in space
    const sign = makeLabel("MAY THE DATA BE WITH YOU", 0xffd166, 1.5); sign.position.set(0, 40, 4); scene.add(sign);

    // ── More detail: asteroid belt, distant galaxies ──
    const belt = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x565c6e, roughness: 1, flatShading: true });
    for (let i = 0; i < 70; i++) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + Math.random() * 0.7, 0), rockMat);
      const a = Math.random() * Math.PI * 2, rr = 66 + Math.random() * 16;
      rock.position.set(Math.cos(a) * rr, (Math.random() - 0.5) * 7, Math.sin(a) * rr);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      belt.add(rock);
    }
    scene.add(belt);
    [[0x9a7bff, -190, 46, -210, 64], [0x5ec8ff, 210, -40, -190, 54], [0xff8ad0, -60, -70, 220, 48]].forEach(([col, x, y, z, sz]) => {
      const gx = glow(col, sz); gx.position.set(x, y, z); gx.material.opacity = 0.45; scene.add(gx);
    });

    // ── More space eggs: black hole, satellite, cartoon rocket ──
    const blackhole = new THREE.Group();
    blackhole.add(new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })));
    const bhDisk = new THREE.Mesh(new THREE.RingGeometry(2.0, 4.6, 56), new THREE.MeshBasicMaterial({ color: 0xffb46a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    bhDisk.rotation.x = -Math.PI / 2.3; blackhole.add(bhDisk);
    const bhGlow = glow(0xffd6a0, 7); blackhole.add(bhGlow);
    blackhole.position.set(74, 40, -54); scene.add(blackhole);

    const sat = new THREE.Group();
    sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.95), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.6, roughness: 0.4 })));
    [-1, 1].forEach((s) => { const panel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.7), new THREE.MeshStandardMaterial({ color: 0x21407a, emissive: 0x0a1830, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.5 })); panel.position.set(s * 1.35, 0, 0); sat.add(panel); });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe6ecf4, roughness: 0.5 })); dish.rotation.x = Math.PI / 2; dish.position.z = 0.62; sat.add(dish);
    sat.position.set(-52, -30, -8); scene.add(sat);

    const rocket = new THREE.Group();
    rocket.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0xf0f2f6, roughness: 0.5 })));
    const rnose = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.7, 16), new THREE.MeshStandardMaterial({ color: 0xd8453b })); rnose.position.y = 1.15; rocket.add(rnose);
    const rwin = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x8fe0ff, emissive: 0x2a6a8a, emissiveIntensity: 0.5 })); rwin.position.set(0, 0.3, 0.38); rocket.add(rwin);
    [0, 1, 2].forEach((i) => { const a = (i / 3) * Math.PI * 2; const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xd8453b })); fin.position.set(Math.cos(a) * 0.42, -0.7, Math.sin(a) * 0.42); fin.rotation.y = -a; rocket.add(fin); });
    const rflame = glow(0xffc060, 1.3); rflame.position.y = -1.15; rocket.add(rflame);
    rocket.position.set(44, 50, 34); rocket.rotation.z = 0.5; scene.add(rocket);

    // ── Engine trail ──
    const TRAIL = 22, trailSprites = [], trailPts = [];
    for (let i = 0; i < TRAIL; i++) { const s = glow(0x00d4ff, 1.4); s.material.opacity = 0; scene.add(s); trailSprites.push(s); }

    // ── Audio ──
    const audio = (() => {
      let ctx, master, eng, ok = false;
      return {
        init() {
          if (ok) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
          try {
            ctx = new AC(); ok = true;
            master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
            const dg = ctx.createGain(); dg.gain.value = 0.05; dg.connect(master);
            const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380; lp.connect(dg);
            [55, 55.4, 82.5].forEach((f) => { const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; o.connect(lp); o.start(); });
            eng = ctx.createGain(); eng.gain.value = 0; eng.connect(master);
            const elp = ctx.createBiquadFilter(); elp.type = "lowpass"; elp.frequency.value = 620; elp.connect(eng);
            const eo = ctx.createOscillator(); eo.type = "sawtooth"; eo.frequency.value = 68; eo.connect(elp); eo.start();
          } catch { ok = false; }
        },
        thrust(v) { if (ok) eng.gain.setTargetAtTime(v * 0.11, ctx.currentTime, 0.12); },
        blip() { if (!ok) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(680, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(1360, ctx.currentTime + 0.12); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25); o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.3); },
        setMuted(m) { if (ok) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05); },
        close() { if (ok) try { ctx.close(); } catch { /* noop */ } },
      };
    })();
    mount._audio = audio;

    // ── Controls (Space modifier for vertical) ──
    const keys = { f: false, b: false, l: false, r: false, space: false, av: false, ad: false, boost: false };
    const setKey = (k, v) => { if (k in keys) keys[k] = v; };
    const keyMap = { ArrowUp: "f", KeyW: "f", ArrowDown: "b", KeyS: "b", ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r", Space: "space", ShiftLeft: "boost", ShiftRight: "boost" };
    const onKeyDown = (e) => {
      if (e.code === "Enter") { enterRef.current(); return; }
      if (keyMap[e.code]) { setKey(keyMap[e.code], true); e.preventDefault(); if (!startedRef.current) { startedRef.current = true; setStarted(true); audio.init(); } }
    };
    const onKeyUp = (e) => { if (keyMap[e.code]) { setKey(keyMap[e.code], false); e.preventDefault(); } };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    mount._setKey = setKey;
    mount._begin = () => { startedRef.current = true; setStarted(true); audio.init(); };

    // ── Flight state ──
    let heading = 0, steerVal = 0;
    const vel = new THREE.Vector3();
    let bank = 0, pitch = 0, lastNear = -1, raf = 0, last = performance.now(), t = 0;
    const camPos = new THREE.Vector3(0, 20, -56), camLook = new THREE.Vector3();
    const fwd = new THREE.Vector3(), pw = new THREE.Vector3(), q = new THREE.Quaternion();
    const tmpV2 = new THREE.Vector3();

    if (import.meta.env && import.meta.env.DEV) {
      window.__verse = { ship, vel, planetObjs, setKey, scene, camera, renderer, composer, getState: () => ({ pos: ship.position.toArray(), heading, speed: vel.length() }) };
    }

    let loopErrored = false;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      try {
      const elapsed = (now - last) / 1000; last = now;
      const dt = Math.min(elapsed, 0.05); t += dt;

      heart.rotation.y += dt * 0.2; heart.rotation.x += dt * 0.08;
      const pulse = 1 + Math.sin(t * 1.5) * 0.06; heartHalo.scale.set(9 * pulse, 9 * pulse, 1);
      stars.rotation.y += dt * 0.004;
      for (const sn of suns) sn.sun.rotation.y += dt * 0.15;

      // easter eggs
      ufo.rotation.y += dt * 0.6; ufo.position.y = 34 + Math.sin(t * 0.6) * 2;
      for (let i = 0; i < ufoLights.length; i++) ufoLights[i].material.opacity = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 4 + i));
      astro.rotation.x += dt * 0.25; astro.rotation.y += dt * 0.18; astro.rotation.z += dt * 0.12; astro.position.y = -8 + Math.sin(t * 0.4) * 3;
      const ct = (t * 0.05) % 1; comet.position.set(-95 + ct * 190, 54 - ct * 26, -42 + Math.sin(ct * Math.PI) * 22); comet.rotation.set(0, -Math.PI / 2, 0.32);
      belt.rotation.y += dt * 0.02;
      bhDisk.rotation.z += dt * 0.5;
      sat.rotation.y += dt * 0.3; sat.position.y = -30 + Math.sin(t * 0.5) * 2;
      rocket.position.y = 50 + Math.sin(t * 0.3) * 4; rocket.rotation.y += dt * 0.4; rflame.scale.setScalar(1 + Math.sin(t * 25) * 0.2);

      for (const po of planetObjs) {
        po.ang += po.data.orbitSpeed * dt;
        const c = po.data.center;
        po.grp.position.set(c[0] + Math.cos(po.ang) * po.data.localRadius, c[1] + po.data.localY, c[2] + Math.sin(po.ang) * po.data.localRadius);
        po.mesh.rotation.y += dt * 0.25;
        if (po.moons) for (const mo of po.moons) { mo.a += mo.speed * dt; mo.mesh.position.set(Math.cos(mo.a) * mo.r, Math.sin(mo.a) * mo.r * mo.tilt, Math.sin(mo.a) * mo.r); }
      }

      // ── Flight: yaw + PITCH = full 3D curved flight (Space + ↑/↓ climbs / dives in an arc) ──
      const TURN = 1.9, GRIP = 2.5, PITCH_RATE = 1.4;
      const boosting = keys.boost;
      const THRUST = boosting ? 100 : 54, MAX = boosting ? 115 : 72; // faster baseline + Shift boost
      const pitchUp = keys.av || (keys.space && keys.f);   // Space+↑ or mobile ⤒
      const pitchDown = keys.ad || (keys.space && keys.b); // Space+↓ or mobile ⤓
      const goFwd = (keys.f && !keys.space) || pitchUp || pitchDown; // thrust along the arc while climbing/diving
      const goRev = keys.b && !keys.space;
      const steerIn = (keys.l ? 1 : 0) - (keys.r ? 1 : 0);
      steerVal += (steerIn - steerVal) * Math.min(1, dt * 5);
      heading += steerVal * TURN * dt;
      bank += (-steerVal * 0.7 - bank) * Math.min(1, dt * 5); // roll into the turn
      const pitchIn = (pitchUp ? 1 : 0) - (pitchDown ? 1 : 0);
      pitch += pitchIn * PITCH_RATE * dt;
      if (pitchIn === 0) pitch += (0 - pitch) * Math.min(1, dt * 1.6); // ease back to level
      pitch = THREE.MathUtils.clamp(pitch, -0.7, 0.7);
      const cpz = Math.cos(pitch);
      fwd.set(cpz * Math.sin(heading), Math.sin(pitch), cpz * Math.cos(heading)); // 3D nose direction
      if (goFwd) vel.addScaledVector(fwd, THRUST * dt);
      if (goRev) vel.addScaledVector(fwd, -THRUST * 0.5 * dt);
      // GRIP: sweep the FULL 3D momentum toward the nose → flight curves in smooth arcs
      const spd = vel.length();
      if (spd > 0.01) { tmpV2.copy(fwd).multiplyScalar(spd); vel.lerp(tmpV2, Math.min(1, dt * GRIP)); }
      vel.multiplyScalar(Math.exp(-0.5 * dt)); // lighter drag → momentum carries (faster feel)
      if (vel.length() > MAX) vel.setLength(MAX);
      ship.position.addScaledVector(vel, dt);
      ship.position.y = Math.max(-52, Math.min(52, ship.position.y));
      const dcore = ship.position.length();
      if (dcore > 105) { ship.position.multiplyScalar(105 / dcore); vel.multiplyScalar(0.4); }
      ship.rotation.y = heading;
      pitchG.rotation.x = -pitch; bankG.rotation.z = bank; // nose follows the climb/dive
      const thrusting = goFwd || goRev;
      const egScale = 1 + (thrusting ? 0.9 : 0) + (boosting && thrusting ? 1.1 : 0) + Math.sin(t * 20) * 0.12;
      for (const eg of engineGlows) eg.scale.setScalar(egScale);
      audio.thrust(thrusting ? 1 : 0);

      // trail
      pw.set(0, 0, -1.3).applyQuaternion(bankG.getWorldQuaternion(q)).add(ship.position);
      trailPts.unshift(pw.clone()); if (trailPts.length > TRAIL) trailPts.pop();
      for (let i = 0; i < trailSprites.length; i++) { const pt = trailPts[i]; if (pt) { trailSprites[i].position.copy(pt); const k = 1 - i / TRAIL; trailSprites[i].material.opacity = (thrusting ? 0.5 : 0.1) * k; trailSprites[i].scale.setScalar(1.4 * k); } }

      // camera
      if (startedRef.current) {
        camPos.lerp(new THREE.Vector3(ship.position.x - fwd.x * 11, ship.position.y + 5 + Math.max(0, vel.y) * 0.2, ship.position.z - fwd.z * 11), Math.min(1, dt * 3));
        camera.position.copy(camPos);
        camLook.lerp(new THREE.Vector3(ship.position.x + fwd.x * 6, ship.position.y + 1, ship.position.z + fwd.z * 6), Math.min(1, dt * 4));
        camera.lookAt(camLook);
      } else {
        camera.position.set(Math.cos(t * 0.14) * 58, 24 + Math.sin(t * 0.3) * 5, Math.sin(t * 0.14) * 58);
        camera.lookAt(0, 17, 0); // aim higher so the bright core sits low on screen, clear of the hero text
      }

      // nearest planet
      let best = 7.5, nIdx = -1;
      for (let i = 0; i < planetObjs.length; i++) {
        const po = planetObjs[i]; po.grp.getWorldPosition(pw);
        const d = ship.position.distanceTo(pw); const g = d < 10;
        po.mesh.material.emissiveIntensity = g ? 0.18 : 0.0;
        po.atmo.material.opacity = g ? 0.2 : 0.08;
        po.label.visible = po.data.kind === "project" || d < 38;
        if (d < best) { best = d; nIdx = i; }
      }
      if (startedRef.current && nIdx !== lastNear) { lastNear = nIdx; nearRef.current = nIdx; setNear(nIdx); }

      if (noBloom) renderer.render(scene, camera); else composer.render();
      } catch (ex) {
        if (!loopErrored) { loopErrored = true; console.error("[Chiangverse loop error]", ex); setErr(String((ex && ex.stack) || ex)); }
      }
    }
    raf = requestAnimationFrame(loop);

    const onResize = () => { W = mount.clientWidth; H = mount.clientHeight; renderer.setSize(W, H); composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      audio.close();
      if (window.__verse) delete window.__verse;
      composer.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  const pad = (k) => ({
    onPointerDown: (e) => { e.preventDefault(); mountRef.current?._setKey?.(k, true); mountRef.current?._begin?.(); },
    onPointerUp: (e) => { e.preventDefault(); mountRef.current?._setKey?.(k, false); },
    onPointerLeave: () => mountRef.current?._setKey?.(k, false),
    onPointerCancel: () => mountRef.current?._setKey?.(k, false),
  });
  const toggleMute = () => setMuted((m) => { const n = !m; mountRef.current?._audio?.setMuted(n); return n; });

  const nearP = near >= 0 ? PLANETS[near] : null;
  const openP = openIdx >= 0 ? PLANETS[openIdx] : null;

  const renderPanelBody = (p) => {
    if (p.kind === "project") {
      return (
        <>
          <div className="cv-tags">{p.tags.map((tg) => <span className="cv-tag" key={tg}>{tg}</span>)}</div>
          <div className="cv-projects">
            {p.projects.map((pr) => (
              <div className="cv-proj glass" key={pr.name}>
                <div className="cv-proj-name">{pr.name}</div>
                <p className="cv-proj-desc">{pr.desc}</p>
                <div className="cv-proj-tech">{pr.tech.map((tc) => <span key={tc}>{tc}</span>)}</div>
                <div className="cv-proj-meta"><span><b>角色</b> {pr.role}</span><span><b>成果</b> {pr.impact}</span></div>
                {pr.links?.demo && <a className="cv-proj-link" href={pr.links.demo}>開啟 Demo ↗</a>}
              </div>
            ))}
          </div>
        </>
      );
    }
    if (p.kind === "contact") {
      return <a className="cv-contact-go" href={p.link} target={p.link.startsWith("http") ? "_blank" : undefined} rel="noreferrer">前往 {p.name} →</a>;
    }
    return (
      <div className="cv-proj glass">
        <div className="cv-proj-meta cv-record">
          <span><b>{p.kind === "edu" ? "學位" : "職位"}</b> {p.sub}</span>
          <span><b>期間</b> {p.period}</span>
          {p.extra && <span><b>成績</b> {p.extra}</span>}
        </div>
        {p.bullets?.length > 0 && <ul className="cv-bullets">{p.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
      </div>
    );
  };

  return (
    <div className="cv-root">
      <div className="cv-canvas" ref={mountRef} />

      {err && (
        <pre className="cv-err">⚠ 3D 迴圈錯誤（請把這段截圖給我）:{"\n"}{err}</pre>
      )}

      {!started && (
        <div className="cv-hero">
          <div className="cv-hero-inner">
            <div className="cv-hero-eyebrow">YU-CHIN CHIANG · 江昱瑾</div>
            <h1 className="cv-hero-title cv-grad">The Chiangverse</h1>
            <div className="cv-hero-kicker">DATA&nbsp;ANALYTICS · AI · QUANT · PRODUCT</div>
            <p className="cv-hero-sub">作品、學歷、經歷與證照，各自是一座小小的星系。<br />駕駛飛船穿過去，靠近任何一顆星球，就能讀到它的故事。</p>
            <button className="cv-enter" onClick={begin}>進入星圖 →</button>
            <div className="cv-hero-hint">↑↓←→ / WASD 飛行 · Shift 加速 · 按住 Space + ↑/↓ 爬升俯衝 · 靠近星球按 Enter</div>
          </div>
        </div>
      )}

      {started && (
        <>
          <div className="cv-hud-top">
            <a className="cv-chip" href="/cv">履歷 · full CV →</a>
            <div className="cv-brand">The Chiangverse</div>
            <div className="cv-hud-right">
              <button className="cv-chip" onClick={() => setJourneyOpen(true)}>旅程</button>
              <button className="cv-chip" onClick={() => setSkillsOpen(true)}>技能</button>
              <button className="cv-chip" onClick={toggleMute} aria-label="mute">{muted ? "🔇" : "🔊"}</button>
              <span className="cv-chip cv-count">探索 {visited.size} / {PLANETS.length}</span>
            </div>
          </div>

          {nearP && openIdx < 0 && (
            <button className="cv-prompt" onClick={enter} style={{ borderColor: hex(nearP.color) }}>
              <span className="cv-prompt-name" style={{ color: hex(nearP.color) }}>{nearP.name}</span>
              <span className="cv-prompt-tag">{nearP.systemName}{nearP.tagline ? " · " + nearP.tagline : nearP.sub ? " · " + nearP.sub : ""}</span>
              <span className="cv-prompt-cta">按 Enter / 點此進入 →</span>
            </button>
          )}

          <div className="cv-altpad">
            <button className="cv-pad" {...pad("av")} aria-label="ascend">⤒</button>
            <button className="cv-pad" {...pad("ad")} aria-label="descend">⤓</button>
          </div>
          <div className="cv-dpad">
            <button className="cv-pad cv-pad-up" {...pad("f")} aria-label="thrust">▲</button>
            <button className="cv-pad cv-pad-left" {...pad("l")} aria-label="left">◀</button>
            <button className="cv-pad cv-pad-down" {...pad("b")} aria-label="reverse">▼</button>
            <button className="cv-pad cv-pad-right" {...pad("r")} aria-label="right">▶</button>
          </div>
        </>
      )}

      {openP && (
        <div className="cv-panel-wrap" onClick={() => setOpenIdx(-1)}>
          <div className="cv-panel glass" style={{ "--accent": hex(openP.color) }} onClick={(e) => e.stopPropagation()}>
            <button className="cv-panel-close" onClick={() => setOpenIdx(-1)} aria-label="close">✕</button>
            <div className="cv-panel-eyebrow" style={{ color: hex(openP.color) }}>{openP.systemName}</div>
            <h2 className="cv-panel-title">{openP.kind === "project" ? openP.tagline : openP.name}</h2>
            {renderPanelBody(openP)}
          </div>
        </div>
      )}

      {journeyOpen && (
        <div className="cv-panel-wrap cv-center" onClick={() => setJourneyOpen(false)}>
          <div className="cv-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="cv-panel-close" onClick={() => setJourneyOpen(false)} aria-label="close">✕</button>
            <div className="cv-panel-eyebrow cv-grad-text">My Project Journey</div>
            <div className="cv-timeline">
              {[["2022", "媒體與影音製作", 0xff6ec7], ["2023", "React Native 開發", 0x46e8a0], ["2024", "深度學習與 AI", 0x7b61ff], ["2025", "Data Analytics · Warwick 碩士", 0x00d4ff], ["2026", "Quant Research", 0xffd166], ["Future", "AI × Quant × Product", 0x00d4ff]].map(([y, l, c]) => (
                <div className="cv-tl-item" key={y}>
                  <span className="cv-tl-dot" style={{ background: hex(c) }} />
                  <span className="cv-tl-line" />
                  <div className="cv-tl-body"><span className="cv-tl-year" style={{ color: hex(c) }}>{y}</span><span className="cv-tl-label">{l}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {skillsOpen && (
        <div className="cv-panel-wrap cv-center" onClick={() => setSkillsOpen(false)}>
          <div className="cv-modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="cv-panel-close" onClick={() => setSkillsOpen(false)} aria-label="close">✕</button>
            <div className="cv-panel-eyebrow cv-grad-text">Skill Constellations</div>
            <div className="cv-skills">
              {[["Data & AI", 0x7b61ff, ["Python", "Pandas", "NumPy", "PyTorch", "Machine Learning", "Statistics"]], ["Software", 0x00d4ff, ["React", "Next.js", "Vue", "React Native", "Firebase"]], ["Quant", 0xffd166, ["Probability", "Backtesting", "Trading Strategy", "Risk Management"]], ["Creative", 0xff6ec7, ["UI/UX", "Storytelling", "Video Production", "Research"]]].map(([g, c, items]) => (
                <div className="cv-skill-group" key={g}>
                  <div className="cv-skill-head" style={{ color: hex(c) }}>{g}</div>
                  <div className="cv-skill-items">{items.map((it) => <span className="cv-skill" key={it}><span className="cv-skill-star" style={{ background: hex(c) }} />{it}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
