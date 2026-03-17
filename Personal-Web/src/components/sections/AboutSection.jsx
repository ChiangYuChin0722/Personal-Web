import React, { useMemo, useState } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import CardGrid from "../ui/CardGrid.jsx";
import Modal from "../ui/Modal.jsx";
import { profileCards } from "../../data/profileCards.js";

const skillsData = {
  "zh-Hant": [
    "Python", "SQL", "Java", "JavaScript", "React",
    "Databricks", "AWS", "Pandas", "NumPy", "scikit-learn",
    "時間序列分析", "迴歸分析", "A/B 測試",
    "Tableau", "Power BI", "ETL 管道", "資料建模",
  ],
  en: [
    "Python", "SQL", "Java", "JavaScript", "React",
    "Databricks", "AWS", "Pandas", "NumPy", "scikit-learn",
    "Time-Series Analysis", "Regression", "A/B Testing",
    "Tableau", "Power BI", "ETL Pipelines", "Data Modelling",
  ],
};

export default function AboutSection() {
  const { lang, t } = useI18n();
  const [active, setActive] = useState(null);

  const items = useMemo(() => {
    return profileCards.map((c) => ({
      id: c.id,
      icon: c.icon,
      title: c.titleKey[lang],
      brief: c.briefKey[lang],
      full: c.contentKey[lang],
      zh: c.contentKey["zh-Hant"],
      en: c.contentKey.en,
    }));
  }, [lang]);

  return (
    <section id="about" className="section">
      <SectionHeader
        titleZh={t("about_title")}
        titleEn="About"
        descZh={t("about_desc")}
        descEn=""
      />

      <CardGrid items={items} onClick={setActive} bento />

      <div className="skills-section reveal">
        <div className="skills-label">Skills &amp; Tools</div>
        <div className="skills-tags">
          {skillsData[lang].map((skill) => (
            <span key={skill} className="skill-tag">{skill}</span>
          ))}
        </div>
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `${active.title}` : ""}
      >
        {active && (
          <>
            <p className="modal-text">{active.zh}</p>
            <p className="modal-text muted">{active.en}</p>
          </>
        )}
      </Modal>
    </section>
  );
}
