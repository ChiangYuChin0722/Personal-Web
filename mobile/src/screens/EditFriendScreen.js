import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store';
import { useUI } from '../ui';
import { DEFAULT_GROUPS, getGroupById } from '../fqcore';

export default function EditFriendScreen({ navigation, route }) {
  const { profiles, customGroups, saveProfile, deleteProfile } = useStore();
  const { C, t, lang } = useUI();
  const s = useMemo(() => makeStyles(C), [C]);
  const editing = route.params?.id ? profiles.find(p => p.id === route.params.id) : null;

  const [name, setName] = useState(editing?.name || '');
  const [photo, setPhoto] = useState(editing?.photo || null);
  const [groupId, setGroupId] = useState(editing?.groupId || '');
  const [since, setSince] = useState(editing?.since || '');
  const [busy, setBusy] = useState(false);

  const groups = [...DEFAULT_GROUPS, ...customGroups];

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert(t('需要相簿權限才能選照片', 'Photo library permission is required')); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]) setPhoto(res.assets[0].uri);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert(t('請輸入名字', 'Please enter a name')); return; }
    setBusy(true);
    const group = getGroupById(groupId, customGroups);
    const saved = await saveProfile({
      ...(editing || {}), id: editing?.id, name: name.trim(), photo, groupId,
      color: group ? group.color : '#60A5FA', since,
    });
    setBusy(false);
    navigation.replace('FriendDetail', { id: saved.id });
  }

  function handleDelete() {
    Alert.alert(t('刪除朋友', 'Delete friend'), t(`確定要刪除 ${editing.name}？此動作無法復原。`, `Delete ${editing.name}? This cannot be undone.`), [
      { text: t('取消', 'Cancel'), style: 'cancel' },
      { text: t('刪除', 'Delete'), style: 'destructive', onPress: () => { deleteProfile(editing.id); navigation.popToTop(); } },
    ]);
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.h1}>{editing ? t('編輯資料', 'Edit Profile') : t('新增朋友', 'New Friend')}</Text>

      <TouchableOpacity style={s.photo} onPress={pickPhoto}>
        {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: '100%', borderRadius: 60 }} />
          : <Text style={s.photoHint}>{t('點擊\n上傳', 'Tap to\nupload')}</Text>}
      </TouchableOpacity>
      {photo && (
        <TouchableOpacity onPress={() => setPhoto(null)}><Text style={s.removePhoto}>{t('移除照片', 'Remove photo')}</Text></TouchableOpacity>
      )}

      <Text style={s.label}>{t('名字', 'Name')}</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('朋友的名字', "Friend's name")} placeholderTextColor={C.dim} />

      <Text style={s.label}>{t('分組', 'Group')}</Text>
      <View style={s.chipRow}>
        {groups.map(g => (
          <TouchableOpacity key={g.id} onPress={() => setGroupId(groupId === g.id ? '' : g.id)}
            style={[s.chip, { borderColor: g.color }, groupId === g.id && { backgroundColor: g.color + '33' }]}>
            <Text style={{ color: g.color, fontSize: 13 }}>{lang === 'zh' ? g.zh : g.en}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>{t('認識年份（選填）', 'Year met (optional)')}</Text>
      <TextInput style={s.input} value={since} onChangeText={setSince} placeholder={t('例如 2018', 'e.g. 2018')} placeholderTextColor={C.dim} keyboardType="number-pad" />

      <TouchableOpacity style={[s.save, busy && { opacity: 0.6 }]} onPress={handleSave} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>✓ {t('儲存', 'Save')}</Text>}
      </TouchableOpacity>

      {editing && (
        <TouchableOpacity style={s.delete} onPress={handleDelete}>
          <Text style={s.deleteText}>{t('刪除朋友', 'Delete friend')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const makeStyles = (C) => StyleSheet.create({
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
