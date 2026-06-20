# FQ System — Mobile (React Native / Expo)

The mobile version of the friend dashboard (`chianghebe.com/dashboard/friend`).
It talks to the **same Firebase project** (`fq-system`) as the web app, so all
data — friends, surveys, journals, groups and **photos** — syncs automatically
between web and mobile. Sign in with the same Google account on both.

## Stack
- Expo (React Native) — SDK 52
- Firebase JS SDK (Auth + Firestore + Storage), shared with the web app
- Google Sign-In via `expo-auth-session`
- `react-native-svg` for the radar chart, `@react-navigation` for screens

## What's implemented
- Google sign-in (session persisted via AsyncStorage)
- Dashboard: KPIs + friend list sorted by score, with tier badges
- Friend detail: latest score, friendship type, radar chart, interaction log
- Add / edit friend with photo (picked from library → uploaded to Storage)
- Friendship survey (24 questions) — scoring ported verbatim from the web
- Log an interaction (mood, rating, notes)
- Per-user data isolation: `users/{uid}/fq/{profiles|surveys|journals|groups}`

## Setup

### 1. Install
```bash
cd mobile
npm install
```

### 2. Firebase console (one-time, shared with web)
1. **Authentication → Sign-in method →** enable **Google**.
2. **Authentication → Settings → Authorized domains →** add `chianghebe.com`
   (for the web app) — Expo dev uses Google's OAuth flow directly.
3. **Firestore → Rules →** paste `firebase/firestore.rules` from this repo.
4. **Storage → Rules →** paste `firebase/storage.rules` from this repo.

### 3. Google OAuth client IDs (for the mobile app)
In **Google Cloud Console → APIs & Services → Credentials** (same project),
create OAuth 2.0 Client IDs and paste them into
`mobile/src/useGoogleAuth.js`:
- **Web client** (also used by Expo Go): `webClientId` / `expoClientId`
- **iOS client** (bundle id `com.chianghebe.fqsystem`): `iosClientId`
- **Android client** (package `com.chianghebe.fqsystem` + SHA-1): `androidClientId`

> Tip: the SHA-1 for a dev build comes from `eas credentials` (or
> `keytool -list -v -keystore ...`). For Expo Go testing, the web client ID is
> usually enough.

### 4. Run
```bash
npx expo start          # scan QR with Expo Go, or press i (iOS) / a (Android)
```

#### Quick preview without OAuth (DEMO_MODE)
To see the app running in a simulator before configuring Google sign-in, open
`src/store.js` and set `export const DEMO_MODE = true;`. This skips login and
loads sample friends/surveys/journals (no Firebase calls). Set it back to
`false` for real sign-in + sync.

### 5. Build installable apps (no Mac needed)
```bash
npm install -g eas-cli
eas login
eas build -p android    # .apk / .aab
eas build -p ios        # needs an Apple Developer account
```

## Notes / next steps
- The web app was migrated to the same Google-login + per-user structure in the
  same change, so the two stay in sync. Existing data created under the old
  shared `fq/*` collection is **not** auto-migrated to `users/{uid}/*`; if you
  had data there, run a one-off copy in the Firebase console.
- Not yet ported from web: key-event sharing, birthday list view, friend
  comparison, light mode, EN/ZH toggle. The scoring core (`src/fqcore.js`) is
  shared verbatim so adding these is straightforward.
