import React, { useState, useEffect } from "react";
import { signInWithGoogle, signOutUser, fsLoad, fsSave, STRATEGIES_DOC } from "./cloud.js";

// "我的" page: Google profile + cloud-saved strategies. Optional — the app
// works fully without logging in.
export default function AccountPanel({ user, onLoadStrategy }) {
  const [strats, setStrats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setStrats([]);
      return;
    }
    setLoading(true);
    fsLoad(user.uid, STRATEGIES_DOC).then((s) => {
      setStrats(Array.isArray(s) ? s : []);
      setLoading(false);
    });
  }, [user]);

  function del(i) {
    const next = strats.filter((_, j) => j !== i);
    setStrats(next);
    fsSave(user.uid, STRATEGIES_DOC, next);
  }

  if (!user) {
    return (
      <div className="acct-guest">
        <div className="acct-guest-icon">👤</div>
        <h3 className="acct-guest-title">登入後可以…</h3>
        <ul className="acct-guest-list">
          <li>☁️ 設定（主題 / 選股池 / 因子權重 / 選的指標）跨裝置同步</li>
          <li>💾 把調好的因子策略存起來，一鍵載入</li>
          <li>📌 你的 watchlist 跟著帳號走</li>
        </ul>
        <button className="acct-google" onClick={signInWithGoogle}>
          <span className="acct-g">G</span> 用 Google 登入
        </button>
        <p className="acct-note">不登入也能用（demo 或自己的 key）—— 登入只是加值，不會少任何功能。</p>
      </div>
    );
  }

  return (
    <div className="acct">
      <div className="acct-head">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="acct-avatar" referrerPolicy="no-referrer" />
        ) : (
          <div className="acct-avatar ph">{(user.displayName || "U")[0]}</div>
        )}
        <div className="acct-id">
          <div className="acct-name">{user.displayName || "User"}</div>
          <div className="acct-email">{user.email}</div>
        </div>
        <button className="acct-signout" onClick={signOutUser}>登出</button>
      </div>

      <div className="acct-sync">☁️ 你的設定已雲端同步（主題、選股池、因子權重、選的指標、流派…）</div>

      <div className="acct-strats">
        <div className="acct-strats-head">我的策略{strats.length > 0 ? `（${strats.length}）` : ""}</div>
        {loading ? (
          <div className="acct-empty">載入中…</div>
        ) : strats.length === 0 ? (
          <div className="acct-empty">還沒有存策略。去「策略評分」調好因子權重，按「💾 存成我的策略」。</div>
        ) : (
          <div className="acct-strat-list">
            {strats.map((s, i) => (
              <div key={i} className="acct-strat">
                <div className="acct-strat-info">
                  <div className="acct-strat-name">{s.name}</div>
                  <div className="acct-strat-meta">
                    {(s.universe || "").split(/[\s,]+/).filter(Boolean).length} 檔 · 前 {s.topN} 名 · {s.years}
                  </div>
                </div>
                <button className="acct-load" onClick={() => onLoadStrategy(s)}>載入</button>
                <button className="acct-del" onClick={() => del(i)}>刪</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
