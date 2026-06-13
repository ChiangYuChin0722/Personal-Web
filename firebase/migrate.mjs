// One-time migration: copy the old shared data (collection `fq`) into the
// per-user structure used by the new web + mobile apps (`users/{uid}/fq`).
//
// Old:  fq/profiles, fq/surveys, fq/journals, fq/groups        (each { items, updatedAt })
// New:  users/{uid}/fq/profiles, .../surveys, .../journals, .../groups
//
// Usage:
//   1. Firebase console → Project settings → Service accounts → Generate new
//      private key. Save it as firebase/serviceAccountKey.json (git-ignored).
//   2. Find your UID: Firebase console → Authentication → Users → "User UID".
//   3. From the firebase/ folder:
//        npm install
//        node migrate.mjs --uid=THE_UID --dry     # preview, writes nothing
//        node migrate.mjs --uid=THE_UID           # actually copy
//        node migrate.mjs --uid=THE_UID --force   # overwrite existing target docs
//
// Notes:
//   - Old profile photos were stored locally only (stripped before upload), so
//     there are no photos in the old data to migrate. Re-add photos in the app.
//   - By default a target doc that already has items is left untouched (use
//     --force to overwrite). The source `fq/*` docs are never modified.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes('=') ? hit.split('=').slice(1).join('=') : true;
};
const uid = getArg('uid');
const dry = !!getArg('dry');
const force = !!getArg('force');
const KEYS = ['profiles', 'surveys', 'journals', 'groups'];

if (!uid || typeof uid !== 'string') {
  console.error('✗ Missing --uid=YOUR_FIREBASE_UID (Authentication → Users → User UID).');
  process.exit(1);
}

// ── Init admin SDK ──────────────────────────────────────────────────────────--
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));
} catch {
  console.error('✗ Could not read firebase/serviceAccountKey.json — see the header of this file for how to create it.');
  process.exit(1);
}
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Migrate ─────────────────────────────────────────────────────────────────--
async function run() {
  console.log(`\nMigrating fq/* → users/${uid}/fq/*  ${dry ? '(DRY RUN)' : ''}${force ? ' [FORCE]' : ''}\n`);
  let copied = 0, skipped = 0;

  for (const key of KEYS) {
    const srcSnap = await db.doc(`fq/${key}`).get();
    if (!srcSnap.exists) { console.log(`  • ${key}: no source doc, skipping`); continue; }

    const data = srcSnap.data() || {};
    const items = Array.isArray(data.items) ? data.items : [];

    const destRef = db.doc(`users/${uid}/fq/${key}`);
    const destSnap = await destRef.get();
    const destItems = destSnap.exists && Array.isArray(destSnap.data().items) ? destSnap.data().items : [];

    if (destItems.length > 0 && !force) {
      console.log(`  • ${key}: target already has ${destItems.length} items — SKIPPED (use --force to overwrite)`);
      skipped++;
      continue;
    }

    if (dry) {
      console.log(`  • ${key}: would copy ${items.length} items` + (destItems.length ? ` (overwriting ${destItems.length})` : ''));
    } else {
      await destRef.set({ items, updatedAt: new Date().toISOString(), migratedFrom: 'fq', migratedAt: new Date().toISOString() });
      console.log(`  • ${key}: copied ${items.length} items ✓`);
    }
    copied++;
  }

  console.log(`\nDone. ${dry ? 'Previewed' : 'Copied'} ${copied} doc(s), skipped ${skipped}.`);
  if (dry) console.log('Re-run without --dry to apply.');
}

run().catch(e => { console.error('✗ Migration failed:', e); process.exit(1); });
