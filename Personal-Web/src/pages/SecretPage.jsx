import { useState, useEffect, useRef, useCallback } from "react";
import { encrypt, decrypt } from "./secretUtils.js";
import "./SecretPage.css";

const VALID_USERNAME = "chianghebe";
const VALID_PASSWORD = "Hebe0722";
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const CARD_COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#059669", "#d97706", "#0891b2"];
const CIRCLED = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"];

const DEFAULT_CATS = [
  { id: "exam",     label: "Exam",     color: "#ef4444" },
  { id: "meal",     label: "Dining",   color: "#f97316" },
  { id: "work",     label: "Work",     color: "#3b82f6" },
  { id: "personal", label: "Personal", color: "#a855f7" },
  { id: "exercise", label: "Exercise", color: "#22c55e" },
  { id: "deadline", label: "Deadline", color: "#e11d48" },
  { id: "other",    label: "Other",    color: "#64748b" },
];
function catColor(id, cats) { return (cats || DEFAULT_CATS).find(c => c.id === id)?.color ?? "#64748b"; }
function catLabel(id, cats) { return (cats || DEFAULT_CATS).find(c => c.id === id)?.label ?? id; }

function CategoryPicker({ value, onChange, categories, onAddCategory }) {
  const cats = categories || DEFAULT_CATS;
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  function addCat() {
    if (!newLabel.trim()) return;
    const id = "custom_" + Date.now();
    onAddCategory?.({ id, label: newLabel.trim(), color: newColor });
    onChange(id);
    setShowAdd(false); setNewLabel(""); setNewColor("#3b82f6");
  }

  return (
    <div className="sp-cat-picker">
      {cats.map(c => (
        <button key={c.id}
          className={`sp-cat-chip${value === c.id ? " active" : ""}`}
          style={{ "--cat": c.color }}
          onClick={() => onChange(c.id)}
          type="button"
        >{c.label}</button>
      ))}
      {showAdd ? (
        <div className="sp-cat-add-inline">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="sp-cat-color-swatch" />
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCat()} placeholder="Label name"
            className="sp-cat-label-inp" autoFocus />
          <button onClick={addCat} type="button" className="sp-cat-add-ok">✓</button>
          <button onClick={() => setShowAdd(false)} type="button" className="sp-del">✕</button>
        </div>
      ) : (
        <button className="sp-cat-chip" style={{ "--cat": "#64748b" }} onClick={() => setShowAdd(true)} type="button">+ New</button>
      )}
    </div>
  );
}

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

