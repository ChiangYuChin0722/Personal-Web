import { useState, useEffect, useRef, useCallback } from "react";
import { encrypt, decrypt } from "./secretUtils.js";
import "./SecretPage.css";

const VALID_USERNAME = "chianghebe";
const VALID_PASSWORD = "Hebe0722";
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const CARD_COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#059669", "#d97706", "#0891b2"];
const CIRCLED = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"];

// ── World Clocks ──────────────────────────────────────────────
function WorldClocks() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const fmt = (tz) =>
    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
  return (
    <div className="sp-clocks">
      <div className="sp-clock-row">
        <span className="sp-clock-time">{fmt("Asia/Taipei")}</span>
        <span className="sp-clock-tz">TWN</span>
      </div>
      <div className="sp-clock-row">
        <span className="sp-clock-time">{fmt("Europe/London")}</span>
        <span className="sp-clock-tz">LON</span>
      </div>
    </div>
  );
}

// ── Quick Links ───────────────────────────────────────────────
const LINK_PRESETS = [
  { icon: "📧", label: "Gmail",     url: "https://mail.google.com" },
  { icon: "▶️",  label: "YouTube",  url: "https://youtube.com" },
  { icon: "🎵", label: "YT Music",  url: "https://music.youtube.com" },
  { icon: "🐙", label: "GitHub",    url: "https://github.com" },
  { icon: "💼", label: "LinkedIn",  url: "https://linkedin.com" },
  { icon: "💻", label: "LeetCode",  url: "https://leetcode.com" },
  { icon: "📷", label: "Instagram", url: "https://instagram.com" },
  { icon: "📝", label: "Notion",    url: "https://notion.so" },
];

const ICON_OPTIONS = ["🔗","📧","▶️","🎵","🐙","💼","💻","🐦","📷","💬","📝","🎮","📊","🌐","🎬","📚","💰","🏠","⚡","🔑","📌","🛒","🎨","📱","🖥️","👽"];

