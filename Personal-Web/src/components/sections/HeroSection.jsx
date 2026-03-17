import React, { useState, useEffect, useMemo } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import Modal from "../ui/Modal.jsx";

// Deterministic particles — no random re-renders
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: 5  + ((i * 47 + 11) % 90),
  top:  10 + ((i * 61 +  7) % 75),
  size: 1.5 + (i % 3) * 0.9,
  delay: (i * 0.38) % 5,
  duration: 8 + (i % 6) * 1.5,
}));

export default function HeroSection() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const nameZh   = "江昱瑾";
  const nameEn   = "Yu-Jin Chiang";
  const nameChars = Array.from(nameZh);

  // Typewriter — starts after char-reveal finishes
  const subtitleText = t("hero_subtitle");
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    const timeout = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i++;
        setDisplayed(subtitleText.slice(0, i));
        if (i >= subtitleText.length) clearInterval(id);
      }, 50);
      return () => clearInterval(id);
    }, 1700);
    return () => clearTimeout(timeout);
  }, [subtitleText]);

  // 3D perspective tilt on mouse move
  useEffect(() => {
    const onMove = (e) => {
      setTilt({
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section id="home" className="section hero">

      {/* Aurora colour washes */}
      <div className="hero-aurora" aria-hidden="true" />

      {/* Floating particles */}
      <div className="hero-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="hero-particle"
            style={{
              left:             `${p.left}%`,
              top:              `${p.top}%`,
              width:            `${p.size}px`,
              height:           `${p.size}px`,
              animationDelay:   `${p.delay}s`,
              animationDuration:`${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Glow blob — follows mouse */}
      <div
        className="hero-glow"
        aria-hidden="true"
        style={{
          transform: `translate(calc(-50% + ${tilt.x * 45}px), calc(-50% + ${tilt.y * 32}px))`,
          transition: "transform 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />

      {/* Content — 3D perspective tilt */}
      <div
        className="hero-center"
        style={{
          transform:  `perspective(900px) rotateY(${tilt.x * 6}deg) rotateX(${-tilt.y * 4}deg)`,
          transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <div className="hero-ornament">✦ · · · ✦</div>

        <h1 className="hero-name">
          {/* data-text used by glitch pseudo-elements */}
          <span className="hero-name-zh" data-text={nameZh}>
            {nameChars.map((char, i) => (
              <span
                key={i}
                className="hero-char"
                style={{ animationDelay: `${0.45 + i * 0.2}s` }}
              >
                {char}
              </span>
            ))}
          </span>
          <span className="hero-name-en">/ {nameEn}</span>
        </h1>

        <p className="hero-sub">
          {displayed}
          <span className="typewriter-cursor" aria-hidden="true" />
        </p>

        <div className="hero-divider" />

        <div className="hero-actions">
          <button className="primary" onClick={() => setOpen(true)}>
            {t("view_more")} / View
          </button>
        </div>

        <p className="hero-hint">{t("hero_hint")}</p>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator" aria-hidden="true">
        <span className="hero-scroll-label">SCROLL</span>
        <div className="hero-scroll-line" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`${nameZh} / ${nameEn}`}>
        <p className="modal-text">{t("about_desc")}</p>
        <p className="modal-text muted">
          Click the right-side menu to jump between sections.
        </p>
      </Modal>
    </section>
  );
}
