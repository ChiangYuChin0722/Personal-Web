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

      <div className="table">
        <div className="row head">
          <div>{t("exp_period")}</div>
          <div>{t("exp_company")}</div>
          <div>{t("exp_role")}</div>
        </div>
        {experience.map((x) => (
          <div className="row" key={x.id}>
            <div>{x.period[lang]}</div>
            <div>{x.company[lang]}</div>
            <div>{x.role[lang]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
