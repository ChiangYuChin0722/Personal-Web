import './FriendPage.css';
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';

// Handles Chinese IME: blocks Enter during composition (macOS fix)
function IMEInput({ onEnterKey, onKeyDown, ...props }) {
  const composing = useRef(false);
  return (
    <input
      {...props}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={() => { setTimeout(() => { composing.current = false; }, 0); }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !composing.current) onEnterKey?.(e);
        onKeyDown?.(e);
      }}
    />
  );
}

const LangCtx = createContext('zh');
const GroupsCtx = createContext([]);

// ─── Constants ────────────────────────────────────────────────────────────────

const RAINBOW_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#6366F1','#A855F7'];

const DEFAULT_GROUPS = [
  { id:'hs',     zh:'高中',   en:'High School', color:'#60A5FA' },
  { id:'uni',    zh:'大學',   en:'University',  color:'#34D399' },
  { id:'work',   zh:'工作',   en:'Work',        color:'#F97316' },
  { id:'fam',    zh:'家人',   en:'Family',      color:'#F472B6' },
  { id:'online', zh:'網友',   en:'Online',      color:'#A855F7' },
  { id:'other',  zh:'其他',   en:'Other',       color:'#94A3B8' },
];
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: THIS_YEAR - 1989 }, (_, i) => THIS_YEAR - i);

const DIM_META = [
  { key: 'F',  label: '頻率', en: 'Frequency',   color: '#60A5FA' },
  { key: 'R',  label: '互惠', en: 'Reciprocity', color: '#22D3EE' },
  { key: 'S',  label: '支持', en: 'Support',     color: '#34D399' },
  { key: 'T',  label: '信任', en: 'Trust',       color: '#8B5CF6' },
  { key: 'St', label: '穩定', en: 'Stability',   color: '#FBBF24' },
  { key: 'E',  label: '能量', en: 'Energy',      color: '#F472B6' },
];

const MOODS = [
  { key:'great',   icon:'🌟', zh:'感覺很好', en:'Feeling great' },
  { key:'good',    icon:'😊', zh:'還不錯',   en:'Pretty good'   },
  { key:'neutral', icon:'😐', zh:'普通',     en:'Neutral'       },
  { key:'drained', icon:'😔', zh:'有點累',   en:'Drained'       },
  { key:'tense',   icon:'⚡', zh:'有些摩擦', en:'Tension'       },
];

const QUESTIONS = [
  // F 頻率 Frequency
  { dim:'F', text:'不計群組訊息，這段友誼目前的一對一聯絡頻率，你覺得是否足夠？', opts:['遠遠不夠，幾乎沒有私下互動','有點不足，偶爾希望多聯繫','差不多剛好，符合這段友誼的節奏','完全夠，甚至超過需要的頻率'],
    en:'Excluding group chats, is the current one-on-one contact frequency in this friendship sufficient?', enOpts:['Far from enough — almost no private interaction','Slightly lacking — occasionally wish for more','About right — fits the rhythm of this friendship','More than enough — even exceeds what is needed'] },
  { dim:'F', text:'過去三個月，這段友誼中主動發起對話或約出來的比例是？', opts:['完全由一方單獨維持','大多是同一方在主動','大概各半','雙方主動程度相當'],
    en:'Over the past three months, who has been more likely to initiate conversations or make plans?', enOpts:['Entirely one-sided','Mostly one side','Roughly equal','Both sides equally'] },
  { dim:'F', text:'你主觀上感受到，這個人有多在意這段友誼的存在？', opts:['幾乎感受不到他在意','偶爾有一點感受到','蠻能感受到他重視這段友誼','非常強烈，你在他生命裡明顯是重要的存在'],
    en:'How much do you feel this person values this friendship?', enOpts:['Almost no sense that they care','Occasionally feel it a little','Can clearly feel they value this friendship','Very strongly — you are obviously important in their life'] },
  { dim:'F', text:'這段友誼對「沉默一段時間不聯絡」的包容度如何？', opts:['包容度低，沉默就會產生疏遠感','需要偶爾聯絡來維持溫度','還不錯，可以接受比較長的空白','非常高，再久沒說話，重聯絡時也完全不尷尬'],
    en:'How tolerant is this friendship of going without contact for a while?', enOpts:['Low — silence quickly leads to distance','Needs occasional contact to stay warm','Fairly tolerant — comfortable with longer gaps','Very high — no matter how long, reconnecting feels effortless'] },
  // R 互惠 Reciprocity
  { dim:'R', text:'在分享個人困擾、喜悅或私事這方面，這段友誼中雙方的投入程度是否均衡？', opts:['明顯不均衡，一方分享多另一方幾乎不開口','有些不均衡','大致均衡','非常均衡，雙方都很主動分享'],
    en:'When it comes to sharing personal struggles, joys, or private matters, how balanced is both sides\' investment?', enOpts:['Clearly unbalanced — one shares a lot, the other rarely opens up','Somewhat unbalanced','Roughly balanced','Very balanced — both actively share'] },
  { dim:'R', text:'這個人對另一方目前生活中最重要的事，了解程度有多深？', opts:['幾乎不知道近況','只知道一些表面的事','了解大部分重要的事','非常清楚，對現在的狀態完全掌握'],
    en:'How well does this person know what matters most in the other person\'s current life?', enOpts:["Almost unaware of what's going on",'Only knows surface-level things','Knows most of what matters','Very aware — fully understands the current situation'] },
  { dim:'R', text:'當一方對這段友誼付出時間和心力，另一方的回應通常是？', opts:['幾乎沒有任何回應','偶爾有回應但少有對等付出','通常有類似程度的回應','完全對等，一致地相互付出'],
    en:'When one person invests time and care into this friendship, how does the other typically respond?', enOpts:['Almost no response','Occasionally responds but rarely reciprocates equally','Usually responds in kind','Fully and consistently reciprocal'] },
  { dim:'R', text:'在真正需要幫助時，開口請這個人協助是否自然？', opts:['很難開口，寧可不說','有些不自在','還算自然，大部分情況能開口','完全自然，不需要任何猶豫'],
    en:'When help is genuinely needed, how natural is it to ask this person?', enOpts:["Hard to ask — would rather stay silent",'A bit uncomfortable','Fairly natural in most situations','Completely natural — no hesitation at all'] },
  // S 支持 Support
  { dim:'S', text:'當你真正處於低潮或需要幫助時，這個人通常的反應是？', opts:['缺席或幾乎不知情','知道但沒有給什麼實質支持','能夠給予真正的關心和幫助','是你最可以依靠的支柱之一'],
    en:'When you are genuinely going through a hard time or need help, how does this person typically respond?', enOpts:['Absent or barely aware','Knew but gave no real support','Provides genuine care and help','Is one of the most dependable pillars you have'] },
  { dim:'S', text:'面對重大人生決定時，這個人是否是想聽取意見的對象？', opts:['完全不在考慮範圍內','應該不會','也許會，可能會考慮','絕對是，會是第一個想找的人'],
    en:'When facing a major life decision, is this person someone whose opinion would be sought?', enOpts:['Not considered at all','Probably not','Maybe — worth considering','Absolutely — would be the first person to turn to'] },
  { dim:'S', text:'這個人給予的支持，是否符合對方真正的需要？', opts:['常常不對，不太懂對方需要什麼','有時候對有時候不對','通常蠻準確的','幾乎總是非常精準，深度理解'],
    en:'How well does the support this person gives match what is actually needed?', enOpts:["Often off — doesn't understand what's needed",'Sometimes right, sometimes not','Usually quite accurate','Almost always precise — deeply understanding'] },
  { dim:'S', text:'這個人是否曾在對方沒有開口的情況下，主動察覺狀態不好並關心？', opts:['從來沒有過','偶爾有一兩次','有幾次讓人很感動','這幾乎是他的常態，很自然'],
    en:'Has this person ever noticed something was wrong and reached out without being asked?', enOpts:['Never','Once or twice','A few times — genuinely touching','This is almost always how they are'] },
  // T 信任 Trust
  { dim:'T', text:'在這個人面前，是否曾說過顯得脆弱、不完美或尷尬的事？', opts:['從來沒有，那一面一直藏著','說過一點點','說過蠻多的','幾乎什麼都說過，包括最低落的時刻'],
    en:'Has anything been shared with this person that reveals vulnerability, imperfection, or embarrassment?', enOpts:['Never — that side has always been hidden','A little bit','Quite a lot','Almost everything — including the lowest moments'] },
  { dim:'T', text:'如果你做了讓你感到羞愧或不想對外說的事，你願意讓這個人知道嗎？', opts:['不願意，寧可瞞著他','需要猶豫很久才可能開口','大概願意，雖然不輕鬆','完全願意，他是第一個想找的人'],
    en:'If you did something you felt ashamed of or wanted to keep private, would you be willing to let this person know?', enOpts:['No — would rather hide it','Would hesitate for a long time before saying anything','Probably yes, though it would not be easy','Completely — they would be the first person to turn to'] },
  { dim:'T', text:'對這個人說的話和做出的承諾，信任程度有多高？', opts:['常常會有所質疑','有一些保留','大致上相信','完全信任，毫無保留'],
    en:'How much trust is placed in what this person says and promises?', enOpts:['Often questioned','Some reservations','Generally trusted','Completely trusted — no reservations at all'] },
  { dim:'T', text:'在這段友誼中，直接表達不滿或說出真心話的自在程度是？', opts:['非常不自在，有話也不敢說','需要鼓很大的勇氣才做得到','大多數情況下能夠說出口','非常自在，任何想法都可以直接表達'],
    en:'How comfortable is it to express dissatisfaction or speak your mind in this friendship?', enOpts:['Very uncomfortable — even when there is something to say, it stays unsaid','Requires a lot of courage to do','Can usually speak up in most situations','Very comfortable — any thought can be expressed directly'] },
  // St 穩定 Stability
  { dim:'St', text:'這段友誼整體上的穩定程度如何？', opts:['有過嚴重危機，目前尚未完全修復','曾有過明顯摩擦，影響了親近程度','偶有小誤會，但都順利化解了','非常穩定，感情從未動搖'],
    en:'How stable has this friendship been overall?', enOpts:['There was a serious crisis that has not been fully resolved','There were notable conflicts that affected closeness','Minor misunderstandings here and there, all resolved','Very stable — the bond has never wavered'] },
  { dim:'St', text:'在一段時間沒有聯絡之後，兩人重新接觸時的自然程度是？', opts:['很尷尬，需要很長時間才能找回感覺','有一點生疏，要花點力氣','需要一點暖身，但很快就回來了','立刻就很自然，完全沒有斷層感'],
    en:'After a period of no contact, how natural is it when the two reconnect?', enOpts:['Awkward — takes a long time to feel comfortable','A bit distant — requires effort','Needs a little warm-up but quickly returns','Immediately natural — no sense of a gap at all'] },
  { dim:'St', text:'這段友誼面對重大人生變化（換工作、搬家、交新對象等）的韌性如何？', opts:['任何大改變都可能讓這段友誼變淡','人生的改變已讓彼此連結變弱了','大致上維持住了，只是見面少了','不管發生什麼都還是很穩固'],
    en:'How resilient is this friendship against major life changes (new job, moving, new relationship, etc.)?', enOpts:['Any big change could fade this friendship','Life changes have already weakened the bond','Mostly maintained — just fewer meetups','Stays strong no matter what'] },
  { dim:'St', text:'五年後，這段友誼是否仍會是生命中重要的存在？', opts:['很不可能','不太確定','應該會','幾乎可以確定'],
    en:'Will this friendship still be an important part of life five years from now?', enOpts:['Very unlikely','Not sure','Probably yes','Almost certain'] },
  // E 情感能量 Energy
  { dim:'E', text:'想到要主動聯絡這個人時，第一個直覺感受是什麼？', opts:['有壓力、有負擔，甚至想逃避','有一點猶豫或抗拒','沒什麼特別的感覺','期待，真的很想聊'],
    en:'When thinking about reaching out to this person, what is the first instinctive feeling?', enOpts:['Pressure, burden, or even avoidance','A little hesitation or reluctance','Nothing particular — just neutral','Excited — genuinely looking forward to it'] },
  { dim:'E', text:'和這個人進行一次深度交流或見面之後，通常會有什麼感覺？', opts:['很疲憊，需要時間獨自恢復','有一點消耗','還好，沒什麼特別','充電了，心情更好'],
    en:'After a deep conversation or meetup with this person, how does it usually feel?', enOpts:['Exhausted — need alone time to recover','Somewhat drained','Fine — nothing special','Recharged — in a better mood'] },
  { dim:'E', text:'在這個人面前，是否可以做自己，不需要表演或管理形象？', opts:['不太行，會有壓力要呈現某種樣子','有時候會注意怎麼表現','大多數情況可以','完全可以，從來不需要偽裝'],
    en:'Is it possible to be oneself around this person, without performing or managing an image?', enOpts:['Not really — there is pressure to present a certain self','Sometimes feel the need to manage how things come across','In most situations, yes','Completely — never need to pretend'] },
  { dim:'E', text:'整體而言，這段友誼帶來的感受是什麼？', opts:['主要是壓力、義務感或情緒消耗','沒什麼特別，正負面都不強','讓生活更豐富、感覺更好','是非常珍視的滋養，心存感激'],
    en:'Overall, what does this friendship bring to life?', enOpts:['Mostly stress, obligation, or emotional drain','Nothing particular — neither strongly positive nor negative','Makes life richer and feels better','A deeply valued source of nourishment — genuinely grateful'] },
];


// ─── Score helpers ─────────────────────────────────────────────────────────────

function calcScores(answers) {
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
    // range: min sum=4, max sum=16 → range=12; scale to 0-100 per dim
    scores[d.key] = Math.round(((sum - 4) / 12) * 100);
  });
  // total capped at 90 (× 0.9 so a perfect run → 90, not 100)
  scores.total = Math.round(DIMS.reduce((acc, d) => acc + d.weight * scores[d.key], 0) * 0.9);
  return scores;
}

