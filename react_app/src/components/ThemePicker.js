import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const SWATCHES = {
  light: "#3b82f6",
  dark:  "#60a5fa",
};

export default function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = themes.find(t => t.id === theme);

  return (
    <div className="theme-picker-wrap" ref={ref}>
      <button
        className="theme-picker-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Change theme"
        aria-expanded={open}
      >
        <span>{current?.icon}</span>
        <span>{current?.label}</span>
        <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div className="theme-picker-dropdown" role="menu">
          {themes.map(t => (
            <button
              key={t.id}
              className={`theme-option ${theme === t.id ? "active" : ""}`}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              role="menuitem"
            >
              <span
                className="theme-swatch"
                style={{ background: SWATCHES[t.id] }}
              />
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
