import './FriendPage.css';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['😊','👻','🐱','🐶','🦊','🐼','🌟','🎯','⚡','🔥','🎭','💎','🚀','🌙','🎵'];
const COLOR_OPTIONS = ['#60A5FA','#22D3EE','#34D399','#8B5CF6','#F472B6','#FB923C','#FBBF24','#F87171'];

const DIM_META = [
  { key: 'F',  label: '頻率', en: 'Frequency', color: '#60A5FA' },
  { key: 'B',  label: '平衡', en: 'Balance',   color: '#22D3EE' },
  { key: 'S',  label: '支持', en: 'Support',   color: '#34D399' },
  { key: 'T',  label: '信任', en: 'Trust',     color: '#8B5CF6' },
  { key: 'St', label: '穩定', en: 'Stability', color: '#FBBF24' },
];

const QUESTIONS = [
  // F
  { dim:'F', text:'我們平均多久主動聯絡一次？', opts:['幾乎不聯絡','每月聯絡','每週聯絡','幾乎每天'] },
  { dim:'F', text:'最近一個月，我們實際見面幾次？', opts:['0次','1–2次','3–5次','6次以上'] },
  { dim:'F', text:'在重要節日或特殊場合，對方會主動聯繫我嗎？', opts:['從不','偶爾','通常會','一定會'] },
  { dim:'F', text:'我們的聯絡頻率和半年前相比？', opts:['大幅減少','略有減少','差不多','增加了'] },
  // B
  { dim:'B', text:'在我們的對話中，誰更常主動開始話題？', opts:['幾乎都是我','大多是我','差不多','對方更多'] },
  { dim:'B', text:'分享個人困擾和喜悅時，是否雙向？', opts:['幾乎單向','偶爾雙向','大多雙向','非常平衡'] },
  { dim:'B', text:'對方是否也會主動關心我的狀況？', opts:['從不','很少','有時','經常'] },
  { dim:'B', text:'我們付出的時間和精力是否對等？', opts:['明顯不對等','稍微不對等','大致對等','完全對等'] },
  // S
  { dim:'S', text:'當我遇到困難時，對方會主動提供幫助嗎？', opts:['從不','很少','有時','一定會'] },
  { dim:'S', text:'對方了解我目前生活中重要的事嗎？', opts:['完全不了解','知道一些','了解大部分','非常了解'] },
  { dim:'S', text:'我在情緒低落時，會想到找對方嗎？', opts:['不會','很少','有時','第一個想到'] },
  { dim:'S', text:'對方曾在我最需要的時候出現嗎？', opts:['從未','偶爾','通常會','一直都在'] },
  // T
  { dim:'T', text:'我可以對對方說不好聽的真心話嗎？', opts:['完全不行','有限度','大多可以','完全可以'] },
  { dim:'T', text:'對方說的話和承諾，我有多信任？', opts:['不太信','將信將疑','大致相信','完全信任'] },
  { dim:'T', text:'我願意把私密的事告訴對方嗎？', opts:['不願意','只說表面','說一部分','完全願意'] },
  { dim:'T', text:'如果我們有矛盾，可以直接溝通解決嗎？', opts:['不行','很困難','大多可以','完全沒問題'] },
  // St
  { dim:'St', text:'我們的友誼在過去一年有沒有出現過明顯裂痕？', opts:['嚴重裂痕','有些摩擦','小誤會','非常穩定'] },
  { dim:'St', text:'即使一段時間沒聯絡，再見面時還是自在嗎？', opts:['非常尷尬','有點生疏','稍微需要暖身','完全自然'] },
  { dim:'St', text:'我預計五年後我們還是好朋友嗎？', opts:['不太可能','不確定','應該會','一定會'] },
  { dim:'St', text:'整體來說，這段友誼讓我感到？', opts:['很累/消耗','普通','還不錯','非常滋養'] },
];


// ─── Score helpers ─────────────────────────────────────────────────────────────

function calcScores(answers) {
  const dims = ['F','B','S','T','St'];
  const scores = {};
  dims.forEach((d, i) => {
    const slice = answers.slice(i * 4, i * 4 + 4);
    const sum = slice.reduce((a, b) => a + b, 0);
    scores[d] = Math.round(((sum - 4) / 16) * 100);
  });
  scores.total = Math.round(
    0.20 * scores.F +
    0.20 * scores.B +
    0.25 * scores.S +
    0.20 * scores.T +
    0.15 * scores.St
  );
  return scores;
}

