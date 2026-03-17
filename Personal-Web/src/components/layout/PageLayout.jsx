import React, { useState, useEffect } from "react";

import SideNav from "./SideNav.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

import HeroSection from "../sections/HeroSection.jsx";
import AboutSection from "../sections/AboutSection.jsx";
import EducationSection from "../sections/EducationSection.jsx";
import ExperienceSection from "../sections/ExperienceSection.jsx";
import CertificatesSection from "../sections/CertificatesSection.jsx";
import PortfolioSection from "../sections/PortfolioSection.jsx";
import ContactSection from "../sections/ContactSection.jsx";

export default function PageLayout() {
  const [atTop, setAtTop] = useState(true);

  // Transparent topbar when at top
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
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".section, .reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <header className={`topbar${atTop ? " at-top" : ""}`}>
        <div className="brand">
          YJ<span className="brand-dot">.</span>
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
    </div>
  );
}
