import { useMemo, useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Line, Polyline, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { linearRegression, fmtDate } from '../fqcore';
import { useUI } from '../ui';

// Trend of a friend's relationship over time: survey totals + rated journals
// (rating ×18 to share the 0–90 scale), an OLS regression line and a 30-day
// forecast with a confidence band. Ported from the web AnalyticsTrendChart.
export default function AnalyticsTrendChart({ surveys, journals, profileId }) {
  const { C, t } = useUI();
  const st = useMemo(() => makeStyles(C), [C]);
  const [sel, setSel] = useState(null);

  const profileSurveys = surveys
    .filter(s => s.profileId === profileId && s.total != null)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const profileJournals = journals
    .filter(j => j.profileId === profileId && j.rating)
    .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

  const allDates = [
    ...profileSurveys.map(s => new Date(s.createdAt).getTime()),
    ...profileJournals.map(j => new Date(j.date || j.createdAt).getTime()),
  ];

  if (allDates.length < 2) {
    return <Text style={st.note}>{t('至少需要 2 筆資料（測驗或日誌評分）才能顯示分析圖表', 'Need at least 2 data points (surveys or rated journals) to show analytics')}</Text>;
  }

  const minDate = Math.min(...allDates);
  const nowTs = Date.now();
  const future = nowTs + 30 * 86400000;
  const dayOf = ts => (ts - minDate) / 86400000;
  const nowDay = dayOf(nowTs);
  const futureDay = dayOf(future);
  const totalDays = futureDay + 10;

  const surveyPts = profileSurveys.map(s => ({
    x: dayOf(new Date(s.createdAt).getTime()), y: s.total,
    label: String(s.total), date: fmtDate(s.createdAt),
  }));
  const journalPts = profileJournals.map(j => ({
    x: dayOf(new Date(j.date || j.createdAt).getTime()), y: j.rating * 18,
    label: '★' + j.rating, date: fmtDate(j.date || j.createdAt),
  }));
  const allPts = [...surveyPts, ...journalPts].sort((a, b) => a.x - b.x);

  const reg = linearRegression(allPts);
  const slopePerMonth = reg ? reg.slope * 30 : 0;
  const futurePred = reg ? Math.max(0, Math.min(90, reg.predict(futureDay))) : null;
  const futureCI = reg ? Math.min(reg.se * 1.645, 30) : 0;
  const slopeColor = slopePerMonth > 2 ? C.green : slopePerMonth < -2 ? C.danger : C.muted;
  const slopeSign = slopePerMonth >= 0 ? '+' : '';

  const W = 600, H = 200, PL = 40, PR = 36, PT = 20, PB = 32;
  const iW = W - PL - PR, iH = H - PT - PB;
  const xOf = x => PL + Math.min(1, x / totalDays) * iW;
  const yOf = v => PT + iH - (Math.max(0, Math.min(90, v)) / 90) * iH;

  const dispW = Dimensions.get('window').width - 40;
  const dispH = (H / W) * dispW;

  return (
    <View>
      <View style={st.summary}>
        <Text style={st.sumMuted}>{t('趨勢斜率', 'Slope')}：</Text>
        <Text style={[st.sumStrong, { color: slopeColor }]}>{slopeSign}{slopePerMonth.toFixed(1)}{t('/月', '/mo')}</Text>
        {futurePred !== null && <>
          <Text style={st.sumDim}>·</Text>
          <Text style={st.sumMuted}>{t('30天預測', '30d forecast')}：</Text>
          <Text style={[st.sumStrong, { color: '#A78BFA' }]}>
            {Math.round(futurePred)}<Text style={st.sumTiny}> ±{Math.round(futureCI)}</Text>
          </Text>
        </>}
        <Text style={st.sumDim}>·</Text>
        <Text style={st.sumMuted}>{t('資料點', 'Data pts')}：{allPts.length}</Text>
      </View>

      <Svg width={dispW} height={dispH} viewBox={`0 0 ${W} ${H}`}>
        {[0, 30, 60, 90].map(v => (
          <Line key={v} x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)}
            stroke={C.grid} strokeWidth={1} strokeDasharray={v === 0 ? undefined : '3,4'} />
        ))}
        {[0, 30, 60, 90].map(v => (
          <SvgText key={'l' + v} x={PL - 5} y={yOf(v)} fill={C.dim} fontSize={9}
            textAnchor="end" alignmentBaseline="middle">{v}</SvgText>
        ))}

        {nowDay > 0 && nowDay < totalDays && (
          <Line x1={xOf(nowDay)} y1={PT} x2={xOf(nowDay)} y2={PT + iH}
            stroke={C.grid} strokeWidth={1} strokeDasharray="3,3" />
        )}

        {reg && (
          <Line x1={xOf(0)} y1={yOf(reg.predict(0))} x2={xOf(totalDays)} y2={yOf(reg.predict(totalDays))}
            stroke={slopeColor} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.55} />
        )}

        {futurePred !== null && futureCI > 0 && (
          <Rect x={xOf(futureDay) - 8} y={yOf(futurePred + futureCI)} width={16}
            height={Math.max(2, yOf(Math.max(0, futurePred - futureCI)) - yOf(futurePred + futureCI))}
            fill="#A78BFA" opacity={0.18} rx={2} />
        )}

        {futurePred !== null && (
          <>
            <Circle cx={xOf(futureDay)} cy={yOf(futurePred)} r={6} fill="#A78BFA" stroke={C.bg} strokeWidth={2} opacity={0.9} />
            <SvgText x={xOf(futureDay)} y={yOf(futurePred) - 11} fill="#A78BFA" fontSize={10} fontWeight="700" textAnchor="middle">{Math.round(futurePred)}</SvgText>
            <SvgText x={xOf(futureDay)} y={PT + iH + 22} fill="#A78BFA" fontSize={8} textAnchor="middle">+30d</SvgText>
          </>
        )}

        {journalPts.map((p, i) => (
          <Circle key={'j' + i} cx={xOf(p.x)} cy={yOf(p.y)} r={sel?.k === 'j' + i ? 6 : 4}
            fill="#F59E0B" stroke={C.bg} strokeWidth={1.5} opacity={0.85}
            onPress={() => setSel({ k: 'j' + i, ...p })} />
        ))}

        {surveyPts.length > 1 && (
          <Polyline points={surveyPts.map(p => `${xOf(p.x)},${yOf(p.y)}`).join(' ')}
            fill="none" stroke={C.accent2} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {surveyPts.map((p, i) => (
          <Circle key={'s' + i} cx={xOf(p.x)} cy={yOf(p.y)} r={sel?.k === 's' + i ? 8 : 5}
            fill={sel?.k === 's' + i ? C.accent2 : C.accent} stroke={C.bg} strokeWidth={2}
            onPress={() => setSel({ k: 's' + i, ...p })} />
        ))}

        {sel && (
          <SvgText x={xOf(sel.x)} y={yOf(sel.y) - 12} fill={C.text} fontSize={11} fontWeight="700" textAnchor="middle">
            {sel.label} · {sel.date}
          </SvgText>
        )}
      </Svg>

      <View style={st.legend}>
        {[
          { color: C.accent, label: t('測驗', 'Survey') },
          { color: '#F59E0B', label: t('日誌評分 (×18)', 'Journal ×18') },
          { color: '#A78BFA', label: t('30天預測', '30d forecast') },
          { color: slopeColor, label: t('趨勢線', 'Trend'), dash: true },
        ].map(({ color, label, dash }) => (
          <View key={label} style={st.legendItem}>
            <View style={dash
              ? { width: 14, height: 2, backgroundColor: color, opacity: 0.6, borderRadius: 1 }
              : { width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={st.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  note: { color: C.muted, fontSize: 12, paddingVertical: 20, textAlign: 'center' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 },
  sumMuted: { color: C.muted, fontSize: 12 },
  sumStrong: { fontSize: 12, fontWeight: '700' },
  sumDim: { color: C.dim, fontSize: 12 },
  sumTiny: { color: C.muted, fontSize: 10, fontWeight: '400' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { color: C.muted, fontSize: 10 },
});
