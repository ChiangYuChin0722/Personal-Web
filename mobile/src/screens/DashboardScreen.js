import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useStore } from '../store';
import Avatar from '../components/Avatar';
import { getScoreTier, birthdayCountdown } from '../fqcore';
import { C } from '../theme';

function Kpi({ label, value, color }) {
  return (
    <View style={s.kpi}>
      <Text style={[s.kpiVal, color && { color }]}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { profiles, surveys, customGroups, syncing, latestSurvey, signOut } = useStore();

  const scored = profiles.map(p => latestSurvey(p.id)?.total).filter(v => v != null);
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : '—';
  const attention = profiles.filter(p => { const sv = latestSurvey(p.id); return sv && sv.total < 40; }).length;

  const sorted = [...profiles].sort((a, b) =>
    (latestSurvey(b.id)?.total ?? -1) - (latestSurvey(a.id)?.total ?? -1));

  const renderItem = ({ item: p }) => {
    const sv = latestSurvey(p.id);
    const tier = sv ? getScoreTier(sv.total) : null;
    const bd = birthdayCountdown(p.birthday);
    return (
      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('FriendDetail', { id: p.id })}>
        <Avatar profile={p} size={48} customGroups={customGroups} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.metaLine}>
            {sv ? `${sv.total} 分` : '尚未評測'}
            {bd != null && bd <= 30 ? `  ·  🎂 ${bd} 天` : ''}
          </Text>
        </View>
        {tier && (
          <View style={[s.tier, { borderColor: tier.color }]}>
            <Text style={{ color: tier.color, fontWeight: '800' }}>{tier.tier}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.logo}>FQ SYSTEM</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('EditFriend', {})}>
            <Text style={s.addBtnText}>+ 新增</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={signOut}>
            <Text style={s.ghostBtnText}>登出</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.kpiRow}>
        <Kpi label="朋友" value={profiles.length} />
        <Kpi label="平均分" value={avg} color={C.accent} />
        <Kpi label="需關注" value={attention} color={attention ? C.danger : C.text} />
      </View>

      {syncing && (
        <View style={s.syncRow}>
          <ActivityIndicator size="small" color={C.accent} />
          <Text style={s.syncText}>雲端同步中…</Text>
        </View>
      )}

      <FlatList
        data={sorted}
        keyExtractor={p => p.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        ListEmptyComponent={!syncing && (
          <Text style={s.empty}>還沒有朋友，點「+ 新增」開始建立你的第一個朋友檔案。</Text>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  logo: { color: C.text, fontWeight: '800', fontSize: 17, letterSpacing: 1 },
  addBtn: { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  ghostBtnText: { color: C.muted, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  kpi: { flex: 1, backgroundColor: C.bg1, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: 'center' },
  kpiVal: { color: C.text, fontSize: 22, fontWeight: '800' },
  kpiLabel: { color: C.muted, fontSize: 11, marginTop: 2 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 6 },
  syncText: { color: C.muted, fontSize: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg1, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  name: { color: C.text, fontWeight: '700', fontSize: 16 },
  metaLine: { color: C.muted, fontSize: 12, marginTop: 3 },
  tier: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  empty: { color: C.muted, textAlign: 'center', marginTop: 60, paddingHorizontal: 30, lineHeight: 22 },
});