const ALL_FRIENDSHIP_TYPES = [
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

function getFriendshipType(scores, typeOverride) {
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

function getScoreTier(total) {
  if (total >= 81) return { tier:'S', color:'#2DD4BF' };
  if (total >= 67) return { tier:'A', color:'#4ADE80' };
  if (total >= 52) return { tier:'B', color:'#60A5FA' };
  if (total >= 36) return { tier:'C', color:'#A78BFA' };
  if (total >= 20) return { tier:'D', color:'#7AAEC4' };
  return { tier:'F', color:'#8FA3B1' };
}

function getSuggestions(scores) {
  const tips = [];
  if (scores.F < 50) tips.push({ icon:'📅', zh:'建議增加主動聯絡的頻率，定期 check-in 能有效維繫感情。', en:'Try reaching out more often — regular check-ins help sustain the bond.' });
  if (scores.R < 50) tips.push({ icon:'⚖️', zh:'注意互動的平衡性，試著讓對方也有機會主動分享和傾訴。', en:'Balance the exchange — give the other person space to share too.' });
  if (scores.S < 50) tips.push({ icon:'🤝', zh:'在對方遇到困難時多給予支持，這是深化友誼的關鍵。', en:'Show up for them when it matters — support deepens friendship.' });
  if (scores.T < 50) tips.push({ icon:'🔐', zh:'試著分享更多真實的想法和脆弱，建立信任需要雙方的勇氣。', en:'Share more authentically — trust is built through mutual vulnerability.' });
  if (scores.St < 50) tips.push({ icon:'🛠️', zh:'若有未解決的摩擦，主動開口溝通比沉默更有效。', en:'Address unresolved friction directly — talking beats silence.' });
  if (scores.E < 50) tips.push({ icon:'⚡', zh:'注意這段關係帶給你的能量狀態，健康的友誼應該讓你感到充電。', en:'Pay attention to how this relationship makes you feel — it should energize you.' });
  if (tips.length === 0) tips.push({ icon:'✨', zh:'這段友誼狀態良好！持續用心維護，它會越來越珍貴。', en:'This friendship is in great shape! Keep nurturing it.' });
  return tips;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Shared-event helpers ──────────────────────────────────────────────────────

function getEvtKey(ev) {
  return ev.sharedId || `${ev.year || ''}|${ev.text.trim().toLowerCase()}`;
}

function findEventMembers(ev, profiles) {
  const key = getEvtKey(ev);
  return profiles.filter(p => (p.keyEvents || []).some(e => getEvtKey(e) === key));
}

function collectEventSuggestions(query, profiles, excludeId) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const seen = new Set();
  const results = [];
  profiles.forEach(p => {
    if (p.id === excludeId) return;
    (p.keyEvents || []).forEach(ev => {
      const key = getEvtKey(ev);
      if (!seen.has(key) && ev.text.toLowerCase().includes(q)) {
        seen.add(key);
        results.push({ ...ev, sharedId: key });
      }
    });
  });
  return results.slice(0, 8);
}

// ─── EventSuggest dropdown ─────────────────────────────────────────────────────

function EventSuggest({ text, allProfiles, excludeId, onSelect }) {
  const suggestions = collectEventSuggestions(text, allProfiles || [], excludeId);
  if (!suggestions.length) return null;
  return (
    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50,
      background:'var(--bg1)', border:'1px solid var(--accent)', borderRadius:8,
      boxShadow:'0 4px 20px rgba(0,0,0,0.3)', maxHeight:200, overflowY:'auto', marginTop:2 }}>
      {suggestions.map((ev, i) => (
        <div key={i} onMouseDown={e => { e.preventDefault(); onSelect(ev); }}
          style={{ padding:'8px 12px', cursor:'pointer', fontSize:13, display:'flex', gap:8, alignItems:'center',
            borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          {ev.year && <span style={{ fontSize:11, padding:'1px 6px', borderRadius:4,
            background:'var(--bg3)', color:'var(--muted)', flexShrink:0 }}>{ev.year}</span>}
          <span style={{ color:'var(--text)' }}>{ev.text}</span>
        </div>
      ))}
    </div>
  );
}

// ─── EventMembersModal ─────────────────────────────────────────────────────────

function EventMembersModal({ ev, allProfiles, onClose, onSelectProfile }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const members = findEventMembers(ev, allProfiles);
  return (
    <div className="fq-log-overlay" onClick={onClose}>
      <div className="fq-log-panel" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
        <div className="fq-log-panel-hdr">
          <div className="fq-log-panel-title" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {ev.year && <span style={{ fontSize:11, padding:'2px 7px', borderRadius:5, background:'var(--bg3)', color:'var(--muted)', flexShrink:0 }}>{ev.year}</span>}
            <span>{ev.text}</span>
          </div>
          <button className="fq-log-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:8, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
          {t(`${members.length} 個人有這個事件`, `${members.length} friend${members.length !== 1 ? 's' : ''} share this event`)}
        </div>
        {members.map(p => (
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0',
            cursor:'pointer', borderBottom:'1px solid var(--border)' }}
            onClick={() => { onClose(); onSelectProfile(p); }}>
            <Avatar profile={p} size={36} />
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{p.name}</div>
              {p.since && <div style={{ fontSize:11, color:'var(--muted)' }}>{t('認識於','Since')} {p.since}</div>}
            </div>
            <span style={{ marginLeft:'auto', fontSize:11, color:'var(--accent)' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-TW', { year:'numeric', month:'2-digit', day:'2-digit' });
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem('fq_profiles') || '[]'); } catch { return []; }
}
function saveProfiles(p) { localStorage.setItem('fq_profiles', JSON.stringify(p)); }
function loadSurveys() {
  try { return JSON.parse(localStorage.getItem('fq_surveys') || '[]'); } catch { return []; }
}
function saveSurveys(s) { localStorage.setItem('fq_surveys', JSON.stringify(s)); }
function loadJournals() {
  try { return JSON.parse(localStorage.getItem('fq_journals') || '[]'); } catch { return []; }
}
function saveJournals(j) { localStorage.setItem('fq_journals', JSON.stringify(j)); }
function loadCustomGroups() {
  try { return JSON.parse(localStorage.getItem('fq_groups') || '[]'); } catch { return []; }
}
function saveCustomGroups(g) { localStorage.setItem('fq_groups', JSON.stringify(g)); }


// ─── Group & Birthday helpers ─────────────────────────────────────────────────

function getGroupById(id, customGroups = []) {
  if (!id) return null;
  return [...DEFAULT_GROUPS, ...customGroups].find(g => g.id === id) || null;
}
function getProfileColor(profile, customGroups = []) {
  const g = getGroupById(profile.groupId, customGroups);
  return g ? g.color : (profile.color || '#60A5FA');
}
function birthdayCountdown(birthday) {
  if (!birthday?.month || !birthday?.day) return null;
  const today = new Date();
  const m = parseInt(birthday.month), d = parseInt(birthday.day);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next <= today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.ceil((next - today) / 86400000);
}
function birthdayStr(birthday) {
  if (!birthday?.month || !birthday?.day) return null;
  return `${String(birthday.month).padStart(2,'0')}/${String(birthday.day).padStart(2,'0')}`;
}

// ─── Avatar component ─────────────────────────────────────────────────────────

function Avatar({ profile, size = 40, style: extra = {} }) {
  const customGroups = useContext(GroupsCtx);
  const color = getProfileColor(profile, customGroups);
  return (
    <div
      className="fq-avatar"
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: color + '22', border: `1px solid ${color}`,
        overflow: 'hidden', flexShrink: 0, ...extra,
      }}
    >
      {profile.photo
        ? <img src={profile.photo} alt={profile.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : <span style={{ fontWeight:800, color }}>{(profile.name||'?').charAt(0).toUpperCase()}</span>
      }
    </div>
  );
}


// ─── Log Modal ────────────────────────────────────────────────────────────────

function LogModal({ profile, onSave, onClose }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const today = new Date().toISOString().split('T')[0];
  const [mood, setMood] = useState('good');
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [markEvent, setMarkEvent] = useState(false);
  const [eventYear, setEventYear] = useState(String(new Date().getFullYear()));
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  function handleSave() {
    if (!text.trim()) return;
    onSave({
      id: genId(), profileId: profile.id, mood, date,
      text: text.trim(), createdAt: new Date().toISOString(),
      rating: rating || null,
      keyEvent: markEvent ? { year: eventYear, text: text.trim() } : null,
    });
  }

  return (
    <div className="fq-log-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fq-log-panel">
        <div className="fq-log-panel-hdr">
          <div className="fq-log-panel-title">{t('記錄互動', 'Log Update')} — {profile.name}</div>
          <button className="fq-log-close" onClick={onClose}>✕</button>
        </div>
        <div className="fq-form-row">
          <label className="fq-label">{t('今天跟他的感覺', 'How do you feel about them today?')}</label>
          <div className="fq-mood-row">
            {MOODS.map(m => (
              <button key={m.key} type="button" className={`fq-mood-btn${mood===m.key?' selected':''}`} onClick={() => setMood(m.key)}>
                {m.icon} {lang === 'zh' ? m.zh : m.en}
              </button>
            ))}
          </div>
        </div>
        <div className="fq-form-row">
          <label className="fq-label">{t('這次互動評分', 'Rate this interaction')} <span style={{ fontWeight:400, color:'var(--muted)', fontSize:11 }}>{t('（選填）','(optional)')}</span></label>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(rating === n ? 0 : n)}
                style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', fontSize:26, lineHeight:1,
                  opacity: (hoverRating || rating) >= n ? 1 : 0.25,
                  transform: (hoverRating || rating) >= n ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.1s, opacity 0.1s' }}>
                ⭐
              </button>
            ))}
            {rating > 0 && (
              <span style={{ fontSize:12, color:'var(--muted)', marginLeft:4 }}>
                {['','😔','😐','🙂','😊','🤩'][rating]}
                {['',' 1/5',' 2/5',' 3/5',' 4/5',' 5/5'][rating]}
              </span>
            )}
          </div>
        </div>
        <div className="fq-form-row">
          <label className="fq-label">{t('日期', 'Date')}</label>
          <input className="fq-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="fq-form-row">
          <label className="fq-label">{t('近況 / 感受', 'Notes / Feelings')}</label>
          <textarea
            className="fq-textarea"
            placeholder={t('記錄最近的互動、對方的近況、你的感覺...', 'Record your recent interaction, updates, feelings...')}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            autoFocus
          />
        </div>

        {/* Mark as Key Event toggle */}
        <div className="fq-form-row">
          <button
            type="button"
            className={`fq-key-event-toggle${markEvent ? ' active' : ''}`}
            onClick={() => setMarkEvent(v => !v)}
          >
            📌 {t('同時記為重要事件', 'Also mark as Key Event')}
          </button>
          {markEvent && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
              <label className="fq-label" style={{ margin:0, whiteSpace:'nowrap' }}>{t('年份', 'Year')}</label>
              <select className="fq-input" style={{ width:110 }} value={eventYear} onChange={e => setEventYear(e.target.value)}>
                {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="fq-row" style={{ gap:10 }}>
          <button className="fq-btn fq-btn-primary" onClick={handleSave} disabled={!text.trim()} style={{ opacity: text.trim()?1:0.5 }}>
            ✓ {t('儲存紀錄', 'Save Log')}
          </button>
          <button className="fq-btn fq-btn-ghost" onClick={onClose}>{t('取消', 'Cancel')}</button>
        </div>
      </div>
    </div>
  );
}


// ─── Radar Chart SVG ───────────────────────────────────────────────────────────

function polarToXY(angleDeg, r, cx, cy) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ scores, size = 240 }) {
  const cx = size / 2, cy = size / 2;
  const maxR = (size / 2) - 32;
  const dims = DIM_META;
  const n = dims.length;
  const angles = dims.map((_, i) => (i * 360) / n);
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  function makePolygon(fraction) {
    return angles.map(a => {
      const p = polarToXY(a, maxR * fraction, cx, cy);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  const dataPoints = dims.map((d, i) => {
    const val = (scores[d.key] || 0) / 100;
    return polarToXY(angles[i], maxR * Math.max(val, 0.02), cx, cy);
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow:'visible' }}>
      {/* grid */}
      {gridLevels.map((f, gi) => (
        <polygon
          key={gi}
          points={makePolygon(f)}
          fill="none"
          stroke="var(--grid-line)"
          strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}
      {/* spokes */}
      {angles.map((a, i) => {
        const outer = polarToXY(a, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="var(--grid-line)" strokeWidth="1" />;
      })}
      {/* data fill */}
      <polygon
        points={dataPolygon}
        fill="rgba(34,211,238,0.15)"
        stroke="#22D3EE"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={dims[i].color} stroke="var(--bg)" strokeWidth="2" />
      ))}
      {/* labels */}
      {dims.map((d, i) => {
        const labelPt = polarToXY(angles[i], maxR + 20, cx, cy);
        return (
          <text
            key={i}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="700"
            fill={d.color}
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}


// ─── Line Chart SVG ────────────────────────────────────────────────────────────

function LineChart({ surveys }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const W = 600, H = 200, PL = 40, PR = 20, PT = 20, PB = 36;
  const iW = W - PL - PR, iH = H - PT - PB;

  if (!surveys || surveys.length === 0) {
    return (
      <div className="fq-history-empty">
        尚無歷史資料 — 完成第一次評測後將顯示趨勢圖
      </div>
    );
  }

  const sorted = [...surveys].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  const minScore = 0, maxScore = 100;

  function xOf(i) { return PL + (sorted.length === 1 ? iW / 2 : (i / (sorted.length - 1)) * iW); }
  function yOf(score) { return PT + iH - ((score - minScore) / (maxScore - minScore)) * iH; }

  const points = sorted.map((s, i) => `${xOf(i)},${yOf(s.total)}`).join(' ');

  return (
    <div className="fq-history-chart">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
        {/* grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)} stroke="var(--grid-line)" strokeWidth="1" strokeDasharray={v === 0 || v === 100 ? 'none' : '3,4'} />
            <text x={PL - 6} y={yOf(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#94A3B8">{v}</text>
          </g>
        ))}
        {/* polyline */}
        {sorted.length > 1 && (
          <polyline points={points} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {/* area fill */}
        {sorted.length > 1 && (
          <polygon
            points={`${xOf(0)},${yOf(0)} ${points} ${xOf(sorted.length-1)},${yOf(0)}`}
            fill="rgba(34,211,238,0.07)"
          />
        )}
        {/* dots */}
        {sorted.map((s, i) => (
          <g key={s.id}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor:'pointer' }}
          >
            <circle cx={xOf(i)} cy={yOf(s.total)} r={hoveredIdx === i ? 7 : 5} fill={hoveredIdx === i ? '#22D3EE' : '#60A5FA'} stroke="var(--bg)" strokeWidth="2" />
            {hoveredIdx === i && (
              <g>
                <rect x={xOf(i) - 28} y={yOf(s.total) - 30} width="56" height="22" rx="4" fill="#0f0f12" stroke="rgba(255,255,255,0.1)" />
                <text x={xOf(i)} y={yOf(s.total) - 19} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="#E8EEF9">{s.total}</text>
              </g>
            )}
          </g>
        ))}
        {/* x-axis labels */}
        {sorted.map((s, i) => (
          <text key={s.id} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#94A3B8">
            {fmtDate(s.createdAt)}
          </text>
        ))}
      </svg>
    </div>
  );
}


// ─── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ view, onDashboard, onAddFriend, lang, onToggleLang, darkMode, onToggleDark }) {
  const t = (zh, en) => lang === 'zh' ? zh : en;
  return (
    <div className="fq-topbar">
      <div className="fq-topbar-logo">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="1" width="8" height="8" rx="2" fill="#60A5FA" opacity="0.9"/>
          <rect x="11" y="1" width="8" height="8" rx="2" fill="#22D3EE" opacity="0.7"/>
          <rect x="1" y="11" width="8" height="8" rx="2" fill="#8B5CF6" opacity="0.7"/>
          <rect x="11" y="11" width="8" height="8" rx="2" fill="#34D399" opacity="0.9"/>
        </svg>
        FQ SYSTEM
      </div>
      <span className="fq-topbar-tag">v2.1 BETA</span>
      <div style={{ flex:1 }} />
      {view !== 'dashboard' && (
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={onDashboard}>
          ← {t('儀表板', 'Dashboard')}
        </button>
      )}
      <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={onAddFriend}>
        + {t('新增朋友', 'Add Friend')}
      </button>
      <button className="fq-lang-btn" onClick={onToggleLang} title="Toggle language">
        {lang === 'zh' ? 'EN' : '中'}
      </button>
      <button className="fq-icon-btn" onClick={onToggleDark} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      <a href="/dashboard" className="fq-topbar-back" style={{ marginLeft: 0 }}>
        ← Secret
      </a>
    </div>
  );
}


// ─── Auth View ─────────────────────────────────────────────────────────────────
const FQ_USER = "chianghebe";
const FQ_PASS = "Hebe0722";

function AuthView({ onAuth }) {
  const [user, setUser] = useState('');
  const [pw,   setPw]   = useState('');
  const [err,  setErr]  = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (user !== FQ_USER || pw !== FQ_PASS) { setErr('Incorrect username or password.'); return; }
    sessionStorage.setItem('yc_auth', 'fq_ok');
    onAuth();
  }

  return (
    <div className="fq-auth">
      <div className="fq-auth-box">
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div className="fq-auth-title">FQ SYSTEM</div>
        <div className="fq-auth-sub">Friendship Quantification v2.1</div>
        <form onSubmit={handleSubmit}>
          <input
            className="fq-auth-input"
            type="text"
            placeholder="Username"
            value={user}
            onChange={e => { setUser(e.target.value); setErr(''); }}
            autoFocus
            autoComplete="off"
            style={{ marginBottom: 8 }}
          />
          <input
            className="fq-auth-input"
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }}
          />
          {err && <div className="fq-auth-err">{err}</div>}
          <button type="submit" className="fq-btn fq-btn-primary" style={{ width:'100%', justifyContent:'center', marginTop: 4 }}>
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
}


// ─── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({ profiles, surveys, journals, onSelectFriend, onCreateFriend, onStartSurvey, onLogUpdate }) {
  const lang = useContext(LangCtx);
  const customGroups = useContext(GroupsCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const [showGuide, setShowGuide] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [compareIds, setCompareIds] = useState([]);

  // KPI calculations
  function getLatestSurvey(profileId) {
    const ps = surveys.filter(s => s.profileId === profileId);
    if (!ps.length) return null;
    return ps.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  const total = profiles.length;
  const latestScores = profiles.map(p => getLatestSurvey(p.id)?.total).filter(v => v != null);
  const avgScore = latestScores.length > 0 ? Math.round(latestScores.reduce((a,b)=>a+b,0)/latestScores.length) : null;
  const needAttention = profiles.filter(p => { const s = getLatestSurvey(p.id); return s && s.total < 40; }).length;
  const totalSurveys = surveys.length;
  const totalLogs = journals.length;

  let highestProfile = null, highestScore = -1;
  profiles.forEach(p => {
    const s = getLatestSurvey(p.id);
    if (s && s.total > highestScore) { highestScore = s.total; highestProfile = p; }
  });

  const sortedRecent = [...surveys].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const mostRecentSurvey = sortedRecent[0] || null;
  const mostRecentProfile = mostRecentSurvey ? profiles.find(p => p.id === mostRecentSurvey.profileId) : null;

  // Filtered + sorted profiles
  const filteredProfiles = profiles
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !filterGroup || p.groupId === filterGroup)
    .filter(p => {
      if (!filterTier) return true;
      const s = getLatestSurvey(p.id);
      return s && getScoreTier(s.total).tier === filterTier;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'score') {
        const sa = getLatestSurvey(a.id)?.total ?? -1;
        const sb = getLatestSurvey(b.id)?.total ?? -1;
        return sb - sa;
      }
      if (sortBy === 'recent') {
        const sa = getLatestSurvey(a.id)?.createdAt ?? '';
        const sb = getLatestSurvey(b.id)?.createdAt ?? '';
        return sb.localeCompare(sa);
      }
      if (sortBy === 'birthday') {
        const da = birthdayCountdown(a.birthday) ?? 999;
        const db = birthdayCountdown(b.birthday) ?? 999;
        return da - db;
      }
      return 0;
    });

  // Overall trend: average score per survey date
  const trendData = (() => {
    if (surveys.length < 2) return [];
    const sorted = [...surveys].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    // group by month
    const byMonth = {};
    sorted.forEach(s => {
      const key = s.createdAt.slice(0,7);
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(s.total);
    });
    return Object.entries(byMonth).map(([month, scores]) => ({
      label: month,
      avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
    }));
  })();

  // Compare panels
  function toggleCompare(pid) {
    setCompareIds(prev => prev.includes(pid) ? prev.filter(x=>x!==pid) : prev.length < 2 ? [...prev,pid] : [prev[1], pid]);
  }

  // Type distribution
  const typeCounts = {};
  profiles.forEach(p => {
    const s = getLatestSurvey(p.id);
    if (!s) return;
    const t = getFriendshipType(s.scores, s.typeOverride).key;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const FRIENDSHIP_TYPES = [
    { key:'SS',  zh:'靈魂夥伴',   en:'Soul Partner',    color:'#2DD4BF', zhDesc:'深度信任、高能量、長期穩定 — 這是最稀有的友誼類型。',   enDesc:'Deep trust, high energy, long-term stable. The rarest type.' },
    { key:'SHQ', zh:'穩固核心型', en:'Stable Core',     color:'#4ADE80', zhDesc:'品質穩固、信任深厚，是你可以長期依賴的朋友。',         enDesc:'Solid quality and deep trust. A long-term reliable friend.' },
    { key:'ASL', zh:'活躍表層型', en:'Active Surface',  color:'#60A5FA', zhDesc:'聯絡頻繁但深度有限，值得投資更多真誠的交流。',         enDesc:'Frequent contact but limited depth. Worth investing in deeper exchange.' },
    { key:'QDB', zh:'深度潛伏型', en:'Quiet Deep Bond', color:'#A78BFA', zhDesc:'見面不多，但每次聯絡都有深度。聯絡少不代表感情淡。',   enDesc:"Infrequent contact but always meaningful. Absence doesn't mean fading." },
    { key:'ED',  zh:'情感消耗型', en:'Energy Drain',    color:'#A08CC8', zhDesc:'這段關係讓你感到消耗，值得認真評估是否繼續投入。',     enDesc:'This relationship feels draining. Worth evaluating your investment.' },
    { key:'AOS', zh:'單向付出型', en:'One-Sided',       color:'#7AAEC4', zhDesc:'付出不對等，長期下來會造成疲憊感。',                   enDesc:'Unbalanced giving. May lead to burnout over time.' },
    { key:'FNR', zh:'脆弱待修型', en:'Fragile',         color:'#7AC4A8', zhDesc:'關係出現裂縫，需要主動溝通修復才能重建。',             enDesc:'Cracks in the relationship. Proactive communication needed.' },
    { key:'SLD', zh:'穩定輕度型', en:'Stable Lite',     color:'#8FA3B1', zhDesc:'關係平穩但不算深入，適合輕鬆相處，不必強求深度。',     enDesc:'Steady but not deep. Good for casual connection.' },
    { key:'FAD', zh:'自然淡化型', en:'Fading',          color:'#6B7F8C', zhDesc:'友誼正在淡化，需要決定是否值得主動投入。',             enDesc:"Friendship is fading. Decide if it's worth reinvesting." },
  ];

  const TIERS = [
    { tier:'S', min:81, color:'#2DD4BF', label:'Exceptional' },
    { tier:'A', min:67, color:'#4ADE80', label:'Strong' },
    { tier:'B', min:52, color:'#60A5FA', label:'Good' },
    { tier:'C', min:36, color:'#A78BFA', label:'Moderate' },
    { tier:'D', min:20, color:'#7AAEC4', label:'Weak' },
    { tier:'F', min:0,  color:'#8FA3B1', label:'Critical' },
  ];

  return (
    <div className="fq-body">
      <div className="fq-dash-two-col">

        {/* ── Left panel ── */}
        <div className="fq-dash-left">

          {/* KPI list */}
          <div className="fq-kpi-list">
            {[
              { label: t('朋友數', 'Friends'),       value: total,      sub: null,          color: null },
              { label: t('平均分數', 'Avg FQ'),       value: avgScore ?? '—', sub: null,    color: avgScore !== null ? getScoreTier(avgScore).color : 'var(--muted)' },
              { label: t('最高分', 'Top Score'),      value: highestScore > -1 ? highestScore : '—', sub: null, color: highestScore > -1 ? getScoreTier(highestScore).color : null },
              { label: t('最佳朋友', 'Top Friend'),   value: highestProfile ? highestProfile.name : '—', sub: null, color: null, small: !!highestProfile },
              { label: t('測驗次數', 'Surveys'),       value: totalSurveys, sub: null,       color: null },
              { label: t('日誌條目', 'Log Entries'),   value: totalLogs,  sub: null,          color: null },
            ].map(({ label, value, sub, color, small }) => (
              <div key={label} className="fq-kpi-list-item">
                <span className="fq-kpi-list-label">{label}</span>
                <span className="fq-kpi-list-value" style={{ color: color || 'var(--text)', fontSize: small ? 14 : 18 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Type distribution */}
          {profiles.length > 0 && Object.keys(typeCounts).length > 0 && (
            <div className="fq-card">
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>
                {t('友誼類型分布', 'Type Distribution')}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {FRIENDSHIP_TYPES.filter(ft => typeCounts[ft.key]).map(ft => (
                  <div key={ft.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 8px', borderRadius:7, background: ft.color+'14', border:`1px solid ${ft.color}33` }}>
                    <span style={{ fontSize:12, fontWeight:700, color: ft.color }}>{lang === 'zh' ? ft.zh : ft.en}</span>
                    <span style={{ fontSize:13, fontWeight:800, color: ft.color }}>{typeCounts[ft.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          {mostRecentProfile && (
            <div className="fq-card">
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>
                {t('最近測驗', 'Last surveyed')}
              </div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>
                <span style={{ color:'var(--text)', fontWeight:600 }}>{mostRecentProfile.name}</span>
                <br /><span style={{ fontSize:11 }}>{fmtDate(mostRecentSurvey.createdAt)}</span>
              </div>
            </div>
          )}

          {/* Birthday reminders */}
          {(() => {
            const upcoming = profiles
              .map(p => ({ p, days: birthdayCountdown(p.birthday) }))
              .filter(x => x.days !== null && x.days <= 30)
              .sort((a,b) => a.days - b.days);
            if (!upcoming.length) return null;
            return (
              <div className="fq-card">
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>
                  🎂 {t('即將生日','Upcoming Birthdays')}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {upcoming.map(({ p, days }) => (
                    <div key={p.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                      <span style={{ fontWeight:600 }}>{p.name}</span>
                      <span style={{ color: days <= 7 ? '#F87171' : 'var(--muted)' }}>
                        {days === 0 ? t('今天！','Today!') : `${days}${t('天後','d')}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Overall trend mini chart */}
          {trendData.length >= 2 && (
            <div className="fq-card">
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>
                {t('整體趨勢','Overall Trend')}
              </div>
              <svg width="100%" viewBox="0 0 220 70" style={{ display:'block', overflow:'visible' }}>
                {(() => {
                  const W=220,H=55,PL=8,PR=8,PT=6,PB=4;
                  const vals = trendData.map(d=>d.avg);
                  const minV = Math.min(...vals), maxV = Math.max(...vals);
                  const range = maxV - minV || 1;
                  const n = vals.length;
                  const x = i => PL + (i/(n-1))*(W-PL-PR);
                  const y = v => PT + (1 - (v-minV)/range)*(H-PT-PB);
                  const pts = vals.map((v,i) => `${x(i)},${y(v)}`).join(' ');
                  return (
                    <>
                      <polyline points={pts} fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                      <polygon points={`${x(0)},${H} ${pts} ${x(n-1)},${H}`} fill="rgba(34,211,238,0.08)"/>
                      {vals.map((v,i) => <circle key={i} cx={x(i)} cy={y(v)} r={3} fill="#22D3EE"/>)}
                      <text x={x(n-1)} y={y(vals[n-1])-6} fontSize="10" fill="#22D3EE" textAnchor="middle">{vals[n-1]}</text>
                    </>
                  );
                })()}
              </svg>
              <div style={{ fontSize:10, color:'var(--dim)', marginTop:2 }}>{t('各月平均 FQ','Monthly avg FQ')}</div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="fq-dash-right">

          {/* Scoring Guide (collapsible) */}
          <div className="fq-card" style={{ marginBottom: 20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={() => setShowGuide(g => !g)}>
              <div style={{ fontSize:13, fontWeight:700 }}>📖 {t('評分說明', 'Scoring Guide & Reference')}</div>
              <span style={{ fontSize:12, color:'var(--muted)' }}>{showGuide ? '▲' : '▼'}</span>
            </div>
            {showGuide && (
              <div style={{ marginTop:16 }}>
                {/* Formula */}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>{t('計算公式', 'Score Formula')}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
                  {DIM_META.map(d => (
                    <div key={d.key} style={{ padding:'4px 10px', borderRadius:8, background: d.color+'18', border:`1px solid ${d.color}33`, fontSize:12 }}>
                      <span style={{ fontWeight:800, color: d.color }}>{d.key}</span>
                      <span style={{ color:'var(--muted)', marginLeft:4 }}>{lang === 'zh' ? d.label : d.en}</span>
                      <span style={{ color:'var(--dim)', marginLeft:4 }}>×{({'F':15,'R':18,'S':20,'T':20,'St':15,'E':12})[d.key]}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14, fontFamily:'monospace', background:'var(--bg2)', padding:'8px 12px', borderRadius:8 }}>
                  FQ = (F×15% + R×18% + S×20% + T×20% + St×15% + E×12%) × 0.9
                  <br />{t('每維度：((4題總和 − 4) ÷ 12) × 100；總分 ×0.9 → 最高 90 分', 'Per dim: ((sum−4)÷12)×100; total ×0.9 → max 90')}
                </div>

                {/* Tiers */}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>{t('分數等級', 'Score Tiers')}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                  {TIERS.map(tier => (
                    <div key={tier.tier} style={{ padding:'4px 10px', borderRadius:8, background: tier.color+'18', border:`1px solid ${tier.color}44`, fontSize:12 }}>
                      <span style={{ fontWeight:800, color: tier.color }}>Tier {tier.tier}</span>
                      <span style={{ color:'var(--muted)', marginLeft:6 }}>{tier.min}+</span>
                      <span style={{ color:'var(--dim)', marginLeft:6 }}>{tier.label}</span>
                    </div>
                  ))}
                </div>

                {/* Friendship Types */}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>{t('友誼類型', 'Friendship Types')}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {FRIENDSHIP_TYPES.map(ft => (
                    <div key={ft.key} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'7px 10px', borderRadius:8, background:'var(--bg2)' }}>
                      <span style={{ fontWeight:800, color: ft.color, minWidth:36, fontSize:12 }}>{ft.key}</span>
                      <span style={{ fontWeight:700, color: ft.color, minWidth:96, fontSize:12 }}>{lang === 'zh' ? ft.zh : ft.en}</span>
                      <span style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{lang === 'zh' ? ft.zhDesc : ft.enDesc}</span>
                    </div>
                  ))}
                </div>

                {/* Dimensions */}
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>{t('六個維度', 'The 6 Dimensions')}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {DIM_META.map(d => (
                    <div key={d.key} style={{ display:'flex', gap:10, fontSize:12 }}>
                      <span style={{ fontWeight:800, color: d.color, minWidth:28 }}>{d.key}</span>
                      <span style={{ fontWeight:700, color: d.color, minWidth:70 }}>{lang === 'zh' ? d.label : d.en}</span>
                      <span style={{ color:'var(--muted)' }}>{{
                        'F': t('聯絡頻率與誰主動推動。','How often you connect, and who drives it.'),
                        'R': t('互動是否平衡、雙方是否都在投入。','Whether the relationship is balanced and mutually invested.'),
                        'S': t('真正需要時對方是否在場。','Whether they show up when it actually matters.'),
                        'T': t('信任、脆弱與心理安全感的深度。','Depth of trust, vulnerability, and psychological safety.'),
                        'St': t('面對時間與生活變化的友誼韌性。','Resilience of the friendship through time and life changes.'),
                        'E': t('這段關係給你帶來能量還是消耗你。','The emotional energy this relationship gives or takes from you.'),
                      }[d.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search + Filter bar */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <input
              className="fq-input"
              style={{ flex:'1 1 140px', minWidth:120, padding:'7px 12px', fontSize:13 }}
              placeholder={t('搜尋朋友…','Search friends…')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="fq-input" style={{ width:120, padding:'7px 10px', fontSize:12 }} value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
              <option value="">{t('所有分組','All Groups')}</option>
              {[...DEFAULT_GROUPS, ...customGroups].map(g => <option key={g.id} value={g.id}>{lang==='zh'?g.zh:g.en}</option>)}
            </select>
            <select className="fq-input" style={{ width:100, padding:'7px 10px', fontSize:12 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
              <option value="">{t('所有等級','All Tiers')}</option>
              {['S','A','B','C','D','F'].map(tier => <option key={tier} value={tier}>Tier {tier}</option>)}
            </select>
            <select className="fq-input" style={{ width:110, padding:'7px 10px', fontSize:12 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="score">{t('依分數','By Score')}</option>
              <option value="name">{t('依名字','By Name')}</option>
              <option value="recent">{t('最近測驗','Last Survey')}</option>
              <option value="birthday">{t('依生日','By Birthday')}</option>
            </select>
            <button
              className={`fq-btn fq-btn-sm${compareIds.length > 0 ? ' fq-btn-primary' : ' fq-btn-ghost'}`}
              onClick={() => setCompareIds([])}
              title={t('清除比較選擇','Clear compare')}
              style={{ whiteSpace:'nowrap' }}
            >
              ⊕ {t('比較','Compare')} {compareIds.length > 0 ? `(${compareIds.length}/2)` : ''}
            </button>
          </div>

          {/* Compare Panel */}
          {compareIds.length === 2 && (() => {
            const [pa, pb] = compareIds.map(id => profiles.find(p=>p.id===id)).filter(Boolean);
            if (!pa || !pb) return null;
            const sa = getLatestSurvey(pa.id), sb = getLatestSurvey(pb.id);
            return (
              <div className="fq-card" style={{ marginBottom:16, background:'var(--bg2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>⊕ {t('比較','Comparison')}: {pa.name} vs {pb.name}</div>
                  <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => setCompareIds([])}>✕</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:8, alignItems:'start' }}>
                  {/* Left friend */}
                  <div style={{ textAlign:'center' }}>
                    <Avatar profile={pa} size={44} style={{ margin:'0 auto 6px' }} />
                    <div style={{ fontWeight:700, fontSize:14 }}>{pa.name}</div>
                    {sa ? <div style={{ fontSize:22, fontWeight:900, color: getScoreTier(sa.total).color }}>{sa.total}</div> : <div style={{ color:'var(--muted)', fontSize:13 }}>N/A</div>}
                  </div>
                  {/* Radar overlay */}
                  <div style={{ display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
                    {sa && sb && (
                      <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow:'visible' }}>
                        {(() => {
                          const cx=90, cy=90, maxR=62;
                          const angles = DIM_META.map((_,i)=>(i*360)/6);
                          const pol = (angleDeg, r) => {
                            const rad = ((angleDeg-90)*Math.PI)/180;
                            return {x: cx+r*Math.cos(rad), y: cy+r*Math.sin(rad)};
                          };
                          const grid = [0.25,0.5,0.75,1.0].map(f=>angles.map(a=>{ const p=pol(a,maxR*f); return `${p.x},${p.y}`; }).join(' '));
                          const mkPts = scores => DIM_META.map((d,i) => { const p=pol(angles[i], maxR*Math.max((scores[d.key]||0)/100,0.02)); return `${p.x},${p.y}`; }).join(' ');
                          return (
                            <>
                              {grid.map((pts,i)=><polygon key={i} points={pts} fill="none" stroke="var(--grid-line)" strokeWidth="1"/>)}
                              {angles.map((a,i)=>{ const p=pol(a,maxR); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--grid-line)" strokeWidth="1"/>; })}
                              <polygon points={mkPts(sa.scores)} fill="rgba(34,211,238,0.15)" stroke="#22D3EE" strokeWidth="2"/>
                              <polygon points={mkPts(sb.scores)} fill="rgba(139,92,246,0.15)" stroke="#8B5CF6" strokeWidth="2"/>
                              {DIM_META.map((d,i)=>{ const lp=pol(angles[i],maxR+16); return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill={d.color}>{d.key}</text>; })}
                            </>
                          );
                        })()}
                      </svg>
                    )}
                    <div style={{ display:'flex', gap:12, fontSize:11 }}>
                      <span style={{ color:'#22D3EE' }}>■ {pa.name}</span>
                      <span style={{ color:'#8B5CF6' }}>■ {pb.name}</span>
                    </div>
                  </div>
                  {/* Right friend */}
                  <div style={{ textAlign:'center' }}>
                    <Avatar profile={pb} size={44} style={{ margin:'0 auto 6px' }} />
                    <div style={{ fontWeight:700, fontSize:14 }}>{pb.name}</div>
                    {sb ? <div style={{ fontSize:22, fontWeight:900, color: getScoreTier(sb.total).color }}>{sb.total}</div> : <div style={{ color:'var(--muted)', fontSize:13 }}>N/A</div>}
                  </div>
                </div>
                {/* Dim comparison table */}
                {sa && sb && (
                  <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:4 }}>
                    {DIM_META.map(d => {
                      const va = sa.scores[d.key], vb = sb.scores[d.key];
                      const max = Math.max(va, vb);
                      return (
                        <div key={d.key} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
                          <span style={{ color:d.color, fontWeight:700, minWidth:28 }}>{d.key}</span>
                          <span style={{ minWidth:28, textAlign:'right', fontWeight: va>=vb?700:400, color: va>=vb?'#22D3EE':'var(--muted)' }}>{va}</span>
                          <div style={{ flex:1, height:6, background:'var(--bg3)', borderRadius:3, overflow:'hidden', position:'relative' }}>
                            <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(va/90)*100}%`, background:'#22D3EE', borderRadius:3, opacity:0.7 }}/>
                            <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(vb/90)*100}%`, background:'#8B5CF6', borderRadius:3, opacity:0.5 }}/>
                          </div>
                          <span style={{ minWidth:28, fontWeight: vb>=va?700:400, color: vb>=va?'#8B5CF6':'var(--muted)' }}>{vb}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Friend Grid */}
          <div className="fq-section-hdr">
            <h2>{t('朋友列表', 'Friend Profiles')} {filteredProfiles.length < profiles.length ? `(${filteredProfiles.length}/${profiles.length})` : `(${profiles.length})`}</h2>
            <div className="fq-line" />
          </div>

          {profiles.length === 0 ? (
            <div className="fq-empty">
              <div className="fq-empty-icon">📡</div>
              <div className="fq-empty-title">{t('尚無朋友資料', 'No profiles yet')}</div>
              <div className="fq-empty-sub">{t('新增第一個朋友，開始量化你的友誼。', 'Add your first friend to start quantifying your relationships.')}</div>
              <button className="fq-btn fq-btn-primary" onClick={onCreateFriend}>+ {t('建立第一個', 'Create First Profile')}</button>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="fq-empty" style={{ padding:'32px 20px' }}>
              <div className="fq-empty-title">{t('找不到符合條件的朋友', 'No matches found')}</div>
              <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => { setSearch(''); setFilterGroup(''); setFilterTier(''); }}>{t('清除篩選','Clear filters')}</button>
            </div>
          ) : (() => {
            const surveyProfiles = filteredProfiles.filter(p => !p.noSurvey);
            const noSurveyProfiles = filteredProfiles.filter(p => p.noSurvey);

            function FriendCard({ p }) {
              const latest = getLatestSurvey(p.id);
              const tier = latest ? getScoreTier(latest.total) : null;
              const type = latest ? getFriendshipType(latest.scores, latest.typeOverride) : null;
              const group = getGroupById(p.groupId, customGroups);
              const bdays = birthdayCountdown(p.birthday);
              const inCompare = compareIds.includes(p.id);
              return (
                <div key={p.id} className={`fq-friend-card${inCompare ? ' fq-compare-selected' : ''}`} onClick={() => onSelectFriend(p)}>
                  {type && (
                    <div className="fq-type-tag" style={{ background: type.color + '22', color: type.color }}>
                      {type.key}
                      {latest?.typeOverride && <span style={{ fontSize:8, marginLeft:2, opacity:0.7 }}>✎</span>}
                    </div>
                  )}
                  {p.noSurvey && (
                    <div className="fq-type-tag" style={{ background:'var(--bg3)', color:'var(--muted)' }}>
                      {t('記錄','Record')}
                    </div>
                  )}
                  <div className="fq-friend-card-top">
                    <Avatar profile={p} size={40} />
                    <div>
                      <div className="fq-friend-name">{p.name}</div>
                      <div className="fq-friend-meta" style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                        {group && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background:group.color+'22', color:group.color, fontWeight:700 }}>{lang==='zh'?group.zh:group.en}</span>}
                        <span>{p.since ? `${t('認識於','Since')} ${p.since}` : t('年份不詳','Year unknown')}</span>
                        {bdays !== null && bdays <= 30 && <span style={{ color: bdays<=7?'#F87171':'var(--muted)', fontWeight:600, fontSize:11 }}>🎂 {bdays===0?t('今天！','Today!'):bdays+t('天','d')}</span>}
                        {(() => { const jc = journals.filter(j => j.profileId === p.id).length; return jc > 0 ? <span>· {jc} {t('則日誌','logs')}</span> : null; })()}
                      </div>
                    </div>
                    {!p.noSurvey && (latest ? (
                      <div className={`fq-score-badge tier-${tier.tier}`}>{latest.total}</div>
                    ) : (
                      <div className="fq-score-badge" style={{ color:'var(--muted)', fontSize:14 }}>N/A</div>
                    ))}
                  </div>
                  {latest && !p.noSurvey && (
                    <div className="fq-dim-mini">
                      {DIM_META.map(d => (
                        <div key={d.key} className="fq-dim-pip">
                          <span style={{ color: d.color, fontWeight:700 }}>{d.key}</span>
                          <div className="fq-dim-pip-bar">
                            <div className="fq-dim-pip-fill" style={{ width: `${latest.scores[d.key]}%`, background: d.color }} />
                          </div>
                          <span>{latest.scores[d.key]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                    {!latest && !p.noSurvey && (
                      <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={e => { e.stopPropagation(); onStartSurvey(p); }}>
                        {t('開始測驗', 'Start Survey')} →
                      </button>
                    )}
                    <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={e => { e.stopPropagation(); onLogUpdate(p); }}>
                      + {t('日誌', 'Log')}
                    </button>
                    <button
                      className={`fq-btn fq-btn-sm${inCompare ? ' fq-btn-primary' : ' fq-btn-ghost'}`}
                      onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}
                      style={{ marginLeft:'auto', padding:'4px 8px', fontSize:11 }}
                    >
                      ⊕
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <>
                {surveyProfiles.length > 0 && (
                  <div className="fq-friend-grid">
                    {surveyProfiles.map(p => <FriendCard key={p.id} p={p} />)}
                  </div>
                )}
                {noSurveyProfiles.length > 0 && (
                  <>
                    <div className="fq-section-hdr" style={{ marginTop: surveyProfiles.length > 0 ? 28 : 0, marginBottom:14 }}>
                      <h2>{t('純記錄（不評分）','Record Only')}</h2>
                      <div className="fq-line" />
                      <span style={{ fontSize:12, color:'var(--muted)' }}>{noSurveyProfiles.length} {t('人','profiles')}</span>
                    </div>
                    <div className="fq-friend-grid">
                      {noSurveyProfiles.map(p => <FriendCard key={p.id} p={p} />)}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
      </div>

    </div>
  );
}


// ─── Photo Crop Modal ──────────────────────────────────────────────────────────

function PhotoCropModal({ src, onApply, onCancel }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const PREVIEW = 260;
  const [scale, setScale] = useState(1);
  const [fillScale, setFillScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Log-scale slider: fillScale/ZOOM_K at 0%, fillScale at 50%, fillScale*ZOOM_K at 100%
  const ZOOM_K = 5;
  function sliderVal() {
    const mn = fillScale / ZOOM_K, mx = fillScale * ZOOM_K;
    return Math.log(Math.max(scale, mn) / mn) / Math.log(mx / mn) * 100;
  }
  function scaleFromSlider(v) {
    const mn = fillScale / ZOOM_K, mx = fillScale * ZOOM_K;
    return mn * Math.pow(mx / mn, v / 100);
  }
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  function startDrag(clientX, clientY) {
    dragStart.current = { x: clientX - offset.x, y: clientY - offset.y };
    setDragging(true);
  }
  function moveDrag(clientX, clientY) {
    if (!dragStart.current) return;
    setOffset({ x: clientX - dragStart.current.x, y: clientY - dragStart.current.y });
  }
  function endDrag() { dragStart.current = null; setDragging(false); }

  function handleApply() {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const OUT = 400;
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    const W = img.naturalWidth, H = img.naturalHeight;
    // image top-left in preview container coords
    const ix = PREVIEW / 2 + offset.x - (W * scale) / 2;
    const iy = PREVIEW / 2 + offset.y - (H * scale) / 2;
    // map preview → output
    const r = OUT / PREVIEW;
    ctx.drawImage(img, ix * r, iy * r, W * scale * r, H * scale * r);
    onApply(canvas.toDataURL('image/jpeg', 0.92));
  }

  return (
    <div className="fq-log-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="fq-log-panel" style={{ maxWidth: 340 }}>
        <div className="fq-log-panel-hdr">
          <div className="fq-log-panel-title">{t('調整照片', 'Adjust Photo')}</div>
          <button className="fq-log-close" onClick={onCancel}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
          <div style={{
            width: PREVIEW, height: PREVIEW, borderRadius:'50%', overflow:'hidden',
            border:'3px solid var(--accent)', position:'relative', background:'var(--bg2)',
            cursor: dragging ? 'grabbing' : 'grab', userSelect:'none', flexShrink:0
          }}
            onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
            onMouseMove={e => dragging && moveDrag(e.clientX, e.clientY)}
            onMouseUp={endDrag} onMouseLeave={endDrag}
            onTouchStart={e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
            onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
            onTouchEnd={endDrag}
          >
            <img ref={imgRef} src={src} alt="" draggable={false} style={{
              position:'absolute', left:'50%', top:'50%', maxWidth:'none',
              width: imgRef.current ? imgRef.current.naturalWidth * scale : 'auto',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              pointerEvents:'none'
            }} onLoad={() => {
              const img = imgRef.current;
              const W = img.naturalWidth, H = img.naturalHeight;
              const fs = Math.max(PREVIEW / W, PREVIEW / H);
              setFillScale(fs);
              setScale(fs);
            }} />
          </div>
          <div style={{ width:'100%' }}>
            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6 }}>
              {t('縮放', 'Zoom')}
            </label>
            <input type="range" min="0" max="100" step="0.5" value={sliderVal()}
              onChange={e => setScale(scaleFromSlider(parseFloat(e.target.value)))}
              style={{ width:'100%', accentColor:'var(--accent)' }} />
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <div className="fq-row" style={{ gap:10, width:'100%' }}>
            <button className="fq-btn fq-btn-primary" style={{ flex:1 }} onClick={handleApply}>
              ✓ {t('套用', 'Apply')}
            </button>
            <button className="fq-btn fq-btn-ghost" onClick={onCancel}>{t('取消', 'Cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Create/Edit Profile View ──────────────────────────────────────────────────

function CreateView({ editProfile, onSave, onCancel, onDelete, allProfiles }) {
  const lang = useContext(LangCtx);
  const customGroups = useContext(GroupsCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const isEdit = !!editProfile;
  const [name,        setName]        = useState(editProfile?.name      || '');
  const [photo,       setPhoto]       = useState(editProfile?.photo     || null);
  const [groupId,     setGroupId]     = useState(editProfile?.groupId   || '');
  const [since,       setSince]       = useState(editProfile?.since     || '');
  const [keyEvents,   setKeyEvents]   = useState(editProfile?.keyEvents || []);
  const [birthday,    setBirthday]    = useState(editProfile?.birthday  || { month:'', day:'' });
  const [prosList,    setProsList]    = useState(Array.isArray(editProfile?.pros) ? editProfile.pros : []);
  const [consList,    setConsList]    = useState(Array.isArray(editProfile?.cons) ? editProfile.cons : []);
  const [prosInput,   setProsInput]   = useState('');
  const [consInput,   setConsInput]   = useState('');
  const [noSurvey,    setNoSurvey]    = useState(editProfile?.noSurvey ?? false);
  const [quickScore,  setQuickScore]  = useState('');  // direct score input (skip survey)
  const [err,         setErr]         = useState('');
  const [cropSrc,     setCropSrc]     = useState(null);
  const [evtSharedId, setEvtSharedId] = useState('');
  const [showEvtSug,  setShowEvtSug]  = useState(false);
  const fileRef = useRef(null);

  // new custom group form
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [newGroupColor, setNewGroupColor] = useState(RAINBOW_COLORS[4]);

  // new key event form
  const [evtYear, setEvtYear] = useState('');
  const [evtText, setEvtText] = useState('');

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setErr(t('照片太大（最大 2 MB）','Photo too large (max 2 MB)')); return; }
    const reader = new FileReader();
    reader.onload = ev => { setCropSrc(ev.target.result); e.target.value = ''; };
    reader.readAsDataURL(file);
  }

  function addNewGroup() {
    if (!newGroupLabel.trim()) return;
    // parent will receive via onSave; we store in context via GroupsCtx parent update
    const g = { id: genId(), zh: newGroupLabel.trim(), en: newGroupLabel.trim(), color: newGroupColor };
    // bubble up via a callback - we embed it into profile save payload
    setGroupId('__new__' + JSON.stringify(g));
    setShowGroupForm(false); setNewGroupLabel(''); setNewGroupColor(RAINBOW_COLORS[4]);
  }

  function addEvent() {
    if (!evtText.trim()) return;
    const sid = evtSharedId || genId();
    setKeyEvents(prev => [...prev, { id: genId(), sharedId: sid, year: evtYear, text: evtText.trim() }]);
    setEvtYear(''); setEvtText(''); setEvtSharedId(''); setShowEvtSug(false);
  }

  function removeEvent(id) {
    setKeyEvents(prev => prev.filter(e => e.id !== id));
  }

  function handleSave() {
    if (!name.trim()) { setErr('Name is required'); return; }
    let resolvedGroupId = groupId;
    let newCustomGroup = null;
    if (groupId.startsWith('__new__')) {
      try { newCustomGroup = JSON.parse(groupId.replace('__new__','').trim()); resolvedGroupId = newCustomGroup.id; } catch {}
    }
    const group = getGroupById(resolvedGroupId, customGroups);
    const color = group ? group.color : '#60A5FA';
    const qs = quickScore !== '' ? Math.max(0, Math.min(90, parseInt(quickScore, 10))) : null;
    onSave({
      id: editProfile?.id || genId(),
      name: name.trim(), photo, color, groupId: resolvedGroupId || '',
      since, keyEvents, birthday, pros: prosList, cons: consList, noSurvey: noSurvey || false,
      createdAt: editProfile?.createdAt || new Date().toISOString(),
      _newGroup: newCustomGroup,
      _quickScore: (!isEdit && !noSurvey && qs !== null && !isNaN(qs)) ? qs : null,
    });
  }

  const resolvedColor = (() => {
    if (groupId.startsWith('__new__')) {
      try { return JSON.parse(groupId.replace('__new__','').trim()).color; } catch {}
    }
    return getGroupById(groupId, customGroups)?.color || '#60A5FA';
  })();
  const color = resolvedColor;
  const previewProfile = { name, photo, color: resolvedColor, groupId };

  return (
    <>
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 28 }}>
        <h2>{isEdit ? t('編輯資料','Edit Profile') : t('新增朋友','New Friend Profile')}</h2>
        <div className="fq-line" />
      </div>
      <div className="fq-form">
        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28, padding:'16px 20px', background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:10 }}>
          <Avatar profile={previewProfile} size={56} />
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{name || '(Name)'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              {groupId && !groupId.startsWith('__new__') && (() => { const g = getGroupById(groupId, customGroups); return g ? <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:g.color+'22', color:g.color, fontWeight:700, border:`1px solid ${g.color}` }}>{lang==='zh'?g.zh:g.en}</span> : null; })()}
              <span style={{ fontSize:12, color:'var(--muted)' }}>{since ? `${t('認識於','Since')} ${since}` : t('年份不詳','Year unknown')}</span>
              {birthday?.month && birthday?.day && <span style={{ fontSize:12, color:'var(--muted)' }}>🎂 {birthdayStr(birthday)}</span>}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="fq-form-row">
          <label className="fq-label">{t('姓名 *','Name *')}</label>
          <input className="fq-input" placeholder={t("朋友的名字或暱稱","Friend's name or nickname")}
            value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          {err && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{err}</div>}
        </div>

        {/* Photo */}
        <div className="fq-form-row">
          <label className="fq-label">{t('照片','Photo')}</label>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="fq-photo-upload" onClick={() => fileRef.current?.click()} style={{ background: color + '22', borderColor: photo ? color : undefined }}>
              {photo
                ? <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span className="fq-photo-upload-hint">{t('點擊','Click')}<br/>{t('上傳','Upload')}</span>
              }
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>{t('PNG / JPG，最大 2 MB','PNG / JPG, max 2 MB')}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {photo && <button className="fq-btn fq-btn-ghost fq-btn-sm" type="button" onClick={() => setCropSrc(photo)}>{t('重新調整','Adjust')}</button>}
                {photo && <button className="fq-btn fq-btn-ghost fq-btn-sm" type="button" onClick={() => setPhoto(null)}>{t('移除照片','Remove photo')}</button>}
              </div>
            </div>
          </div>
        </div>

        {/* Relationship Group */}
        <div className="fq-form-row">
          <label className="fq-label">{t('關係分組','Relationship Group')}</label>
          <div className="fq-tag-picker">
            {[...DEFAULT_GROUPS, ...customGroups].map(g => (
              <button key={g.id} type="button"
                className={`fq-tag-chip${groupId === g.id ? ' selected' : ''}`}
                style={{ '--tc': g.color }}
                onClick={() => setGroupId(groupId === g.id ? '' : g.id)}>
                {lang==='zh' ? g.zh : g.en}
              </button>
            ))}
            {showGroupForm ? (
              <div className="fq-tag-add-form">
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {RAINBOW_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewGroupColor(c)}
                      style={{ width:18, height:18, borderRadius:'50%', background:c, border: newGroupColor===c ? '2.5px solid var(--text)' : '2.5px solid transparent', cursor:'pointer', padding:0, flexShrink:0 }} />
                  ))}
                </div>
                <IMEInput value={newGroupLabel} onChange={e => setNewGroupLabel(e.target.value)}
                  onEnterKey={() => addNewGroup()}
                  placeholder={t('自訂分組名稱','Group name')} className="fq-tag-label-inp" autoFocus />
                <button type="button" className="fq-btn fq-btn-primary fq-btn-sm" onClick={addNewGroup}>✓</button>
                <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => setShowGroupForm(false)}>✕</button>
              </div>
            ) : (
              <button type="button" className="fq-tag-chip fq-tag-chip-add" onClick={() => setShowGroupForm(true)}>＋ {t('自訂','Custom')}</button>
            )}
          </div>
          {groupId && !groupId.startsWith('__new__') && (
            <div style={{ marginTop:6, fontSize:12, color:'var(--muted)' }}>
              <button type="button" onClick={() => setGroupId('')} style={{ fontSize:11, color:'var(--muted)', background:'none', border:'none', cursor:'pointer' }}>{t('清除','clear')}</button>
            </div>
          )}
        </div>

        {/* Birthday */}
        <div className="fq-form-row">
          <label className="fq-label">{t('生日（月/日）','Birthday (M/D)')}</label>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <select className="fq-input" style={{ width:110 }} value={birthday.month}
              onChange={e => setBirthday(b => ({ ...b, month: e.target.value }))}>
              <option value="">{t('月份','Month')}</option>
              {Array.from({length:12},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}</option>)}
            </select>
            <span style={{ color:'var(--muted)' }}>/</span>
            <select className="fq-input" style={{ width:110 }} value={birthday.day}
              onChange={e => setBirthday(b => ({ ...b, day: e.target.value }))}>
              <option value="">{t('日期','Day')}</option>
              {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1)}>{i+1}</option>)}
            </select>
            {(birthday.month || birthday.day) && (
              <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => setBirthday({month:'',day:''})}>{t('清除','clear')}</button>
            )}
          </div>
        </div>

        {/* Friends Since (year only) */}
        <div className="fq-form-row">
          <label className="fq-label">{t('認識時間','Friends Since')}</label>
          <select className="fq-input" value={since} onChange={e => setSince(e.target.value)}>
            <option value="">{t('— 選擇年份 —','— Select year —')}</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>

        {/* Key Events */}
        <div className="fq-form-row">
          <label className="fq-label">{t('重要事件','Key Events')}</label>
          <div className="fq-key-events">
            {keyEvents.length === 0 && (
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:10 }}>{t('尚無事件，新增里程碑、回憶或消息吧。','No events yet. Add milestones, memories, or news.')}</div>
            )}
            {[...keyEvents].sort((a,b) => (b.year||0) - (a.year||0)).map((ev, idx) => (
              <div key={ev.id} className="fq-key-event-row">
                <span className="fq-key-event-num">#{idx + 1}</span>
                {ev.year && <span className="fq-key-event-year">{ev.year}</span>}
                <span className="fq-key-event-text">{ev.text}</span>
                <button type="button" className="fq-key-event-del" onClick={() => removeEvent(ev.id)}>✕</button>
              </div>
            ))}
            <div className="fq-key-event-add">
              <IMEInput className="fq-key-event-year-inp" value={evtYear}
                onChange={e => setEvtYear(e.target.value)} placeholder={t('年份','Year')} type="number"
                min="1990" max={THIS_YEAR} />
              <div style={{ position:'relative', flex:1, minWidth:0 }}>
                <IMEInput className="fq-key-event-text-inp" value={evtText}
                  onChange={e => { setEvtText(e.target.value); setEvtSharedId(''); setShowEvtSug(true); }}
                  onFocus={() => setShowEvtSug(true)}
                  onBlur={() => setTimeout(() => setShowEvtSug(false), 150)}
                  onEnterKey={() => addEvent()}
                  placeholder={t('例：創業','e.g. Started his own company')}
                  style={{ width:'100%' }} />
                {showEvtSug && <EventSuggest text={evtText} allProfiles={allProfiles} excludeId={editProfile?.id}
                  onSelect={ev => { setEvtYear(ev.year || evtYear); setEvtText(ev.text); setEvtSharedId(getEvtKey(ev)); setShowEvtSug(false); }} />}
              </div>
              <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm" onClick={addEvent}>＋</button>
            </div>
          </div>
        </div>

        {/* Pros */}
        <div className="fq-form-row">
          <label className="fq-label">{t('優點','Strengths')}</label>
          <div className="fq-key-events">
            {prosList.length === 0 && (
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>{t('尚未新增任何優點。','No strengths added yet.')}</div>
            )}
            {prosList.map((item, i) => (
              <div key={i} className="fq-key-event-row">
                <span style={{ color:'#34D399', fontWeight:800, minWidth:14 }}>•</span>
                <span className="fq-key-event-text">{item}</span>
                <button type="button" className="fq-key-event-del" onClick={() => setProsList(prev => prev.filter((_,idx) => idx !== i))}>✕</button>
              </div>
            ))}
            <div className="fq-key-event-add">
              <IMEInput className="fq-key-event-text-inp" value={prosInput}
                onChange={e => setProsInput(e.target.value)}
                onEnterKey={() => { if (prosInput.trim()) { setProsList(prev => [...prev, prosInput.trim()]); setProsInput(''); }}}
                placeholder={t('例：很懂得傾聽、樂於幫忙','e.g. Great listener, always willing to help')} />
              <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm"
                onClick={() => { if (prosInput.trim()) { setProsList(prev => [...prev, prosInput.trim()]); setProsInput(''); }}}>＋</button>
            </div>
          </div>
        </div>

        {/* Cons */}
        <div className="fq-form-row">
          <label className="fq-label">{t('缺點 / 挑戰','Weaknesses / Challenges')}</label>
          <div className="fq-key-events">
            {consList.length === 0 && (
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>{t('尚未新增任何缺點。','No weaknesses added yet.')}</div>
            )}
            {consList.map((item, i) => (
              <div key={i} className="fq-key-event-row">
                <span style={{ color:'#F87171', fontWeight:800, minWidth:14 }}>•</span>
                <span className="fq-key-event-text">{item}</span>
                <button type="button" className="fq-key-event-del" onClick={() => setConsList(prev => prev.filter((_,idx) => idx !== i))}>✕</button>
              </div>
            ))}
            <div className="fq-key-event-add">
              <IMEInput className="fq-key-event-text-inp" value={consInput}
                onChange={e => setConsInput(e.target.value)}
                onEnterKey={() => { if (consInput.trim()) { setConsList(prev => [...prev, consInput.trim()]); setConsInput(''); }}}
                placeholder={t('例：容易遲到、有時太直接','e.g. Often late, sometimes too blunt')} />
              <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm"
                onClick={() => { if (consInput.trim()) { setConsList(prev => [...prev, consInput.trim()]); setConsInput(''); }}}>＋</button>
            </div>
          </div>
        </div>

        {/* Survey toggle */}
        <div className="fq-form-row">
          <label className="fq-label">{t('FQ 測驗','FQ Survey')}</label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button type="button" onClick={() => setNoSurvey(v => !v)}
              style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', padding:0,
                background: noSurvey ? 'var(--border)' : 'var(--accent)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <span style={{ position:'absolute', top:3, left: noSurvey ? 3 : 23, width:18, height:18,
                borderRadius:'50%', background:'white', transition:'left 0.2s', display:'block' }}/>
            </button>
            <span style={{ fontSize:13, color:'var(--muted)' }}>
              {noSurvey ? t('不做 FQ 測驗（純記錄用）','No FQ survey — record only') : t('啟用 FQ 測驗評分','FQ scoring enabled')}
            </span>
          </div>
        </div>

        {!isEdit && !noSurvey && (
          <div className="fq-form-row">
            <label className="fq-label">{t('直接給分（選填）','Quick Score (optional)')}</label>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input
                  type="number" min="0" max="90"
                  className="fq-input"
                  style={{ width:100 }}
                  placeholder={t('0 – 90','0 – 90')}
                  value={quickScore}
                  onChange={e => setQuickScore(e.target.value)}
                />
                {quickScore !== '' && !isNaN(parseInt(quickScore)) && (() => {
                  const s = Math.max(0, Math.min(90, parseInt(quickScore)));
                  const d = Math.min(100, Math.round(s / 0.9));
                  const scores = { F:d, R:d, S:d, T:d, St:d, E:d, total: s };
                  const type = getFriendshipType(scores);
                  const tier = getScoreTier(s);
                  return (
                    <span style={{ fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ color: tier.color, fontWeight:700 }}>Tier {tier.tier}</span>
                      <span style={{ padding:'2px 8px', borderRadius:4, background: type.color+'22', color: type.color, fontWeight:700 }}>{type.key} {lang==='zh'?type.name:type.en}</span>
                    </span>
                  );
                })()}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>
                {t('留空則等到完成測驗後才有分數。填入後系統會自動推算各維度並判斷類型。','Leave blank to score via survey later. If filled, dimensions are auto-derived equally.')}
              </div>
            </div>
          </div>
        )}

        <div className="fq-row" style={{ gap:10, marginTop:8 }}>
          <button className="fq-btn fq-btn-primary" onClick={handleSave}>
            {isEdit ? t('✓ 儲存變更','✓ Save Changes') : t('✓ 建立資料','✓ Create Profile')}
          </button>
          <button className="fq-btn fq-btn-ghost" onClick={onCancel}>{t('取消','Cancel')}</button>
          {isEdit && (
            <button className="fq-btn fq-btn-danger fq-btn-sm" style={{ marginLeft:'auto' }} onClick={onDelete}>
              {t('刪除資料','Delete Profile')}
            </button>
          )}
        </div>
      </div>
    </div>
    {cropSrc && (
      <PhotoCropModal
        src={cropSrc}
        onApply={result => { setPhoto(result); setCropSrc(null); }}
        onCancel={() => setCropSrc(null)}
      />
    )}
    </>
  );
}


// ─── Survey View ───────────────────────────────────────────────────────────────

function SurveyView({ profile, onComplete, onCancel }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(Array(24).fill(null));

  const liveAnswers = answers.map(a => a !== null ? a : 0);
  const liveScores = calcScores(liveAnswers);

  function handleSelect(val) {
    const next = [...answers];
    next[currentQ] = val;
    setAnswers(next);
  }

  function handleNext() {
    if (answers[currentQ] === null) return;
    if (currentQ < 23) {
      setCurrentQ(currentQ + 1);
    } else {
      // submit
      const finalAnswers = answers.map(a => a !== null ? a : 1);
      const scores = calcScores(finalAnswers);
      const type = getFriendshipType(scores);
      const survey = {
        id: genId(),
        profileId: profile.id,
        answers: finalAnswers,
        scores,
        total: scores.total,
        type: type.key,
        createdAt: new Date().toISOString(),
      };
      onComplete(survey);
    }
  }

  function handlePrev() {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  }

  const q = QUESTIONS[currentQ];
  const dimIdx = DIM_META.findIndex(d => d.key === q.dim);
  const dimMeta = DIM_META[dimIdx];
  const progress = (currentQ / 20) * 100;

  // sidebar: partial scores
  function partialScore(dimKey) {
    const di = DIM_META.findIndex(d => d.key === dimKey);
    const slice = answers.slice(di * 4, di * 4 + 4);
    const filled = slice.filter(a => a !== null);
    if (filled.length === 0) return null;
    const sum = filled.reduce((a,b) => a+b,0);
    const fullSum = sum + (4 - filled.length) * 0; // assume 0 for unfilled
    return Math.round(((sum - filled.length) / (filled.length * 3)) * 100);
  }

  return (
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 20 }}>
        <Avatar profile={profile} size={32} />
        <h2 style={{ fontSize:14, letterSpacing:0 }}>{profile.name} — FQ {t('測驗','Survey')}</h2>
        <div className="fq-line" />
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={onCancel}>✕ {t('取消','Cancel')}</button>
      </div>

      <div className="fq-survey-layout">
        {/* Main question area */}
        <div>
          <div className="fq-survey-progress">
            <div className="fq-survey-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="fq-survey-dim-header" style={{ color: dimMeta.color }}>
            [{dimMeta.en.toUpperCase()}] {lang === 'zh' ? dimMeta.label : dimMeta.en}
          </div>
          <div className="fq-survey-q-num">{t('第','Question')} {currentQ + 1} {t('題，共24題','of 24')}</div>
          <div className="fq-survey-q-text">{lang === 'zh' ? q.text : q.en}</div>

          <div className="fq-likert">
            {(lang === 'zh' ? q.opts : q.enOpts).map((opt, oi) => {
              const val = oi + 1;
              const selected = answers[currentQ] === val;
              return (
                <div
                  key={oi}
                  className={`fq-likert-opt${selected ? ' selected' : ''}`}
                  onClick={() => handleSelect(val)}
                >
                  <div className="fq-likert-dot">
                    <div className="fq-likert-dot-inner" />
                  </div>
                  <span className="fq-likert-val">{val}</span>
                  <span className="fq-likert-text">{opt}</span>
                </div>
              );
            })}
          </div>

          <div className="fq-survey-nav">
            <button
              className="fq-btn fq-btn-ghost"
              onClick={handlePrev}
              disabled={currentQ === 0}
              style={{ opacity: currentQ === 0 ? 0.4 : 1 }}
            >
              ← {t('上一題','Prev')}
            </button>
            <span className="fq-q-counter">{currentQ + 1} / 24</span>
            <button
              className="fq-btn fq-btn-primary"
              onClick={handleNext}
              disabled={answers[currentQ] === null}
              style={{ opacity: answers[currentQ] === null ? 0.5 : 1 }}
            >
              {currentQ === 23 ? `${t('完成','Done')} →` : `${t('下一題','Next')} →`}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="fq-survey-sidebar fq-card">
          <div className="fq-live-label">
            <div className="fq-live-dot" />
            Live Analysis
          </div>

          <div className="fq-dim-bars">
            {DIM_META.map(d => {
              const partial = partialScore(d.key);
              return (
                <div key={d.key} className="fq-dim-bar-row">
                  <div className="fq-dim-bar-top">
                    <span className="fq-dim-bar-name" style={{ color: d.color }}>{lang === 'zh' ? d.label : d.en}</span>
                    <span className="fq-dim-bar-score" style={{ color: d.color }}>
                      {partial !== null ? partial : '—'}
                    </span>
                  </div>
                  <div className="fq-dim-bar-track">
                    <div
                      className="fq-dim-bar-fill"
                      style={{
                        width: partial !== null ? `${partial}%` : '0%',
                        background: d.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* progress dots */}
          <div className="fq-survey-q-dots">
            {Array.from({ length: 24 }, (_, i) => (
              <div
                key={i}
                className={`fq-survey-q-dot${i === currentQ ? ' current' : answers[i] !== null ? ' answered' : ''}`}
                onClick={() => { if (i <= currentQ || answers[i-1] !== null) setCurrentQ(i); }}
                style={{ cursor:'pointer' }}
                title={`Q${i+1}`}
              />
            ))}
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>
            {answers.filter(a => a !== null).length} / 24 {t('已回答','answered')}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Results View ──────────────────────────────────────────────────────────────

function ResultsView({ survey, profile, surveys, onDone, onRetake, onViewDetail, onUpdateSurvey }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const { scores } = survey;
  const tier = getScoreTier(scores.total);
  const type = getFriendshipType(scores, survey.typeOverride);
  const suggestions = getSuggestions(scores);
  // Previous survey for delta
  const prevSurvey = (surveys || [])
    .filter(s => s.profileId === profile.id && s.id !== survey.id)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

  return (
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 24 }}>
        <Avatar profile={profile} size={32} />
        <h2 style={{ fontSize:14 }}>{profile.name} — {t('分析結果','Analysis Results')}</h2>
        <div className="fq-line" />
        <span style={{ fontSize:12, color:'var(--muted)' }}>{fmtDate(survey.createdAt)}</span>
      </div>

      <div className="fq-results-layout">
        {/* Score hero */}
        <div className="fq-card fq-results-score-hero">
          <div className="fq-results-big-score" style={{ color: tier.color }}>
            {scores.total}
          </div>
          <div className="fq-results-tier" style={{ color: tier.color }}>
            TIER {tier.tier} — FQ SCORE
            {prevSurvey && (() => {
              const diff = scores.total - prevSurvey.total;
              if (diff === 0) return null;
              return <span style={{ fontSize:14, marginLeft:8, color: diff>0?'var(--green)':'var(--red)', fontWeight:700 }}>{diff>0?'+':''}{diff}</span>;
            })()}
          </div>
          <div style={{
            display:'inline-block',
            padding:'4px 14px',
            borderRadius:6,
            background: type.color + '22',
            color: type.color,
            fontSize:12,
            fontWeight:700,
            letterSpacing:'0.05em',
            marginBottom:12,
          }}>
            {type.key} · {type.en}
          </div>
          <div className="fq-results-type-name">{lang === 'zh' ? type.name : type.en}</div>
          <div className="fq-results-type-desc">{type.desc}</div>
        </div>

        {/* Radar */}
        <div className="fq-card fq-radar-wrap">
          <RadarChart scores={scores} size={260} />
        </div>
      </div>

      <div className="fq-results-layout">
        {/* Dimension breakdown */}
        <div className="fq-card">
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:16 }}>
            {t('維度分析','Dimension Breakdown')}
          </div>
          <div className="fq-dim-breakdown">
            {DIM_META.map(d => (
              <div key={d.key} className="fq-dim-breakdown-row">
                <div className="fq-dim-breakdown-top">
                  <span className="fq-dim-breakdown-name">
                    <span style={{ width:10, height:10, borderRadius:'50%', background: d.color, display:'inline-block' }} />
                    {lang === 'zh' ? d.label : d.en}
                  </span>
                  <span className="fq-dim-breakdown-score" style={{ color: d.color }}>
                    {scores[d.key]}
                    <span style={{ fontSize:12, fontWeight:400, color:'var(--muted)' }}>/100</span>
                    {prevSurvey && (() => {
                      const diff = scores[d.key] - prevSurvey.scores[d.key];
                      if (diff === 0) return null;
                      return <span style={{ fontSize:11, marginLeft:4, color: diff>0?'var(--green)':'var(--red)', fontWeight:700 }}>{diff>0?'+':''}{diff}</span>;
                    })()}
                  </span>
                </div>
                <div className="fq-dim-breakdown-track">
                  <div
                    className="fq-dim-breakdown-fill"
                    style={{ width: `${scores[d.key]}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="fq-card">
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:16 }}>
            {t('建議','Suggestions')}
          </div>
          <div className="fq-flags">
            {suggestions.map((s, i) => (
              <div key={i} className="fq-flag">
                <span className="fq-flag-icon">{s.icon}</span>
                <span>{lang === 'zh' ? s.zh : s.en}</span>
              </div>
            ))}
          </div>
          <div className="fq-divider" />
          <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>
            FQ = (F×15% + R×18% + S×20% + T×20% + St×15% + E×12%) × 0.9 → max 90
          </div>
        </div>
      </div>

      {/* Type Override Picker */}
      {onUpdateSurvey && (
        <div className="fq-card" style={{ marginTop: 24 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:12 }}>
            {t('手動調整友誼類型','Override Friendship Type')}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {ALL_FRIENDSHIP_TYPES.map(tp => {
              const isSelected = (survey.typeOverride || type.key) === tp.key;
              const isAuto = !survey.typeOverride && tp.key === type.key;
              return (
                <button
                  key={tp.key}
                  onClick={() => {
                    const newOverride = survey.typeOverride === tp.key ? null : tp.key;
                    onUpdateSurvey({ ...survey, typeOverride: newOverride });
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: `2px solid ${isSelected ? tp.color : 'transparent'}`,
                    background: isSelected ? tp.color + '22' : 'var(--surface2)',
                    color: isSelected ? tp.color : 'var(--text)',
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  title={lang === 'zh' ? tp.name : tp.en}
                >
                  {tp.key} · {lang === 'zh' ? tp.name : tp.en}
                  {isAuto && <span style={{ fontSize:10, marginLeft:4, opacity:0.6 }}>auto</span>}
                </button>
              );
            })}
          </div>
          {survey.typeOverride && (
            <div style={{ marginTop:8, fontSize:11, color:'var(--muted)' }}>
              {t('已手動設定。點擊同一個類型可取消覆蓋。','Manually set. Click the same type again to revert to auto.')}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="fq-row" style={{ marginTop:24, gap:10 }}>
        <button className="fq-btn fq-btn-primary" onClick={onViewDetail}>
          {t('查看完整歷史','View Full History')} →
        </button>
        <button className="fq-btn fq-btn-ghost" onClick={onRetake}>
          {t('重新測驗','Retake Survey')}
        </button>
        <button className="fq-btn fq-btn-ghost" onClick={onDone}>
          ← {t('儀表板','Dashboard')}
        </button>
      </div>
    </div>
  );
}


// ─── Detail View ───────────────────────────────────────────────────────────────

function DetailView({ profile, surveys, journals, onEdit, onDelete, onStartSurvey, onBack, onLogUpdate, onProfileUpdate, allProfiles, onSelectFriend, onUpdateSurvey }) {
  const lang = useContext(LangCtx);
  const customGroups = useContext(GroupsCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const [photoLightbox, setPhotoLightbox] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [evtYear,     setEvtYear]     = useState('');
  const [evtText,     setEvtText]     = useState('');
  const [evtSharedId, setEvtSharedId] = useState('');
  const [showEvtSug,  setShowEvtSug]  = useState(false);
  const [evtMembersEv, setEvtMembersEv] = useState(null);
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');

  function addEvent() {
    if (!evtText.trim()) return;
    const sid = evtSharedId || genId();
    const updated = { ...profile, keyEvents: [...(profile.keyEvents || []), { id: genId(), sharedId: sid, year: evtYear, text: evtText.trim() }] };
    onProfileUpdate(updated);
    setEvtYear(''); setEvtText(''); setEvtSharedId(''); setShowEvtSug(false);
  }
  function addPro() {
    if (!prosInput.trim()) return;
    const updated = { ...profile, pros: [...(Array.isArray(profile.pros) ? profile.pros : []), prosInput.trim()] };
    onProfileUpdate(updated);
    setProsInput('');
  }
  function addCon() {
    if (!consInput.trim()) return;
    const updated = { ...profile, cons: [...(Array.isArray(profile.cons) ? profile.cons : []), consInput.trim()] };
    onProfileUpdate(updated);
    setConsInput('');
  }
  const group = getGroupById(profile.groupId, customGroups);
  const bdays = birthdayCountdown(profile.birthday);
  const profileSurveys = surveys
    .filter(s => s.profileId === profile.id)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const latest = profileSurveys[0] || null;
  const tier = latest ? getScoreTier(latest.total) : null;
  const type = latest ? getFriendshipType(latest.scores, latest.typeOverride) : null;

  const surveyCount = profileSurveys.length;
  const avgScore = surveyCount === 0 ? null :
    Math.round(profileSurveys.reduce((a,s) => a + s.total, 0) / surveyCount);
  const bestScore = surveyCount === 0 ? null :
    Math.max(...profileSurveys.map(s => s.total));

  // Interaction score: average of last 5 rated logs × 20 (1★=20 … 5★=100)
  const ratedLogs = journals
    .filter(j => j.profileId === profile.id && j.rating)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const interactionScore = ratedLogs.length === 0 ? null :
    Math.round(ratedLogs.reduce((acc, j) => acc + j.rating, 0) / ratedLogs.length * 20);
  const interactionStars = ratedLogs.length === 0 ? null :
    (ratedLogs.reduce((acc, j) => acc + j.rating, 0) / ratedLogs.length).toFixed(1);

  return (
    <>
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 24 }}>
        <h2>{t('朋友詳情', 'Friend Detail')}</h2>
        <div className="fq-line" />
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={onEdit}>✎ {t('編輯', 'Edit')}</button>
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => onLogUpdate(profile)}>+ {t('日誌', 'Log')}</button>
        {!profile.noSurvey && (
          <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={() => onStartSurvey(profile)}>
            + {t('測驗', 'Survey')}
          </button>
        )}
        <button className="fq-btn fq-btn-danger fq-btn-sm" onClick={onDelete}>
          🗑 {t('刪除', 'Delete')}
        </button>
      </div>

      <div className="fq-detail-layout">
        {/* Sidebar */}
        <div className="fq-detail-sidebar fq-card">
          <div onClick={() => profile.photo && setPhotoLightbox(true)}
            style={{ cursor: profile.photo ? 'zoom-in' : 'default', display:'flex', justifyContent:'center', marginBottom:14 }}>
            <Avatar profile={profile} size={68} />
          </div>
          <div className="fq-detail-name">{profile.name}</div>
          <div className="fq-detail-since">
            {profile.since ? `${t('認識於','Friends since')} ${profile.since}` : t('年份未記錄','Year not recorded')}
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {group && <span style={{ fontSize:12, padding:'2px 10px', borderRadius:10, background:group.color+'22', color:group.color, fontWeight:700, border:`1px solid ${group.color}44` }}>{lang==='zh'?group.zh:group.en}</span>}
            {profile.birthday?.month && profile.birthday?.day && (
              <span style={{ fontSize:12, padding:'2px 10px', borderRadius:10, background:'var(--bg2)', color: bdays!==null&&bdays<=7?'#F87171':'var(--muted)', fontWeight:600, border:'1px solid var(--border)' }}>
                🎂 {birthdayStr(profile.birthday)}{bdays!==null&&bdays<=30?' · '+(bdays===0?t('今天！','Today!'):bdays+t('天後','d')):''}
              </span>
            )}
          </div>

          {latest && (
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:44, fontWeight:900, color: tier.color, lineHeight:1 }}>
                {latest.total}
              </div>
              <div style={{ fontSize:13, color: tier.color, fontWeight:700, marginTop:4 }}>
                TIER {tier.tier}
              </div>
              <div
                onClick={() => onUpdateSurvey && setTypePickerOpen(true)}
                style={{ fontSize:11, marginTop:6, padding:'3px 10px', borderRadius:5, display:'inline-block', background: type.color + '22', color: type.color, fontWeight:600, cursor: onUpdateSurvey ? 'pointer' : 'default' }}
                title={onUpdateSurvey ? t('點擊更改類型','Click to change type') : undefined}
              >
                {type.name}
                {latest?.typeOverride && <span style={{ fontSize:9, marginLeft:3, opacity:0.7 }}>✎</span>}
              </div>
            </div>
          )}

          {interactionScore !== null && (
            <div style={{ textAlign:'center', marginBottom:16, padding:'10px 0', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>
                {t('近期互動分','Recent Interaction')}
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:'#F59E0B', lineHeight:1 }}>{interactionScore}</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
                ⭐ {interactionStars} &nbsp;·&nbsp; {ratedLogs.length} {t('筆','logs')}
              </div>
            </div>
          )}

          <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
            {[
              [t('測驗次數','Surveys taken'), surveyCount],
              [t('平均分數','Avg score'), avgScore !== null ? avgScore : '—'],
              [t('最高分','Best score'), bestScore !== null ? bestScore : '—'],
              [t('最近測驗','Last survey'), latest ? fmtDate(latest.createdAt) : '—'],
            ].map(([label, val]) => (
              <div key={label} className="fq-detail-stat">
                <span className="fq-detail-stat-label">{label}</span>
                <span className="fq-detail-stat-val">{val}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:14 }}>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>{t('重要事件','Key Events')}</div>
            {(profile.keyEvents || []).length === 0 && (
              <div style={{ fontSize:12, color:'var(--dim)', marginBottom:8 }}>{t('尚無事件','No events yet')}</div>
            )}
            {[...(profile.keyEvents || [])].sort((a,b)=>(b.year||0)-(a.year||0)).map((ev, i) => {
              const members = allProfiles ? findEventMembers(ev, allProfiles) : [];
              const othersCount = members.filter(p => p.id !== profile.id).length;
              return (
                <div key={ev.id || i}
                  style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6, fontSize:13,
                    cursor: othersCount > 0 ? 'pointer' : 'default',
                    padding:'3px 4px', borderRadius:6, transition:'background 0.15s' }}
                  onClick={() => othersCount > 0 && setEvtMembersEv(ev)}
                  onMouseEnter={e => { if (othersCount > 0) e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', minWidth:16 }}>#{i+1}</span>
                  {ev.year && <span style={{ fontSize:11, padding:'1px 6px', borderRadius:6, background:'var(--bg3)', color:'var(--muted)', flexShrink:0 }}>{ev.year}</span>}
                  <span style={{ color:'var(--text)', lineHeight:1.5, flex:1 }}>{ev.text}</span>
                  {othersCount > 0 && (
                    <span style={{ fontSize:10, padding:'1px 5px', borderRadius:8, background:'var(--accent)22',
                      color:'var(--accent)', fontWeight:700, flexShrink:0 }}>👥 {othersCount}</span>
                  )}
                </div>
              );
            })}
            <div style={{ display:'flex', gap:4, marginTop:6 }}>
              <IMEInput value={evtYear} onChange={e => setEvtYear(e.target.value)}
                placeholder={t('年份','Year')} type="number" min="1990" max={THIS_YEAR}
                style={{ width:64, padding:'4px 6px', fontSize:12, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', flexShrink:0 }} />
              <div style={{ position:'relative', flex:1, minWidth:0 }}>
                <IMEInput value={evtText}
                  onChange={e => { setEvtText(e.target.value); setEvtSharedId(''); setShowEvtSug(true); }}
                  onFocus={() => setShowEvtSug(true)}
                  onBlur={() => setTimeout(() => setShowEvtSug(false), 150)}
                  onEnterKey={addEvent}
                  placeholder={t('新增事件…','Add event…')}
                  style={{ width:'100%', padding:'4px 8px', fontSize:12, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)' }} />
                {showEvtSug && <EventSuggest text={evtText} allProfiles={allProfiles} excludeId={profile.id}
                  onSelect={ev => { setEvtYear(ev.year || evtYear); setEvtText(ev.text); setEvtSharedId(getEvtKey(ev)); setShowEvtSug(false); }} />}
              </div>
              <button onClick={addEvent} style={{ padding:'4px 8px', fontSize:13, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--muted)', cursor:'pointer', flexShrink:0 }}>＋</button>
            </div>
          </div>
          {/* Pros & Cons */}
          <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:14 }}>
            {/* Pros */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#34D399', marginBottom:6 }}>
                {t('優點','Strengths')}
              </div>
              {(Array.isArray(profile.pros) ? profile.pros : []).map((item, i) => (
                <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom:4, fontSize:13 }}>
                  <span style={{ color:'#34D399', fontWeight:800, flexShrink:0 }}>•</span>
                  <span style={{ color:'var(--text)', lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
              <div style={{ display:'flex', gap:4, marginTop:4 }}>
                <IMEInput value={prosInput} onChange={e => setProsInput(e.target.value)}
                  onEnterKey={addPro}
                  placeholder={t('新增優點…','Add strength…')}
                  style={{ flex:1, padding:'4px 8px', fontSize:12, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', minWidth:0 }} />
                <button onClick={addPro} style={{ padding:'4px 8px', fontSize:13, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'#34D399', cursor:'pointer', flexShrink:0 }}>＋</button>
              </div>
            </div>
            {/* Cons */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#F87171', marginBottom:6 }}>
                {t('缺點 / 挑戰','Weaknesses / Challenges')}
              </div>
              {(Array.isArray(profile.cons) ? profile.cons : []).map((item, i) => (
                <div key={i} style={{ display:'flex', gap:7, alignItems:'flex-start', marginBottom:4, fontSize:13 }}>
                  <span style={{ color:'#F87171', fontWeight:800, flexShrink:0 }}>•</span>
                  <span style={{ color:'var(--text)', lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
              <div style={{ display:'flex', gap:4, marginTop:4 }}>
                <IMEInput value={consInput} onChange={e => setConsInput(e.target.value)}
                  onEnterKey={addCon}
                  placeholder={t('新增缺點…','Add weakness…')}
                  style={{ flex:1, padding:'4px 8px', fontSize:12, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', minWidth:0 }} />
                <button onClick={addCon} style={{ padding:'4px 8px', fontSize:13, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'#F87171', cursor:'pointer', flexShrink:0 }}>＋</button>
              </div>
            </div>
          </div>

          {/* legacy notes support */}
          {profile.notes && !profile.keyEvents && (
            <div style={{ marginTop:14, padding:'10px 12px', background:'var(--bg2)', borderRadius:7, fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
              {profile.notes}
            </div>
          )}

          {latest && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>
                {t('最新維度','Latest Dimensions')}
              </div>
              {DIM_META.map(d => (
                <div key={d.key} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span style={{ color: d.color, fontWeight:600 }}>{d.label}</span>
                    <span style={{ fontWeight:700, color: d.color }}>{latest.scores[d.key]}</span>
                  </div>
                  <div style={{ height:5, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${latest.scores[d.key]}%`, background: d.color, borderRadius:3, transition:'width 0.6s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div>
          {/* Key Events Timeline */}
          {profile.keyEvents && profile.keyEvents.length > 0 && (
            <>
              <div className="fq-section-hdr" style={{ marginBottom:14 }}>
                <h2>{t('重要事件','Key Events')}</h2>
                <div className="fq-line" />
                <span style={{ fontSize:12, color:'var(--muted)' }}>{profile.keyEvents.length} {t('筆','events')}</span>
              </div>
              <div className="fq-card fq-key-event-timeline" style={{ marginBottom:20 }}>
                {[...profile.keyEvents]
                  .sort((a, b) => (b.year || 0) - (a.year || 0))
                  .map((ev, i) => (
                    <div key={ev.id || i} className="fq-ket-row">
                      <div className="fq-ket-dot" />
                      <div className="fq-ket-body">
                        {ev.year && <span className="fq-ket-year">{ev.year}</span>}
                        <span className="fq-ket-text">{ev.text}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </>
          )}

          {/* Score trend + radar + survey history (survey-enabled only) */}
          {!profile.noSurvey && (<>
          <div className="fq-section-hdr" style={{ marginBottom:14 }}>
            <h2>{t('分數趨勢','Score Trend')}</h2>
            <div className="fq-line" />
          </div>
          <div className="fq-card" style={{ marginBottom:20 }}>
            <LineChart surveys={profileSurveys} />
          </div>

          {latest && (
            <>
              <div className="fq-section-hdr" style={{ marginBottom:14 }}>
                <h2>{t('最新雷達圖','Latest Radar')}</h2>
                <div className="fq-line" />
                <span style={{ fontSize:12, color:'var(--muted)' }}>{fmtDate(latest.createdAt)}</span>
              </div>
              <div className="fq-card" style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
                <RadarChart scores={latest.scores} size={280} />
              </div>
            </>
          )}

          <div className="fq-section-hdr" style={{ marginBottom:14 }}>
            <h2>{t('測驗記錄','Survey History')}</h2>
            <div className="fq-line" />
            <span style={{ fontSize:12, color:'var(--muted)' }}>{surveyCount} {t('筆','records')}</span>
          </div>

          {profileSurveys.length === 0 ? (
            <div className="fq-empty" style={{ padding:'40px 20px' }}>
              <div className="fq-empty-icon">📊</div>
              <div className="fq-empty-title">{t('尚無測驗記錄','No surveys yet')}</div>
              <div className="fq-empty-sub">{t('開始第一次測驗來量化這段友誼。','Start a survey to begin quantifying this friendship.')}</div>
              <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={() => onStartSurvey(profile)}>
                + {t('開始測驗','Start Survey')}
              </button>
            </div>
          ) : (
            <div className="fq-survey-history-list">
              {profileSurveys.map((s, idx) => {
                const sTier = getScoreTier(s.total);
                const sType = getFriendshipType(s.scores, s.typeOverride);
                return (
                  <div key={s.id} className="fq-survey-history-row">
                    <span style={{ fontSize:11, color:'var(--muted)', minWidth:24 }}>
                      #{profileSurveys.length - idx}
                    </span>
                    <span className="fq-survey-history-date">{fmtDate(s.createdAt)}</span>
                    <span className="fq-survey-history-score" style={{ color: sTier.color }}>
                      {s.total}
                      <span style={{ fontSize:12, fontWeight:600, marginLeft:4 }}>({sTier.tier})</span>
                    </span>
                    <span className="fq-survey-history-type">{sType.name}</span>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background: sType.color + '22', color: sType.color, fontWeight:600 }}>
                      {sType.key}
                    </span>
                    {idx > 0 && (() => {
                      const prev = profileSurveys[idx - 1];
                      const diff = s.total - prev.total;
                      if (diff === 0) return null;
                      return (
                        <span style={{ fontSize:12, color: diff > 0 ? 'var(--green)' : 'var(--red)', fontWeight:700, minWidth:32 }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
          </>)}

          {/* Journal / Log entries */}
          {(() => {
            const profileJournals = (journals || [])
              .filter(j => j.profileId === profile.id)
              .sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));
            const moodMap = Object.fromEntries(MOODS.map(m => [m.key, m]));
            return (
              <>
                <div className="fq-section-hdr" style={{ marginBottom:14, marginTop:24 }}>
                  <h2>{t('互動日誌','Interaction Log')}</h2>
                  <div className="fq-line" />
                  <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => onLogUpdate(profile)}>+ {t('新增','Add')}</button>
                </div>
                {profileJournals.length === 0 ? (
                  <div className="fq-empty" style={{ padding:'28px 20px' }}>
                    <div className="fq-empty-title">{t('尚無日誌','No logs yet')}</div>
                    <div className="fq-empty-sub">{t('點擊「+ 日誌」記錄最新的互動感受。','Click "+ Log" to record your latest interaction.')}</div>
                  </div>
                ) : (
                  <div className="fq-journal-list">
                    {profileJournals.map(j => {
                      const m = moodMap[j.mood] || { icon:'📝', label:j.mood };
                      return (
                        <div key={j.id} className="fq-journal-entry">
                          <div className="fq-journal-mood-icon">{m.icon}</div>
                          <div className="fq-journal-body">
                            <div className="fq-journal-meta">
                              <span className="fq-journal-date">{fmtDate(j.date || j.createdAt)}</span>
                              <span className="fq-journal-mood-label">{lang === 'zh' ? (m.zh || m.label || j.mood) : (m.en || j.mood)}</span>
                            </div>
                            <div className="fq-journal-text">{j.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
    {evtMembersEv && allProfiles && (
      <EventMembersModal ev={evtMembersEv} allProfiles={allProfiles}
        onClose={() => setEvtMembersEv(null)}
        onSelectProfile={p => { setEvtMembersEv(null); onSelectFriend?.(p); }} />
    )}
    {typePickerOpen && latest && onUpdateSurvey && (
      <div
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
        onClick={() => setTypePickerOpen(false)}
      >
        <div
          style={{ background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:14, padding:24, minWidth:320, maxWidth:480 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>{t('選擇友誼類型','Select Friendship Type')}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {ALL_FRIENDSHIP_TYPES.map(tp => {
              const autoKey = getFriendshipType(latest.scores).key;
              const isSelected = (latest.typeOverride || autoKey) === tp.key;
              const isAuto = !latest.typeOverride && tp.key === autoKey;
              return (
                <button
                  key={tp.key}
                  onClick={() => {
                    const newOverride = latest.typeOverride === tp.key ? null : tp.key;
                    onUpdateSurvey({ ...latest, typeOverride: newOverride });
                  }}
                  style={{
                    padding:'5px 12px', borderRadius:6,
                    border:`2px solid ${isSelected ? tp.color : 'transparent'}`,
                    background: isSelected ? tp.color + '22' : 'var(--surface2)',
                    color: isSelected ? tp.color : 'var(--text)',
                    fontSize:12, fontWeight: isSelected ? 700 : 400,
                    cursor:'pointer', transition:'all 0.15s',
                  }}
                >
                  {tp.key} · {lang === 'zh' ? tp.name : tp.en}
                  {isAuto && <span style={{ fontSize:9, marginLeft:3, opacity:0.6 }}>auto</span>}
                </button>
              );
            })}
          </div>
          {latest.typeOverride && (
            <div style={{ marginTop:10, fontSize:11, color:'var(--muted)' }}>
              {t('已手動設定。點擊同一個類型可取消覆蓋。','Manually set. Click the same type again to revert to auto.')}
            </div>
          )}
          <button className="fq-btn fq-btn-ghost" style={{ marginTop:16 }} onClick={() => setTypePickerOpen(false)}>
            {t('完成','Done')}
          </button>
        </div>
      </div>
    )}
    {photoLightbox && profile.photo && (
      <div onClick={() => setPhotoLightbox(false)} style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:999,
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out'
      }}>
        <img src={profile.photo} alt={profile.name} onClick={e => e.stopPropagation()} style={{
          maxWidth:'90vw', maxHeight:'90vh', borderRadius:16,
          boxShadow:'0 24px 80px rgba(0,0,0,0.7)', objectFit:'contain'
        }} />
        <button onClick={() => setPhotoLightbox(false)} style={{
          position:'absolute', top:24, right:28, background:'rgba(255,255,255,0.1)',
          border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%',
          width:40, height:40, color:'#fff', fontSize:18, cursor:'pointer'
        }}>✕</button>
      </div>
    )}
    </>
  );
}


// ─── Main FriendPage ───────────────────────────────────────────────────────────

export default function FriendPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('yc_auth') === 'fq_ok');
  const [profiles,   setProfiles]   = useState(loadProfiles);
  const [surveys,    setSurveys]    = useState(loadSurveys);
  const [journals,   setJournals]   = useState(loadJournals);
  const [customGroups, setCustomGroups] = useState(loadCustomGroups);
  const [view, setView] = useState('dashboard'); // dashboard | create | survey | results | detail
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [lastSurvey, setLastSurvey] = useState(null);
  const [logTarget, setLogTarget] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('fq_lang') || 'zh');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('fq_dark') !== 'false');

  // Persist on change
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { saveSurveys(surveys); }, [surveys]);
  useEffect(() => { saveJournals(journals); }, [journals]);
  useEffect(() => { saveCustomGroups(customGroups); }, [customGroups]);
  useEffect(() => { localStorage.setItem('fq_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('fq_dark', String(darkMode)); }, [darkMode]);

  function handleAddGroup(group) { setCustomGroups(prev => [...prev, group]); }
  function toggleLang() { setLang(l => l === 'zh' ? 'en' : 'zh'); }
  function toggleDark() { setDarkMode(d => !d); }

  function handleLogSave(entry) {
    setJournals(prev => [entry, ...prev]);
    if (entry.keyEvent) {
      const ke = { id: genId(), year: entry.keyEvent.year, text: entry.keyEvent.text };
      setProfiles(prev => prev.map(p =>
        p.id !== entry.profileId ? p : { ...p, keyEvents: [...(p.keyEvents || []), ke] }
      ));
    }
    setLogTarget(null);
  }

  function handleAuth() { setAuthed(true); }

  function goToDashboard() {
    setView('dashboard');
    setSelectedProfile(null);
    setEditingProfile(null);
    setLastSurvey(null);
  }

  function handleAddFriend() {
    setEditingProfile(null);
    setView('create');
  }

  function handleSelectFriend(profile) {
    setSelectedProfile(profile);
    setView('detail');
  }

  function handleStartSurvey(profile) {
    setSelectedProfile(profile);
    setView('survey');
  }

  function handleSaveProfile(profile) {
    if (profile._newGroup) {
      setCustomGroups(prev => [...prev, profile._newGroup]);
    }
    const { _newGroup, _quickScore, ...cleanProfile } = profile;
    if (editingProfile) {
      setProfiles(prev => prev.map(p => p.id === cleanProfile.id ? cleanProfile : p));
    } else {
      setProfiles(prev => [...prev, cleanProfile]);
    }
    if (_quickScore !== null && _quickScore !== undefined) {
      const d = Math.min(100, Math.round(_quickScore / 0.9));
      const scores = { F:d, R:d, S:d, T:d, St:d, E:d, total: _quickScore };
      const type = getFriendshipType(scores);
      const syntheticSurvey = {
        id: genId(),
        profileId: cleanProfile.id,
        answers: Array(24).fill(null),
        scores,
        total: _quickScore,
        type: type.key,
        createdAt: new Date().toISOString(),
        _synthetic: true,
      };
      setSurveys(prev => [...prev, syntheticSurvey]);
    }
    setSelectedProfile(cleanProfile);
    setEditingProfile(null);
    setView('detail');
  }

  function handleDeleteProfile() {
    if (!editingProfile) return;
    setProfiles(prev => prev.filter(p => p.id !== editingProfile.id));
    setSurveys(prev => prev.filter(s => s.profileId !== editingProfile.id));
    setJournals(prev => prev.filter(j => j.profileId !== editingProfile.id));
    goToDashboard();
  }

  function handleSurveyComplete(survey) {
    setSurveys(prev => [...prev, survey]);
    setLastSurvey(survey);
    setView('results');
  }

  function handleUpdateSurvey(updatedSurvey) {
    setSurveys(prev => prev.map(s => s.id === updatedSurvey.id ? updatedSurvey : s));
    setLastSurvey(updatedSurvey);
  }

  function handleEditProfile(profile) {
    setEditingProfile(profile);
    setView('create');
  }

  function handleProfileUpdate(updatedProfile) {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setSelectedProfile(updatedProfile);
  }

  if (!authed) {
    return (
      <div className={`fq-root${darkMode ? '' : ' fq-light'}`}>
        <AuthView onAuth={handleAuth} />
      </div>
    );
  }
  // also pass surveys to DashboardView (already done in render)

  return (
    <LangCtx.Provider value={lang}>
    <GroupsCtx.Provider value={customGroups}>
    <div className={`fq-root${darkMode ? '' : ' fq-light'}`}>
      <Topbar
        view={view}
        onDashboard={goToDashboard}
        onAddFriend={handleAddFriend}
        lang={lang}
        onToggleLang={toggleLang}
        darkMode={darkMode}
        onToggleDark={toggleDark}
      />

      {view === 'dashboard' && (
        <DashboardView
          profiles={profiles}
          surveys={surveys}
          journals={journals}
          onSelectFriend={handleSelectFriend}
          onCreateFriend={handleAddFriend}
          onStartSurvey={handleStartSurvey}
          onLogUpdate={p => setLogTarget(p)}
        />
      )}

      {view === 'create' && (
        <CreateView
          editProfile={editingProfile}
          onSave={handleSaveProfile}
          onCancel={() => {
            if (selectedProfile) { setView('detail'); }
            else { goToDashboard(); }
          }}
          onDelete={handleDeleteProfile}
          allProfiles={profiles}
        />
      )}

      {view === 'survey' && selectedProfile && (
        <SurveyView
          profile={selectedProfile}
          onComplete={handleSurveyComplete}
          onCancel={() => {
            setView(selectedProfile ? 'detail' : 'dashboard');
          }}
        />
      )}

      {view === 'results' && lastSurvey && selectedProfile && (
        <ResultsView
          survey={lastSurvey}
          surveys={surveys}
          profile={selectedProfile}
          onDone={goToDashboard}
          onRetake={() => setView('survey')}
          onViewDetail={() => setView('detail')}
          onUpdateSurvey={handleUpdateSurvey}
        />
      )}

      {view === 'detail' && selectedProfile && (
        <DetailView
          profile={selectedProfile}
          surveys={surveys}
          journals={journals}
          onEdit={() => handleEditProfile(selectedProfile)}
          onDelete={() => {
            if (!window.confirm(`Delete ${selectedProfile.name}? This cannot be undone.`)) return;
            const pid = selectedProfile.id;
            setProfiles(prev => prev.filter(p => p.id !== pid));
            setSurveys(prev => prev.filter(s => s.profileId !== pid));
            setJournals(prev => prev.filter(j => j.profileId !== pid));
            goToDashboard();
          }}
          onStartSurvey={handleStartSurvey}
          onBack={goToDashboard}
          onLogUpdate={p => setLogTarget(p)}
          onProfileUpdate={handleProfileUpdate}
          allProfiles={profiles}
          onSelectFriend={handleSelectFriend}
          onUpdateSurvey={handleUpdateSurvey}
        />
      )}
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
    </GroupsCtx.Provider>
    </LangCtx.Provider>
  );
}
