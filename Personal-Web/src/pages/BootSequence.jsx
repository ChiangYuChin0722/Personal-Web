import React, { useEffect, useRef, useState } from "react";

// Terminal-style boot intro. Waits for one click to begin so the AudioContext
// is unlocked by a user gesture — that is what lets the typewriter ticks be heard
// (browsers block audio that starts without a gesture).
const LINES = [
  { t: "INITIALIZING CHIANGVERSE...", c: "boot-main" },
  { gap: true },
  { t: "TRANSMISSION RECEIVED", c: "boot-main" },
  { t: "Kai'ra Datax Vel", c: "boot-name" },
  { gap: true },
  { t: "May data guide your journey.", c: "boot-sub" },
];

export default function BootSequence({ onDone }) {
  const [armed, setArmed] = useState(false); // becomes true on the first click (audio unlocked)
  const [done, setDone] = useState([]); // completed lines
  const [cur, setCur] = useState(null); // { t, c } currently typing
  const [fading, setFading] = useState(false);
  const finishRef = useRef(() => {});
  const sndRef = useRef(null); // Web Audio for typewriter ticks (created in the click gesture)

  // short terminal "tick" per character
  const tick = () => {
    try {
      const s = sndRef.current;
      if (!s || s.state !== "running") return;
      const o = s.createOscillator(), g = s.createGain();
      o.type = "square"; o.frequency.value = 1100 + Math.random() * 500;
      g.gain.setValueAtTime(0.0001, s.currentTime); g.gain.exponentialRampToValueAtTime(0.04, s.currentTime + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, s.currentTime + 0.05);
      o.connect(g); g.connect(s.destination); o.start(); o.stop(s.currentTime + 0.06);
    } catch { /* noop */ }
  };

  finishRef.current = () => { setFading(true); window.setTimeout(onDone, 650); };

  // typewriter — runs once the user has clicked to begin
  useEffect(() => {
    if (!armed) return;
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
    after(350, nextLine);
    return () => { cancelled = true; timers.forEach(window.clearTimeout); };
  }, [armed]);

  useEffect(() => () => { try { sndRef.current?.close(); } catch { /* noop */ } }, []);

  // first click: unlock audio (create the context inside the gesture) + start typing
  const begin = () => {
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC) { sndRef.current = new AC(); sndRef.current.resume?.().catch(() => {}); } } catch { /* noop */ }
    setArmed(true);
  };
  const skip = () => { setFading(true); window.setTimeout(onDone, 250); };

  return (
    <div className={"boot-root" + (fading ? " boot-fade" : "")} onClick={() => (armed ? skip() : begin())}>
      {!armed ? (
        <div className="boot-inner boot-begin">
          <div className="boot-main">&gt; CHIANGVERSE TERMINAL</div>
          <div className="boot-begin-hint">點擊進入 · click to begin<span className="boot-caret" /></div>
        </div>
      ) : (
        <div className="boot-inner">
          {done.map((l, i) => (l.gap ? <div className="boot-gap" key={i} /> : <div className={l.c} key={i}>{l.c === "boot-sub" ? l.t : "> " + l.t}</div>))}
          {cur && <div className={cur.c}>{cur.c === "boot-sub" ? cur.t : "> " + cur.t}<span className="boot-caret" /></div>}
        </div>
      )}
      {armed && <div className="boot-skip">點擊跳過 · click to skip</div>}
    </div>
  );
}
