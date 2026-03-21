import React, { useEffect } from "react";

/*
  Usage:
  <ConfirmModal
    open={bool}
    title="Delete Asset?"
    body={<>...</>}
    confirmLabel="Delete"
    danger
    onConfirm={fn}
    onCancel={fn}
  />
*/
export default function ConfirmModal({ open, title, body, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div style={iconWrap}>
          <span style={{ fontSize: "1.6rem" }}>🗑</span>
        </div>

        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
          {title}
        </h3>

        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6, marginBottom: 22 }}>
          {body}
        </div>

        {/* Warning box */}
        <div style={warningBox}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#92400e" }}>⚠ This action cannot be undone.</span>
          <span style={{ fontSize: "0.78rem", color: "#78350f", display: "block", marginTop: 3 }}>
            All assignment history for this asset will also be permanently deleted.
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            style={danger ? { background: "var(--danger)", color: "#fff", border: "none" } : {}}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const dialog = {
  background: "#fff",
  borderRadius: 14,
  padding: "28px 28px 24px",
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const iconWrap = {
  width: 56, height: 56,
  background: "#fef2f2",
  borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "0 auto 16px",
};

const warningBox = {
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
  padding: "10px 14px",
};
