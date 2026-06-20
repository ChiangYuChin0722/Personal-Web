import React, { useState } from "react";

// A card section with a clickable header that collapses its body.
export default function Collapsible({ title, sub, defaultOpen = true, variant = "", children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`collap ${variant}`}>
      <button type="button" className="collap-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`collap-chev ${open ? "open" : ""}`}>▸</span>
        <span className="collap-title">{title}</span>
        {sub && <span className="collap-sub">{sub}</span>}
      </button>
      {open && <div className="collap-body">{children}</div>}
    </section>
  );
}
