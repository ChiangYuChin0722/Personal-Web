import React, { useState, useEffect } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import Modal from "../ui/Modal.jsx";

export default function HeroSection() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  const nameZh = "江昱瑾";
  const nameEn = "Yu-Jin Chiang";

  // Typewriter — delayed to sync with name entrance animation
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
      }, 48);
      return () => clearInterval(id);
    }, 1400); // starts after name finishes appearing
    return () => clearTimeout(timeout);
  }, [subtitleText]);

  return (
    <section id="home" className="section hero">
      {/* Ambient glow */}
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-center">
        <div className="hero-ornament">✦ · · · ✦</div>

        <h1 className="hero-name">
          {nameZh}
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
