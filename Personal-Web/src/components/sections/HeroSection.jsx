import React, { useState } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import Modal from "../ui/Modal.jsx";

export default function HeroSection() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // 你名字（雙語其實名字可同一個）
  const nameZh = "江昱瑾";
  const nameEn = "Yu-Jin Chiang";

  return (
    <section id="home" className="section hero">
      <div className="hero-center">
        <h1 className="hero-name">
          {nameZh}
          <span className="muted"> / {nameEn}</span>
        </h1>
        <p className="hero-sub">{t("hero_subtitle")}</p>

        <div className="hero-actions">
          <button className="primary" onClick={() => setOpen(true)}>
            {t("view_more")} / View
          </button>
        </div>

        <p className="hero-hint">{t("hero_hint")}</p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`${nameZh} / ${nameEn}`}>
        <p className="modal-text">
          {t("about_desc")}
        </p>
        <p className="modal-text muted">
          Click the right-side menu to jump between sections.
        </p>
      </Modal>
    </section>
  );
}
