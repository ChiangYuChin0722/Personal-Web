import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import { education } from "../../data/education";

export default function EducationSection() {
  const { lang, t } = useI18n();

  return (
    <section id="education" className="section">
      <SectionHeader
        titleZh={t("education_title")}
        titleEn="Education"
      />

      <div className="timeline">
        {education.map((e, i) => (
          <div
            key={e.id}
            className={`timeline-item reveal reveal-delay-${i + 1}`}
          >
            <div className="timeline-dot" />
            <div className="timeline-card">
              {e.logo && (
                <img
                  src={e.logo}
                  alt={e.school[lang]}
                  className="timeline-logo"
                  onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                />
              )}
              <div className="timeline-period">
                {e.period[lang]}{e.location ? ` · ${e.location[lang]}` : ""}
              </div>
              <div className="timeline-school">{e.school[lang]}</div>
              <div className="timeline-major">{e.major[lang]}</div>
              {e.gpa && (
                <div className="timeline-gpa">
                  {t("edu_gpa")}: {e.gpa[lang]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
