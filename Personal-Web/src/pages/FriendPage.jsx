import './FriendPage.css';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ['#60A5FA','#22D3EE','#34D399','#8B5CF6','#F472B6','#FB923C','#FBBF24','#F87171'];

const DIM_META = [
  { key: 'F',  label: '頻率', en: 'Frequency',   color: '#60A5FA' },
  { key: 'R',  label: '互惠', en: 'Reciprocity', color: '#22D3EE' },
  { key: 'S',  label: '支持', en: 'Support',     color: '#34D399' },
  { key: 'T',  label: '信任', en: 'Trust',       color: '#8B5CF6' },
  { key: 'St', label: '穩定', en: 'Stability',   color: '#FBBF24' },
  { key: 'E',  label: '能量', en: 'Energy',      color: '#F472B6' },
];

const MOODS = [
  { key:'great',   icon:'🌟', label:'感覺很好' },
  { key:'good',    icon:'😊', label:'還不錯' },
  { key:'neutral', icon:'😐', label:'普通' },
  { key:'drained', icon:'😔', label:'有點累' },
  { key:'tense',   icon:'⚡', label:'有些摩擦' },
];

const QUESTIONS = [
  // F 頻率
  { dim:'F', text:'不計群組訊息，我們私下一對一聯絡的平均頻率？', opts:['幾乎不聯絡','每月一次左右','每週一次以上','幾乎每天'] },
  { dim:'F', text:'最近三個月，是誰更常主動開啟對話或約見面？', opts:['幾乎都是我','大多是我','差不多','對方更多或差不多'] },
  { dim:'F', text:'如果我連續兩週沒有主動聯絡，對方會注意到並主動找我嗎？', opts:['不會','不確定，可能不會','應該會','一定會'] },
  { dim:'F', text:'我們友誼的「聯絡熱度」和一年前相比？', opts:['明顯降溫','稍微減少','差不多','變得更頻繁'] },
  // R 互惠
  { dim:'R', text:'我們分享個人困擾、喜悅和私事的程度，是否雙向對等？', opts:['幾乎是我在分享','偏向我多分享','大致對等','非常對等雙向'] },
  { dim:'R', text:'對方了解我現在生活中最重要、最在意的事嗎？', opts:['幾乎不知道','只知道表面的事','了解大部分','非常清楚'] },
  { dim:'R', text:'我付出的關心、時間和精力，對方是否有相應的回應？', opts:['完全沒有對應','回應很少','大致有回應','充分且對等'] },
  { dim:'R', text:'當我需要幫忙或支持時，主動開口的難度？', opts:['非常難，寧可不說','有點難','還好，可以說','很自然，毫無障礙'] },
  // S 支持
  { dim:'S', text:'在我人生中最困難的一段時期，對方的角色是？', opts:['完全不在場','知道但沒怎麼幫助','有提供支持','是重要的支柱之一'] },
  { dim:'S', text:'如果我明天要做一個重大決定，我會想先聽對方的意見嗎？', opts:['不會','不太會','可能會','一定會'] },
  { dim:'S', text:'對方的支持符合「我真正需要的」的程度？', opts:['差很多，不理解需要','有時對有時錯','大多能給到位','非常精準，深度理解'] },
  { dim:'S', text:'對方曾在沒有明確求助的情況下，主動察覺並關心過我嗎？', opts:['從來沒有','偶爾','有幾次讓我很感動','這是他的常態'] },
  // T 信任
  { dim:'T', text:'我是否曾對對方說過讓自己顯得脆弱、不完美或尷尬的事？', opts:['從不，不敢說','說過一點點','說過不少','幾乎什麼都說過'] },
  { dim:'T', text:'如果我犯了一個嚴重的錯誤，我願意主動告訴對方嗎？', opts:['不願意','有點猶豫','應該會告訴他','第一個想到的就是他'] },
  { dim:'T', text:'對方說過的話、做出的承諾，我的信任程度是？', opts:['經常懷疑','有些保留','大致相信','完全信任'] },
  { dim:'T', text:'如果我們發生誤會或衝突，我相信問題可以被直接溝通解決嗎？', opts:['不相信，很難談','很困難但或許可以','大多能解決','完全相信，我們能處理'] },
  // St 穩定性
  { dim:'St', text:'這段友誼在過去兩年內有沒有出現過「差點斷掉」的危機？', opts:['有嚴重危機且未修復','有摩擦影響了關係','有小誤會但都解決了','非常穩定從沒出現過'] },
  { dim:'St', text:'即使一段時間沒有聯絡，再次見面或聊天時的自在感？', opts:['非常尷尬，需要很久暖身','有些生疏','稍微需要一點時間','完全自然，像從沒斷過'] },
  { dim:'St', text:'考慮各種人生變化（換工作、搬家、新對象），這段友誼的韌性？', opts:['人生一變就消失了','有些影響，關係變淡了','大致維持，只是見面少了','人生變了依然穩固'] },
  { dim:'St', text:'我預計五年後，我們是否仍然是彼此生命中重要的人？', opts:['不太可能','不確定','應該會','幾乎確定'] },
  // E 情感能量
  { dim:'E', text:'想到要主動聯絡對方，我的第一個直覺反應是？', opts:['有負擔或逃避感','有點猶豫','還好沒特別感覺','期待，很想聊'] },
  { dim:'E', text:'和對方進行一次深度交流或見面之後，我通常感覺？', opts:['很累，需要獨自恢復','有些消耗','普通，沒什麼特別','充電感，精神變好'] },
  { dim:'E', text:'這段友誼是否讓我感覺「被接納」——不需要表演、可以做自己？', opts:['不太行，有壓力要表現','有時有壓力','大多可以','完全可以，就是我'] },
  { dim:'E', text:'整體來說，這段友誼對我的生活帶來什麼？', opts:['主要是消耗或壓力','普通，沒什麼特別','讓生活更豐富','是我非常珍惜的滋養'] },
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
    scores[d.key] = Math.round(((sum - 4) / 16) * 100);
  });
  scores.total = Math.round(DIMS.reduce((acc, d) => acc + d.weight * scores[d.key], 0));
  return scores;
}

