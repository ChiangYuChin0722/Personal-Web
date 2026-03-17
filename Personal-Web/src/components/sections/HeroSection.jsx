import React, { useState, useEffect } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import Modal from "../ui/Modal.jsx";

// Google brand colors cycling through name characters
const G_COLORS = ["#4285F4", "#EA4335", "#34A853", "#FBBC05"];

export default function HeroSection() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const nameChars = Array.from("江昱瑾");

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
      }, 55);
      return () => clearInterval(id);
    }, 900);
    return () => clearTimeout(timeout);
  }, [subtitleText]);

  return (
    <section id="home" className="section hero">
      <div className="hero-center">

        {/* Colorful name — each char a Google color */}
        <h1 className="hero-name">
          {nameChars.map((char, i) => (
            <span
              key={i}
              className="hero-char"
              style={{
                color: G_COLORS[i % G_COLORS.length],
                animationDelay: `${0.1 + i * 0.15}s`,
              }}
            >
              {char}
            </span>
          ))}
        </h1>

        <p className="hero-name-en">Yu-Jin Chiang</p>

        <p className="hero-sub">
          {displayed}
          <span className="typewriter-cursor" aria-hidden="true" />
        </p>

        <div className="hero-actions">
          <button className="primary" onClick={() => setOpen(true)}>
            {t("view_more")}
          </button>
        </div>

        <p className="hero-hint">{t("hero_hint")}</p>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator" aria-hidden="true">
        <span className="hero-scroll-label">scroll</span>
        <div className="hero-scroll-line" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="江昱瑾 / Yu-Jin Chiang">
        <p className="modal-text">{t("about_desc")}</p>
        <p className="modal-text muted">
          Use the navigation dots on the right to jump between sections.
        </p>
      </Modal>
    </section>
  );
}
