import React from "react";

export default function SectionHeader({ titleZh, titleEn, descZh, descEn }) {
  return (
    <div className="section-header">
      <h2 className="section-title">
        {titleZh} <span className="muted">/ {titleEn}</span>
      </h2>
      {(descZh || descEn) && (
        <p className="section-desc">
          {descZh} {descEn ? <span className="muted"> {descEn}</span> : null}
        </p>
      )}
    </div>
  );
}
