import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCq9yxdN8e9-d9DMeg85dkCUgYTgEP2PUA",
  authDomain: "fq-system.firebaseapp.com",
  projectId: "fq-system",
  storageBucket: "fq-system.firebasestorage.app",
  messagingSenderId: "679401909982",
  appId: "1:679401909982:web:6cdc1188f30fea09ffdc4f",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Load items array from Firestore. Returns null on miss or error.
export async function fsLoad(collection, docId) {
  try {
    const snap = await getDoc(doc(db, collection, docId));
    if (snap.exists()) return snap.data().items ?? null;
    return null;
  } catch (e) {
    console.warn(`Firestore load ${collection}/${docId}:`, e.message);
    return null;
  }
}

// Save items array to Firestore (fire-and-forget style).
export function fsSave(collection, docId, items) {
  setDoc(doc(db, collection, docId), {
    items,
    updatedAt: new Date().toISOString(),
  }).catch(e => console.warn(`Firestore save ${collection}/${docId}:`, e.message));
}
