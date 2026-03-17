import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";

const items = [
  { id: "home", key: "nav_home" },
  { id: "about", key: "nav_about" },
  { id: "education", key: "nav_education" },
  { id: "experience", key: "nav_experience" },
  { id: "certificates", key: "nav_certificates" },
  { id: "portfolio", key: "nav_portfolio" },
  { id: "contact", key: "nav_contact" },
];

export default function SideNav() {
  const { t } = useI18n();

  return (
    <nav className="sidenav" aria-label="Section navigation">
      {items.map((it) => (
        <a key={it.id} className="sidenav-link" href={`#${it.id}`} aria-label={t(it.key)} title={t(it.key)}>
          <span className="sidenav-label">{t(it.key)}</span>
        </a>
      ))}
    </nav>
  );
}
