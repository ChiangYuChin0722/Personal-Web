// Pure FQ logic ported verbatim from the web app (src/pages/FriendPage.jsx)
// so that scores, types and tiers are identical across web and mobile.

export const RAINBOW_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#6366F1','#A855F7'];

export const DEFAULT_GROUPS = [
  { id:'hs',     zh:'高中',   en:'High School', color:'#60A5FA' },
  { id:'uni',    zh:'大學',   en:'University',  color:'#34D399' },
  { id:'work',   zh:'工作',   en:'Work',        color:'#F97316' },
  { id:'fam',    zh:'家人',   en:'Family',      color:'#F472B6' },
  { id:'online', zh:'網友',   en:'Online',      color:'#A855F7' },
  { id:'other',  zh:'其他',   en:'Other',       color:'#94A3B8' },
];

export const DIM_META = [
  { key: 'F',  label: '頻率', en: 'Frequency',   color: '#60A5FA' },
  { key: 'R',  label: '互惠', en: 'Reciprocity', color: '#22D3EE' },
  { key: 'S',  label: '支持', en: 'Support',     color: '#34D399' },
  { key: 'T',  label: '信任', en: 'Trust',       color: '#8B5CF6' },
  { key: 'St', label: '穩定', en: 'Stability',   color: '#FBBF24' },
  { key: 'E',  label: '能量', en: 'Energy',      color: '#F472B6' },
];

export const MOODS = [
  { key:'great',   icon:'🌟', zh:'感覺很好', en:'Feeling great' },
  { key:'good',    icon:'😊', zh:'還不錯',   en:'Pretty good'   },
  { key:'neutral', icon:'😐', zh:'普通',     en:'Neutral'       },
  { key:'drained', icon:'😔', zh:'有點累',   en:'Drained'       },
  { key:'tense',   icon:'⚡', zh:'有些摩擦', en:'Tension'       },
];

