import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import { experience } from "../../data/experience";

export default function ExperienceSection() {
  const { lang, t } = useI18n();

  return (
    <section id="experience" className="section">
      <SectionHeader
        titleZh={t("experience_title")}
        titleEn="Experience"
      />

      <div className="timeline">
        {experience.map((x, i) => (
          <div
            key={x.id}
            className={`timeline-item reveal reveal-delay-${Math.min(i + 1, 4)}`}
          >
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div className="timeline-period">{x.period[lang]}</div>
              <div className="timeline-company">{x.company[lang]}</div>
              <div className="timeline-role">{x.role[lang]}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
