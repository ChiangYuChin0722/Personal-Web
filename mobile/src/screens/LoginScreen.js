import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useGoogleAuth } from '../useGoogleAuth';
import { useUI } from '../ui';

export default function LoginScreen() {
  const { signIn, busy, error } = useGoogleAuth();
  const { C } = useUI();
  const s = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={s.root}>
      <View style={s.box}>
        <Text style={{ fontSize: 34, marginBottom: 12 }}>🔐</Text>
        <Text style={s.title}>FQ SYSTEM</Text>
        <Text style={s.sub}>Friendship Quantification</Text>
        <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={signIn} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Sign in with Google</Text>}
        </TouchableOpacity>
        {!!error && <Text style={s.err}>{error}</Text>}
      </View>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 340, backgroundColor: C.bg1, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 28, alignItems: 'center' },
  title: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  sub: { color: C.muted, fontSize: 13, marginTop: 4, marginBottom: 24 },
  btn: { backgroundColor: C.accent, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  err: { color: C.danger, fontSize: 12, marginTop: 14, textAlign: 'center' },
});
