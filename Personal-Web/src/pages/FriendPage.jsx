import './FriendPage.css';
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';

const LangCtx = createContext('zh');

// ─── Constants ────────────────────────────────────────────────────────────────

const RAINBOW_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#6366F1','#A855F7'];
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
  { dim:'F', text:'不計群組訊息，你們私下一對一聯絡（傳訊息、通話、見面）的平均頻率大概是？', opts:['幾乎沒有聯絡（一年一次或更少）','一年幾次','每個月幾次','每週或更頻繁'] },
  { dim:'F', text:'過去三個月，你們之間是誰更常主動發起對話或約出來？', opts:['幾乎都是我在主動','大多數都是我','大概差不多各半','大多數是對方或兩邊差不多'] },
  { dim:'F', text:'假設你連續兩週沒有主動聯絡對方，對方會注意到並主動找你嗎？', opts:['很不可能，他大概不會發現','應該不會','他大概會來問一下','絕對會，完全不用懷疑'] },
  { dim:'F', text:'和一年前相比，你們的聯絡頻率有什麼變化？', opts:['明顯減少了很多','有一點變少','大概差不多','比以前更頻繁了'] },
  // R 互惠 Reciprocity
  { dim:'R', text:'當你分享個人困擾、開心的事或私事時，對方是否也會同等地向你分享？', opts:['我分享很多但他幾乎不開口','我分享的比他多','我們分享的程度大概差不多','非常均衡，都很願意主動分享'] },
  { dim:'R', text:'這個人對你目前生活中最重要的事了解有多深？', opts:['幾乎不知道我的近況','只知道一些表面的事','了解大部分對我重要的事','非常清楚，對我現在的狀態完全掌握'] },
  { dim:'R', text:'當你對這段友誼投入時間、關心和精力，對方通常怎麼回應？', opts:['幾乎沒有任何回應','偶爾有回應但很少對等付出','通常有類似程度的回應','完全、一致地相互付出'] },
  { dim:'R', text:'當你真正需要幫助或支持時，主動開口請對方幫忙對你來說有多容易？', opts:['很難開口，我寧可不說','有點不自在','還算容易，大部分情況都可以開口','完全自然，不需要任何猶豫'] },
  // S 支持 Support
  { dim:'S', text:'回想你生命中最艱難的一段時期，這個人扮演了什麼樣的角色？', opts:['他完全不在場或不知情','他知道但沒有給什麼實質支持','他在那段時間給了真正的幫助','他是我最重要的支柱之一'] },
  { dim:'S', text:'如果明天你要做一個重大的人生決定，你會想要事先聽他的意見嗎？', opts:['完全不會，他不在我的考慮範圍','應該不會','也許會，我可能會考慮','絕對會，他會是我第一個想找的人'] },
  { dim:'S', text:'當對方給你支持時，那份支持有多符合你真正需要的是什麼？', opts:['常常不對，他不太懂我需要什麼','有時候對有時候不對','通常都蠻準確的','幾乎總是非常精準，深度理解我的需求'] },
  { dim:'S', text:'對方有沒有在你沒有開口的情況下，主動察覺到你狀態不好並關心你？', opts:['從來沒有過這種事','偶爾有一兩次','有幾次讓我很感動','這幾乎是他的常態，很自然'] },
  // T 信任 Trust
  { dim:'T', text:'你有沒有對這個人說過讓你顯得脆弱、不完美或尷尬的事？', opts:['從來沒有，我把那一面藏起來','說過一點點','說過蠻多的','幾乎什麼都說過，包括我最低落的時刻'] },
  { dim:'T', text:'如果你犯了一個嚴重的錯誤，你會主動去告訴這個人嗎？', opts:['不會，我不想讓他知道','猶豫很久才決定要不要說','會，我大概會告訴他','他會是我第一個想找的人'] },
  { dim:'T', text:'你對這個人說的話和做的承諾，信任程度有多高？', opts:['常常會質疑他說的話','有一些保留','大致上相信他','完全信任，毫無保留'] },
  { dim:'T', text:'如果你們之間發生了誤會或衝突，你相信可以透過直接對話解決嗎？', opts:['不相信，這種事我們只能逃避或放著','會很困難，但也許有可能','通常可以，我們能夠溝通','完全相信，我們一定有辦法處理'] },
  // St 穩定 Stability
  { dim:'St', text:'過去兩年之間，這段友誼有沒有出現過嚴重的緊張或幾乎斷掉的危機？', opts:['有過嚴重的危機，且目前還沒有完全解決','有過一些摩擦，影響了親近程度','有過小誤會，但都解決了','完全穩定，什麼問題都沒發生過'] },
  { dim:'St', text:'在一段時間沒有聯絡之後，你們重新接觸時的自然程度是？', opts:['很尷尬，需要很長時間才能找回感覺','有一點生疏，要花點力氣','需要一點暖身，但很快就回來了','立刻就很自然，完全沒有斷層感'] },
  { dim:'St', text:'這段友誼面對重大人生變化（換工作、搬家、交新對象等）的韌性如何？', opts:['任何大改變都可能讓這段友誼變淡或結束','人生的改變已經讓我們的連結變弱了','大致上維持住了，只是見面少了','不管發生什麼都還是很穩固'] },
  { dim:'St', text:'你預計五年後，這個人對你來說還會是重要的存在嗎？', opts:['我覺得不太可能','我不太確定','我認為應該會','幾乎可以確定'] },
  // E 情感能量 Energy
  { dim:'E', text:'當你想到要主動去聯絡這個人時，你第一個冒出來的直覺感受是？', opts:['有壓力、有負擔，甚至想逃避','有一點猶豫或抗拒','沒什麼特別的感覺，就是普通','期待，真的很想聊'] },
  { dim:'E', text:'在和這個人進行一次深度交流或見面之後，你通常感覺如何？', opts:['很疲憊，需要時間獨自恢復','有一點消耗','還好，沒什麼特別','充電了，心情更好'] },
  { dim:'E', text:'在這個人面前，你是否可以做自己，不需要表演或管理別人的觀感？', opts:['不太行，我會有壓力要呈現某種形象','有時候會覺得要注意怎麼表現','大多數情況可以','完全可以，從來不需要偽裝'] },
  { dim:'E', text:'整體而言，這段友誼對你的生活帶來的是什麼？', opts:['主要是壓力、義務感或情緒消耗','沒什麼特別，正面負面都不強','讓生活更豐富、讓我感覺更好','是我非常珍視的滋養，讓我很感激'] },
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