function getFriendshipType(scores) {
  const { F, R, S, T, St, E } = scores;
  const tot = scores.total;
  if (tot >= 78 && T >= 70 && E >= 65 && St >= 65)
    return { key:'SS',  name:'靈魂夥伴',   en:'Soul Partner',    color:'#22D3EE', desc:'深度信任、高能量、長期穩定 — 這是最稀有的友誼類型。' };
  if (tot >= 65 && T >= 60 && St >= 60 && R >= 58)
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
  if (tot >= 50)
    return { key:'SLD', name:'穩定輕度型', en:'Stable Lite',     color:'#94A3B8', desc:'關係平穩但不算深入，適合輕鬆相處，不必強求深度。' };
  return   { key:'FAD', name:'自然淡化型', en:'Fading',          color:'#475569', desc:'友誼正在淡化，需要決定是否值得主動投入。' };
}

function getScoreTier(total) {
  if (total >= 85) return { tier:'S', color:'#22D3EE' };
  if (total >= 70) return { tier:'A', color:'#34D399' };
  if (total >= 55) return { tier:'B', color:'#60A5FA' };
  if (total >= 40) return { tier:'C', color:'#FBBF24' };
  if (total >= 25) return { tier:'D', color:'#FB923C' };
  return { tier:'F', color:'#F87171' };
}