function QuickLinks({ links, onAdd, onRemove }) {
  const [showCustom, setShowCustom] = useState(false);
  const [icon, setIcon]   = useState("🔗");
  const [label, setLabel] = useState("");
  const [url, setUrl]     = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Which preset IDs are already added
  const addedUrls = new Set(links.map(l => l.url));

  function addPreset(preset) {
    if (addedUrls.has(preset.url)) return;
    onAdd({ id: Date.now().toString(), ...preset });
  }

  function addCustom() {
    if (!url.trim()) return;
    const fullUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    onAdd({ id: Date.now().toString(), icon, label: label.trim() || fullUrl, url: fullUrl });
    setIcon("🔗"); setLabel(""); setUrl(""); setShowCustom(false);
  }

  return (
    <div className="sp-box">
      <div className="sp-box-title">Quick Links</div>

      {/* Preset chips */}
      <div className="ql-presets">
        {LINK_PRESETS.map(p => (
          <button key={p.url}
            className={`ql-preset${addedUrls.has(p.url) ? " added" : ""}`}
            onClick={() => addPreset(p)}
            title={p.label}
          >
            <span>{p.icon}</span><span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Added links */}
      {links.length > 0 && (
        <div className="sp-link-list">
          {links.map((l, i) => (
            <div key={l.id || i} className="sp-link-item">
              <span className="ql-link-icon">{l.icon || "🔗"}</span>
              <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
              <button onClick={() => onRemove(i)} className="sp-del">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Custom add */}
      {showCustom ? (
        <div className="ql-custom-row">
          <div className="ql-icon-picker-wrap">
            <button className="ql-icon-btn" onClick={() => setShowPicker(p => !p)}>{icon}</button>
            {showPicker && (
              <div className="ql-icon-grid">
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} onClick={() => { setIcon(ic); setShowPicker(false); }}
                    className={ic === icon ? "selected" : ""}>{ic}</button>
                ))}
              </div>
            )}
          </div>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" />
          <input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustom()} placeholder="URL" />
          <button onClick={addCustom} className="ql-add-btn">+</button>
          <button onClick={() => setShowCustom(false)} className="sp-del">✕</button>
        </div>
      ) : (
        <button className="ql-custom-toggle" onClick={() => setShowCustom(true)}>+ Custom URL</button>
      )}
    </div>
  );
}

// ── Expandable Pill Section ───────────────────────────────────
function PillSection({ icon, label, items, onAdd, onRemove, placeholder }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    onAdd(input.trim()); setInput("");
  }

  return (
    <div className="sp-pill-wrap">
      <button className="sp-pill" onClick={() => setOpen(o => !o)}>
        <span>{icon}</span>{label}<span className="sp-pill-caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="sp-pill-body">
          {items.map((item, i) => (
            <div key={i} className="sp-pill-item">
              <span>{item}</span>
              <button onClick={() => onRemove(i)} className="sp-del">✕</button>
            </div>
          ))}
          <div className="sp-pill-add-row">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={placeholder} />
            <button onClick={add}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Deadlines ─────────────────────────────────────────────────
function daysLeft(dateStr) {
  if (!dateStr || dateStr === "TBD") return null;
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    d = new Date(dateStr + "T00:00:00");
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    const now = new Date();
    if (parts.length === 3) {
      d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    } else {
      d = new Date(now.getFullYear(), +parts[0] - 1, +parts[1]);
      if (d < now && now - d > 86400000) d.setFullYear(now.getFullYear() + 1);
    }
  } else { return null; }
  const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function dlBadgeStyle(days) {
  if (days === null) return { bg: "var(--bg3)", color: "var(--muted)" };
  if (days < 0)  return { bg: "rgba(248,113,113,0.15)", color: "var(--red)" };
  if (days <= 3) return { bg: "rgba(249,115,22,0.15)", color: "#f97316" };
  if (days <= 7) return { bg: "rgba(234,179,8,0.15)",  color: "#eab308" };
  return { bg: "rgba(52,211,153,0.12)", color: "var(--green)" };
}

function dlBadgeLabel(days) {
  if (days === null) return "TBD";
  if (days < 0)  return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function DeadlinesSection({ deadlines, onAdd, onRemove }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  function add() {
    if (!title.trim()) return;
    onAdd({ id: Date.now().toString(), title: title.trim(), date: date || "TBD" });
    setTitle(""); setDate("");
  }

  const sorted = [...deadlines]
    .map((d, origIdx) => ({ ...d, origIdx }))
    .sort((a, b) => {
      const da = daysLeft(a.date), db = daysLeft(b.date);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });

  return (
    <div className="sp-deadlines">
      <div className="sp-section-title">Deadlines</div>
      <div className="sp-dl-list">
        {sorted.map(d => {
          const days = daysLeft(d.date);
          const { bg, color } = dlBadgeStyle(days);
          const displayDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date)
            ? d.date.slice(5).replace("-", "/") : d.date;
          return (
            <div key={d.id || d.origIdx} className="sp-dl-item">
              <span className="sp-dl-badge" style={{ background: bg, color }}>{dlBadgeLabel(days)}</span>
              <span className="sp-dl-name">{d.title}</span>
              <span className="sp-dl-datestr">{displayDate}</span>
              <button onClick={() => onRemove(d.origIdx)} className="sp-del">✕</button>
            </div>
          );
        })}
        {deadlines.length === 0 && <div className="sp-dl-empty">No deadlines yet</div>}
      </div>
      <div className="sp-dl-add">
        <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Task name..." className="sp-dl-title-input" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="sp-dl-date-input" />
        <button onClick={add} className="sp-add-btn">+</button>
      </div>
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────
function TasksSection({ tasks, onAdd, onRemove, onUpdate }) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");

  function add() {
    if (!name.trim()) return;
    onAdd({ id: Date.now().toString(), name: name.trim(), tags: tags.trim(), progress: 0, urgent: false });
    setName(""); setTags("");
  }

  return (
    <div className="sp-tasks">
      <div className="sp-tasks-head">
        <span>Task</span><span>Tags</span><span></span>
      </div>
      {tasks.map((t, i) => (
        <div key={t.id || i} className={`sp-task-row${t.urgent ? " sp-urgent" : ""}`}>
          <div className="sp-task-name">
            <span className="sp-task-num">{CIRCLED[i] || `${i + 1}`}</span>
            <span>{t.name}</span>
            {t.urgent && <span className="sp-urgent-tag">urgent</span>}
          </div>
          <div className="sp-task-tags">{t.tags}</div>
          <div className="sp-task-ctrl">
            <button onClick={() => onUpdate(i, { ...t, urgent: !t.urgent })} className={`sp-urg-btn${t.urgent ? " on" : ""}`} title="Toggle urgent">!</button>
            <button onClick={() => onRemove(i)} className="sp-del">✕</button>
          </div>
        </div>
      ))}
      <div className="sp-task-add-row">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Task name..." />
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags..." />
        <button onClick={add}>+</button>
      </div>
    </div>
  );
}

// ── Eisenhower Matrix ─────────────────────────────────────────
function getQuadrantInfo(x, y) {
  // x: 0=Not Urgent(left)  100=Urgent(right)
  // y: 0=Important(top)    100=Not Important(bottom)
  if (x >= 50 && y < 50)  return { label: "Important × Urgent",         color: "#dc2626", sub: "Do Now" };
  if (x < 50  && y < 50)  return { label: "Important × Not Urgent",     color: "#2563eb", sub: "Schedule" };
  if (x >= 50 && y >= 50) return { label: "Not Important × Urgent",     color: "#d97706", sub: "Delegate" };
  return                          { label: "Not Important × Not Urgent", color: "#475569", sub: "Eliminate" };
}

function EisenhowerMatrix({ matrix, onUpdate }) {
  const plotRef        = useRef(null);
  const dragId         = useRef(null);
  const dragMoved      = useRef(false);
  const localItemsRef  = useRef([]);

  const [localItems, setLocalItems] = useState([]);
  const [addModal, setAddModal]     = useState(null);
  const [viewCard, setViewCard]     = useState(null);
  const [form, setForm]             = useState({ title: "", deadline: "", details: "" });

  // Sync from parent when not dragging
  useEffect(() => {
    if (!dragId.current) {
      const arr = Array.isArray(matrix) ? matrix : [];
      localItemsRef.current = arr;
      setLocalItems(arr);
    }
  }, [matrix]);

  function getPos(clientX, clientY) {
    const r = plotRef.current.getBoundingClientRect();
    return {
      x: Math.max(2, Math.min(98, ((clientX - r.left)  / r.width)  * 100)),
      y: Math.max(2, Math.min(98, ((clientY - r.top)   / r.height) * 100)),
    };
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragId.current || !plotRef.current) return;
      dragMoved.current = true;
      const pos = getPos(e.clientX, e.clientY);
      const next = localItemsRef.current.map(it =>
        it.id === dragId.current ? { ...it, ...pos } : it
      );
      localItemsRef.current = next;
      setLocalItems([...next]);
    }
    function onUp() {
      if (!dragId.current) return;
      if (dragMoved.current) onUpdate([...localItemsRef.current]);
      dragId.current    = null;
      dragMoved.current = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [onUpdate]);

  function handlePlotClick(e) {
    if (dragMoved.current) return;
    if (e.target.closest(".em-dot")) return;
    const pos = getPos(e.clientX, e.clientY);
    setAddModal(pos);
    setForm({ title: "", deadline: "", details: "" });
  }

  function handleDotMouseDown(e, id) {
    e.stopPropagation();
    dragId.current    = id;
    dragMoved.current = false;
    setViewCard(null);
  }

  function handleDotClick(e, id) {
    e.stopPropagation();
    if (dragMoved.current) return;
    setViewCard(id);
  }

  function addItem() {
    if (!form.title.trim()) return;
    const newItem = { id: Date.now().toString(), ...form, title: form.title.trim(), x: addModal.x, y: addModal.y };
    const next = [...localItemsRef.current, newItem];
    localItemsRef.current = next;
    setLocalItems(next);
    onUpdate(next);
    setAddModal(null);
  }

  function deleteItem(id) {
    const next = localItemsRef.current.filter(i => i.id !== id);
    localItemsRef.current = next;
    setLocalItems(next);
    onUpdate(next);
    setViewCard(null);
  }

  const viewItem = viewCard ? localItems.find(i => i.id === viewCard) : null;

  return (
    <div className="sp-matrix">
      <div className="sp-section-title">Eisenhower Matrix
        <span className="sp-matrix-hint">click anywhere to add</span>
      </div>

      {/* Plot */}
      <div className="em-plot-wrap">
        {/* Y axis labels */}
        <div className="em-axis-y-top">Important</div>
        <div className="em-axis-y-bot">Not Important</div>

        <div ref={plotRef} className="em-plot" onClick={handlePlotClick}
          style={{ cursor: dragId.current ? "grabbing" : "crosshair" }}>

          {/* Quadrant backgrounds */}
          <div className="em-bg em-bg-tl" />
          <div className="em-bg em-bg-tr" />
          <div className="em-bg em-bg-bl" />
          <div className="em-bg em-bg-br" />

          {/* Axis lines */}
          <div className="em-line em-line-h" />
          <div className="em-line em-line-v" />

          {/* Corner labels */}
          <span className="em-qlabel" style={{ top:"6%", left:"4%",  color:"#2563eb" }}>Schedule</span>
          <span className="em-qlabel" style={{ top:"6%", right:"4%", color:"#dc2626" }}>Do Now</span>
          <span className="em-qlabel" style={{ bottom:"6%", left:"4%",  color:"#475569" }}>Eliminate</span>
          <span className="em-qlabel" style={{ bottom:"6%", right:"4%", color:"#d97706" }}>Delegate</span>

          {localItems.map(item => {
            const q = getQuadrantInfo(item.x, item.y);
            return (
              <div key={item.id} className="em-dot"
                style={{ left: `${item.x}%`, top: `${item.y}%`, background: q.color,
                  boxShadow: `0 0 10px ${q.color}88`,
                  cursor: dragId.current === item.id ? "grabbing" : "grab" }}
                onMouseDown={e => handleDotMouseDown(e, item.id)}
                onClick={e => handleDotClick(e, item.id)}
              >
                <span className="em-dot-label">{item.title}</span>
              </div>
            );
          })}
        </div>

        {/* X axis labels */}
        <div className="em-axis-x">
          <span>← Not Urgent</span>
          <span>Urgent →</span>
        </div>
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="em-overlay" onClick={() => setAddModal(null)}>
          <div className="em-modal" onClick={e => e.stopPropagation()}>
            <div className="em-modal-header">
              <h3>New Task</h3>
              <span className="em-modal-quad" style={{ color: getQuadrantInfo(addModal.x, addModal.y).color }}>
                {getQuadrantInfo(addModal.x, addModal.y).label}
              </span>
            </div>
            <div className="em-modal-field">
              <label>Title</label>
              <input autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Task title..." />
            </div>
            <div className="em-modal-field">
              <label>Deadline</label>
              <input value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                placeholder="e.g. 2025/06/01" />
            </div>
            <div className="em-modal-field">
              <label>Details</label>
              <textarea value={form.details} onChange={e => setForm(p => ({ ...p, details: e.target.value }))}
                placeholder="Notes, subtasks..." rows={3} />
            </div>
            <div className="em-modal-actions">
              <button className="em-btn-cancel" onClick={() => setAddModal(null)}>Cancel</button>
              <button className="em-btn-add" onClick={addItem}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* View Card */}
      {viewItem && (() => {
        const q = getQuadrantInfo(viewItem.x, viewItem.y);
        return (
          <div className="em-overlay" onClick={() => setViewCard(null)}>
            <div className="em-modal" onClick={e => e.stopPropagation()}>
              <div className="em-modal-header">
                <div>
                  <span className="em-modal-quad" style={{ color: q.color }}>{q.label} · {q.sub}</span>
                  <h3>{viewItem.title}</h3>
                </div>
                <button className="em-close" onClick={() => setViewCard(null)}>✕</button>
              </div>
              {viewItem.deadline && (
                <div className="em-card-row"><span className="em-card-key">Deadline</span><span>{viewItem.deadline}</span></div>
              )}
              {viewItem.details && (
                <div className="em-card-row"><span className="em-card-key">Details</span><span>{viewItem.details}</span></div>
              )}
              <div className="em-modal-actions">
                <button className="em-btn-delete" onClick={() => deleteItem(viewItem.id)}>Delete</button>
                <button className="em-btn-cancel" onClick={() => setViewCard(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Today Timeline ────────────────────────────────────────────
function dateKey(d) { return d.toISOString().slice(0, 10); }

function TodayTimeline({ timeline, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  const [offset, setOffset] = useState(0); // 0=today, negative=past, positive=future

  const today = new Date();
  const selected = new Date(today);
  selected.setDate(today.getDate() + offset);
  const selKey = dateKey(selected);
  const currentHour = offset === 0 ? today.getHours() : -1;

  // Migrate old flat format { hour: text } → new { dateKey: { hour: text } }
  function normalize(tl) {
    if (!tl || typeof tl !== "object") return {};
    const vals = Object.values(tl);
    if (vals.length > 0 && typeof vals[0] === "string") {
      return { [dateKey(today)]: tl };
    }
    return tl;
  }
  const norm = normalize(timeline);
  const dayData = norm[selKey] || {};

  function startEdit(h) { setEditing(h); setVal(dayData[h] || ""); }
  function commitEdit() {
    if (editing == null) return;
    const base = normalize(timeline);
    const dayUpdated = { ...(base[selKey] || {}), [editing]: val };
    if (!val.trim()) delete dayUpdated[editing];
    onUpdate({ ...base, [selKey]: dayUpdated });
    setEditing(null);
  }

  const dayLabel = offset === 0 ? "Today" : offset === -1 ? "Yesterday" : offset === 1 ? "Tomorrow"
    : selected.toLocaleDateString("en-US", { weekday: "short" });
  const dateLabel = selected.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="sp-timeline">
      <div className="sp-tl-header">
        <div className="sp-section-title">
          {dayLabel} <span className="sp-tl-sub">timeline</span>
        </div>
        <div className="sp-tl-nav">
          <button className="sp-tl-nav-btn" onClick={() => setOffset(o => o - 1)} disabled={offset <= -3}>‹</button>
          <span className="sp-tl-date">{dateLabel}</span>
          <button className="sp-tl-nav-btn" onClick={() => setOffset(o => o + 1)} disabled={offset >= 7}>›</button>
        </div>
      </div>
      {HOURS.map(h => (
        <div key={h} className={`sp-tl-row${h === currentHour ? " sp-tl-now" : ""}`} onClick={() => startEdit(h)}>
          <span className="sp-tl-hour">{h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}</span>
          <div className="sp-tl-line" />
          {editing === h ? (
            <input
              autoFocus className="sp-tl-input"
              value={val} onChange={e => setVal(e.target.value)}
              onBlur={commitEdit} onKeyDown={e => e.key === "Enter" && commitEdit()}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="sp-tl-event">{dayData[h]}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Groceries ─────────────────────────────────────────────────
function GroceriesSection({ items, onAdd, onToggle, onRemove }) {
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    onAdd({ id: Date.now().toString(), text: input.trim(), done: false });
    setInput("");
  }

  return (
    <div className="sp-groceries">
      <div className="sp-section-title">Groceries</div>
      {items.map((g, i) => (
        <div key={g.id || i} className={`sp-grocery-item${g.done ? " done" : ""}`}>
          <input type="checkbox" checked={g.done} onChange={() => onToggle(i)} />
          <span>{g.text}</span>
          <button onClick={() => onRemove(i)} className="sp-del">✕</button>
        </div>
      ))}
      <div className="sp-grocery-add">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add item..." />
        <button onClick={add}>+</button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function SecretPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [links, setLinks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [timeline, setTimeline] = useState({});
  const [importantDraft, setImportantDraft] = useState("");
  const [groceries, setGroceries] = useState([]);
  const importantTimer = useRef(null);

  // Restore session
  useEffect(() => {
    const auth = sessionStorage.getItem("yc_auth");
    const user = sessionStorage.getItem("yc_user");
    const pass = sessionStorage.getItem("yc_pass");
    if (auth === "authenticated" && user && pass) {
      setCurrentUser(user); setCurrentPassword(pass); setLoggedIn(true);
    }
  }, []);

  // Load all data after login
  useEffect(() => {
    if (!loggedIn || !currentPassword) return;
    (async () => {
      const load = async (key, def, isStr = false) => {
        const raw = localStorage.getItem(key);
        if (!raw) return def;
        const text = await decrypt(raw, currentPassword);
        if (text == null) return def;
        return isStr ? text : JSON.parse(text);
      };
      setLinks(await load("yc2_links", []));
      setDeadlines(await load("yc2_deadlines", []));
      setTasks(await load("yc2_tasks", []));
      const rawMatrix = await load("yc2_matrix", []);
      setMatrix(Array.isArray(rawMatrix) ? rawMatrix : []);
      setTimeline(await load("yc2_timeline", {}));
      setImportantDraft(await load("yc2_important", "", true));
      setGroceries(await load("yc2_groceries", []));
    })();
  }, [loggedIn, currentPassword]);

  const save = useCallback(async (key, value) => {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, await encrypt(text, currentPassword));
  }, [currentPassword]);

  function handleLogin() {
    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      setLoginError(true); return;
    }
    sessionStorage.setItem("yc_auth", "authenticated");
    sessionStorage.setItem("yc_user", username);
    sessionStorage.setItem("yc_pass", password);
    setCurrentUser(username); setCurrentPassword(password);
    setLoginError(false); setLoggedIn(true);
  }

  function handleLogout() {
    sessionStorage.clear();
    setLoggedIn(false); setCurrentUser(""); setCurrentPassword(""); setPassword("");
    setLinks([]);
    setDeadlines([]); setTasks([]); setMatrix([]); setTimeline({});
    setImportantDraft(""); setGroceries([]);
  }

  const updateLinks = v => { setLinks(v); save("yc2_links", v); };
  const updateDeadlines= v => { setDeadlines(v); save("yc2_deadlines", v); };
  const updateTasks    = v => { setTasks(v);     save("yc2_tasks", v); };
  const updateMatrix   = v => { setMatrix(v);    save("yc2_matrix", v); };
  const updateTimeline = v => { setTimeline(v);  save("yc2_timeline", v); };
  const updateGroceries= v => { setGroceries(v); save("yc2_groceries", v); };

  function handleImportantChange(v) {
    setImportantDraft(v);
    clearTimeout(importantTimer.current);
    importantTimer.current = setTimeout(() => save("yc2_important", v), 500);
  }

  if (!loggedIn) {
    return (
      <div className="sp-root sp-login-bg">
        <div className="sp-login-box">
          <h1>Private Access</h1>
          <p>This area is restricted. Please sign in.</p>
          <div className="sp-field">
            <label>USERNAME</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoComplete="off" />
          </div>
          <div className="sp-field">
            <label>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter password" />
          </div>
          <button className="sp-login-btn" onClick={handleLogin}>Sign In</button>
          {loginError && <div className="sp-login-error">Incorrect username or password.</div>}
          <div className="sp-login-footer"><a href="/">← Back to portfolio</a></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-root">
      <div className="sp-topbar">
        <div className="sp-brand">YC<span>.</span> Private</div>
        <div className="sp-topbar-right">
          <span className="sp-username">{currentUser}</span>
          <button className="sp-logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div className="sp-body">
        {/* ── LEFT ── */}
        <div className="sp-left">
          <WorldClocks />
          <QuickLinks
            links={links}
            onAdd={l => updateLinks([...links, l])}
            onRemove={i => updateLinks(links.filter((_, idx) => idx !== i))}
          />
          <a href="https://music.youtube.com/playlist?list=PLdpw4c3Tb8_i87buXxix9KI3KS1JbPfl5&si=YqcEhZpE700XF6c6" target="_blank" rel="noreferrer" className="sp-pill sp-pill-link">
            <span>🎵</span>Music Playlist<span className="sp-pill-caret">→</span>
          </a>
          <a href="/secret/fun" className="sp-pill sp-pill-link">
            <span>🎉</span>Fun Things<span className="sp-pill-caret">→</span>
          </a>
          <a href="/secret/friend" className="sp-pill sp-pill-link">
            <span>👥</span>Friends<span className="sp-pill-caret">→</span>
          </a>
        </div>

        {/* ── MIDDLE ── */}
        <div className="sp-middle">
          <DeadlinesSection
            deadlines={deadlines}
            onAdd={d => updateDeadlines([...deadlines, d])}
            onRemove={i => updateDeadlines(deadlines.filter((_, idx) => idx !== i))}
          />
          <TasksSection
            tasks={tasks}
            onAdd={t => updateTasks([...tasks, t])}
            onRemove={i => updateTasks(tasks.filter((_, idx) => idx !== i))}
            onUpdate={(i, t) => updateTasks(tasks.map((x, idx) => idx === i ? t : x))}
          />
          <EisenhowerMatrix matrix={matrix} onUpdate={updateMatrix} />
        </div>

        {/* ── RIGHT ── */}
        <div className="sp-right">
          <TodayTimeline timeline={timeline} onUpdate={updateTimeline} />
          <div className="sp-important-box">
            <div className="sp-section-title">Important</div>
            <textarea
              className="sp-important-area"
              value={importantDraft}
              onChange={e => handleImportantChange(e.target.value)}
              placeholder="Important notes..."
            />
          </div>
          <GroceriesSection
            items={groceries}
            onAdd={g => updateGroceries([...groceries, g])}
            onToggle={i => updateGroceries(groceries.map((g, idx) => idx === i ? { ...g, done: !g.done } : g))}
            onRemove={i => updateGroceries(groceries.filter((_, idx) => idx !== i))}
          />
        </div>
      </div>
    </div>
  );
}
