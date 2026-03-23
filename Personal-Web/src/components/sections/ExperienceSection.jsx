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
              {x.logo && (
                <img
                  src={x.logo}
                  alt={x.company[lang]}
                  className="timeline-logo"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <div className="timeline-period">
                {x.period[lang]}{x.location ? ` · ${x.location[lang]}` : ""}
              </div>
              <div className="timeline-company">{x.company[lang]}</div>
              <div className="timeline-role">{x.role[lang]}</div>
              {x.bullets?.[lang]?.length > 0 && (
                <ul className="timeline-bullets">
                  {x.bullets[lang].map((b, j) => (
                    <li key={j} className="timeline-bullet">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