function getFriendshipType(scores) {
  const { F, B, S, T, St } = scores;
  if (scores.total >= 75 && T >= 70 && St >= 70)
    return { key:'SHQ', name:'穩固高品質', en:'Stable & High Quality', color:'#22D3EE', desc:'信任深厚、情感穩定，是少數真正可以依賴的友誼。' };
  if (F >= 70 && B < 50)
    return { key:'ASL', name:'主動表層型', en:'Active but Surface Level', color:'#60A5FA', desc:'聯絡頻繁但缺乏深度，需要加強雙向理解。' };
  if (B < 45 || (S < 50 && T < 50))
    return { key:'AOS', name:'不對等單向型', en:'Asymmetric / One-Sided', color:'#FB923C', desc:'付出不對等，長期可能造成疲憊感。' };
  if (F < 50 && T >= 65 && St >= 65)
    return { key:'QDB', name:'安靜深連型', en:'Quiet Deep Bond', color:'#8B5CF6', desc:'見面不多但情感真實，聯絡少不代表感情淡。' };
  if (St < 45 || T < 45)
    return { key:'FNR', name:'脆弱待修型', en:'Fragile / Needs Repair', color:'#F87171', desc:'關係出現裂縫，需要主動修復才能維持。' };
  if (scores.total >= 55)
    return { key:'SLD', name:'穩定輕度型', en:'Stable Lightweight', color:'#34D399', desc:'關係平穩但不算特別深入，適合輕鬆相處。' };
  return { key:'FAD', name:'淡化中型', en:'Fading', color:'#94A3B8', desc:'友誼正在自然淡化，需要決定是否投入更多。' };
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
  if (scores.F < 50) tips.push({ icon:'📅', text:'建議增加主動聯絡的頻率，定期check-in能有效維繫感情。' });
  if (scores.B < 50) tips.push({ icon:'⚖️', text:'注意互動的平衡性，試著讓對方也有機會分享和傾訴。' });
  if (scores.S < 50) tips.push({ icon:'🤝', text:'在對方遇到困難時多給予支持，這是深化友誼的關鍵。' });
  if (scores.T < 50) tips.push({ icon:'🔐', text:'試著分享更多真實的想法，建立信任需要雙方的勇氣。' });
  if (scores.St < 50) tips.push({ icon:'🛠️', text:'若有未解決的摩擦，主動開口溝通比沉默更有效。' });
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
          stroke="#263248"
          strokeWidth={f === 1.0 ? 1.5 : 1}
        />
      ))}
      {/* spokes */}
      {angles.map((a, i) => {
        const outer = polarToXY(a, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#263248" strokeWidth="1" />;
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
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={dims[i].color} stroke="#0B1020" strokeWidth="2" />
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
            <line x1={PL} y1={yOf(v)} x2={W - PR} y2={yOf(v)} stroke="#263248" strokeWidth="1" strokeDasharray={v === 0 || v === 100 ? 'none' : '3,4'} />
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
            <circle cx={xOf(i)} cy={yOf(s.total)} r={hoveredIdx === i ? 7 : 5} fill={hoveredIdx === i ? '#22D3EE' : '#60A5FA'} stroke="#0B1020" strokeWidth="2" />
            {hoveredIdx === i && (
              <g>
                <rect x={xOf(i) - 28} y={yOf(s.total) - 30} width="56" height="22" rx="4" fill="#182235" stroke="#263248" />
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
    </div>
  );
}


// ─── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({ profiles, surveys, onSelectFriend, onCreateFriend, onStartSurvey }) {
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
          <div className="fq-kpi-value" style={{ color: avgScore !== null ? getScoreTier(avgScore).color : 'var(--fq-muted)' }}>
            {avgScore !== null ? avgScore : '—'}
          </div>
          <div className="fq-kpi-sub">across all friends</div>
        </div>
        <div className="fq-kpi">
          <div className="fq-kpi-label">Highest Scorer</div>
          <div className="fq-kpi-value" style={{ fontSize: highestProfile ? 22 : 30, paddingTop: highestProfile ? 4 : 0 }}>
            {highestProfile ? (
              <span>{highestProfile.emoji} {highestProfile.name}</span>
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
            {mostRecentProfile ? `${mostRecentProfile.emoji} ${mostRecentProfile.name}` : '—'}
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
                  <div className="fq-avatar" style={{ background: p.color + '33', borderColor: p.color }}>
                    {p.emoji}
                  </div>
                  <div>
                    <div className="fq-friend-name">{p.name}</div>
                    <div className="fq-friend-meta">
                      {p.since ? `Since ${fmtDate(p.since)}` : 'Date unknown'}
                    </div>
                  </div>
                  {latest ? (
                    <div className={`fq-score-badge tier-${tier.tier}`}>
                      {latest.total}
                    </div>
                  ) : (
                    <div className="fq-score-badge" style={{ color:'var(--fq-muted)', fontSize:14 }}>
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
                {!latest && (
                  <button
                    className="fq-btn fq-btn-ghost fq-btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={e => { e.stopPropagation(); onStartSurvey(p); }}
                  >
                    Start Survey →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Create/Edit Profile View ──────────────────────────────────────────────────

function CreateView({ editProfile, onSave, onCancel, onDelete }) {
  const isEdit = !!editProfile;
  const [name, setName] = useState(editProfile?.name || '');
  const [emoji, setEmoji] = useState(editProfile?.emoji || '😊');
  const [color, setColor] = useState(editProfile?.color || '#60A5FA');
  const [since, setSince] = useState(editProfile?.since || '');
  const [notes, setNotes] = useState(editProfile?.notes || '');
  const [err, setErr] = useState('');

  function handleSave() {
    if (!name.trim()) { setErr('請輸入姓名'); return; }
    const profile = {
      id: editProfile?.id || genId(),
      name: name.trim(),
      emoji,
      color,
      since,
      notes,
      createdAt: editProfile?.createdAt || new Date().toISOString(),
    };
    onSave(profile);
  }

  return (
    <div className="fq-body">
      <div className="fq-section-hdr" style={{ marginBottom: 28 }}>
        <h2>{isEdit ? 'Edit Profile' : 'New Friend Profile'}</h2>
        <div className="fq-line" />
      </div>
      <div className="fq-form">
        {/* Preview */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28, padding:'16px 20px', background:'var(--fq-card)', border:'1px solid var(--fq-border)', borderRadius:10 }}>
          <div className="fq-avatar" style={{ width:56, height:56, fontSize:26, background: color + '33', borderColor: color }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{name || '(Name)'}</div>
            <div style={{ fontSize:12, color:'var(--fq-muted)' }}>{since ? `Since ${fmtDate(since)}` : 'Friend since...'}</div>
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
          {err && <div style={{ color:'var(--fq-red)', fontSize:12, marginTop:6 }}>{err}</div>}
        </div>

        <div className="fq-form-row">
          <label className="fq-label">Avatar Emoji</label>
          <div className="fq-emoji-row">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                className={`fq-emoji-opt${emoji === e ? ' selected' : ''}`}
                onClick={() => setEmoji(e)}
                type="button"
              >
                {e}
              </button>
            ))}
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
    </div>
  );
}


// ─── Survey View ───────────────────────────────────────────────────────────────

function SurveyView({ profile, onComplete, onCancel }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(Array(20).fill(null));

  const liveAnswers = answers.map(a => a !== null ? a : 0);
  const liveScores = calcScores(liveAnswers);

  function handleSelect(val) {
    const next = [...answers];
    next[currentQ] = val;
    setAnswers(next);
  }

  function handleNext() {
    if (answers[currentQ] === null) return;
    if (currentQ < 19) {
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
        <div className="fq-avatar" style={{ background: profile.color + '33', borderColor: profile.color, width:32, height:32, fontSize:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid', flexShrink:0 }}>
          {profile.emoji}
        </div>
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
          <div className="fq-survey-q-num">Question {currentQ + 1} of 20</div>
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
            <span className="fq-q-counter">{currentQ + 1} / 20</span>
            <button
              className="fq-btn fq-btn-primary"
              onClick={handleNext}
              disabled={answers[currentQ] === null}
              style={{ opacity: answers[currentQ] === null ? 0.5 : 1 }}
            >
              {currentQ === 19 ? '完成 →' : 'Next →'}
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
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className={`fq-survey-q-dot${i === currentQ ? ' current' : answers[i] !== null ? ' answered' : ''}`}
                onClick={() => { if (i <= currentQ || answers[i-1] !== null) setCurrentQ(i); }}
                style={{ cursor:'pointer' }}
                title={`Q${i+1}`}
              />
            ))}
          </div>
          <div style={{ fontSize:11, color:'var(--fq-muted)', marginTop:8 }}>
            {answers.filter(a => a !== null).length} / 20 answered
          </div>
        </div>
      </div>
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
        <div className="fq-avatar" style={{ background: profile.color + '33', borderColor: profile.color, width:32, height:32, fontSize:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid', flexShrink:0 }}>
          {profile.emoji}
        </div>
        <h2 style={{ fontSize:14 }}>{profile.name} — Analysis Results</h2>
        <div className="fq-line" />
        <span style={{ fontSize:12, color:'var(--fq-muted)' }}>{fmtDate(survey.createdAt)}</span>
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
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fq-muted)', marginBottom:16 }}>
            Dimension Breakdown
          </div>
          <div className="fq-dim-breakdown">
            {DIM_META.map(d => (
              <div key={d.key} className="fq-dim-breakdown-row">
                <div className="fq-dim-breakdown-top">
                  <span className="fq-dim-breakdown-name">
                    <span style={{ width:10, height:10, borderRadius:'50%', background: d.color, display:'inline-block' }} />
                    {d.label} <span style={{ color:'var(--fq-muted)', fontWeight:400, fontSize:12 }}>({d.en})</span>
                  </span>
                  <span className="fq-dim-breakdown-score" style={{ color: d.color }}>
                    {scores[d.key]}
                    <span style={{ fontSize:12, fontWeight:400, color:'var(--fq-muted)' }}>/100</span>
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
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fq-muted)', marginBottom:16 }}>
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
          <div style={{ fontSize:11, color:'var(--fq-muted)', lineHeight:1.6 }}>
            FQ Score is calculated as: F×20% + B×20% + S×25% + T×20% + St×15%
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
    </div>
  );
}


// ─── Detail View ───────────────────────────────────────────────────────────────

function DetailView({ profile, surveys, onEdit, onStartSurvey, onBack }) {
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
        <button className="fq-btn fq-btn-primary fq-btn-sm" onClick={() => onStartSurvey(profile)}>
          + New Survey
        </button>
      </div>

      <div className="fq-detail-layout">
        {/* Sidebar */}
        <div className="fq-detail-sidebar fq-card">
          <div className="fq-detail-avatar-big" style={{ background: profile.color + '33', borderColor: profile.color }}>
            {profile.emoji}
          </div>
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

          <div style={{ borderTop:'1px solid var(--fq-border)', paddingTop:14 }}>
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
            <div style={{ marginTop:14, padding:'10px 12px', background:'var(--fq-surface)', borderRadius:7, fontSize:13, color:'var(--fq-muted)', lineHeight:1.6 }}>
              {profile.notes}
            </div>
          )}

          {latest && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--fq-muted)', marginBottom:10 }}>
                Latest Dimensions
              </div>
              {DIM_META.map(d => (
                <div key={d.key} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span style={{ color: d.color, fontWeight:600 }}>{d.label}</span>
                    <span style={{ fontWeight:700, color: d.color }}>{latest.scores[d.key]}</span>
                  </div>
                  <div style={{ height:5, background:'var(--fq-border)', borderRadius:3, overflow:'hidden' }}>
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
                <span style={{ fontSize:12, color:'var(--fq-muted)' }}>{fmtDate(latest.createdAt)}</span>
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
            <span style={{ fontSize:12, color:'var(--fq-muted)' }}>{surveyCount} records</span>
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
                    <span style={{ fontSize:11, color:'var(--fq-muted)', minWidth:24 }}>
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
                        <span style={{ fontSize:12, color: diff > 0 ? 'var(--fq-green)' : 'var(--fq-red)', fontWeight:700, minWidth:32 }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      );
                    })()}
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


// ─── Main FriendPage ───────────────────────────────────────────────────────────

export default function FriendPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('yc_auth'));
  const [profiles, setProfiles] = useState(loadProfiles);
  const [surveys, setSurveys] = useState(loadSurveys);
  const [view, setView] = useState('dashboard'); // dashboard | create | survey | results | detail
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);
  const [lastSurvey, setLastSurvey] = useState(null);

  // Persist on change
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { saveSurveys(surveys); }, [surveys]);

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
          onSelectFriend={handleSelectFriend}
          onCreateFriend={handleAddFriend}
          onStartSurvey={handleStartSurvey}
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
          onEdit={() => handleEditProfile(selectedProfile)}
          onStartSurvey={handleStartSurvey}
          onBack={goToDashboard}
        />
      )}
    </div>
  );
}
