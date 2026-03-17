import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { translations } from "./translations.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("dark");

  // Apply theme to <html> so CSS [data-theme] selectors work
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const t = useMemo(() => {
    return (key) => {
      const dict = translations[lang] || translations["en"];
      return dict[key] ?? key;
    };
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, theme, setTheme }),
    [lang, t, theme]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