export const QUESTIONS = [
  { dim:'F', text:'不計群組訊息，這段友誼目前的一對一聯絡頻率，你覺得是否足夠？', opts:['遠遠不夠，幾乎沒有私下互動','有點不足，偶爾希望多聯繫','差不多剛好，符合這段友誼的節奏','完全夠，甚至超過需要的頻率'],
    en:'Excluding group chats, is the current one-on-one contact frequency in this friendship sufficient?', enOpts:['Far from enough — almost no private interaction','Slightly lacking — occasionally wish for more','About right — fits the rhythm of this friendship','More than enough — even exceeds what is needed'] },
  { dim:'F', text:'過去三個月，這段友誼中主動發起對話或約出來的比例是？', opts:['完全由一方單獨維持','大多是同一方在主動','大概各半','雙方主動程度相當'],
    en:'Over the past three months, who has been more likely to initiate conversations or make plans?', enOpts:['Entirely one-sided','Mostly one side','Roughly equal','Both sides equally'] },
  { dim:'F', text:'你主觀上感受到，這個人有多在意這段友誼的存在？', opts:['幾乎感受不到他在意','偶爾有一點感受到','蠻能感受到他重視這段友誼','非常強烈，你在他生命裡明顯是重要的存在'],
    en:'How much do you feel this person values this friendship?', enOpts:['Almost no sense that they care','Occasionally feel it a little','Can clearly feel they value this friendship','Very strongly — you are obviously important in their life'] },
  { dim:'F', text:'這段友誼對「沉默一段時間不聯絡」的包容度如何？', opts:['包容度低，沉默就會產生疏遠感','需要偶爾聯絡來維持溫度','還不錯，可以接受比較長的空白','非常高，再久沒說話，重聯絡時也完全不尷尬'],
    en:'How tolerant is this friendship of going without contact for a while?', enOpts:['Low — silence quickly leads to distance','Needs occasional contact to stay warm','Fairly tolerant — comfortable with longer gaps','Very high — no matter how long, reconnecting feels effortless'] },
  { dim:'R', text:'在分享個人困擾、喜悅或私事這方面，這段友誼中雙方的投入程度是否均衡？', opts:['明顯不均衡，一方分享多另一方幾乎不開口','有些不均衡','大致均衡','非常均衡，雙方都很主動分享'],
    en:'When it comes to sharing personal struggles, joys, or private matters, how balanced is both sides\' investment?', enOpts:['Clearly unbalanced — one shares a lot, the other rarely opens up','Somewhat unbalanced','Roughly balanced','Very balanced — both actively share'] },
  { dim:'R', text:'這個人對另一方目前生活中最重要的事，了解程度有多深？', opts:['幾乎不知道近況','只知道一些表面的事','了解大部分重要的事','非常清楚，對現在的狀態完全掌握'],
    en:'How well does this person know what matters most in the other person\'s current life?', enOpts:["Almost unaware of what's going on",'Only knows surface-level things','Knows most of what matters','Very aware — fully understands the current situation'] },
  { dim:'R', text:'當一方對這段友誼付出時間和心力，另一方的回應通常是？', opts:['幾乎沒有任何回應','偶爾有回應但少有對等付出','通常有類似程度的回應','完全對等，一致地相互付出'],
    en:'When one person invests time and care into this friendship, how does the other typically respond?', enOpts:['Almost no response','Occasionally responds but rarely reciprocates equally','Usually responds in kind','Fully and consistently reciprocal'] },
  { dim:'R', text:'在真正需要幫助時，開口請這個人協助是否自然？', opts:['很難開口，寧可不說','有些不自在','還算自然，大部分情況能開口','完全自然，不需要任何猶豫'],
    en:'When help is genuinely needed, how natural is it to ask this person?', enOpts:["Hard to ask — would rather stay silent",'A bit uncomfortable','Fairly natural in most situations','Completely natural — no hesitation at all'] },
  { dim:'S', text:'當你真正處於低潮或需要幫助時，這個人通常的反應是？', opts:['缺席或幾乎不知情','知道但沒有給什麼實質支持','能夠給予真正的關心和幫助','是你最可以依靠的支柱之一'],
    en:'When you are genuinely going through a hard time or need help, how does this person typically respond?', enOpts:['Absent or barely aware','Knew but gave no real support','Provides genuine care and help','Is one of the most dependable pillars you have'] },
  { dim:'S', text:'面對重大人生決定時，這個人是否是想聽取意見的對象？', opts:['完全不在考慮範圍內','應該不會','也許會，可能會考慮','絕對是，會是第一個想找的人'],
    en:'When facing a major life decision, is this person someone whose opinion would be sought?', enOpts:['Not considered at all','Probably not','Maybe — worth considering','Absolutely — would be the first person to turn to'] },
  { dim:'S', text:'這個人給予的支持，是否符合對方真正的需要？', opts:['常常不對，不太懂對方需要什麼','有時候對有時候不對','通常蠻準確的','幾乎總是非常精準，深度理解'],
    en:'How well does the support this person gives match what is actually needed?', enOpts:["Often off — doesn't understand what's needed",'Sometimes right, sometimes not','Usually quite accurate','Almost always precise — deeply understanding'] },
  { dim:'S', text:'這個人是否曾在對方沒有開口的情況下，主動察覺狀態不好並關心？', opts:['從來沒有過','偶爾有一兩次','有幾次讓人很感動','這幾乎是他的常態，很自然'],
    en:'Has this person ever noticed something was wrong and reached out without being asked?', enOpts:['Never','Once or twice','A few times — genuinely touching','This is almost always how they are'] },
  { dim:'T', text:'在這個人面前，是否曾說過顯得脆弱、不完美或尷尬的事？', opts:['從來沒有，那一面一直藏著','說過一點點','說過蠻多的','幾乎什麼都說過，包括最低落的時刻'],
    en:'Has anything been shared with this person that reveals vulnerability, imperfection, or embarrassment?', enOpts:['Never — that side has always been hidden','A little bit','Quite a lot','Almost everything — including the lowest moments'] },
  { dim:'T', text:'如果你做了讓你感到羞愧或不想對外說的事，你願意讓這個人知道嗎？', opts:['不願意，寧可瞞著他','需要猶豫很久才可能開口','大概願意，雖然不輕鬆','完全願意，他是第一個想找的人'],
    en:'If you did something you felt ashamed of or wanted to keep private, would you be willing to let this person know?', enOpts:['No — would rather hide it','Would hesitate for a long time before saying anything','Probably yes, though it would not be easy','Completely — they would be the first person to turn to'] },
  { dim:'T', text:'對這個人說的話和做出的承諾，信任程度有多高？', opts:['常常會有所質疑','有一些保留','大致上相信','完全信任，毫無保留'],
    en:'How much trust is placed in what this person says and promises?', enOpts:['Often questioned','Some reservations','Generally trusted','Completely trusted — no reservations at all'] },
  { dim:'T', text:'在這段友誼中，直接表達不滿或說出真心話的自在程度是？', opts:['非常不自在，有話也不敢說','需要鼓很大的勇氣才做得到','大多數情況下能夠說出口','非常自在，任何想法都可以直接表達'],
    en:'How comfortable is it to express dissatisfaction or speak your mind in this friendship?', enOpts:['Very uncomfortable — even when there is something to say, it stays unsaid','Requires a lot of courage to do','Can usually speak up in most situations','Very comfortable — any thought can be expressed directly'] },
  { dim:'St', text:'這段友誼整體上的穩定程度如何？', opts:['有過嚴重危機，目前尚未完全修復','曾有過明顯摩擦，影響了親近程度','偶有小誤會，但都順利化解了','非常穩定，感情從未動搖'],
    en:'How stable has this friendship been overall?', enOpts:['There was a serious crisis that has not been fully resolved','There were notable conflicts that affected closeness','Minor misunderstandings here and there, all resolved','Very stable — the bond has never wavered'] },
  { dim:'St', text:'在一段時間沒有聯絡之後，兩人重新接觸時的自然程度是？', opts:['很尷尬，需要很長時間才能找回感覺','有一點生疏，要花點力氣','需要一點暖身，但很快就回來了','立刻就很自然，完全沒有斷層感'],
    en:'After a period of no contact, how natural is it when the two reconnect?', enOpts:['Awkward — takes a long time to feel comfortable','A bit distant — requires effort','Needs a little warm-up but quickly returns','Immediately natural — no sense of a gap at all'] },
  { dim:'St', text:'這段友誼面對重大人生變化（換工作、搬家、交新對象等）的韌性如何？', opts:['任何大改變都可能讓這段友誼變淡','人生的改變已讓彼此連結變弱了','大致上維持住了，只是見面少了','不管發生什麼都還是很穩固'],
    en:'How resilient is this friendship against major life changes (new job, moving, new relationship, etc.)?', enOpts:['Any big change could fade this friendship','Life changes have already weakened the bond','Mostly maintained — just fewer meetups','Stays strong no matter what'] },
  { dim:'St', text:'五年後，這段友誼是否仍會是生命中重要的存在？', opts:['很不可能','不太確定','應該會','幾乎可以確定'],
    en:'Will this friendship still be an important part of life five years from now?', enOpts:['Very unlikely','Not sure','Probably yes','Almost certain'] },
  { dim:'E', text:'想到要主動聯絡這個人時，第一個直覺感受是什麼？', opts:['有壓力、有負擔，甚至想逃避','有一點猶豫或抗拒','沒什麼特別的感覺','期待，真的很想聊'],
    en:'When thinking about reaching out to this person, what is the first instinctive feeling?', enOpts:['Pressure, burden, or even avoidance','A little hesitation or reluctance','Nothing particular — just neutral','Excited — genuinely looking forward to it'] },
  { dim:'E', text:'和這個人進行一次深度交流或見面之後，通常會有什麼感覺？', opts:['很疲憊，需要時間獨自恢復','有一點消耗','還好，沒什麼特別','充電了，心情更好'],
    en:'After a deep conversation or meetup with this person, how does it usually feel?', enOpts:['Exhausted — need alone time to recover','Somewhat drained','Fine — nothing special','Recharged — in a better mood'] },
  { dim:'E', text:'在這個人面前，是否可以做自己，不需要表演或管理形象？', opts:['不太行，會有壓力要呈現某種樣子','有時候會注意怎麼表現','大多數情況可以','完全可以，從來不需要偽裝'],
    en:'Is it possible to be oneself around this person, without performing or managing an image?', enOpts:['Not really — there is pressure to present a certain self','Sometimes feel the need to manage how things come across','In most situations, yes','Completely — never need to pretend'] },
  { dim:'E', text:'整體而言，這段友誼帶來的感受是什麼？', opts:['主要是壓力、義務感或情緒消耗','沒什麼特別，正負面都不強','讓生活更豐富、感覺更好','是非常珍視的滋養，心存感激'],
    en:'Overall, what does this friendship bring to life?', enOpts:['Mostly stress, obligation, or emotional drain','Nothing particular — neither strongly positive nor negative','Makes life richer and feels better','A deeply valued source of nourishment — genuinely grateful'] },
];

