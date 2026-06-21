import React, { useEffect, useState } from "react";

// Easter-egg messages now live on 3D objects in the galaxy; the scene dispatches a
// `cv-egg` window event when you click one. This component only shows the transmission
// modal + handles the Konami "terminal mode" (a hidden key code, not a UI element).
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];

export default function EasterEggs() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const onEgg = (e) => setMsg(e.detail);
    window.addEventListener("cv-egg", onEgg);
    let buf = [], term = false;
    const onKey = (e) => {
      if (e.repeat) return; // ignore held-key auto-repeat so the sequence isn't polluted
      buf.push(e.code);
      if (buf.length > KONAMI.length) buf.shift();
      if (buf.length === KONAMI.length && KONAMI.every((k, i) => buf[i] === k)) {
        buf = [];
        term = !term;
        document.body.classList.toggle("cv-term", term);
        if (term) {
          const zh = (typeof localStorage !== "undefined" && localStorage.getItem("cv_lang") === "zh");
          setMsg(zh
            ? { title: "任務控制已啟動", lines: ["所有系統正常。", "終端機模式已開啟。"], foot: "再按一次 Konami 關閉" }
            : { title: "Mission Control Activated", lines: ["All systems nominal.", "Terminal mode engaged."], foot: "Press Konami again to exit" });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("cv-egg", onEgg); window.removeEventListener("keydown", onKey); document.body.classList.remove("cv-term"); };
  }, []);

  if (!msg) return null;
  return (
    <div className="egg-modal-wrap" onClick={() => setMsg(null)}>
      <div className="egg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="egg-modal-head">▸ TRANSMISSION</div>
        <div className="egg-modal-title">{msg.title}</div>
        <div className="egg-modal-body">{msg.lines.map((l, i) => <div key={i}>{l || " "}</div>)}</div>
        {msg.foot && <div className="egg-modal-foot">{msg.foot}</div>}
        <button className="egg-modal-close" onClick={() => setMsg(null)}>關閉</button>
      </div>
    </div>
  );
}
