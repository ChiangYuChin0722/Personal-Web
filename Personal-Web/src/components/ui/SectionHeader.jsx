import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";

export default function SectionHeader({ titleZh, titleEn, descZh, descEn }) {
  const { lang } = useI18n();
  const isZh = lang === "zh-Hant";

  return (
    <div className="section-header">
      <div className="section-header-row">
        <h2 className="section-title">
          {titleZh}
          {isZh && titleEn && <span className="section-title-en"> / {titleEn}</span>}
        </h2>
        <div className="section-divider-line" />
        <span className="section-ornament">✦</span>
      </div>
      {(descZh || descEn) && (
        <p className="section-desc">
          {isZh ? descZh : descEn}
        </p>
      )}
    </div>
  );
}
