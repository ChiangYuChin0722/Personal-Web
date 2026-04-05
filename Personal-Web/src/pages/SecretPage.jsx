import { useState, useEffect, useRef } from "react";
import { encrypt, decrypt } from "./secretUtils.js";
import "./SecretPage.css";

const VALID_USERNAME = "chianghebe";
const VALID_PASSWORD = "Hebe0722";

export default function SecretPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);

  const [notes, setNotes] = useState("");
  const [noteStatus, setNoteStatus] = useState("Auto-saved");

  const [vault, setVault] = useState("");
  const [vaultStatus, setVaultStatus] = useState("Encrypted & auto-saved");

  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState("");

  const [todos, setTodos] = useState([]);
  const [todoInput, setTodoInput] = useState("");

  const noteTimer = useRef(null);
  const vaultTimer = useRef(null);

  // Check existing session on mount
  useEffect(() => {
    const auth = sessionStorage.getItem("yc_auth");
    const user = sessionStorage.getItem("yc_user");
    const pass = sessionStorage.getItem("yc_pass");
    if (auth === "authenticated" && user && pass) {
      setCurrentPassword(pass);
      setCurrentUser(user);
      setLoggedIn(true);
    }
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (!loggedIn || !currentPassword) return;

    (async () => {
      const rawNotes = localStorage.getItem("yc_notes");
      if (rawNotes) {
        const text = await decrypt(rawNotes, currentPassword);
        if (text !== null) setNotes(text);
      }

      const rawVault = localStorage.getItem("yc_vault");
      if (rawVault) {
        const text = await decrypt(rawVault, currentPassword);
        if (text !== null) setVault(text);
      }

      const rawLinks = localStorage.getItem("yc_links");
      if (rawLinks) {
        const text = await decrypt(rawLinks, currentPassword);
        if (text) setLinks(JSON.parse(text));
      }

      const rawTodos = localStorage.getItem("yc_todos");
      if (rawTodos) {
        const text = await decrypt(rawTodos, currentPassword);
        if (text) setTodos(JSON.parse(text));
      }
    })();
  }, [loggedIn, currentPassword]);

  async function handleLogin() {
    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      setLoginError(true);
      return;
    }
    setLoginError(false);
    setCurrentPassword(password);
    setCurrentUser(username);
    sessionStorage.setItem("yc_auth", "authenticated");
    sessionStorage.setItem("yc_user", username);
    sessionStorage.setItem("yc_pass", password);
    setLoggedIn(true);
  }

  function handleLogout() {
    sessionStorage.clear();
    setLoggedIn(false);
    setCurrentUser("");
    setCurrentPassword("");
    setPassword("");
    setNotes("");
    setVault("");
    setLinks([]);
    setTodos([]);
  }

  // Notes auto-save
  function handleNotesChange(value) {
    setNotes(value);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(async () => {
      const enc = await encrypt(value, currentPassword);
      localStorage.setItem("yc_notes", enc);
      setNoteStatus("Saved " + new Date().toLocaleTimeString());
    }, 500);
  }

  // Vault auto-save
  function handleVaultChange(value) {
    setVault(value);
    clearTimeout(vaultTimer.current);
    vaultTimer.current = setTimeout(async () => {
      const enc = await encrypt(value, currentPassword);
      localStorage.setItem("yc_vault", enc);
      setVaultStatus("Encrypted & saved " + new Date().toLocaleTimeString());
    }, 500);
  }

  // Links
  async function addLink() {
    const url = linkInput.trim();
    if (!url) return;
    const updated = [...links, url];
    setLinks(updated);
    setLinkInput("");
    const enc = await encrypt(JSON.stringify(updated), currentPassword);
    localStorage.setItem("yc_links", enc);
  }

  async function removeLink(i) {
    const updated = links.filter((_, idx) => idx !== i);
    setLinks(updated);
    const enc = await encrypt(JSON.stringify(updated), currentPassword);
    localStorage.setItem("yc_links", enc);
  }

  // Todos
  async function addTodo() {
    const text = todoInput.trim();
    if (!text) return;
    const updated = [...todos, { text, done: false }];
    setTodos(updated);
    setTodoInput("");
    const enc = await encrypt(JSON.stringify(updated), currentPassword);
    localStorage.setItem("yc_todos", enc);
  }

  async function toggleTodo(i) {
    const updated = todos.map((t, idx) => idx === i ? { ...t, done: !t.done } : t);
    setTodos(updated);
    const enc = await encrypt(JSON.stringify(updated), currentPassword);
    localStorage.setItem("yc_todos", enc);
  }

  async function removeTodo(i) {
    const updated = todos.filter((_, idx) => idx !== i);
    setTodos(updated);
    const enc = await encrypt(JSON.stringify(updated), currentPassword);
    localStorage.setItem("yc_todos", enc);
  }

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  if (!loggedIn) {
    return (
      <div className="secret-root">
        <div className="secret-center">
          <div className="login-box">
            <h1>Private Access</h1>
            <p>This area is restricted. Please sign in.</p>
            <div className="field">
              <label>USERNAME</label>
              <input
                type="text"
                placeholder="Enter username"
                autoComplete="off"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="field">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <button className="login-btn" onClick={handleLogin}>Sign In</button>
            {loginError && <div className="login-error">Incorrect username or password.</div>}
            <div className="login-footer"><a href="/">← Back to portfolio</a></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="secret-root">
      <div className="dash-topbar">
        <div className="dash-brand">YC<span>.</span> Private</div>
        <div className="dash-user">
          <span className="dash-user-name">{currentUser}</span>
          <button className="dash-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </div>

      <div className="dash-content">
        <div className="dash-greeting">Welcome back, {currentUser}</div>
        <div className="dash-subtitle">{dateStr}</div>

        {/* Stats */}
        <div className="dash-grid" style={{ marginBottom: "24px" }}>
          <div className="dash-card">
            <div className="stat-row">
              <div className="stat-box">
                <div className="stat-num">{notes.length > 0 ? "1" : "0"}</div>
                <div className="stat-label">Notes</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{links.length}</div>
                <div className="stat-label">Links</div>
              </div>
              <div className="stat-box">
                <div className="stat-num">{todos.length}</div>
                <div className="stat-label">Todos</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-grid">
          {/* Notes */}
          <div className="dash-card">
            <h3><span>📝</span> Quick Notes</h3>
            <textarea
              className="note-area"
              placeholder="Write anything here..."
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
            />
            <div className="note-status">{noteStatus}</div>
          </div>

          {/* Links */}
          <div className="dash-card">
            <h3><span>🔗</span> Saved Links</h3>
            <ul className="link-list">
              {links.map((l, i) => (
                <li key={i} className="link-item">
                  <a href={l} target="_blank" rel="noreferrer">{l}</a>
                  <button className="link-del" onClick={() => removeLink(i)}>✕</button>
                </li>
              ))}
            </ul>
            <div className="link-add-row">
              <input
                type="text"
                placeholder="Paste a URL..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addLink()}
              />
              <button className="link-add-btn" onClick={addLink}>+</button>
            </div>
          </div>

          {/* Todos */}
          <div className="dash-card">
            <h3><span>✅</span> To-Do</h3>
            <div className="todo-list">
              {todos.map((t, i) => (
                <div key={i} className={`todo-item${t.done ? " done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTodo(i)}
                  />
                  <span>{t.text}</span>
                  <button className="todo-del" onClick={() => removeTodo(i)}>✕</button>
                </div>
              ))}
            </div>
            <div className="todo-add-row">
              <input
                type="text"
                placeholder="Add a task..."
                value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTodo()}
              />
              <button className="todo-add-btn" onClick={addTodo}>+</button>
            </div>
          </div>

          {/* Vault */}
          <div className="dash-card">
            <h3><span>🔒</span> Encrypted Vault</h3>
            <textarea
              className="note-area"
              placeholder="Store sensitive info here... (encrypted with your password)"
              value={vault}
              onChange={e => handleVaultChange(e.target.value)}
            />
            <div className="note-status">{vaultStatus}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
