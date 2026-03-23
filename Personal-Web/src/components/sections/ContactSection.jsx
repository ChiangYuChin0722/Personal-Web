import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import { contacts } from "../../data/contacts.js";

export default function ContactSection() {
  const { t } = useI18n();

  const btns = [
    { key: "contact_email", href: contacts.email, icon: "✉" },
    { key: "contact_linkedin", href: contacts.linkedin, icon: "in" },
    { key: "contact_github", href: contacts.github, icon: "⌥" },
    { key: "contact_leetcode", href: contacts.leetcode, icon: "⚡" },
    { key: "contact_ig", href: contacts.ig, icon: "◎" },
  ];

  return (
    <section id="contact" className="section">
      <SectionHeader titleZh={t("contact_title")} titleEn="Contact" />

      <div className="contact-row">
        {btns.map((b) => (
          <a key={b.key} className="contact-btn" href={b.href} target="_blank" rel="noreferrer">
            <span className="contact-btn-icon">{b.icon}</span>
            {t(b.key)}
          </a>
        ))}
      </div>

      <div className="footer-note muted">
        © {new Date().getFullYear()} — Built with a little magic.
      </div>
    </section>
  );
}
