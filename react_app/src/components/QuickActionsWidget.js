import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets } from "../api/client";

/**
 * QuickActionsWidget
 *
 * UCD        – surfaces the 3 most frequent user tasks (assign, add, history)
 * Consistency – reuses .btn, .badge, and CSS variable tokens from the design system
 * Feedback    – live health bar + spinner while loading; button active states
 * Simplicity  – collapsed by default; one click reveals only what's needed
 * Affordance  – FAB "⚡" signals interactivity; chevron shows expand/collapse
 * Flexibility – keyboard-accessible (Enter/Space on FAB); works on every page
 * Hierarchy   – health bar at top (most critical), actions below, footer last
 */
export default function QuickActionsWidget() {
  const [open, setOpen]       = useState(false);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const assets = await fetchAssets();
      const total       = assets.length;
      const available   = assets.filter(a => a.status === "available").length;
      const assigned    = assets.filter(a => a.status === "assigned").length;
      const maintenance = assets.filter(a => a.status === "maintenance").length;
      setStats({ total, available, assigned, maintenance });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stats whenever the widget is opened — Feedback principle
  useEffect(() => { if (open) loadStats(); }, [open, loadStats]);

  const go = (path) => { setOpen(false); navigate(path); };

  const healthPct = stats ? Math.round((stats.available / stats.total) * 100) : 0;
  const healthColor =
    healthPct >= 60 ? "var(--success)" :
    healthPct >= 30 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="qaw-root" role="complementary" aria-label="Quick Actions">

      {/* ── Panel (Simplicity: hidden until needed) ── */}
      {open && (
        <div className="qaw-panel" role="dialog" aria-modal="false">

          {/* Header — Hierarchy: most important info first */}
          <div className="qaw-header">
            <span className="qaw-title">⚡ Quick Actions</span>
            <button
              className="qaw-close"
              onClick={() => setOpen(false)}
              aria-label="Close widget"
            >✕</button>
          </div>

          {/* Health Bar — Feedback: real-time asset availability signal */}
          <div className="qaw-health">
            <div className="qaw-health-label">
              <span>Fleet Health</span>
              {loading
                ? <span className="qaw-loading-dot" />
                : <span style={{ color: healthColor, fontWeight: 600 }}>{healthPct}%</span>
              }
            </div>
            <div className="qaw-bar-track">
              <div
                className="qaw-bar-fill"
                style={{ width: loading ? "0%" : `${healthPct}%`, background: healthColor }}
              />
            </div>
            {stats && !loading && (
              <div className="qaw-mini-stats">
                <span className="badge available">✅ {stats.available} free</span>
                <span className="badge assigned">🔗 {stats.assigned} out</span>
                <span className="badge maintenance">🔧 {stats.maintenance} maint.</span>
              </div>
            )}
          </div>

          {/* Actions — Affordance: clear verb labels; Consistency: reuse .btn */}
          <div className="qaw-actions">
            <button className="btn btn-primary qaw-btn" onClick={() => go("/assign")}>
              🔗 Assign Asset
            </button>
            <button className="btn btn-ghost qaw-btn" onClick={() => go("/add-asset")}>
              ➕ Add New Asset
            </button>
            <button className="btn btn-ghost qaw-btn" onClick={() => go("/history")}>
              📋 View History
            </button>
            <button className="btn btn-ghost qaw-btn" onClick={() => go("/inventory")}>
              📦 Inventory
            </button>
          </div>

          {/* Footer — Hierarchy: least critical, visually subdued */}
          <div className="qaw-footer">
            {stats ? `${stats.total} assets tracked` : "Loading…"}
          </div>
        </div>
      )}

      {/* ── FAB — Affordance: raised button signals "press me" ── */}
      <button
        className={`qaw-fab ${open ? "qaw-fab--open" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Toggle quick actions"
      >
        {open ? "✕" : "⚡"}
      </button>
    </div>
  );
}
