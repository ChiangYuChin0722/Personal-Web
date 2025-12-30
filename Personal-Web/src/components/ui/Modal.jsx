import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";

export default function Modal({ open, onClose, title, children }) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="modal-shell" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t("close")}>
          ✕
        </button>
        {title ? <h3 className="modal-title">{title}</h3> : null}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
