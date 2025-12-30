import React, { useMemo, useState } from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";
import SectionHeader from "../ui/SectionHeader.jsx";
import CardGrid from "../ui/CardGrid.jsx";
import Modal from "../ui/Modal.jsx";
import { certificates } from "../../data/certificates.js";

export default function CertificatesSection() {
  const { lang, t } = useI18n();
  const [active, setActive] = useState(null);

  const items = useMemo(() => {
    return certificates.map((c) => ({
      id: c.id,
      title: c.title[lang],
      brief: c.brief[lang],
      image: c.image,
    }));
  }, [lang]);

  return (
    <section id="certificates" className="section">
      <SectionHeader titleZh={t("certificates_title")} titleEn="Certificates" />

      <CardGrid items={items} onClick={setActive} />

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title}>
        {active && (
          <div className="image-card">
            <img src={active.image} alt={active.title} />
          </div>
        )}
      </Modal>
    </section>
  );
}
