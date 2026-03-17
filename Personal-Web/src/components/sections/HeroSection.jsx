import React, { useState, useEffect } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import Modal from "../ui/Modal.jsx";

export default function HeroSection() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

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
    }, 750);
    return () => clearTimeout(timeout);
  }, [subtitleText]);

  const badgeText = lang === "zh-Hant" ? "開放求職機會" : "Open to opportunities";

  return (
    <section id="home" className="section hero">
      <div className="hero-center">

        {/* Status badge */}
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {badgeText}
        </div>

        {/* Name — switches with language */}
        <h1 className="hero-name">
          {lang === "zh-Hant" ? "江昱瑾" : "Yu-Chin Chiang"}
        </h1>

        {/* Secondary name in the other language */}
        <p className="hero-name-en">
          {lang === "zh-Hant" ? "Yu-Chin Chiang" : "江昱瑾"}
        </p>

        {/* Typewriter subtitle */}
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
          {lang === "zh-Hant"
            ? "使用右側導覽點跳轉各區塊。"
            : "Use the navigation dots on the right to jump between sections."}
        </p>
      </Modal>
    </section>
  );
}
