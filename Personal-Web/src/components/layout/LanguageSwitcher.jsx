import React from "react";
import { useI18n } from "../../i18n/LanguageContext.jsx";

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang">
      <label className="lang-label">{t("language")}</label>
      <select
        className="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Language"
      >
        <option value="zh-Hant">{t("lang_zh")}</option>
        <option value="en">{t("lang_en")}</option>
      </select>
    </div>
  );
}
