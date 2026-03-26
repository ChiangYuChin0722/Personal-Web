import React, { useState, useEffect } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import Modal from "../ui/Modal.jsx";

export default function HeroSection() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const nameZh = "江昱瑾";
  const nameEn = "Yu-Chin Chiang";

  // Typewriter effect — re-runs when language changes
  const subtitleText = t("hero_subtitle");
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(subtitleText.slice(0, i));
      if (i >= subtitleText.length) clearInterval(id);
    }, 48);
    return () => clearInterval(id);
  }, [subtitleText]);

  return (
    <section id="home" className="section hero">
      <div className="hero-center">
        <div className="hero-ornament">✦ · · · ✦</div>

        {/* Available badge */}
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {t("open_to")}
        </div>

        {/* Avatar */}
        <img
          src="/images/avatar.jpg"
          alt="Yu-Chin Chiang"
          className="hero-avatar hero-avatar--clickable"
          onClick={() => setPhotoOpen(true)}
        />

        <h1 className={`hero-name${lang === "zh-Hant" ? " hero-name--cjk" : ""}`}>
          {lang === "zh-Hant" ? nameZh : nameEn}
        </h1>
        {lang === "zh-Hant" && (
          <p className="hero-name-sub">{nameEn}</p>
        )}

        <p className="hero-sub">
          {displayed}
          <span className="typewriter-cursor" aria-hidden="true" />
        </p>

        <div className="hero-divider" />

        <div className="hero-actions">
          <button className="primary" onClick={() => setOpen(true)}>
            {t("view_more")}
          </button>
        </div>

        <p className="hero-hint">{t("hero_hint")}</p>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator">
        <span className="hero-scroll-label">scroll</span>
        <span className="hero-scroll-line" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={lang === "zh-Hant" ? nameZh : nameEn}>
        <p className="modal-text">{t("about_desc")}</p>
        <p className="modal-text muted">{t("hero_hint")}</p>
      </Modal>

      {/* Photo lightbox */}
      {photoOpen && (
        <div className="photo-backdrop" onClick={() => setPhotoOpen(false)}>
          <img
            src="/images/avatar.jpg"
            alt="Yu-Chin Chiang"
            className="photo-lightbox"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
