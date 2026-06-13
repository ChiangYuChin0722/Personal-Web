# Firebase config & data migration

Shared by the web app (`Personal-Web/`) and the mobile app (`mobile/`), all on
the `fq-system` Firebase project.

## Security rules
- `firestore.rules` — each user can only read/write `users/{uid}/**`.
- `storage.rules` — profile photos at `users/{uid}/photos/*`, owner-only, ≤5 MB images.

Paste each into the Firebase console (Firestore → Rules, Storage → Rules), or
deploy with the Firebase CLI.

## One-time data migration (`migrate.mjs`)

Moves your existing data from the old shared location `fq/*` to your personal
`users/{uid}/fq/*` so the new Google-login apps can see it.

```bash
cd firebase
npm install

# 1. Service account: Firebase console → Project settings → Service accounts →
#    Generate new private key → save as firebase/serviceAccountKey.json
# 2. Your UID: Firebase console → Authentication → Users → "User UID"

node migrate.mjs --uid=YOUR_UID --dry      # preview only
node migrate.mjs --uid=YOUR_UID            # copy (skips non-empty targets)
node migrate.mjs --uid=YOUR_UID --force    # overwrite existing target docs
```

Notes:
- Old profile photos were local-only (stripped before upload), so there are no
  photos in the old data — re-add them in the app afterwards.
- The source `fq/*` documents are never modified, so it's safe to re-run.
- `serviceAccountKey.json` is git-ignored — never commit it.
