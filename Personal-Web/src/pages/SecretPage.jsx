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
function QuickLinks({ links, onAdd, onRemove }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function add() {
    if (!url.trim()) return;
    const fullUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    onAdd({ id: Date.now().toString(), label: label.trim() || fullUrl, url: fullUrl });
    setLabel(""); setUrl("");
  }

  return (
    <div className="sp-box">
      <div className="sp-box-title">URL</div>
      <div className="sp-link-list">
        {links.map((l, i) => (
          <div key={l.id || i} className="sp-link-item">
            <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
            <button onClick={() => onRemove(i)} className="sp-del">✕</button>
          </div>
        ))}
      </div>
      <div className="sp-link-inputs">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" />
        <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="URL" />
        <button onClick={add}>+</button>
      </div>
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
function DeadlinesSection({ deadlines, onAdd, onRemove }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  function add() {
    if (!title.trim()) return;
    const color = CARD_COLORS[deadlines.length % CARD_COLORS.length];
    onAdd({ id: Date.now().toString(), title: title.trim(), date: date || "TBD", color });
    setTitle(""); setDate("");
  }

  return (
    <div className="sp-deadlines">
      <div className="sp-section-title">Dead Line</div>
      <div className="sp-deadline-row">
        {deadlines.map((d, i) => (
          <div key={d.id || i} className="sp-deadline-card" style={{ "--card-color": d.color }}>
            <button onClick={() => onRemove(i)} className="sp-card-del">✕</button>
            <div className="sp-deadline-date">{d.date}</div>
            <div className="sp-deadline-title">{d.title}</div>
          </div>
        ))}
        <div className="sp-deadline-new">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Task name..." className="sp-dl-title-input" />
          <input value={date} onChange={e => setDate(e.target.value)} placeholder="MM/DD" className="sp-dl-date-input" />
          <button onClick={add} className="sp-add-btn">+</button>
        </div>
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
        <span>任務欄</span><span>標籤</span><span>進度條</span><span></span>
      </div>
      {tasks.map((t, i) => (
        <div key={t.id || i} className={`sp-task-row${t.urgent ? " sp-urgent" : ""}`}>
          <div className="sp-task-name">
            <span className="sp-task-num">{CIRCLED[i] || `${i + 1}`}</span>
            <span>{t.name}</span>
            {t.urgent && <span className="sp-urgent-tag">urgent</span>}
          </div>
          <div className="sp-task-tags">{t.tags}</div>
          <div className="sp-task-prog">
            <div className="sp-prog-bar">
              <div className="sp-prog-fill" style={{ width: `${t.progress}%` }} />
            </div>
            <span className="sp-prog-pct">{t.progress}%</span>
            <input
              type="range" min="0" max="100" value={t.progress}
              onChange={e => onUpdate(i, { ...t, progress: +e.target.value })}
              className="sp-prog-slider"
            />
          </div>
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

// ── Today Timeline ────────────────────────────────────────────
function TodayTimeline({ timeline, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  const currentHour = new Date().getHours();

  function startEdit(h) { setEditing(h); setVal(timeline[h] || ""); }
  function save() {
    if (editing == null) return;
    onUpdate({ ...timeline, [editing]: val });
    setEditing(null);
  }

  return (
    <div className="sp-timeline">
      <div className="sp-section-title">Today <span className="sp-tl-sub">timeline</span></div>
      {HOURS.map(h => (
        <div key={h} className={`sp-tl-row${h === currentHour ? " sp-tl-now" : ""}`} onClick={() => startEdit(h)}>
          <span className="sp-tl-hour">{h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}</span>
          <div className="sp-tl-line" />
          {editing === h ? (
            <input
              autoFocus className="sp-tl-input"
              value={val} onChange={e => setVal(e.target.value)}
              onBlur={save} onKeyDown={e => e.key === "Enter" && save()}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="sp-tl-event">{timeline[h]}</span>
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
  const [music, setMusic] = useState([]);
  const [funThings, setFunThings] = useState([]);
  const [friends, setFriends] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [tasks, setTasks] = useState([]);
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
      setMusic(await load("yc2_music", []));
      setFunThings(await load("yc2_fun", []));
      setFriends(await load("yc2_friends", []));
      setDeadlines(await load("yc2_deadlines", []));
      setTasks(await load("yc2_tasks", []));
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
    setLinks([]); setMusic([]); setFunThings([]); setFriends([]);
    setDeadlines([]); setTasks([]); setTimeline({});
    setImportantDraft(""); setGroceries([]);
  }

  const updateLinks    = v => { setLinks(v);     save("yc2_links", v); };
  const updateMusic    = v => { setMusic(v);     save("yc2_music", v); };
  const updateFun      = v => { setFunThings(v); save("yc2_fun", v); };
  const updateFriends  = v => { setFriends(v);   save("yc2_friends", v); };
  const updateDeadlines= v => { setDeadlines(v); save("yc2_deadlines", v); };
  const updateTasks    = v => { setTasks(v);     save("yc2_tasks", v); };
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
          <PillSection icon="🎵" label="Music Playlist" items={music}
            onAdd={t => updateMusic([...music, t])}
            onRemove={i => updateMusic(music.filter((_, idx) => idx !== i))}
            placeholder="Add track..." />
          <PillSection icon="🎉" label="Fun Things" items={funThings}
            onAdd={t => updateFun([...funThings, t])}
            onRemove={i => updateFun(funThings.filter((_, idx) => idx !== i))}
            placeholder="Add fun thing..." />
          <PillSection icon="👥" label="Friends" items={friends}
            onAdd={t => updateFriends([...friends, t])}
            onRemove={i => updateFriends(friends.filter((_, idx) => idx !== i))}
            placeholder="Add friend..." />
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
