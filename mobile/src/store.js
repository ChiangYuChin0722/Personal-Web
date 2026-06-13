import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  watchAuth, signOutUser, fsLoad, fsSave, uploadPhoto,
} from './firebase';
import { genId } from './fqcore';
import { demoProfiles, demoSurveys, demoJournals } from './demoData';

// Set to true to skip Google sign-in and load sample data — handy for previewing
// the app in a simulator before OAuth is configured. Keep false for real use.
export const DEMO_MODE = false;

const StoreCtx = createContext(null);
export const useStore = () => useContext(StoreCtx);

// Per-user AsyncStorage cache keys keep accounts separate on the same device.
const ck = (uid, name) => `fq_${name}_${uid}`;

async function cacheGet(uid, name, def) {
  try {
    const raw = await AsyncStorage.getItem(ck(uid, name));
    return raw ? JSON.parse(raw) : def;
  } catch { return def; }
}
function cacheSet(uid, name, val) {
  AsyncStorage.setItem(ck(uid, name), JSON.stringify(val)).catch(() => {});
}

export function StoreProvider({ children }) {
  const [user, setUser] = useState(DEMO_MODE ? { uid: 'demo', displayName: 'Demo' } : undefined);
  const uid = user?.uid || null;

  const [profiles, setProfiles] = useState(DEMO_MODE ? demoProfiles : []);
  const [surveys, setSurveys] = useState(DEMO_MODE ? demoSurveys : []);
  const [journals, setJournals] = useState(DEMO_MODE ? demoJournals : []);
  const [customGroups, setCustomGroups] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const fsReady = useRef(false);

  useEffect(() => { if (DEMO_MODE) return; return watchAuth(u => setUser(u || null)); }, []);

  // Load this user's data from Firestore (with cache) once signed in.
  useEffect(() => {
    if (DEMO_MODE || !uid) { fsReady.current = false; return; }
    let cancelled = false;
    fsReady.current = false;

    (async () => {
      setSyncing(true);
      const [cp, cs, cj, cg] = await Promise.all([
        fsLoad(uid, 'profiles'), fsLoad(uid, 'surveys'),
        fsLoad(uid, 'journals'), fsLoad(uid, 'groups'),
      ]);
      if (cancelled) return;

      const [lp, ls, lj, lg] = await Promise.all([
        cacheGet(uid, 'profiles', []), cacheGet(uid, 'surveys', []),
        cacheGet(uid, 'journals', []), cacheGet(uid, 'groups', []),
      ]);
      if (cancelled) return;

      const safeMerge = (cloud, local) =>
        (cloud !== null && (local.length === 0 || cloud.length >= local.length)) ? cloud : local;

      const fp = safeMerge(cp, lp), fs = safeMerge(cs, ls);
      const fj = safeMerge(cj, lj), fg = safeMerge(cg, lg);
      setProfiles(fp); setSurveys(fs); setJournals(fj); setCustomGroups(fg);

      if (cp === null || lp.length > (cp?.length ?? 0)) fsSave(uid, 'profiles', fp);
      if (cs === null || ls.length > (cs?.length ?? 0)) fsSave(uid, 'surveys', fs);
      if (cj === null || lj.length > (cj?.length ?? 0)) fsSave(uid, 'journals', fj);
      if (cg === null || lg.length > (cg?.length ?? 0)) fsSave(uid, 'groups', fg);

      fsReady.current = true;
      setSyncing(false);
    })();
    return () => { cancelled = true; };
  }, [uid]);

  // Persist on change (skipped entirely in demo mode).
  useEffect(() => { if (DEMO_MODE || !uid) return; cacheSet(uid, 'profiles', profiles); if (fsReady.current) fsSave(uid, 'profiles', profiles); }, [profiles, uid]);
  useEffect(() => { if (DEMO_MODE || !uid) return; cacheSet(uid, 'surveys', surveys);  if (fsReady.current) fsSave(uid, 'surveys', surveys);  }, [surveys, uid]);
  useEffect(() => { if (DEMO_MODE || !uid) return; cacheSet(uid, 'journals', journals); if (fsReady.current) fsSave(uid, 'journals', journals); }, [journals, uid]);
  useEffect(() => { if (DEMO_MODE || !uid) return; cacheSet(uid, 'groups', customGroups); if (fsReady.current) fsSave(uid, 'groups', customGroups); }, [customGroups, uid]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const saveProfile = useCallback(async (profile) => {
    const id = profile.id || genId();
    let photo = profile.photo || null;
    if (!DEMO_MODE && photo && !photo.startsWith('http')) {
      try { photo = await uploadPhoto(uid, id, photo); }
      catch (e) { console.warn('Photo upload failed:', e.message); }
    }
    const clean = { ...profile, id, photo, createdAt: profile.createdAt || new Date().toISOString() };
    setProfiles(prev => prev.some(p => p.id === id)
      ? prev.map(p => (p.id === id ? clean : p))
      : [...prev, clean]);
    return clean;
  }, [uid]);

  const deleteProfile = useCallback((pid) => {
    setProfiles(prev => prev.filter(p => p.id !== pid));
    setSurveys(prev => prev.filter(s => s.profileId !== pid));
    setJournals(prev => prev.filter(j => j.profileId !== pid));
  }, []);

  const addSurvey = useCallback((survey) => setSurveys(prev => [...prev, survey]), []);

  const addJournal = useCallback((entry) => {
    setJournals(prev => [entry, ...prev]);
    if (entry.keyEvent) {
      const ke = { id: genId(), year: entry.keyEvent.year, text: entry.keyEvent.text };
      setProfiles(prev => prev.map(p =>
        p.id !== entry.profileId ? p : { ...p, keyEvents: [...(p.keyEvents || []), ke] }));
    }
  }, []);

  const addGroup = useCallback((g) => setCustomGroups(prev => [...prev, g]), []);

  // Wipe everything (used by the "clear all / remove sample data" button).
  const clearAll = useCallback(() => {
    setProfiles([]); setSurveys([]); setJournals([]); setCustomGroups([]);
  }, []);

  const latestSurvey = useCallback((pid) => {
    const ps = surveys.filter(s => s.profileId === pid);
    if (!ps.length) return null;
    return ps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }, [surveys]);

  const value = {
    user, uid, syncing,
    profiles, surveys, journals, customGroups,
    saveProfile, deleteProfile, addSurvey, addJournal, addGroup, latestSurvey, clearAll,
    signOut: () => (DEMO_MODE ? Promise.resolve() : signOutUser()),
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
