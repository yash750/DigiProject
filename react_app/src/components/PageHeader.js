import React from "react";

/**
 * PageHeader — Aesthetic Integrity + Hierarchy
 * Consistent page-level heading used on every page that has its own inner title.
 * Provides a clear visual anchor: icon → title → subtitle, largest to smallest.
 */
export default function PageHeader({ icon, title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-between", flexWrap: "wrap",
      gap: 12, marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.3rem", flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 3 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