function getFriendshipType(scores) {
  const { F, R, S, T, St, E } = scores;
  const tot = scores.total;
  if (tot >= 70 && T >= 70 && E >= 65 && St >= 65)
    return { key:'SS',  name:'靈魂夥伴',   en:'Soul Partner',    color:'#22D3EE', desc:'深度信任、高能量、長期穩定 — 這是最稀有的友誼類型。' };
  if (tot >= 58 && T >= 60 && St >= 60 && R >= 58)
    return { key:'SHQ', name:'穩固核心型', en:'Stable Core',     color:'#34D399', desc:'品質穩固、信任深厚，是你可以長期依賴的朋友。' };
  if (F >= 68 && E >= 60 && T < 55)
    return { key:'ASL', name:'活躍表層型', en:'Active Surface',  color:'#93C5FD', desc:'聯絡頻繁但深度有限，值得投資更多真誠的交流。' };
  if (F < 45 && T >= 62 && St >= 62)
    return { key:'QDB', name:'深度潛伏型', en:'Quiet Deep Bond', color:'#8B5CF6', desc:'見面不多，但每次聯絡都有深度。聯絡少不代表感情淡。' };
  if (E < 38)
    return { key:'ED',  name:'情感消耗型', en:'Energy Drain',    color:'#F87171', desc:'這段關係讓你感到消耗，值得認真評估是否繼續投入。' };
  if (R < 42)
    return { key:'AOS', name:'單向付出型', en:'One-Sided',       color:'#FB923C', desc:'付出不對等，長期下來會造成疲憊感。' };
  if (St < 42 || T < 40)
    return { key:'FNR', name:'脆弱待修型', en:'Fragile',         color:'#FBBF24', desc:'關係出現裂縫，需要主動溝通修復才能重建。' };
  if (tot >= 45)
    return { key:'SLD', name:'穩定輕度型', en:'Stable Lite',     color:'#94A3B8', desc:'關係平穩但不算深入，適合輕鬆相處，不必強求深度。' };
  return   { key:'FAD', name:'自然淡化型', en:'Fading',          color:'#475569', desc:'友誼正在淡化，需要決定是否值得主動投入。' };
}

