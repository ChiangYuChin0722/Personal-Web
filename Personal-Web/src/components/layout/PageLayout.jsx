import React, { useMemo, useState } from "react";

import SideNav from "./SideNav.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

import FloatingFrames from "../background/FloatingFrames.jsx";

import HeroSection from "../sections/HeroSection.jsx";
import AboutSection from "../sections/AboutSection.jsx";
import EducationSection from "../sections/EducationSection.jsx";
import ExperienceSection from "../sections/ExperienceSection.jsx";
import CertificatesSection from "../sections/CertificatesSection.jsx";
import PortfolioSection from "../sections/PortfolioSection.jsx";
import ContactSection from "../sections/ContactSection.jsx";


export default function PageLayout() {
  // 每個區塊共用：背景漂浮相框 + 點擊也可跳 modal
  const [bgModal, setBgModal] = useState(null);

  const bgInfo = useMemo(
    () => ({
      title: { "zh-Hant": "漂浮相框", en: "Floating Frame" },
      body: {
        "zh-Hant": "你點到的是背景相框。你也可以把它改成放彩蛋、公告或個人亮點。",
        en: "You clicked a background frame. You can turn this into easter eggs, announcements, or highlights.",
      },
    }),
    []
  );

  return (
    <div className="page">
      <FloatingFrames count={7} onFrameClick={() => setBgModal(bgInfo)} />

      <header className="topbar">
        <div className="brand">✦</div>
        <LanguageSwitcher />
      </header>

      <SideNav />

      <main className="content">
        <HeroSection />
        <AboutSection />
        <EducationSection />
        <ExperienceSection />
        <CertificatesSection />
        <PortfolioSection />
        <ContactSection />
      </main>

      {/* 背景的 modal（可選） */}
      {bgModal && (
        <div className="modal-backdrop" onMouseDown={() => setBgModal(null)}>
          <div className="modal-shell" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setBgModal(null)} aria-label="Close">
              ✕
            </button>
            <h3 className="modal-title">{bgModal.title["zh-Hant"]} / {bgModal.title.en}</h3>
            <p className="modal-text">{bgModal.body["zh-Hant"]}</p>
            <p className="modal-text muted">{bgModal.body.en}</p>
          </div>
        </div>
      )}
    </div>
  );
}
