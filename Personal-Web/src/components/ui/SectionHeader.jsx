import React from "react";

export default function SectionHeader({ titleZh, titleEn, descZh, descEn }) {
  return (
    <div className="section-header">
      <div className="section-header-row">
        <h2 className="section-title">
          {titleZh}
          {titleEn && <span className="section-title-en"> / {titleEn}</span>}
        </h2>
        <div className="section-divider-line" />
        <span className="section-ornament">✦</span>
      </div>
      {(descZh || descEn) && (
        <p className="section-desc">
          {descZh}
          {descEn ? <span className="muted"> {descEn}</span> : null}
        </p>
      )}
    </div>
  );
}
