import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCq9yxdN8e9-d9DMeg85dkCUgYTgEP2PUA",
  authDomain: "fq-system.firebaseapp.com",
  projectId: "fq-system",
  storageBucket: "fq-system.firebasestorage.app",
  messagingSenderId: "679401909982",
  appId: "1:679401909982:web:6cdc1188f30fea09ffdc4f",
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
const storage = getStorage(app);

export { auth };

// ─── Auth (Google) ────────────────────────────────────────────────────────────

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

// Subscribe to auth changes. Returns an unsubscribe fn.
export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

// ─── Per-user Firestore (users/{uid}/fq/{key}) ──────────────────────────────────

// Load an array from Firestore. Returns null on miss or error.
export async function fsLoad(uid, key) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'fq', key));
    if (snap.exists()) return snap.data().items ?? null;
    return null;
  } catch (e) {
    console.warn(`Firestore load ${uid}/${key}:`, e.message);
    return null;
  }
}

// Save an array to Firestore (fire-and-forget).
export function fsSave(uid, key, items) {
  if (!uid) return;
  setDoc(doc(db, 'users', uid, 'fq', key), { items, updatedAt: new Date().toISOString() })
    .catch(e => console.warn(`Firestore save ${uid}/${key}:`, e.message));
}

// ─── Public Chiangverse shooter leaderboard (public/cv_shooter) ────────────────

// Top N fastest "clear all targets" runs, ascending by time. Null on error.
export async function lbTop(n = 5) {
  try {
    const snap = await getDoc(doc(db, 'public', 'cv_shooter'));
    const scores = (snap.exists() && snap.data().scores) || [];
    return scores.slice().sort((a, b) => a.timeMs - b.timeMs).slice(0, n);
  } catch (e) {
    console.warn('lbTop:', e.message);
    return null;
  }
}

// Append a run and keep the global top 20. Returns the new top 5, or null on error.
export async function lbSubmit(entry) {
  try {
    const ref = doc(db, 'public', 'cv_shooter');
    const snap = await getDoc(ref);
    const scores = (snap.exists() && snap.data().scores) || [];
    scores.push(entry);
    scores.sort((a, b) => a.timeMs - b.timeMs);
    const top = scores.slice(0, 20);
    await setDoc(ref, { scores: top });
    return top.slice(0, 5);
  } catch (e) {
    console.warn('lbSubmit:', e.message);
    return null;
  }
}

// ─── Photo storage (Firebase Storage) ───────────────────────────────────────────

// Upload a base64 data-URL photo to Storage and return its download URL.
// If the value is already a remote URL (or empty), it is returned unchanged so
// re-saving an existing profile does not re-upload.
export async function uploadPhoto(uid, profileId, dataUrl) {
  if (!uid || !dataUrl || !dataUrl.startsWith('data:')) return dataUrl ?? null;
  const r = ref(storage, `users/${uid}/photos/${profileId}`);
  await uploadString(r, dataUrl, 'data_url');
  return await getDownloadURL(r);
}
