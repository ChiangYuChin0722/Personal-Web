import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { MOODS, genId } from '../fqcore';
import { C } from '../theme';

export default function LogScreen({ navigation, route }) {
  const { addJournal, profiles } = useStore();
  const profile = profiles.find(p => p.id === route.params.id);
  const today = new Date().toISOString().split('T')[0];

  const [mood, setMood] = useState('good');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);

  function save() {
    if (!text.trim()) return;
    addJournal({
      id: genId(), profileId: route.params.id, mood, date: today,
      text: text.trim(), createdAt: new Date().toISOString(), rating: rating || null, keyEvent: null,
    });
    navigation.goBack();
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.h1}>記錄互動{profile ? ` — ${profile.name}` : ''}</Text>

      <Text style={s.label}>今天跟他的感覺</Text>
      <View style={s.moodRow}>
        {MOODS.map(m => (
          <TouchableOpacity key={m.key} onPress={() => setMood(m.key)}
            style={[s.mood, mood === m.key && { borderColor: C.accent, backgroundColor: C.accent + '1A' }]}>
            <Text style={{ fontSize: 13, color: C.text }}>{m.icon} {m.zh}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>這次互動評分（選填）</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(rating === n ? 0 : n)}>
            <Text style={{ fontSize: 28, opacity: rating >= n ? 1 : 0.25 }}>⭐</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>近況 / 感受</Text>
      <TextInput style={s.textarea} value={text} onChangeText={setText} multiline
        placeholder="記錄最近的互動、對方的近況、你的感覺..." placeholderTextColor={C.dim} />

      <TouchableOpacity style={[s.save, !text.trim() && { opacity: 0.5 }]} onPress={save} disabled={!text.trim()}>
        <Text style={s.saveText}>✓ 儲存紀錄</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  h1: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 16 },
  label: { color: C.muted, fontSize: 13, marginTop: 20, marginBottom: 8 },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mood: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  textarea: { backgroundColor: C.bg1, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, color: C.text, fontSize: 15, minHeight: 110, textAlignVertical: 'top' },
  save: { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
