import React, { useMemo, useState } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import CardGrid from "../ui/CardGrid.jsx";
import Modal from "../ui/Modal.jsx";
import { portfolio } from "../../data/portfolio.js";

export default function PortfolioSection() {
  const { lang, t } = useI18n();
  const [active, setActive] = useState(null);

  const items = useMemo(() => {
    return portfolio.map((p) => ({
      id: p.id,
      title: p.title[lang],
      brief: p.brief[lang],
      image: p.image,
      desc: p.desc[lang],
    }));
  }, [lang]);

  return (
    <section id="portfolio" className="section">
      <SectionHeader titleZh={t("portfolio_title")} titleEn="Portfolio" />

      <CardGrid items={items} onClick={setActive} />

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title}>
        {active && (
          <>
            <div className="image-card">
              <img src={active.image} alt={active.title} />
            </div>
            <p className="modal-text">{active.desc}</p>
          </>
        )}
      </Modal>
    </section>
  );
}
