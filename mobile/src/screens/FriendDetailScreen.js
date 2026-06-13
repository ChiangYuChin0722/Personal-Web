import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../store';
import Avatar from '../components/Avatar';
import RadarChart from '../components/RadarChart';
import { getScoreTier, getFriendshipType, MOODS } from '../fqcore';
import { C } from '../theme';

export default function FriendDetailScreen({ navigation, route }) {
  const { profiles, journals, customGroups, latestSurvey } = useStore();
  const profile = profiles.find(p => p.id === route.params.id);

  if (!profile) {
    return <View style={s.root}><Text style={s.muted}>找不到這位朋友</Text></View>;
  }

  const sv = latestSurvey(profile.id);
  const tier = sv ? getScoreTier(sv.total) : null;
  const type = sv ? getFriendshipType(sv.scores, sv.type) : null;
  const logs = journals.filter(j => j.profileId === profile.id)
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View style={{ alignItems: 'center' }}>
        <Avatar profile={profile} size={88} customGroups={customGroups} />
        <Text style={s.name}>{profile.name}</Text>
        {profile.since ? <Text style={s.muted}>認識於 {profile.since}</Text> : null}
        <TouchableOpacity onPress={() => navigation.navigate('EditFriend', { id: profile.id })}>
          <Text style={s.editLink}>編輯資料</Text>
        </TouchableOpacity>
      </View>

      {sv ? (
        <>
          <View style={s.scoreRow}>
            <View style={[s.tierBadge, { borderColor: tier.color }]}>
              <Text style={{ color: tier.color, fontWeight: '800', fontSize: 20 }}>{tier.tier}</Text>
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={s.scoreVal}>{sv.total}<Text style={s.muted}> / 90</Text></Text>
              {type && <Text style={[s.typeName, { color: type.color }]}>{type.name}</Text>}
            </View>
          </View>
          {type && <Text style={s.typeDesc}>{type.desc}</Text>}
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <RadarChart scores={sv.scores} />
          </View>
        </>
      ) : (
        <Text style={[s.muted, { textAlign: 'center', marginTop: 24 }]}>尚未評測這段友誼</Text>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('Survey', { id: profile.id })}>
          <Text style={s.primaryText}>{sv ? '重新評測' : '開始評測'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Log', { id: profile.id })}>
          <Text style={s.secondaryText}>＋ 記錄互動</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>互動紀錄</Text>
      {logs.length === 0 && <Text style={s.muted}>還沒有任何紀錄</Text>}
      {logs.map(l => {
        const mood = MOODS.find(m => m.key === l.mood);
        return (
          <View key={l.id} style={s.logCard}>
            <Text style={s.logHead}>
              {mood ? mood.icon + ' ' : ''}{l.date || ''}
              {l.rating ? '   ' + '⭐'.repeat(l.rating) : ''}
            </Text>
            <Text style={s.logText}>{l.text}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  name: { color: C.text, fontSize: 22, fontWeight: '800', marginTop: 12 },
  muted: { color: C.muted, fontSize: 13, marginTop: 4 },
  editLink: { color: C.accent, fontSize: 13, marginTop: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  tierBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  scoreVal: { color: C.text, fontSize: 28, fontWeight: '800' },
  typeName: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  typeDesc: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  primaryBtn: { flex: 1, backgroundColor: C.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  secondaryText: { color: C.text, fontWeight: '600' },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 32, marginBottom: 12 },
  logCard: { backgroundColor: C.bg1, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, marginBottom: 10 },
  logHead: { color: C.muted, fontSize: 12, marginBottom: 6 },
  logText: { color: C.text, fontSize: 14, lineHeight: 20 },
});