function getScoreTier(total) {
  if (total >= 81) return { tier:'S', color:'#22D3EE' };
  if (total >= 67) return { tier:'A', color:'#34D399' };
  if (total >= 52) return { tier:'B', color:'#60A5FA' };
  if (total >= 36) return { tier:'C', color:'#FBBF24' };
  if (total >= 20) return { tier:'D', color:'#FB923C' };
  return { tier:'F', color:'#F87171' };
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
function loadColorTags() {
  try { return JSON.parse(localStorage.getItem('fq_color_tags') || '[]'); } catch { return []; }
}
function saveColorTags(t) { localStorage.setItem('fq_color_tags', JSON.stringify(t)); }


// ─── Avatar component ─────────────────────────────────────────────────────────

function Avatar({ profile, size = 40, style: extra = {} }) {
  const color = profile.color || '#2563eb';
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

  function handleSave() {
    if (!text.trim()) return;
    onSave({ id: genId(), profileId: profile.id, mood, date, text: text.trim(), createdAt: new Date().toISOString() });
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
            rows={5}
            autoFocus
          />
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
      <a href="/secret" className="fq-topbar-back" style={{ marginLeft: 0 }}>
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
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const [showGuide, setShowGuide] = useState(false);

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

  // Type distribution
  const typeCounts = {};
  profiles.forEach(p => {
    const s = getLatestSurvey(p.id);
    if (!s) return;
    const t = getFriendshipType(s.scores).key;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const FRIENDSHIP_TYPES = [
    { key:'SS',  name:'Soul Partner',   color:'#22D3EE', desc:'Deep trust, high energy, long-term stable. The rarest type.' },
    { key:'SHQ', name:'Stable Core',    color:'#34D399', desc:'Solid quality and deep trust. A long-term reliable friend.' },
    { key:'ASL', name:'Active Surface', color:'#93C5FD', desc:'Frequent contact but limited depth. Worth investing in deeper exchange.' },
    { key:'QDB', name:'Quiet Deep Bond',color:'#8B5CF6', desc:"Infrequent contact but always meaningful. Absence doesn't mean fading." },
    { key:'ED',  name:'Energy Drain',   color:'#F87171', desc:'This relationship feels draining. Worth evaluating your investment.' },
    { key:'AOS', name:'One-Sided',      color:'#FB923C', desc:'Unbalanced giving. May lead to burnout over time.' },
    { key:'FNR', name:'Fragile',        color:'#FBBF24', desc:'Cracks in the relationship. Proactive communication needed.' },
    { key:'SLD', name:'Stable Lite',    color:'#94A3B8', desc:'Steady but not deep. Good for casual connection.' },
    { key:'FAD', name:'Fading',         color:'#475569', desc:"Friendship is fading. Decide if it's worth reinvesting." },
  ];

  const TIERS = [
    { tier:'S', min:81, color:'#22D3EE', label:'Exceptional' },
    { tier:'A', min:67, color:'#34D399', label:'Strong' },
    { tier:'B', min:52, color:'#60A5FA', label:'Good' },
    { tier:'C', min:36, color:'#FBBF24', label:'Moderate' },
    { tier:'D', min:20, color:'#FB923C', label:'Weak' },
    { tier:'F', min:0,  color:'#F87171', label:'Critical' },
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
              { label: t('需要關注', 'Need Attention'), value: needAttention, sub: t('分數低於40', 'Score < 40'), color: needAttention > 0 ? '#F87171' : null },
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
                    <span style={{ fontSize:12, fontWeight:700, color: ft.color }}>{ft.name}</span>
                    <span style={{ fontSize:13, fontWeight:800, color: ft.color }}>{typeCounts[ft.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="fq-card">
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>
              {t('快速操作', 'Quick Actions')}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <button className="fq-btn fq-btn-primary" style={{ justifyContent:'center' }} onClick={onCreateFriend}>
                + {t('新增朋友', 'Add Friend')}
              </button>
              {mostRecentProfile && (
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:4, lineHeight:1.5 }}>
                  {t('最近測驗', 'Last surveyed')}: <span style={{ color:'var(--text)', fontWeight:600 }}>{mostRecentProfile.name}</span>
                  <br /><span style={{ fontSize:11 }}>{fmtDate(mostRecentSurvey.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
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
                      <span style={{ fontWeight:700, color: ft.color, minWidth:96, fontSize:12 }}>{ft.name}</span>
                      <span style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>{ft.desc}</span>
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

          {/* Friend Grid */}
          <div className="fq-section-hdr">
            <h2>{t('朋友列表', 'Friend Profiles')}</h2>
            <div className="fq-line" />
            <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={onCreateFriend}>
              + {t('新增', 'New')}
            </button>
          </div>

          {profiles.length === 0 ? (
            <div className="fq-empty">
              <div className="fq-empty-icon">📡</div>
              <div className="fq-empty-title">{t('尚無朋友資料', 'No profiles yet')}</div>
              <div className="fq-empty-sub">{t('新增第一個朋友，開始量化你的友誼。', 'Add your first friend to start quantifying your relationships.')}</div>
              <button className="fq-btn fq-btn-primary" onClick={onCreateFriend}>+ {t('建立第一個', 'Create First Profile')}</button>
            </div>
          ) : (
            <div className="fq-friend-grid">
              {profiles.map(p => {
                const latest = getLatestSurvey(p.id);
                const tier = latest ? getScoreTier(latest.total) : null;
                const type = latest ? getFriendshipType(latest.scores) : null;
                return (
                  <div key={p.id} className="fq-friend-card" onClick={() => onSelectFriend(p)}>
                    {type && (
                      <div className="fq-type-tag" style={{ background: type.color + '22', color: type.color }}>
                        {type.key}
                      </div>
                    )}
                    <div className="fq-friend-card-top">
                      <Avatar profile={p} size={40} />
                      <div>
                        <div className="fq-friend-name">{p.name}</div>
                        <div className="fq-friend-meta" style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                          {p.colorTag && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:8, background: p.color+'22', color: p.color, fontWeight:700 }}>{p.colorTag}</span>}
                          <span>{p.since ? `${t('認識於','Since')} ${p.since}` : t('年份不詳','Year unknown')}</span>
                          {(() => { const jc = journals.filter(j => j.profileId === p.id).length; return jc > 0 ? <span>· {jc} {t('則日誌','logs')}</span> : null; })()}
                        </div>
                      </div>
                      {latest ? (
                        <div className={`fq-score-badge tier-${tier.tier}`}>{latest.total}</div>
                      ) : (
                        <div className="fq-score-badge" style={{ color:'var(--muted)', fontSize:14 }}>N/A</div>
                      )}
                    </div>
                    {latest && (
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
                      {!latest && (
                        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={e => { e.stopPropagation(); onStartSurvey(p); }}>
                          {t('開始測驗', 'Start Survey')} →
                        </button>
                      )}
                      <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={e => { e.stopPropagation(); onLogUpdate(p); }}>
                        + {t('日誌', 'Log')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Create/Edit Profile View ──────────────────────────────────────────────────

function CreateView({ editProfile, onSave, onCancel, onDelete, colorTags, onAddColorTag }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const isEdit = !!editProfile;
  const [name,      setName]      = useState(editProfile?.name      || '');
  const [photo,     setPhoto]     = useState(editProfile?.photo     || null);
  const [color,     setColor]     = useState(editProfile?.color     || '#60A5FA');
  const [colorTag,  setColorTag]  = useState(editProfile?.colorTag  || '');
  const [since,     setSince]     = useState(editProfile?.since     || '');
  const [keyEvents, setKeyEvents] = useState(editProfile?.keyEvents || []);
  const [err, setErr]             = useState('');
  const fileRef = useRef(null);

  // new tag form
  const [showTagForm,  setShowTagForm]  = useState(false);
  const [newTagLabel,  setNewTagLabel]  = useState('');
  const [newTagColor,  setNewTagColor]  = useState(RAINBOW_COLORS[4]);

  // new key event form
  const [evtYear, setEvtYear] = useState('');
  const [evtText, setEvtText] = useState('');

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setErr('Photo too large (max 2 MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  function selectTag(tag) {
    setColor(tag.color);
    setColorTag(tag.label);
  }

  function addNewTag() {
    if (!newTagLabel.trim()) return;
    const tag = { id: genId(), label: newTagLabel.trim(), color: newTagColor };
    onAddColorTag(tag);
    selectTag(tag);
    setShowTagForm(false); setNewTagLabel(''); setNewTagColor(RAINBOW_COLORS[4]);
  }

  function addEvent() {
    if (!evtText.trim()) return;
    setKeyEvents(prev => [...prev, { id: genId(), year: evtYear, text: evtText.trim() }]);
    setEvtYear(''); setEvtText('');
  }

  function removeEvent(id) {
    setKeyEvents(prev => prev.filter(e => e.id !== id));
  }

  function handleSave() {
    if (!name.trim()) { setErr('Name is required'); return; }
    onSave({
      id: editProfile?.id || genId(),
      name: name.trim(), photo, color, colorTag,
      since, keyEvents,
      createdAt: editProfile?.createdAt || new Date().toISOString(),
    });
  }

  const previewProfile = { name, photo, color };

  return (
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
              {colorTag && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background: color+'22', color, fontWeight:700, border:`1px solid ${color}` }}>{colorTag}</span>}
              <span style={{ fontSize:12, color:'var(--muted)' }}>{since ? `${t('認識於','Since')} ${since}` : t('年份不詳','Year unknown')}</span>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="fq-form-row">
          <label className="fq-label">Name *</label>
          <input className="fq-input" placeholder="Friend's name or nickname"
            value={name} onChange={e => { setName(e.target.value); setErr(''); }} />
          {err && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{err}</div>}
        </div>

        {/* Photo */}
        <div className="fq-form-row">
          <label className="fq-label">Photo</label>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="fq-photo-upload" onClick={() => fileRef.current?.click()} style={{ background: color + '22', borderColor: photo ? color : undefined }}>
              {photo
                ? <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span className="fq-photo-upload-hint">Click<br/>Upload</span>
              }
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>PNG / JPG, max 2 MB</div>
              {photo && <button className="fq-btn fq-btn-ghost fq-btn-sm" type="button" onClick={() => setPhoto(null)}>Remove photo</button>}
            </div>
          </div>
        </div>

        {/* Profile Tag (color + label) */}
        <div className="fq-form-row">
          <label className="fq-label">Profile Tag</label>
          <div className="fq-tag-picker">
            {colorTags.map(tag => (
              <button key={tag.id} type="button"
                className={`fq-tag-chip${color === tag.color && colorTag === tag.label ? ' selected' : ''}`}
                style={{ '--tc': tag.color }}
                onClick={() => selectTag(tag)}>
                {tag.label}
              </button>
            ))}
            {showTagForm ? (
              <div className="fq-tag-add-form">
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {RAINBOW_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewTagColor(c)}
                      style={{ width:18, height:18, borderRadius:'50%', background:c, border: newTagColor===c ? '2.5px solid var(--text)' : '2.5px solid transparent', cursor:'pointer', padding:0, flexShrink:0 }} />
                  ))}
                </div>
                <input value={newTagLabel} onChange={e => setNewTagLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNewTag()}
                  placeholder="Tag name" className="fq-tag-label-inp" autoFocus />
                <button type="button" className="fq-btn fq-btn-primary fq-btn-sm" onClick={addNewTag}>✓</button>
                <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => setShowTagForm(false)}>✕</button>
              </div>
            ) : (
              <button type="button" className="fq-tag-chip fq-tag-chip-add" onClick={() => setShowTagForm(true)}>＋ New Tag</button>
            )}
          </div>
          {colorTag && (
            <div style={{ marginTop:6, fontSize:12, color:'var(--muted)' }}>
              Selected: <span style={{ color, fontWeight:700 }}>{colorTag}</span>
              <button type="button" onClick={() => { setColorTag(''); }} style={{ marginLeft:8, fontSize:11, color:'var(--muted)', background:'none', border:'none', cursor:'pointer' }}>clear</button>
            </div>
          )}
        </div>

        {/* Friends Since (year only) */}
        <div className="fq-form-row">
          <label className="fq-label">Friends Since</label>
          <select className="fq-input" value={since} onChange={e => setSince(e.target.value)}>
            <option value="">— Select year —</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>

        {/* Key Events */}
        <div className="fq-form-row">
          <label className="fq-label">Key Events</label>
          <div className="fq-key-events">
            {keyEvents.length === 0 && (
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:10 }}>No events yet — add milestones, memories, or news.</div>
            )}
            {keyEvents.map((ev, idx) => (
              <div key={ev.id} className="fq-key-event-row">
                <span className="fq-key-event-num">#{idx + 1}</span>
                {ev.year && <span className="fq-key-event-year">{ev.year}</span>}
                <span className="fq-key-event-text">{ev.text}</span>
                <button type="button" className="fq-key-event-del" onClick={() => removeEvent(ev.id)}>✕</button>
              </div>
            ))}
            <div className="fq-key-event-add">
              <input className="fq-key-event-year-inp" value={evtYear}
                onChange={e => setEvtYear(e.target.value)} placeholder="Year" type="number"
                min="1990" max={THIS_YEAR} />
              <input className="fq-key-event-text-inp" value={evtText}
                onChange={e => setEvtText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEvent()}
                placeholder="e.g. Started his own company" />
              <button type="button" className="fq-btn fq-btn-ghost fq-btn-sm" onClick={addEvent}>＋</button>
            </div>
          </div>
        </div>

        <div className="fq-row" style={{ gap:10, marginTop:8 }}>
          <button className="fq-btn fq-btn-primary" onClick={handleSave}>
            {isEdit ? '✓ Save Changes' : '✓ Create Profile'}
          </button>
          <button className="fq-btn fq-btn-ghost" onClick={onCancel}>Cancel</button>
          {isEdit && (
            <button className="fq-btn fq-btn-danger fq-btn-sm" style={{ marginLeft:'auto' }} onClick={onDelete}>
              Delete Profile
            </button>
          )}
        </div>
      </div>
    </div>
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
          <div className="fq-survey-q-text">{q.text}</div>

          <div className="fq-likert">
            {q.opts.map((opt, oi) => {
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

function ResultsView({ survey, profile, onDone, onRetake, onViewDetail }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const { scores } = survey;
  const tier = getScoreTier(scores.total);
  const type = getFriendshipType(scores);
  const suggestions = getSuggestions(scores);

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

function DetailView({ profile, surveys, journals, onEdit, onDelete, onStartSurvey, onBack, onLogUpdate }) {
  const lang = useContext(LangCtx);
  const t = (zh, en) => lang === 'zh' ? zh : en;
  const profileSurveys = surveys
    .filter(s => s.profileId === profile.id)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const latest = profileSurveys[0] || null;
  const tier = latest ? getScoreTier(latest.total) : null;
  const type = latest ? getFriendshipType(latest.scores) : null;

  const surveyCount = profileSurveys.length;
  const avgScore = surveyCount === 0 ? null :
    Math.round(profileSurveys.reduce((a,s) => a + s.total, 0) / surveyCount);
  const bestScore = surveyCount === 0 ? null :
    Math.max(...profileSurveys.map(s => s.total));

  return (
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 24 }}>
        <h2>{t('朋友詳情', 'Friend Detail')}</h2>
        <div className="fq-line" />
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={onEdit}>✎ {t('編輯', 'Edit')}</button>
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => onLogUpdate(profile)}>+ {t('日誌', 'Log')}</button>
        <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={() => onStartSurvey(profile)}>
          + {t('測驗', 'Survey')}
        </button>
        <button className="fq-btn fq-btn-danger fq-btn-sm" onClick={onDelete}>
          🗑 {t('刪除', 'Delete')}
        </button>
      </div>

      <div className="fq-detail-layout">
        {/* Sidebar */}
        <div className="fq-detail-sidebar fq-card">
          <Avatar profile={profile} size={68} style={{ margin:'0 auto 14px', display:'flex' }} />
          <div className="fq-detail-name">{profile.name}</div>
          <div className="fq-detail-since">
            {profile.since ? `${t('認識於','Friends since')} ${profile.since}` : t('年份未記錄','Year not recorded')}
          </div>

          {latest && (
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:44, fontWeight:900, color: tier.color, lineHeight:1 }}>
                {latest.total}
              </div>
              <div style={{ fontSize:13, color: tier.color, fontWeight:700, marginTop:4 }}>
                TIER {tier.tier}
              </div>
              <div style={{ fontSize:11, marginTop:6, padding:'3px 10px', borderRadius:5, display:'inline-block', background: type.color + '22', color: type.color, fontWeight:600 }}>
                {type.name}
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

          {profile.keyEvents && profile.keyEvents.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>{t('重要事件','Key Events')}</div>
              {profile.keyEvents.map((ev, i) => (
                <div key={ev.id || i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6, fontSize:13 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', minWidth:16 }}>#{i+1}</span>
                  {ev.year && <span style={{ fontSize:11, padding:'1px 6px', borderRadius:6, background:'var(--bg3)', color:'var(--muted)', flexShrink:0 }}>{ev.year}</span>}
                  <span style={{ color:'var(--text)', lineHeight:1.5 }}>{ev.text}</span>
                </div>
              ))}
            </div>
          )}
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
          {/* Score trend */}
          <div className="fq-section-hdr" style={{ marginBottom:14 }}>
            <h2>{t('分數趨勢','Score Trend')}</h2>
            <div className="fq-line" />
          </div>
          <div className="fq-card" style={{ marginBottom:20 }}>
            <LineChart surveys={profileSurveys} />
          </div>

          {/* Latest radar */}
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

          {/* Survey history */}
          <div className="fq-section-hdr" style={{ marginBottom:14 }}>
            <h2>{t('測驗記錄','Survey History')}</h2>
            <div className="fq-line" />
            <span style={{ fontSize:12, color:'var(--muted)' }}>{surveyCount} {t('筆','records')}</span>
          </div>

          {profileSurveys.length === 0 ? (
            <div className="fq-empty" style={{ padding:'40px 20px' }}>
              <div className="fq-empty-icon">📊</div>
              <div className="fq-empty-title">No surveys yet</div>
              <div className="fq-empty-sub">Start a survey to begin quantifying this friendship.</div>
              <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={() => onStartSurvey(profile)}>
                + Start Survey
              </button>
            </div>
          ) : (
            <div className="fq-survey-history-list">
              {profileSurveys.map((s, idx) => {
                const sTier = getScoreTier(s.total);
                const sType = getFriendshipType(s.scores);
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
  );
}


// ─── Main FriendPage ───────────────────────────────────────────────────────────

export default function FriendPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('yc_auth') === 'fq_ok');
  const [profiles,   setProfiles]   = useState(loadProfiles);
  const [surveys,    setSurveys]    = useState(loadSurveys);
  const [journals,   setJournals]   = useState(loadJournals);
  const [colorTags,  setColorTags]  = useState(loadColorTags);
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
  useEffect(() => { saveColorTags(colorTags); }, [colorTags]);
  useEffect(() => { localStorage.setItem('fq_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('fq_dark', String(darkMode)); }, [darkMode]);

  function handleAddColorTag(tag) { setColorTags(prev => [...prev, tag]); }
  function toggleLang() { setLang(l => l === 'zh' ? 'en' : 'zh'); }
  function toggleDark() { setDarkMode(d => !d); }

  function handleLogSave(entry) { setJournals(prev => [entry, ...prev]); setLogTarget(null); }

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
    if (editingProfile) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    } else {
      setProfiles(prev => [...prev, profile]);
    }
    setSelectedProfile(profile);
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

  function handleEditProfile(profile) {
    setEditingProfile(profile);
    setView('create');
  }

  if (!authed) {
    return (
      <div className={`fq-root${darkMode ? '' : ' fq-light'}`}>
        <AuthView onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <LangCtx.Provider value={lang}>
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
          colorTags={colorTags}
          onAddColorTag={handleAddColorTag}
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
          profile={selectedProfile}
          onDone={goToDashboard}
          onRetake={() => setView('survey')}
          onViewDetail={() => setView('detail')}
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
        />
      )}
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
    </LangCtx.Provider>
  );
}