function getSuggestions(scores) {
  const tips = [];
  if (scores.F < 50) tips.push({ icon:'📅', text:'建議增加主動聯絡的頻率，定期 check-in 能有效維繫感情。' });
  if (scores.R < 50) tips.push({ icon:'⚖️', text:'注意互動的平衡性，試著讓對方也有機會主動分享和傾訴。' });
  if (scores.S < 50) tips.push({ icon:'🤝', text:'在對方遇到困難時多給予支持，這是深化友誼的關鍵。' });
  if (scores.T < 50) tips.push({ icon:'🔐', text:'試著分享更多真實的想法和脆弱，建立信任需要雙方的勇氣。' });
  if (scores.St < 50) tips.push({ icon:'🛠️', text:'若有未解決的摩擦，主動開口溝通比沉默更有效。' });
  if (scores.E < 50) tips.push({ icon:'⚡', text:'注意這段關係帶給你的能量狀態，健康的友誼應該讓你感到充電。' });
  if (tips.length === 0) tips.push({ icon:'✨', text:'這段友誼狀態良好！持續用心維護，它會越來越珍貴。' });
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
          <div className="fq-log-panel-title">Log Update — {profile.name}</div>
          <button className="fq-log-close" onClick={onClose}>✕</button>
        </div>
        <div className="fq-form-row">
          <label className="fq-label">今天跟他的感覺</label>
          <div className="fq-mood-row">
            {MOODS.map(m => (
              <button key={m.key} type="button" className={`fq-mood-btn${mood===m.key?' selected':''}`} onClick={() => setMood(m.key)}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fq-form-row">
          <label className="fq-label">日期</label>
          <input className="fq-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="fq-form-row">
          <label className="fq-label">近況 / 八卦 / 感受</label>
          <textarea
            className="fq-textarea"
            placeholder="記錄最近的互動、對方的近況、你的感覺、發生了什麼事..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            autoFocus
          />
        </div>
        <div className="fq-row" style={{ gap:10 }}>
          <button className="fq-btn fq-btn-primary" onClick={handleSave} disabled={!text.trim()} style={{ opacity: text.trim()?1:0.5 }}>
            ✓ 儲存紀錄
          </button>
          <button className="fq-btn fq-btn-ghost" onClick={onClose}>取消</button>
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
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}
      {/* spokes */}
      {angles.map((a, i) => {
        const outer = polarToXY(a, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
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
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={dims[i].color} stroke="#090909" strokeWidth="2" />
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
            <line x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray={v === 0 || v === 100 ? 'none' : '3,4'} />
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
            <circle cx={xOf(i)} cy={yOf(s.total)} r={hoveredIdx === i ? 7 : 5} fill={hoveredIdx === i ? '#22D3EE' : '#60A5FA'} stroke="#090909" strokeWidth="2" />
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
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Topbar ────────────────────────────────────────────────────────────────────

function Topbar({ view, onDashboard, onAddFriend }) {
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
          ← Dashboard
        </button>
      )}
      <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={onAddFriend}>
        + Add Friend
      </button>
      <a href="/secret" className="fq-topbar-back" style={{ marginLeft: 0 }}>
        ← Secret
      </a>
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Auth View ─────────────────────────────────────────────────────────────────

function AuthView({ onAuth }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!pw.trim()) { setErr('請輸入密碼'); return; }
    sessionStorage.setItem('yc_auth', pw);
    onAuth();
  }

  return (
    <div className="fq-auth">
      <div className="fq-auth-box">
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div className="fq-auth-title">FQ SYSTEM</div>
        <div className="fq-auth-sub">Friendship Quantification v2.1<br />請輸入密碼以繼續</div>
        <form onSubmit={handleSubmit}>
          <input
            className="fq-auth-input"
            type="password"
            placeholder="••••••••"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(''); }}
            autoFocus
          />
          {err && <div className="fq-auth-err">{err}</div>}
          <button type="submit" className="fq-btn fq-btn-primary" style={{ width:'100%', justifyContent:'center' }}>
            AUTHENTICATE
          </button>
        </form>
      </div>
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({ profiles, surveys, journals, onSelectFriend, onCreateFriend, onStartSurvey, onLogUpdate }) {
  // KPI calculations
  const total = profiles.length;
  const avgScore = total === 0 ? null : (() => {
    const scored = profiles.map(p => {
      const ps = surveys.filter(s => s.profileId === p.id);
      if (ps.length === 0) return null;
      return ps.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0].total;
    }).filter(v => v !== null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((a,b) => a+b,0) / scored.length);
  })();

  const highestProfile = (() => {
    let best = null, bestScore = -1;
    profiles.forEach(p => {
      const ps = surveys.filter(s => s.profileId === p.id);
      if (ps.length === 0) return;
      const latest = ps.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (latest.total > bestScore) { bestScore = latest.total; best = p; }
    });
    return best;
  })();

  const mostRecentSurvey = surveys.length === 0 ? null :
    surveys.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const mostRecentProfile = mostRecentSurvey
    ? profiles.find(p => p.id === mostRecentSurvey.profileId)
    : null;

  // Latest score per profile
  function getLatestSurvey(profileId) {
    const ps = surveys.filter(s => s.profileId === profileId);
    if (!ps.length) return null;
    return ps.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  return (
    <div className="fq-body">
      {/* KPI Row */}
      <div className="fq-kpi-row">
        <div className="fq-kpi">
          <div className="fq-kpi-label">Total Friends</div>
          <div className="fq-kpi-value">{total}</div>
          <div className="fq-kpi-sub">registered profiles</div>
        </div>
        <div className="fq-kpi">
          <div className="fq-kpi-label">Avg FQ Score</div>
          <div className="fq-kpi-value" style={{ color: avgScore !== null ? getScoreTier(avgScore).color : 'var(--muted)' }}>
            {avgScore !== null ? avgScore : '—'}
          </div>
          <div className="fq-kpi-sub">across all friends</div>
        </div>
        <div className="fq-kpi">
          <div className="fq-kpi-label">Highest Scorer</div>
          <div className="fq-kpi-value" style={{ fontSize: highestProfile ? 22 : 30, paddingTop: highestProfile ? 4 : 0 }}>
            {highestProfile ? (
              <span>{highestProfile.name}</span>
            ) : '—'}
          </div>
          <div className="fq-kpi-sub">
            {highestProfile ? (() => {
              const s = getLatestSurvey(highestProfile.id);
              return s ? `Score: ${s.total}` : 'no survey';
            })() : 'no data yet'}
          </div>
        </div>
        <div className="fq-kpi">
          <div className="fq-kpi-label">Most Recent Survey</div>
          <div className="fq-kpi-value" style={{ fontSize: 22, paddingTop: 4 }}>
            {mostRecentProfile ? mostRecentProfile.name : '—'}
          </div>
          <div className="fq-kpi-sub">
            {mostRecentSurvey ? fmtDate(mostRecentSurvey.createdAt) : 'none yet'}
          </div>
        </div>
      </div>

      {/* Friend Grid */}
      <div className="fq-section-hdr">
        <h2>Friend Profiles</h2>
        <div className="fq-line" />
        <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={onCreateFriend}>
          + New Friend
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="fq-empty">
          <div className="fq-empty-icon">📡</div>
          <div className="fq-empty-title">No profiles yet</div>
          <div className="fq-empty-sub">Add your first friend to start quantifying your relationships.</div>
          <button className="fq-btn fq-btn-primary" onClick={onCreateFriend}>+ Create First Profile</button>
        </div>
      ) : (
        <div className="fq-friend-grid">
          {profiles.map(p => {
            const latest = getLatestSurvey(p.id);
            const tier = latest ? getScoreTier(latest.total) : null;
            const type = latest ? getFriendshipType(latest.scores) : null;
            return (
              <div
                key={p.id}
                className="fq-friend-card"
                onClick={() => onSelectFriend(p)}
              >
                {type && (
                  <div
                    className="fq-type-tag"
                    style={{ background: type.color + '22', color: type.color }}
                  >
                    {type.key}
                  </div>
                )}
                <div className="fq-friend-card-top">
                  <Avatar profile={p} size={40} />
                  <div>
                    <div className="fq-friend-name">{p.name}</div>
                    <div className="fq-friend-meta">
                      {p.since ? `Since ${fmtDate(p.since)}` : 'Date unknown'}
                      {(() => { const jc = journals.filter(j => j.profileId === p.id).length; return jc > 0 ? ` · ${jc} logs` : ''; })()}
                    </div>
                  </div>
                  {latest ? (
                    <div className={`fq-score-badge tier-${tier.tier}`}>
                      {latest.total}
                    </div>
                  ) : (
                    <div className="fq-score-badge" style={{ color:'var(--muted)', fontSize:14 }}>
                      N/A
                    </div>
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
                      Start Survey →
                    </button>
                  )}
                  <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={e => { e.stopPropagation(); onLogUpdate(p); }}>
                    + Log
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Create/Edit Profile View ──────────────────────────────────────────────────

function CreateView({ editProfile, onSave, onCancel, onDelete }) {
  const isEdit = !!editProfile;
  const [name, setName] = useState(editProfile?.name || '');
  const [photo, setPhoto] = useState(editProfile?.photo || null);
  const [color, setColor] = useState(editProfile?.color || '#60A5FA');
  const [since, setSince] = useState(editProfile?.since || '');
  const [notes, setNotes] = useState(editProfile?.notes || '');
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setErr('照片太大，請選擇 2MB 以下的圖片'); return; }
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!name.trim()) { setErr('請輸入姓名'); return; }
    const profile = {
      id: editProfile?.id || genId(),
      name: name.trim(),
      photo,
      color,
      since,
      notes,
      createdAt: editProfile?.createdAt || new Date().toISOString(),
    };
    onSave(profile);
  }

  const previewProfile = { name, photo, color };

  return (
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 28 }}>
        <h2>{isEdit ? 'Edit Profile' : 'New Friend Profile'}</h2>
        <div className="fq-line" />
      </div>
      <div className="fq-form">
        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28, padding:'16px 20px', background:'var(--bg1)', border:'1px solid var(--border)', borderRadius:10 }}>
          <Avatar profile={previewProfile} size={56} />
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{name || '(Name)'}</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>{since ? `Since ${fmtDate(since)}` : 'Friend since...'}</div>
          </div>
        </div>

        <div className="fq-form-row">
          <label className="fq-label">Name *</label>
          <input
            className="fq-input"
            placeholder="朋友的名字或暱稱"
            value={name}
            onChange={e => { setName(e.target.value); setErr(''); }}
          />
          {err && <div style={{ color:'var(--red)', fontSize:12, marginTop:6 }}>{err}</div>}
        </div>

        <div className="fq-form-row">
          <label className="fq-label">照片</label>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="fq-photo-upload" onClick={() => fileRef.current?.click()} style={{ background: color + '22', borderColor: photo ? color : undefined }}>
              {photo
                ? <img src={photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span className="fq-photo-upload-hint">點擊<br/>上傳</span>
              }
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>上傳朋友照片（PNG/JPG，最大 2MB）</div>
              {photo && <button className="fq-btn fq-btn-ghost fq-btn-sm" type="button" onClick={() => setPhoto(null)}>移除照片</button>}
            </div>
          </div>
        </div>

        <div className="fq-form-row">
          <label className="fq-label">Profile Color</label>
          <div className="fq-color-row">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                className={`fq-color-opt${color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                type="button"
              />
            ))}
          </div>
        </div>

        <div className="fq-form-row">
          <label className="fq-label">Friends Since</label>
          <input
            className="fq-input"
            type="date"
            value={since}
            onChange={e => setSince(e.target.value)}
          />
        </div>

        <div className="fq-form-row">
          <label className="fq-label">Notes</label>
          <textarea
            className="fq-textarea"
            placeholder="備注、認識經過、關係描述..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
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
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Survey View ───────────────────────────────────────────────────────────────

function SurveyView({ profile, onComplete, onCancel }) {
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
        <h2 style={{ fontSize:14, letterSpacing:0 }}>{profile.name} — FQ Survey</h2>
        <div className="fq-line" />
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={onCancel}>✕ Cancel</button>
      </div>

      <div className="fq-survey-layout">
        {/* Main question area */}
        <div>
          <div className="fq-survey-progress">
            <div className="fq-survey-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="fq-survey-dim-header" style={{ color: dimMeta.color }}>
            [{dimMeta.en.toUpperCase()}] {dimMeta.label}
          </div>
          <div className="fq-survey-q-num">Question {currentQ + 1} of 24</div>
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
              ← Prev
            </button>
            <span className="fq-q-counter">{currentQ + 1} / 24</span>
            <button
              className="fq-btn fq-btn-primary"
              onClick={handleNext}
              disabled={answers[currentQ] === null}
              style={{ opacity: answers[currentQ] === null ? 0.5 : 1 }}
            >
              {currentQ === 23 ? '完成 →' : 'Next →'}
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
                    <span className="fq-dim-bar-name" style={{ color: d.color }}>{d.label}</span>
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
            {answers.filter(a => a !== null).length} / 24 answered
          </div>
        </div>
      </div>
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Results View ──────────────────────────────────────────────────────────────

function ResultsView({ survey, profile, onDone, onRetake, onViewDetail }) {
  const { scores } = survey;
  const tier = getScoreTier(scores.total);
  const type = getFriendshipType(scores);
  const suggestions = getSuggestions(scores);

  return (
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 24 }}>
        <Avatar profile={profile} size={32} />
        <h2 style={{ fontSize:14 }}>{profile.name} — Analysis Results</h2>
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
          <div className="fq-results-type-name">{type.name}</div>
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
            Dimension Breakdown
          </div>
          <div className="fq-dim-breakdown">
            {DIM_META.map(d => (
              <div key={d.key} className="fq-dim-breakdown-row">
                <div className="fq-dim-breakdown-top">
                  <span className="fq-dim-breakdown-name">
                    <span style={{ width:10, height:10, borderRadius:'50%', background: d.color, display:'inline-block' }} />
                    {d.label} <span style={{ color:'var(--muted)', fontWeight:400, fontSize:12 }}>({d.en})</span>
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
            AI Suggestions
          </div>
          <div className="fq-flags">
            {suggestions.map((s, i) => (
              <div key={i} className="fq-flag">
                <span className="fq-flag-icon">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
          <div className="fq-divider" />
          <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.6 }}>
            FQ Score = F×15% + R×18% + S×20% + T×20% + St×15% + E×12%
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fq-row" style={{ marginTop:24, gap:10 }}>
        <button className="fq-btn fq-btn-primary" onClick={onViewDetail}>
          View Full History →
        </button>
        <button className="fq-btn fq-btn-ghost" onClick={onRetake}>
          Retake Survey
        </button>
        <button className="fq-btn fq-btn-ghost" onClick={onDone}>
          ← Dashboard
        </button>
      </div>
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Detail View ───────────────────────────────────────────────────────────────

function DetailView({ profile, surveys, journals, onEdit, onStartSurvey, onBack, onLogUpdate }) {
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
        <h2>Friend Detail</h2>
        <div className="fq-line" />
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={onEdit}>✎ Edit</button>
        <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => onLogUpdate(profile)}>+ Log</button>
        <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={() => onStartSurvey(profile)}>
          + Survey
        </button>
      </div>

      <div className="fq-detail-layout">
        {/* Sidebar */}
        <div className="fq-detail-sidebar fq-card">
          <Avatar profile={profile} size={68} style={{ margin:'0 auto 14px', display:'flex' }} />
          <div className="fq-detail-name">{profile.name}</div>
          <div className="fq-detail-since">
            {profile.since ? `Friends since ${fmtDate(profile.since)}` : 'Date not recorded'}
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
              ['Surveys taken', surveyCount],
              ['Avg score', avgScore !== null ? avgScore : '—'],
              ['Best score', bestScore !== null ? bestScore : '—'],
              ['Last survey', latest ? fmtDate(latest.createdAt) : '—'],
            ].map(([label, val]) => (
              <div key={label} className="fq-detail-stat">
                <span className="fq-detail-stat-label">{label}</span>
                <span className="fq-detail-stat-val">{val}</span>
              </div>
            ))}
          </div>

          {profile.notes && (
            <div style={{ marginTop:14, padding:'10px 12px', background:'var(--bg2)', borderRadius:7, fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
              {profile.notes}
            </div>
          )}

          {latest && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>
                Latest Dimensions
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
            <h2>Score Trend</h2>
            <div className="fq-line" />
          </div>
          <div className="fq-card" style={{ marginBottom:20 }}>
            <LineChart surveys={profileSurveys} />
          </div>

          {/* Latest radar */}
          {latest && (
            <>
              <div className="fq-section-hdr" style={{ marginBottom:14 }}>
                <h2>Latest Radar</h2>
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
            <h2>Survey History</h2>
            <div className="fq-line" />
            <span style={{ fontSize:12, color:'var(--muted)' }}>{surveyCount} records</span>
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
                  <h2>近況日誌</h2>
                  <div className="fq-line" />
                  <button className="fq-btn fq-btn-ghost fq-btn-sm" onClick={() => onLogUpdate(profile)}>+ 新增</button>
                </div>
                {profileJournals.length === 0 ? (
                  <div className="fq-empty" style={{ padding:'28px 20px' }}>
                    <div className="fq-empty-title">尚無日誌紀錄</div>
                    <div className="fq-empty-sub">隨時點擊「+ Log」記錄最新的互動感受。</div>
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
                              <span className="fq-journal-mood-label">{m.label}</span>
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
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}


// ─── Main FriendPage ───────────────────────────────────────────────────────────

export default function FriendPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('yc_auth'));
  const [profiles, setProfiles] = useState(loadProfiles);
  const [surveys, setSurveys] = useState(loadSurveys);
  const [journals, setJournals] = useState(loadJournals);
  const [view, setView] = useState('dashboard'); // dashboard | create | survey | results | detail
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [lastSurvey, setLastSurvey] = useState(null);
  const [logTarget, setLogTarget] = useState(null);

  // Persist on change
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { saveSurveys(surveys); }, [surveys]);
  useEffect(() => { saveJournals(journals); }, [journals]);

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
    return <AuthView onAuth={handleAuth} />;
  }

  return (
    <div className="fq-root">
      <Topbar
        view={view}
        onDashboard={goToDashboard}
        onAddFriend={handleAddFriend}
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
          onStartSurvey={handleStartSurvey}
          onBack={goToDashboard}
          onLogUpdate={p => setLogTarget(p)}
        />
      )}
      {logTarget && <LogModal profile={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
    </div>
  );
}
