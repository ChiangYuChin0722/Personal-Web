import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK, LIGHT } from './theme';

// Theme (dark/light) + language (zh/en), persisted, matching the web app's
// dark-mode toggle and EN/中 switch.
const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

export function UIProvider({ children }) {
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState('zh');

  useEffect(() => {
    (async () => {
      try {
        const d = await AsyncStorage.getItem('fq_dark');
        const l = await AsyncStorage.getItem('fq_lang');
        if (d !== null) setDark(d !== 'false');
        if (l) setLang(l);
      } catch {}
    })();
  }, []);

  const toggleDark = () => setDark(v => { AsyncStorage.setItem('fq_dark', String(!v)).catch(() => {}); return !v; });
  const toggleLang = () => setLang(v => { const n = v === 'zh' ? 'en' : 'zh'; AsyncStorage.setItem('fq_lang', n).catch(() => {}); return n; });
  const t = (zh, en) => (lang === 'zh' ? zh : en);
  const C = dark ? DARK : LIGHT;

  return <UICtx.Provider value={{ C, dark, lang, toggleDark, toggleLang, t }}>{children}</UICtx.Provider>;
}
