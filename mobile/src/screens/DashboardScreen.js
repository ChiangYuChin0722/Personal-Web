import { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { useUI } from '../ui';
import Avatar from '../components/Avatar';
import { getScoreTier, birthdayCountdown } from '../fqcore';

function Logo({ C }) {
  const sq = (bg, op) => <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: bg, opacity: op }} />;
  return (
    <View style={{ width: 20, height: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
      {sq('#60A5FA', 0.9)}{sq('#22D3EE', 0.7)}{sq('#8B5CF6', 0.7)}{sq('#34D399', 0.9)}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { profiles, customGroups, syncing, latestSurvey, signOut, clearAll } = useStore();
  const { C, dark, t, toggleDark, toggleLang, lang } = useUI();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(C), [C]);

  const scored = profiles.map(p => latestSurvey(p.id)?.total).filter(v => v != null);
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : '—';
  const attention = profiles.filter(p => { const sv = latestSurvey(p.id); return sv && sv.total < 40; }).length;

  const sorted = [...profiles].sort((a, b) =>
    (latestSurvey(b.id)?.total ?? -1) - (latestSurvey(a.id)?.total ?? -1));

  function confirmClear() {
    Alert.alert(
      t('清除全部資料', 'Clear all data'),
      t('確定要刪除所有朋友、評測與紀錄嗎？此動作無法復原。', 'Delete all friends, surveys and logs? This cannot be undone.'),
      [
        { text: t('取消', 'Cancel'), style: 'cancel' },
        { text: t('全部清除', 'Clear all'), style: 'destructive', onPress: clearAll },
      ],
    );
  }

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
            {sv ? t(`${sv.total} 分`, `${sv.total} pts`) : t('尚未評測', 'Not rated')}
            {bd != null && bd <= 30 ? `  ·  🎂 ${bd}${t(' 天', 'd')}` : ''}
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
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Topbar */}
      <View style={s.topbar}>
        <View style={s.logoRow}>
          <Logo C={C} />
          <Text style={s.logo}>FQ SYSTEM</Text>
          <View style={s.tag}><Text style={s.tagText}>v1.0</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity style={s.iconBtn} onPress={toggleLang}>
            <Text style={s.iconBtnText}>{lang === 'zh' ? 'EN' : '中'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={toggleDark}>
            <Text style={s.iconBtnText}>{dark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.actionRow}>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('EditFriend', {})}>
          <Text style={s.addBtnText}>＋ {t('新增朋友', 'Add Friend')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={signOut}>
          <Text style={s.ghostBtnText}>{t('登出', 'Sign out')}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.kpiRow}>
        <Kpi s={s} label={t('朋友', 'Friends')} value={profiles.length} />
        <Kpi s={s} label={t('平均分', 'Avg')} value={avg} color={C.accent} />
        <Kpi s={s} label={t('需關注', 'Attention')} value={attention} color={attention ? C.danger : C.text} />
      </View>

      {syncing && (
        <View style={s.syncRow}>
          <ActivityIndicator size="small" color={C.accent} />
          <Text style={s.syncText}>{t('雲端同步中…', 'Syncing…')}</Text>
        </View>
      )}

      <FlatList
        data={sorted}
        keyExtractor={p => p.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
        ListEmptyComponent={!syncing && (
          <Text style={s.empty}>{t('還沒有朋友，點「＋ 新增朋友」開始建立你的第一個朋友檔案。', 'No friends yet — tap "＋ Add Friend" to create your first profile.')}</Text>
        )}
        ListFooterComponent={profiles.length > 0 && (
          <TouchableOpacity style={s.clearBtn} onPress={confirmClear}>
            <Text style={s.clearText}>🗑  {t('清除全部資料', 'Clear all data')}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Kpi({ s, label, value, color }) {
  return (
    <View style={s.kpi}>
      <Text style={[s.kpiVal, color && { color }]}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { color: C.text, fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  tag: { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  iconBtn: { width: 38, height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { color: C.muted, fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  addBtn: { backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8 },
  ghostBtnText: { color: C.muted, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginVertical: 8 },
  kpi: { flex: 1, backgroundColor: C.bg1, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: 'center' },
  kpiVal: { color: C.text, fontSize: 26, fontWeight: '800' },
  kpiLabel: { color: C.muted, fontSize: 11, marginTop: 3 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 6 },
  syncText: { color: C.muted, fontSize: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg1, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  name: { color: C.text, fontWeight: '700', fontSize: 16 },
  metaLine: { color: C.muted, fontSize: 12, marginTop: 3 },
  tier: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  empty: { color: C.muted, textAlign: 'center', marginTop: 60, paddingHorizontal: 30, lineHeight: 22 },
  clearBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  clearText: { color: C.danger, fontSize: 13, fontWeight: '600' },
});
