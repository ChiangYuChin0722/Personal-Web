import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  initializeAuth, getReactNativePersistence,
  GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same project as the web app — that is what makes the data sync between
// chianghebe.com and the mobile app.
const firebaseConfig = {
  apiKey: 'AIzaSyCq9yxdN8e9-d9DMeg85dkCUgYTgEP2PUA',
  authDomain: 'fq-system.firebaseapp.com',
  projectId: 'fq-system',
  storageBucket: 'fq-system.firebasestorage.app',
  messagingSenderId: '679401909982',
  appId: '1:679401909982:web:6cdc1188f30fea09ffdc4f',
};

const app = initializeApp(firebaseConfig);

// React Native needs AsyncStorage persistence so the session survives restarts.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

// ─── Auth ───────────────────────────────────────────────────────────────────

// Sign in with a Google ID token obtained from expo-auth-session.
export function signInWithGoogleIdToken(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export function signOutUser() {
  return signOut(auth);
}

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

// ─── Per-user Firestore (users/{uid}/fq/{key}) ────────────────────────────────

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

export function fsSave(uid, key, items) {
  if (!uid) return;
  setDoc(doc(db, 'users', uid, 'fq', key), { items, updatedAt: new Date().toISOString() })
    .catch(e => console.warn(`Firestore save ${uid}/${key}:`, e.message));
}

// ─── Photo storage ────────────────────────────────────────────────────────────

// Upload a local image (file:// URI) to Storage and return its download URL.
// Already-remote URLs are returned unchanged so re-saving does not re-upload.
export async function uploadPhoto(uid, profileId, uri) {
  if (!uid || !uri) return uri ?? null;
  if (uri.startsWith('http')) return uri;
  const res = await fetch(uri);
  const blob = await res.blob();
  const r = ref(storage, `users/${uid}/photos/${profileId}`);
  await uploadBytes(r, blob);
  return await getDownloadURL(r);
}
