// Cloud sync for the Quant Dashboard — reuses the project's existing Firebase
// (Google auth + per-user Firestore at users/{uid}/fq/{key}).
// Model: localStorage stays the live store; Firestore mirrors it per user, so
// settings + saved strategies follow you across devices. Login is optional.
import { signInWithGoogle, signOutUser, watchAuth, fsLoad, fsSave } from "../../firebase.js";

export { signInWithGoogle, signOutUser, watchAuth, fsLoad, fsSave };

// all the localStorage keys this dashboard owns
export const SETTINGS_KEYS = [
  "usstock_apikey",
  "usstock_fmpkey",
  "usstock_flow",
  "usstock_theme",
  "usstock_school",
  "usstock_selected",
  "usstock_weights",
  "usstock_universe",
  "usstock_home",
  "usstock_watchlists",
];

export const SETTINGS_DOC = "usstock_settings";
export const STRATEGIES_DOC = "usstock_strategies";

// snapshot localStorage settings into a plain object
export function gatherSettings() {
  const out = {};
  for (const k of SETTINGS_KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) out[k] = v;
  }
  return out;
}

// write a settings object back into localStorage
export function applySettings(obj) {
  if (!obj) return;
  for (const k of SETTINGS_KEYS) {
    if (obj[k] != null) localStorage.setItem(k, obj[k]);
  }
}