export function calcScores(answers) {
  const DIMS = [
    { key:'F',  from:0,  weight:0.15 },
    { key:'R',  from:4,  weight:0.18 },
    { key:'S',  from:8,  weight:0.20 },
    { key:'T',  from:12, weight:0.20 },
    { key:'St', from:16, weight:0.15 },
    { key:'E',  from:20, weight:0.12 },
  ];
  const scores = {};
  DIMS.forEach(d => {
    const slice = answers.slice(d.from, d.from + 4);
    const sum = slice.reduce((a, b) => a + b, 0);
    scores[d.key] = Math.round(((sum - 4) / 12) * 100);
  });
  scores.total = Math.round(DIMS.reduce((acc, d) => acc + d.weight * scores[d.key], 0) * 0.9);
  return scores;
}

export const ALL_FRIENDSHIP_TYPES = [
  { key:'SS',  name:'靈魂夥伴',   en:'Soul Partner',    color:'#2DD4BF', desc:'深度信任、高能量、長期穩定 — 這是最稀有的友誼類型。' },
  { key:'SHQ', name:'穩固核心型', en:'Stable Core',     color:'#4ADE80', desc:'品質穩固、信任深厚，是你可以長期依賴的朋友。' },
  { key:'ASL', name:'活躍表層型', en:'Active Surface',  color:'#60A5FA', desc:'聯絡頻繁但深度有限，值得投資更多真誠的交流。' },
  { key:'QDB', name:'深度潛伏型', en:'Quiet Deep Bond', color:'#A78BFA', desc:'見面不多，但每次聯絡都有深度。聯絡少不代表感情淡。' },
  { key:'ED',  name:'情感消耗型', en:'Energy Drain',    color:'#A08CC8', desc:'這段關係讓你感到消耗，值得認真評估是否繼續投入。' },
  { key:'AOS', name:'單向付出型', en:'One-Sided',       color:'#7AAEC4', desc:'付出不對等，長期下來會造成疲憊感。' },
  { key:'FNR', name:'脆弱待修型', en:'Fragile',         color:'#7AC4A8', desc:'關係出現裂縫，需要主動溝通修復才能重建。' },
  { key:'SLD', name:'穩定輕度型', en:'Stable Lite',     color:'#8FA3B1', desc:'關係平穩但不算深入，適合輕鬆相處，不必強求深度。' },
  { key:'FAD', name:'自然淡化型', en:'Fading',          color:'#6B7F8C', desc:'友誼正在淡化，需要決定是否值得主動投入。' },
];

