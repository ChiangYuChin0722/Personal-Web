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

      <div className="table">
        <div className="row head">
          <div>{t("edu_school")}</div>
          <div>{t("edu_major")}</div>
          <div>{t("edu_period")}</div>
          <div>{t("edu_gpa")}</div>
        </div>
        {education.map((e) => (
          <div className="row" key={e.id}>
            <div>{e.school[lang]}</div>
            <div>{e.major[lang]}</div>
            <div>{e.period[lang]}</div>
            <div>{e.gpa[lang]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
