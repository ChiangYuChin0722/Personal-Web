import React, { useMemo, useState, useEffect } from "react";

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
  const [bgModal, setBgModal] = useState(null);
  const [atTop, setAtTop] = useState(true);

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

  // Transparent topbar when at top of page
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveal — IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const targets = document.querySelectorAll(".section, .reveal");
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <FloatingFrames count={7} onFrameClick={() => setBgModal(bgInfo)} />

      <header className={`topbar${atTop ? " at-top" : ""}`}>
        <div className="brand">
          <span>江</span><span>昱</span><span>瑾</span>
        </div>
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
