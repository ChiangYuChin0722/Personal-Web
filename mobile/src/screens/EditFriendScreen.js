import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { DEFAULT_GROUPS, getGroupById } from '../fqcore';
import { C } from '../theme';

export default function EditFriendScreen({ navigation, route }) {
  const { profiles, customGroups, saveProfile, deleteProfile } = useStore();
  const editing = route.params?.id ? profiles.find(p => p.id === route.params.id) : null;

  const [name, setName] = useState(editing?.name || '');
  const [photo, setPhoto] = useState(editing?.photo || null);
  const [groupId, setGroupId] = useState(editing?.groupId || '');
  const [since, setSince] = useState(editing?.since || '');
  const [busy, setBusy] = useState(false);

  const groups = [...DEFAULT_GROUPS, ...customGroups];

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('需要相簿權限才能選照片'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0].uri);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('請輸入名字'); return; }
    setBusy(true);
    const group = getGroupById(groupId, customGroups);
    const saved = await saveProfile({
      ...(editing || {}),
      id: editing?.id,
      name: name.trim(),
      photo,
      groupId,
      color: group ? group.color : '#60A5FA',
      since,
    });
    setBusy(false);
    navigation.replace('FriendDetail', { id: saved.id });
  }

  function handleDelete() {
    Alert.alert('刪除朋友', `確定要刪除 ${editing.name}？此動作無法復原。`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => { deleteProfile(editing.id); navigation.popToTop(); } },
    ]);
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.h1}>{editing ? '編輯資料' : '新增朋友'}</Text>

      <TouchableOpacity style={s.photo} onPress={pickPhoto}>
        {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%', borderRadius: 60 }} />
          : <Text style={s.photoHint}>點擊{'\n'}上傳</Text>}
      </TouchableOpacity>
      {photo && (
        <TouchableOpacity onPress={() => setPhoto(null)}><Text style={s.removePhoto}>移除照片</Text></TouchableOpacity>
      )}

      <Text style={s.label}>名字</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="朋友的名字" placeholderTextColor={C.dim} />

      <Text style={s.label}>分組</Text>
      <View style={s.chipRow}>
        {groups.map(g => (
          <TouchableOpacity key={g.id} onPress={() => setGroupId(groupId === g.id ? '' : g.id)}
            style={[s.chip, { borderColor: g.color }, groupId === g.id && { backgroundColor: g.color + '33' }]}>
            <Text style={{ color: g.color, fontSize: 13 }}>{g.zh}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>認識年份（選填）</Text>
      <TextInput style={s.input} value={since} onChangeText={setSince} placeholder="例如 2018" placeholderTextColor={C.dim} keyboardType="number-pad" />

      <TouchableOpacity style={[s.save, busy && { opacity: 0.6 }]} onPress={handleSave} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>✓ 儲存</Text>}
      </TouchableOpacity>

      {editing && (
        <TouchableOpacity style={s.delete} onPress={handleDelete}>
          <Text style={s.deleteText}>刪除朋友</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  h1: { color: C.text, fontSize: 22, fontWeight: '800', marginBottom: 20 },
  photo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoHint: { color: C.muted, textAlign: 'center', fontSize: 13 },
  removePhoto: { color: C.danger, textAlign: 'center', marginTop: 8, fontSize: 13 },
  label: { color: C.muted, fontSize: 13, marginTop: 20, marginBottom: 8 },
  input: { backgroundColor: C.bg1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  save: { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  delete: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  deleteText: { color: C.danger, fontWeight: '600' },
});
