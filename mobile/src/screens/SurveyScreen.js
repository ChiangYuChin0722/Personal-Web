import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { useUI } from '../ui';
import { QUESTIONS, DIM_META, calcScores, getFriendshipType, genId } from '../fqcore';

export default function SurveyScreen({ navigation, route }) {
  const { addSurvey } = useStore();
  const { C, t, lang } = useUI();
  const s = useMemo(() => makeStyles(C), [C]);
  const profileId = route.params.id;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));

  const q = QUESTIONS[idx];
  const dim = DIM_META.find(d => d.key === q.dim);
  const progress = (idx + (answers[idx] ? 1 : 0)) / QUESTIONS.length;
  const opts = lang === 'zh' ? q.opts : q.enOpts;

  function choose(optIdx) {
    const next = [...answers];
    next[idx] = optIdx + 1;
    setAnswers(next);
    setTimeout(() => {
      if (idx < QUESTIONS.length - 1) setIdx(idx + 1);
      else finish(next);
    }, 180);
  }

  function finish(finalAnswers) {
    const scores = calcScores(finalAnswers);
    const type = getFriendshipType(scores);
    addSurvey({
      id: genId(), profileId, answers: finalAnswers, scores,
      total: scores.total, type: type.key, createdAt: new Date().toISOString(),
    });
    navigation.replace('FriendDetail', { id: profileId });
  }

  return (
    <View style={s.root}>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: dim.color }]} />
      </View>
      <Text style={s.counter}>{idx + 1} / {QUESTIONS.length}</Text>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[s.dimTag, { color: dim.color }]}>{dim.label} · {dim.en}</Text>
        <Text style={s.question}>{lang === 'zh' ? q.text : q.en}</Text>
        {opts.map((opt, i) => (
          <TouchableOpacity key={i} style={[s.opt, answers[idx] === i + 1 && { borderColor: dim.color, backgroundColor: dim.color + '1A' }]}
            onPress={() => choose(i)}>
            <Text style={s.optText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.nav}>
        <TouchableOpacity disabled={idx === 0} onPress={() => setIdx(idx - 1)}>
          <Text style={[s.navBtn, idx === 0 && { opacity: 0.3 }]}>← {t('上一題', 'Previous')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.navBtn}>{t('取消', 'Cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  progressTrack: { height: 4, backgroundColor: C.bg2 },
  progressFill: { height: 4 },
  counter: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
  dimTag: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  question: { color: C.text, fontSize: 18, fontWeight: '600', lineHeight: 26, marginBottom: 24 },
  opt: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: C.bg1 },
  optText: { color: C.text, fontSize: 15, lineHeight: 21 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  navBtn: { color: C.accent, fontSize: 14, fontWeight: '600' },
});
