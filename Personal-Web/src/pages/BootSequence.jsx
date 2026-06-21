import React, { useEffect, useRef, useState } from "react";

// Terminal-style boot intro that plays before the galaxy hero.
const LINES = [
  { t: "INITIALIZING CHIANGVERSE...", c: "boot-main" },
  { gap: true },
  { t: "TRANSMISSION RECEIVED", c: "boot-main" },
  { t: "Kai'ra Datax Vel", c: "boot-name" },
  { gap: true },
  { t: "May data guide your journey.", c: "boot-sub" },
];

export default function BootSequence({ onDone }) {
  const [done, setDone] = useState([]); // completed lines
  const [cur, setCur] = useState(null); // { t, c } currently typing
  const [fading, setFading] = useState(false);
  const finishRef = useRef(() => {});
  const sndRef = useRef(null); // lazy Web Audio for typewriter ticks

  // short terminal "tick" per character (silent until the AudioContext is allowed to run)
  const tick = () => {
    try {
      let s = sndRef.current;
      if (!s) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; s = sndRef.current = new AC(); }
      if (s.state === "suspended") s.resume().catch(() => {});
      if (s.state !== "running") return;
      const o = s.createOscillator(), g = s.createGain();
      o.type = "square"; o.frequency.value = 1100 + Math.random() * 500;
      g.gain.setValueAtTime(0.0001, s.currentTime); g.gain.exponentialRampToValueAtTime(0.03, s.currentTime + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, s.currentTime + 0.05);
      o.connect(g); g.connect(s.destination); o.start(); o.stop(s.currentTime + 0.06);
    } catch { /* noop */ }
  };

  finishRef.current = () => { setFading(true); window.setTimeout(onDone, 650); };

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const after = (ms, fn) => { const id = window.setTimeout(() => { if (!cancelled) fn(); }, ms); timers.push(id); };
    let li = 0;
    const nextLine = () => {
      if (li >= LINES.length) { after(550, () => finishRef.current()); return; }
      const line = LINES[li++];
      if (line.gap) { setDone((d) => [...d, { gap: true }]); after(170, nextLine); return; }
      let ci = 0;
      const typeChar = () => {
        ci++;
        if (line.t[ci - 1] !== " ") tick();
        setCur({ t: line.t.slice(0, ci), c: line.c });
        if (ci < line.t.length) after(26 + Math.random() * 26, typeChar);
        else { setDone((d) => [...d, line]); setCur(null); after(320, nextLine); }
      };
      typeChar();
    };
    after(450, nextLine);
    return () => { cancelled = true; timers.forEach(window.clearTimeout); try { sndRef.current?.close(); } catch { /* noop */ } };
  }, []);

  const skip = () => { sndRef.current?.resume?.().catch(() => {}); setFading(true); window.setTimeout(onDone, 250); };

  return (
    <div className={"boot-root" + (fading ? " boot-fade" : "")} onClick={skip}>
      <div className="boot-inner">
        {done.map((l, i) => (l.gap ? <div className="boot-gap" key={i} /> : <div className={l.c} key={i}>{l.c === "boot-sub" ? l.t : "> " + l.t}</div>))}
        {cur && <div className={cur.c}>{cur.c === "boot-sub" ? cur.t : "> " + cur.t}<span className="boot-caret" /></div>}
      </div>
      <div className="boot-skip">點擊跳過 · click to skip</div>
    </div>
  );
}
