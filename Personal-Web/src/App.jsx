import React from "react";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import PageLayout from "./components/layout/PageLayout.jsx";

export default function App() {
  return (
    <LanguageProvider>
      <PageLayout />
    </LanguageProvider>
  );
}
