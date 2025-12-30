import React from "react";

export default function CardGrid({ items, onClick }) {
  return (
    <div className="grid">
      {items.map((it) => (
        <button
          key={it.id}
          className="mini-card"
          onClick={() => onClick(it)}
          type="button"
        >
          <div className="mini-card-title">{it.title}</div>
          <div className="mini-card-brief">{it.brief}</div>
          <div className="mini-card-cta">↳</div>
        </button>
      ))}
    </div>
  );
}
