import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogleIdToken } from './firebase';

WebBrowser.maybeCompleteAuthSession();

// OAuth client IDs from Google Cloud / Firebase console.
// Create them at: console.cloud.google.com → APIs & Services → Credentials.
// See mobile/README.md for the exact steps. Replace the placeholders below.
const GOOGLE_CLIENT_IDS = {
  expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
};

export function useGoogleAuth() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(GOOGLE_CLIENT_IDS);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        signInWithGoogleIdToken(idToken)
          .catch(e => setError(e.message || 'Sign-in failed.'))
          .finally(() => setBusy(false));
      } else {
        setBusy(false);
        setError('No ID token returned from Google.');
      }
    } else if (response.type === 'error') {
      setBusy(false);
      setError(response.error?.message || 'Sign-in failed.');
    } else {
      // dismiss / cancel
      setBusy(false);
    }
  }, [response]);

  const signIn = async () => {
    setError(''); setBusy(true);
    try { await promptAsync(); }
    catch (e) { setBusy(false); setError(e.message || 'Sign-in failed.'); }
  };

  return { signIn, busy: busy || !request, error, ready: !!request };
}
