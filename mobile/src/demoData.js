// Sample data for DEMO_MODE (see store.js). Lets you launch the app in a
// simulator without setting up Google OAuth — purely for previewing the UI.
// Turn DEMO_MODE off in store.js to use real Google sign-in + Firestore sync.

export const demoProfiles = [
  { id: 'd1', name: '媽媽',  color: '#F472B6', groupId: 'fam',    since: '1996', photo: null },
  { id: 'd2', name: '小美',  color: '#34D399', groupId: 'uni',    since: '2019', photo: null },
  { id: 'd3', name: '阿哲',  color: '#60A5FA', groupId: 'hs',     since: '2012', photo: null },
  { id: 'd4', name: 'Kevin', color: '#F97316', groupId: 'work',   since: '2022', photo: null },
  { id: 'd5', name: '阿翔',  color: '#A855F7', groupId: 'online', since: '2023', photo: null },
];

const mkScores = (total) => {
  const d = Math.min(100, Math.round(total / 0.9));
  return { F: d, R: d, S: d, T: d, St: d, E: d, total };
};

export const demoSurveys = [
  // 小美 — a few surveys over time so the trend chart has data
  { id: 's1', profileId: 'd2', total: 60, scores: mkScores(60), type: 'SHQ', createdAt: '2026-03-15T10:00:00.000Z' },
  { id: 's2', profileId: 'd2', total: 70, scores: mkScores(70), type: 'SHQ', createdAt: '2026-04-20T10:00:00.000Z' },
  { id: 's3', profileId: 'd2', total: 78, scores: { F: 82, R: 74, S: 88, T: 80, St: 70, E: 76, total: 78 }, type: 'SS', createdAt: '2026-06-10T10:00:00.000Z' },
  { id: 's4', profileId: 'd1', total: 88, scores: { F: 90, R: 85, S: 95, T: 90, St: 85, E: 88, total: 88 }, type: 'SS', createdAt: '2026-05-01T10:00:00.000Z' },
  { id: 's5', profileId: 'd3', total: 64, scores: mkScores(64), type: 'SHQ', createdAt: '2026-05-20T10:00:00.000Z' },
  { id: 's6', profileId: 'd4', total: 45, scores: mkScores(45), type: 'SLD', createdAt: '2026-04-10T10:00:00.000Z' },
  { id: 's7', profileId: 'd5', total: 32, scores: mkScores(32), type: 'FAD', createdAt: '2026-03-28T10:00:00.000Z' },
];

export const demoJournals = [
  { id: 'j1', profileId: 'd2', mood: 'great', date: '2026-06-10', text: '今天一起吃飯，聊了很多近況，感覺很好。', createdAt: '2026-06-10T12:00:00.000Z', rating: 4, keyEvent: null },
  { id: 'j2', profileId: 'd2', mood: 'good',  date: '2026-05-10', text: '傳訊息關心彼此，回覆很快。', createdAt: '2026-05-10T12:00:00.000Z', rating: 3, keyEvent: null },
  { id: 'j3', profileId: 'd2', mood: 'neutral', date: '2026-04-01', text: '約了下次見面的時間。', createdAt: '2026-04-01T12:00:00.000Z', rating: 3, keyEvent: null },
];
