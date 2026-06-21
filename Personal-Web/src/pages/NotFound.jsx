import React from "react";
import "./NotFound.css";

// A space-themed 404 that picks a random "lost in space" transmission each visit.
const MEMES = [
  { tag: "NASA", title: "Houston, We Have A Problem.", sub: "Telemetry lost — this page drifted off-course." },
  { tag: "STAR WARS", title: "These Are Not The Pages You Are Looking For.", sub: "Move along. Move along." },
  { tag: "QUANT", title: "Expected Return Not Found.", sub: "404 — this route has been de-listed." },
  { tag: "X-FILES", title: "The Page Has Been Abducted By Aliens.", sub: "The truth is out there. The page isn't." },
];
// pick once at module load (a fresh page visit) — not during render, so it stays pure
const PICK = MEMES[Math.floor(Math.random() * MEMES.length)];

export default function NotFound() {
  const m = PICK;
  return (
    <div className="nf-root">
      <div className="nf-stars" />
      <div className="nf-inner">
        <div className="nf-code">404</div>
        <div className="nf-tag">▸ {m.tag} TRANSMISSION</div>
        <h1 className="nf-title">{m.title}</h1>
        <p className="nf-sub">{m.sub}</p>
        <a className="nf-btn" href="/">← Back to The Chiangverse · 返回宇宙</a>
      </div>
    </div>
  );
}
