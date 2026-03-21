import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchActivity } from "../api/client";
import { useToast } from "../components/Toast";

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Config per event type
const EVENT_META = {
  created:    { icon: "✨", label: "Asset Added",     dot: "#22c55e", bg: "#f0fdf4", color: "#15803d" },
  deleted:    { icon: "🗑",  label: "Asset Deleted",   dot: "#ef4444", bg: "#fef2f2", color: "#b91c1c" },
  assigned:   { icon: "🔗", label: "Assigned",         dot: "#3b82f6", bg: "#eff6ff", color: "#1d4ed8" },
  returned:   { icon: "↩",  label: "Returned",         dot: "#f59e0b", bg: "#fffbeb", color: "#b45309" },
  assignment: { icon: "🔗", label: "Assigned",         dot: "#3b82f6", bg: "#eff6ff", color: "#1d4ed8" },
};

function EventBadge({ type }) {
  const m = EVENT_META[type] || { icon: "•", label: type, bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
      background: m.bg, color: m.color,
    }}>
      {m.icon} {m.label}
    </span>
  );
}

// ── Asset-specific timeline ──────────────────────────────────────────────────
function AssetTimeline({ assetId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const toast    = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/asset/${assetId}/history/json`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(setData)
      .catch(() => toast("Failed to load asset history", "error"))
      .finally(() => setLoading(false));
  }, [assetId, toast]);

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;
  if (!data)   return null;

  const { asset, timeline } = data;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>← Back</button>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Asset History</h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {asset.name} · <span style={{ fontFamily: "monospace" }}>{asset.serial_number}</span>
            <span className={`badge ${asset.status}`} style={{ marginLeft: 10 }}>● {asset.status}</span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Full Lifecycle Timeline</h3>
            <p>{timeline.length} event{timeline.length !== 1 ? "s" : ""} recorded</p>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No history recorded yet for this asset.</p>
          </div>
        ) : (
          <div className="timeline">
            {timeline.map((item, i) => {
              const meta = EVENT_META[item.type === "assignment" ? "assigned" : item.event] || EVENT_META.assigned;
              return (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" style={{ background: meta.dot, marginTop: 6 }} />
                  <div className="timeline-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <EventBadge type={item.type === "assignment" ? "assigned" : item.event} />
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {fmt(item.timestamp)}
                      </span>
                    </div>

                    {/* Assignment row */}
                    {item.type === "assignment" && (
                      <div style={{ marginTop: 6 }}>
                        <div className="timeline-title">
                          Assigned to <strong>{item.assigned_to}</strong>
                          {" "}by <strong>{item.assigned_by}</strong>
                        </div>
                        {item.returned_at ? (
                          <div className="timeline-meta" style={{ marginTop: 3 }}>
                            <EventBadge type="returned" />
                            <span style={{ marginLeft: 8, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              Returned on {fmt(item.returned_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="timeline-meta" style={{ marginTop: 3, color: "var(--primary)", fontSize: "0.78rem" }}>
                            🔵 Still assigned — not yet returned
                          </div>
                        )}
                        {item.notes && (
                          <div style={{ marginTop: 4, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Log row (created / deleted) */}
                    {item.type === "log" && (
                      <div style={{ marginTop: 6 }}>
                        <div className="timeline-title">{item.detail || item.event}</div>
                        {item.actor && (
                          <div className="timeline-meta">by {item.actor}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── Global activity feed ─────────────────────────────────────────────────────
function GlobalActivity() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
  const toast    = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchActivity()
      .then(setLogs)
      .catch(() => toast("Failed to load activity", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const visible = filter === "all" ? logs : logs.filter((l) => l.event === filter);

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Activity Feed</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>
          Every lifecycle event across all assets — additions, deletions, assignments and returns.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>All Events</h3>
            <p>{visible.length} event{visible.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="toolbar">
            <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Events</option>
              <option value="created">✨ Added</option>
              <option value="assigned">🔗 Assigned</option>
              <option value="returned">↩ Returned</option>
              <option value="deleted">🗑 Deleted</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No activity recorded yet.</p>
            <p style={{ marginTop: 6, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Events will appear here as you add, assign, return, or delete assets.
            </p>
          </div>
        ) : (
          <div className="timeline">
            {visible.map((log) => {
              const meta = EVENT_META[log.event] || { icon: "•", dot: "#94a3b8" };
              return (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-dot" style={{ background: meta.dot, marginTop: 6 }} />
                  <div className="timeline-body">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <EventBadge type={log.event} />
                      <span
                        style={{ fontWeight: 600, fontSize: "0.875rem", cursor: log.asset_id ? "pointer" : "default", color: log.asset_id ? "var(--primary)" : "inherit" }}
                        onClick={() => log.asset_id && navigate(`/history/${log.asset_id}`)}
                        title={log.asset_id ? "View asset history" : undefined}
                      >
                        {log.asset_name}
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {log.serial_number}
                      </span>
                    </div>
                    <div className="timeline-meta" style={{ marginTop: 4 }}>
                      {log.detail && <span>{log.detail}</span>}
                      {log.actor  && <span style={{ marginLeft: log.detail ? 10 : 0 }}>· by {log.actor}</span>}
                      <span style={{ marginLeft: 10 }}>{fmt(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ── Page entry point ─────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { assetId } = useParams();
  return assetId ? <AssetTimeline assetId={assetId} /> : <GlobalActivity />;
}