// ── Time Picker (10-min steps) ────────────────────────────────
function TimePicker({ value, onChange, className }) {
  const parts = (value || "").split(":");
  const hVal = parts[0] || "";
  const mVal = parts[1] ? parts[1].slice(0, 2) : "";

  function update(newH, newM) {
    if (!newH || !newM) { onChange(""); return; }
    onChange(`${newH}:${newM}`);
  }

  return (
    <div className="sp-time-picker">
      <select value={hVal} onChange={e => update(e.target.value, mVal)} className={className}>
        <option value="">HH</option>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="sp-time-colon">:</span>
      <select value={mVal} onChange={e => update(hVal, e.target.value)} className={className}>
        <option value="">MM</option>
        {["00","10","20","30","40","50"].map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

// ── Event Modal ───────────────────────────────────────────────
function EventModal({ initial = {}, onSave, onClose, categories, onAddCategory }) {
  const [title,       setTitle]       = useState(initial.title       || "");
  const [date,        setDate]        = useState(initial.date        || "");
  const [time,        setTime]        = useState(initial.time        || "");
  const [category,    setCategory]    = useState(initial.category    || "other");
  const [location,    setLocation]    = useState(initial.location    || "");
  const [notes,       setNotes]       = useState(initial.notes       || "");
  const [pinDeadline, setPinDeadline] = useState(initial.pinDeadline !== false);

  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    if (!title.trim()) return;
    onSave({ id: initial.id || Date.now().toString(), title: title.trim(), date, time, category, location, notes, pinDeadline });
    onClose();
  }

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={e => e.stopPropagation()}>
        <div className="sp-modal-header">
          <span className="sp-modal-hd">{initial.id ? "Edit Event" : "New Event"}</span>
          <button onClick={onClose} className="sp-modal-close">✕</button>
        </div>
        <div className="sp-modal-body">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="Event title..." className="sp-modal-main-input" />
          <div className="sp-modal-label">Category</div>
          <CategoryPicker value={category} onChange={setCategory} categories={categories} onAddCategory={onAddCategory} />
          <div className="sp-modal-row2">
            <div className="sp-modal-field">
              <div className="sp-modal-label">Date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="sp-modal-input" />
            </div>
            <div className="sp-modal-field">
              <div className="sp-modal-label">Time</div>
              <TimePicker value={time} onChange={setTime} className="sp-modal-input" />
            </div>
          </div>
          <div className="sp-modal-field">
            <div className="sp-modal-label">Location</div>
            <input value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Add location..." className="sp-modal-input" />
          </div>
          <div className="sp-modal-field">
            <div className="sp-modal-label">Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes..." className="sp-modal-textarea" />
          </div>
          <label className="sp-pin-toggle">
            <input type="checkbox" checked={pinDeadline} onChange={e => setPinDeadline(e.target.checked)} />
            <span>Show in Deadlines</span>
          </label>
        </div>
        <div className="sp-modal-footer">
          <button onClick={onClose} className="sp-modal-cancel">Cancel</button>
          <button onClick={save} className="sp-modal-save">Save Event</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared event helpers ──────────────────────────────────────
function daysLeft(dateStr) {
  if (!dateStr || dateStr === "TBD") return null;
  let d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    d = new Date(dateStr + "T00:00:00");
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    const now = new Date();
    if (parts.length === 3) { d = new Date(+parts[0], +parts[1]-1, +parts[2]); }
    else {
      d = new Date(now.getFullYear(), +parts[0]-1, +parts[1]);
      if (d < now && now-d > 86400000) d.setFullYear(now.getFullYear()+1);
    }
  } else { return null; }
  const today = new Date(); today.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}
function dlBadgeStyle(days) {
  if (days === null) return { bg: "var(--bg3)",              color: "var(--muted)" };
  if (days < 0)      return { bg: "rgba(248,113,113,0.15)",  color: "var(--red)"   };
  if (days <= 3)     return { bg: "rgba(249,115,22,0.15)",   color: "#f97316"      };
  if (days <= 7)     return { bg: "rgba(234,179,8,0.15)",    color: "#eab308"      };
  return                    { bg: "rgba(52,211,153,0.12)",   color: "var(--green)" };
}
function dlBadgeLabel(days) {
  if (days === null) return "TBD";
  if (days < 0)  return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

// ── Deadlines ─────────────────────────────────────────────────
function DeadlinesSection({ events, onAdd, onEdit, onRemove, categories }) {
  const [modal, setModal] = useState(null);

  const list = events.filter(e => !e.deleted && e.pinDeadline !== false);
  const sorted = [...list].sort((a, b) => {
    const da = daysLeft(a.date), db = daysLeft(b.date);
    if (da === null && db === null) return 0;
    if (da === null) return 1; if (db === null) return -1;
    return da - db;
  });

  return (
    <div className="sp-deadlines">
      <div className="sp-section-title">Deadlines</div>
      <div className="sp-dl-list">
        {sorted.length === 0 && <div className="sp-dl-empty">No events yet</div>}
        {sorted.map(d => {
          const days = daysLeft(d.date);
          const { bg, color } = dlBadgeStyle(days);
          const displayDate = /^\d{4}-\d{2}-\d{2}$/.test(d.date)
            ? d.date.slice(5).replace("-", "/") : d.date;
          return (
            <div key={d.id} className="sp-dl-item sp-dl-item-click" onClick={() => setModal(d)}>
              <span className="sp-dl-badge" style={{ background: bg, color }}>{dlBadgeLabel(days)}</span>
              <span className="sp-cat-dot" style={{ background: catColor(d.category, categories) }}
                title={catLabel(d.category, categories)} />
              <span className="sp-dl-name">{d.title}</span>
              {d.time && <span className="sp-dl-time">{d.time.slice(0,5)}</span>}
              <span className="sp-dl-datestr">{displayDate}</span>
              <button onClick={e => { e.stopPropagation(); onRemove(d.id); }} className="sp-del">✕</button>
            </div>
          );
        })}
      </div>
      {modal && (
        <EventModal initial={modal} categories={categories}
          onSave={e => { modal.id ? onEdit(e) : onAdd(e); setModal(null); }}
          onClose={() => setModal(null)} />
      )}
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
  const [editMode, setEditMode]     = useState(false);
  const [editForm, setEditForm]     = useState({ title: "", deadline: "", details: "" });
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
    setEditMode(false);
  }

  function startEdit(item) {
    setEditForm({ title: item.title, deadline: item.deadline || "", details: item.details || "" });
    setEditMode(true);
  }

  function saveEdit(id) {
    if (!editForm.title.trim()) return;
    const next = localItemsRef.current.map(i =>
      i.id === id ? { ...i, title: editForm.title.trim(), deadline: editForm.deadline, details: editForm.details } : i
    );
    localItemsRef.current = next;
    setLocalItems(next);
    onUpdate(next);
    setEditMode(false);
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

      {/* View / Edit Card */}
      {viewItem && (() => {
        const q = getQuadrantInfo(viewItem.x, viewItem.y);
        return (
          <div className="em-overlay" onClick={() => { setViewCard(null); setEditMode(false); }}>
            <div className="em-modal" onClick={e => e.stopPropagation()}>
              <div className="em-modal-header">
                <div>
                  <span className="em-modal-quad" style={{ color: q.color }}>{q.label} · {q.sub}</span>
                  {!editMode && <h3>{viewItem.title}</h3>}
                </div>
                <button className="em-close" onClick={() => { setViewCard(null); setEditMode(false); }}>✕</button>
              </div>

              {editMode ? (
                <>
                  <div className="em-modal-field">
                    <label>Title</label>
                    <input autoFocus value={editForm.title}
                      onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && saveEdit(viewItem.id)} />
                  </div>
                  <div className="em-modal-field">
                    <label>Deadline</label>
                    <input value={editForm.deadline}
                      onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))}
                      placeholder="e.g. 2025/06/01" />
                  </div>
                  <div className="em-modal-field">
                    <label>Details</label>
                    <textarea value={editForm.details}
                      onChange={e => setEditForm(p => ({ ...p, details: e.target.value }))}
                      rows={3} placeholder="Notes, subtasks..." />
                  </div>
                  <div className="em-modal-actions">
                    <button className="em-btn-delete" onClick={() => deleteItem(viewItem.id)}>Delete</button>
                    <button className="em-btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
                    <button className="em-btn-add" onClick={() => saveEdit(viewItem.id)}>Save</button>
                  </div>
                </>
              ) : (
                <>
                  {viewItem.deadline && (
                    <div className="em-card-row"><span className="em-card-key">Deadline</span><span>{viewItem.deadline}</span></div>
                  )}
                  {viewItem.details && (
                    <div className="em-card-row"><span className="em-card-key">Details</span><span style={{ whiteSpace:"pre-wrap" }}>{viewItem.details}</span></div>
                  )}
                  <div className="em-modal-actions">
                    <button className="em-btn-delete" onClick={() => deleteItem(viewItem.id)}>Delete</button>
                    <button className="em-btn-cancel" onClick={() => { setViewCard(null); setEditMode(false); }}>Close</button>
                    <button className="em-btn-add" onClick={() => startEdit(viewItem)}>Edit</button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Today Timeline ────────────────────────────────────────────
function dateKey(d) { return d.toISOString().slice(0, 10); }

function normToISO(dateStr) {
  if (!dateStr || dateStr === "TBD") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3)
      return `${parts[0]}-${String(parts[1]).padStart(2,"0")}-${String(parts[2]).padStart(2,"0")}`;
    const now = new Date();
    let d = new Date(now.getFullYear(), +parts[0]-1, +parts[1]);
    if (d < now && now-d > 86400000) d = new Date(now.getFullYear()+1, +parts[0]-1, +parts[1]);
    return dateKey(d);
  }
  return null;
}

function TodayTimeline({ events, onAdd, onEdit, onRemove }) {
  const [offset, setOffset] = useState(0);
  const [modal,  setModal]  = useState(null);

  const today = new Date();
  const selected = new Date(today);
  selected.setDate(today.getDate() + offset);
  const selKey = dateKey(selected);
  const currentHour = offset === 0 ? today.getHours() : -1;

  function eventsAtHour(h) {
    const hStr = String(h).padStart(2, "0");
    return events.filter(e => !e.deleted && e.date === selKey && e.time && e.time.startsWith(hStr + ":"));
  }

  const dayLabel = offset === 0 ? "Today" : offset === -1 ? "Yesterday" : offset === 1 ? "Tomorrow"
    : selected.toLocaleDateString("en-US", { weekday: "short" });
  const dateLabel = selected.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="sp-timeline">
      <div className="sp-tl-header">
        <div className="sp-section-title">{dayLabel} <span className="sp-tl-sub">timeline</span></div>
        <div className="sp-tl-nav">
          <button className="sp-tl-nav-btn" onClick={() => setOffset(o => o-1)} disabled={offset <= -3}>‹</button>
          <span className="sp-tl-date">{dateLabel}</span>
          <button className="sp-tl-nav-btn" onClick={() => setOffset(o => o+1)} disabled={offset >= 7}>›</button>
        </div>
      </div>
      {HOURS.map(h => {
        const hourEvs = eventsAtHour(h);
        const isNow   = h === currentHour;
        return (
          <div key={h} className={`sp-tl-row${isNow ? " sp-tl-now" : ""}`}>
            <span className="sp-tl-hour">{h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h-12}pm`}</span>
            <div className="sp-tl-line" />
            <div className="sp-tl-events">
              {hourEvs.map(e => (
                <span key={e.id} className="sp-tl-chip"
                  style={{ background: catColor(e.category)+"22", borderColor: catColor(e.category), color: catColor(e.category) }}
                  onClick={() => setModal(e)} title="Edit event">
                  {e.time && <span style={{fontSize:10,opacity:0.7,marginRight:3}}>{e.time.slice(0,5)}</span>}{e.title}
                  <button onClick={ev => { ev.stopPropagation(); onRemove(e.id); }} className="sp-tl-chip-del">×</button>
                </span>
              ))}
            </div>
          </div>
        );
      })}
      {modal && (
        <EventModal initial={modal}
          onSave={e => { modal.id ? onEdit(e) : onAdd(e); setModal(null); }}
          onClose={() => setModal(null)} />
      )}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────
const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function CalendarSection({ events, onAdd, onEdit, onRemove }) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selected,  setSelected]  = useState(null);
  const [modal,     setModal]     = useState(null);

  const todayISO = dateKey(now);

  function eventsForDate(iso) {
    return events.filter(e => !e.deleted && (normToISO(e.date) === iso || e.date === iso))
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); }
    else setViewMonth(m => m-1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); }
    else setViewMonth(m => m+1);
  }

  const firstDow  = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth+1, 0).getDate();
  const selEvs    = selected ? eventsForDate(selected) : [];

  function fmtDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="sp-calendar">
      <div className="sp-cal-header">
        <div className="sp-section-title">Calendar</div>
        <div className="sp-tl-nav">
          <button className="sp-tl-nav-btn" onClick={prevMonth}>‹</button>
          <span className="sp-cal-month-label">{CAL_MONTHS[viewMonth]} {viewYear}</span>
          <button className="sp-tl-nav-btn" onClick={nextMonth}>›</button>
        </div>
      </div>

      <div className="sp-cal-grid">
        {CAL_DAYS.map(d => <div key={d} className="sp-cal-dow">{d}</div>)}
        {Array(firstDow).fill(null).map((_, i) => <div key={"e"+i} />)}
        {Array.from({ length: totalDays }, (_, i) => i+1).map(day => {
          const iso = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const evs = eventsForDate(iso);
          const isToday = iso === todayISO;
          const isSel   = iso === selected;
          const cats    = [...new Set(evs.map(e => e.category))];
          return (
            <div key={iso}
              className={`sp-cal-day${isToday ? " sp-cal-today" : ""}${isSel ? " sp-cal-sel" : ""}`}
              onClick={() => setSelected(isSel ? null : iso)}>
              <span className="sp-cal-num">{day}</span>
              <div className="sp-cal-dots">
                {cats.slice(0, 3).map(c => (
                  <span key={c} className="sp-cal-dot" style={{ background: catColor(c) }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="sp-cal-panel">
          <div className="sp-cal-panel-header">
            <div className="sp-cal-panel-date">{fmtDate(selected)}</div>
            <button className="sp-cal-panel-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="sp-cal-ev-list">
            {selEvs.length === 0 && <div className="sp-dl-empty">No events</div>}
            {selEvs.map(e => (
              <div key={e.id} className="sp-cal-ev sp-cal-ev-click" onClick={() => setModal(e)}>
                <span className="sp-cal-ev-tag" style={{ background: catColor(e.category)+"22", color: catColor(e.category) }}>
                  {catLabel(e.category)}
                </span>
                {e.time && <span className="sp-cal-ev-time">{e.time}</span>}
                <span className="sp-cal-ev-title">{e.title}</span>
                <button onClick={ev => { ev.stopPropagation(); onRemove(e.id); }} className="sp-del">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {modal && (
        <EventModal initial={modal}
          onSave={e => { modal.id ? onEdit(e) : onAdd(e); setModal(null); }}
          onClose={() => setModal(null)} />
      )}
    </div>
  );
}

// ── Task Lists (replaces Groceries) ───────────────────────────
function TaskListItem({ item, onToggle, onRemove }) {
  return (
    <div className={`sp-grocery-item${item.done ? " done" : ""}`}>
      <input type="checkbox" checked={item.done} onChange={onToggle} />
      <span>{item.text}</span>
      <button onClick={onRemove} className="sp-del">✕</button>
    </div>
  );
}

function TaskList({ list, isOpen, onToggleOpen, onDelete, onAddItem, onToggleItem, onRemoveItem }) {
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    onAddItem(input.trim());
    setInput("");
  }

  const done  = list.items.filter(i => i.done).length;
  const total = list.items.length;

  return (
    <div className="sp-tl-list">
      <div className="sp-tl-list-header" onClick={onToggleOpen}>
        <span className="sp-tl-list-caret">{isOpen ? "▲" : "▼"}</span>
        <span className="sp-tl-list-name">{list.name}</span>
        {total > 0 && <span className="sp-tl-list-count">{done}/{total}</span>}
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="sp-del" style={{marginLeft:"auto"}}>✕</button>
      </div>
      {isOpen && (
        <div className="sp-tl-list-body">
          {list.items.map(item => (
            <TaskListItem key={item.id} item={item}
              onToggle={() => onToggleItem(item.id)}
              onRemove={() => onRemoveItem(item.id)} />
          ))}
          <div className="sp-grocery-add">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()} placeholder="Add item..." />
            <button onClick={add}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskListsSection({ taskLists, onUpdate }) {
  const [newName, setNewName] = useState("");
  const [open, setOpen]       = useState({});

  function isOpen(id) { return open[id] !== false; } // default open

  function addList() {
    if (!newName.trim()) return;
    const id = Date.now().toString();
    onUpdate([...taskLists, { id, name: newName.trim(), items: [] }]);
    setOpen(o => ({ ...o, [id]: true }));
    setNewName("");
  }

  function deleteList(id) {
    onUpdate(taskLists.filter(l => l.id !== id));
  }

  function addItem(listId, text) {
    onUpdate(taskLists.map(l => l.id === listId
      ? { ...l, items: [...l.items, { id: Date.now().toString(), text, done: false }] }
      : l
    ));
  }

  function toggleItem(listId, itemId) {
    onUpdate(taskLists.map(l => l.id === listId
      ? { ...l, items: l.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it) }
      : l
    ));
  }

  function removeItem(listId, itemId) {
    onUpdate(taskLists.map(l => l.id === listId
      ? { ...l, items: l.items.filter(it => it.id !== itemId) }
      : l
    ));
  }

  return (
    <div className="sp-tasklists">
      <div className="sp-section-title">Task Lists</div>
      {taskLists.map(list => (
        <TaskList key={list.id} list={list} isOpen={isOpen(list.id)}
          onToggleOpen={() => setOpen(o => ({ ...o, [list.id]: !isOpen(list.id) }))}
          onDelete={() => deleteList(list.id)}
          onAddItem={text => addItem(list.id, text)}
          onToggleItem={itemId => toggleItem(list.id, itemId)}
          onRemoveItem={itemId => removeItem(list.id, itemId)}
        />
      ))}
      <div className="sp-tl-add-list">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addList()} placeholder="+ New list..." className="sp-tl-add-input" />
        <button onClick={addList} className="sp-tl-add-btn">+</button>
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

  const [links,      setLinks]      = useState([]);
  const [events,     setEvents]     = useState([]);  // unified events
  const [matrix,     setMatrix]     = useState([]);
  const [taskLists,  setTaskLists]  = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [globalModal,setGlobalModal]= useState(false);

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
    if (!loggedIn) return;
    // Try plain JSON first; if it fails (old encrypted format), migrate once
    const tryLoad = async (key, def) => {
      const raw = localStorage.getItem(key);
      if (!raw) return def;
      try {
        return JSON.parse(raw);
      } catch {
        // Old encrypted format – decrypt once and re-save as plain JSON
        if (!currentPassword) return def;
        const text = await decrypt(raw, currentPassword);
        if (text == null) return def;
        try {
          const val = JSON.parse(text);
          localStorage.setItem(key, JSON.stringify(val)); // migrate
          return val;
        } catch { return def; }
      }
    };
    (async () => {
      setLinks(await tryLoad("yc2_links", []));
      const rawMatrix = await tryLoad("yc2_matrix", []);
      setMatrix(Array.isArray(rawMatrix) ? rawMatrix : []);

      // Load unified events (migrate old formats if present)
      let unified = await tryLoad("yc2_events", null);
      if (!unified) {
        unified = [];
        // Migrate old deadlines
        const oldDL = await tryLoad("yc2_deadlines", []);
        oldDL.forEach(d => unified.push({ id: d.id || Date.now().toString() + Math.random(), title: d.title, date: normToISO(d.date) || d.date, category: "deadline" }));
        // Migrate old timeline
        const oldTL = await tryLoad("yc2_timeline", {});
        const tlObj = (typeof Object.values(oldTL)[0] === "string") ? { [dateKey(new Date())]: oldTL } : oldTL;
        Object.entries(tlObj).forEach(([date, hours]) => {
          Object.entries(hours).forEach(([h, txt]) => {
            if (txt) unified.push({ id: Date.now().toString()+Math.random(), title: txt, date, time: `${String(h).padStart(2,"0")}:00`, category: "other" });
          });
        });
        // Migrate old cal events
        const oldCal = await tryLoad("yc2_cal_events", []);
        oldCal.forEach(e => unified.push({ id: e.id, title: e.title, date: e.date, time: e.time||"", category: e.category||"other" }));
      }
      setEvents(unified);
      setTaskLists(await tryLoad("yc2_tasklists", []));
      setCategories(await tryLoad("yc2_categories", DEFAULT_CATS));
    })();
  }, [loggedIn, currentPassword]);

  // Synchronous plain-JSON save – no async, no timing issues
  const save = useCallback((key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

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
    setEvents([]); setMatrix([]); setTaskLists([]); setCategories(DEFAULT_CATS);
  }

  const updateLinks     = v => { setLinks(v);      save("yc2_links", v); };
  const updateEvents    = v => { setEvents(v);     save("yc2_events", v); };
  const handleAddEvent  = e => updateEvents([...events, e]);
  const handleEditEvent = e => updateEvents(events.map(x => x.id === e.id ? e : x));
  const handleDelEvent  = id => updateEvents(events.filter(e => e.id !== id));
  const updateMatrix    = v => { setMatrix(v);     save("yc2_matrix", v); };
  const updateTaskLists = v => { setTaskLists(v);  save("yc2_tasklists", v); };
  const handleAddCategory = cat => {
    const next = [...categories, cat];
    setCategories(next);
    save("yc2_categories", next);
  };

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
          <button className="sp-new-ev-btn" onClick={() => setGlobalModal(true)}>＋ Event</button>
          <span className="sp-username">{currentUser}</span>
          <button className="sp-logout-btn" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
      {globalModal && (
        <EventModal initial={{ date: dateKey(new Date()) }}
          categories={categories} onAddCategory={handleAddCategory}
          onSave={e => { handleAddEvent(e); setGlobalModal(false); }}
          onClose={() => setGlobalModal(false)} />
      )}

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
          <TaskListsSection taskLists={taskLists} onUpdate={updateTaskLists} />
        </div>

        {/* ── MIDDLE ── */}
        <div className="sp-middle">
          <DeadlinesSection
            events={events} categories={categories}
            onAdd={handleAddEvent} onEdit={handleEditEvent} onRemove={handleDelEvent}
          />
          <EisenhowerMatrix matrix={matrix} onUpdate={updateMatrix} />
        </div>

        {/* ── RIGHT ── */}
        <div className="sp-right">
          <TodayTimeline
            events={events}
            onAdd={handleAddEvent} onEdit={handleEditEvent} onRemove={handleDelEvent}
          />
          <CalendarSection
            events={events}
            onAdd={handleAddEvent} onEdit={handleEditEvent} onRemove={handleDelEvent}
          />
        </div>
      </div>
    </div>
  );
}