export function getFriendshipType(scores, typeOverride) {
  if (typeOverride) {
    const found = ALL_FRIENDSHIP_TYPES.find(t => t.key === typeOverride);
    if (found) return found;
  }
  const { F, R, S, T, St, E } = scores;
  const tot = scores.total;
  if (tot >= 70 && T >= 70 && E >= 65 && St >= 65) return ALL_FRIENDSHIP_TYPES[0];
  if (tot >= 58 && T >= 60 && St >= 60 && R >= 58) return ALL_FRIENDSHIP_TYPES[1];
  if (F >= 68 && E >= 60 && T < 55)               return ALL_FRIENDSHIP_TYPES[2];
  if (F < 45 && T >= 62 && St >= 62)              return ALL_FRIENDSHIP_TYPES[3];
  if (E < 38)                                      return ALL_FRIENDSHIP_TYPES[4];
  if (R < 42)                                      return ALL_FRIENDSHIP_TYPES[5];
  if (St < 42 || T < 40)                           return ALL_FRIENDSHIP_TYPES[6];
  if (tot >= 45)                                   return ALL_FRIENDSHIP_TYPES[7];
  return ALL_FRIENDSHIP_TYPES[8];
}

export function getScoreTier(total) {
  if (total >= 81) return { tier:'S', color:'#2DD4BF' };
  if (total >= 67) return { tier:'A', color:'#4ADE80' };
  if (total >= 52) return { tier:'B', color:'#60A5FA' };
  if (total >= 36) return { tier:'C', color:'#A78BFA' };
  if (total >= 20) return { tier:'D', color:'#7AAEC4' };
  return { tier:'F', color:'#8FA3B1' };
}

export function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getGroupById(id, customGroups = []) {
  if (!id) return null;
  return [...DEFAULT_GROUPS, ...customGroups].find(g => g.id === id) || null;
}

export function getProfileColor(profile, customGroups = []) {
  const g = getGroupById(profile.groupId, customGroups);
  return g ? g.color : (profile.color || '#60A5FA');
}

export function birthdayCountdown(birthday) {
  if (!birthday?.month || !birthday?.day) return null;
  const today = new Date();
  const m = parseInt(birthday.month), d = parseInt(birthday.day);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next <= today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.ceil((next - today) / 86400000);
}

// Ordinary least-squares linear regression on [{x, y}] points.
// Returns { slope, intercept, se (residual std-dev), predict(x) } or null.
export function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const sx  = points.reduce((a, p) => a + p.x, 0);
  const sy  = points.reduce((a, p) => a + p.y, 0);
  const sxy = points.reduce((a, p) => a + p.x * p.y, 0);
  const sxx = points.reduce((a, p) => a + p.x * p.x, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const slope     = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const se = Math.sqrt(
    points.reduce((a, p) => a + Math.pow(p.y - (slope * p.x + intercept), 2), 0)
    / Math.max(1, n - 2)
  );
  return { slope, intercept, se, predict: x => slope * x + intercept };
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

