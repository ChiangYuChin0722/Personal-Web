import React, { createContext, useContext, useState } from "react";

// Lightweight i18n for the dashboard. Default English; toggle persists to
// localStorage (and is part of the cloud-synced settings via SETTINGS_KEYS).
// Usage in components: const { t, lang } = useLang();  t("English", "中文")
const LangCtx = createContext({ lang: "en", setLang: () => {}, t: (en) => en });

// module-level mirror so non-component code (interpret.js, catalogs) can read it
let CURRENT = (typeof localStorage !== "undefined" && localStorage.getItem("usstock_lang")) || "en";
export function getLang() {
  return CURRENT;
}
// pick from a {en, zh} pair or two args
export function tr(en, zh) {
  return CURRENT === "zh" ? zh : en;
}

// resolve a value that may be a {en, zh} object (used by data modules so
// catalogs can carry both languages). Reactive because language changes
// re-render consumers via context, and CURRENT is updated before that.
export function L(field) {
  if (field && typeof field === "object" && !Array.isArray(field)) {
    return field[CURRENT] ?? field.en ?? field.zh ?? "";
  }
  return field;
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(CURRENT);
  const setLang = (l) => {
    CURRENT = l;
    setLangState(l);
    localStorage.setItem("usstock_lang", l);
  };
  const t = (en, zh) => (lang === "zh" ? zh : en);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
