import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";

export default function LanguageSwitcher() {
  const { lang, setLang, t, theme, setTheme } = useI18n();

  return (
    <div className="topbar-right">
      {/* Dark / light toggle */}
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? t("theme_light") : t("theme_dark")}
        title={theme === "dark" ? t("theme_light") : t("theme_dark")}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      {/* Language */}
      <div className="lang">
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label="Language"
        >
          <option value="en">{t("lang_en")}</option>
          <option value="zh-Hant">{t("lang_zh")}</option>
        </select>
      </div>
    </div>
  );
}
