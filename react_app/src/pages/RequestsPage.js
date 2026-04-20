import React, { useEffect, useState, useCallback } from "react";
import {
  fetchAssets, fetchUsers,
  fetchMyRequests, fetchOpenRequests,
  createRequest, actionRequest, cancelRequest,
} from "../api/client";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:   { bg: "#fffbeb", color: "#b45309", label: "Pending"   },
  approved:  { bg: "#f0fdf4", color: "#15803d", label: "Approved"  },
  fulfilled: { bg: "#eff6ff", color: "#1d4ed8", label: "Fulfilled" },
  rejected:  { bg: "#fef2f2", color: "#b91c1c", label: "Rejected"  },
  cancelled: { bg: "#f8fafc", color: "#64748b", label: "Cancelled" },
};

function StatusPill({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      fontSize: "0.72rem", fontWeight: 600, background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Tab: New Request ──────────────────────────────────────────────────────────
function NewRequestTab({ assets, onCreated }) {
  const [type, setType]     = useState("specific"); // "specific" | "global"
  const [assetId, setAssetId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [note, setNote]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const available = assets.filter(a => a.status === "available");

  const handleSubmit = async e => {
    e.preventDefault();
    if (type === "specific" && !assetId) { toast("Please select an asset", "error"); return; }
    if (type === "global"   && !assetName.trim()) { toast("Please describe the asset you need", "error"); return; }
    setSubmitting(true);
    try {
      await createRequest(
        type === "specific"
          ? { asset_id: parseInt(assetId), note: note || undefined }
          : { asset_name: assetName.trim(), note: note || undefined }
      );
      toast("Request submitted successfully!");
      setAssetId(""); setAssetName(""); setNote("");
      onCreated();
    } catch (err) { toast(err.message, "error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div className="form-card" style={{ flex: "1 1 400px" }}>
        <div className="form-title">New Asset Request</div>
        <div className="form-subtitle">
          Request a specific available asset, or post a global request for any asset type.
        </div>

        {/* Type toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["specific", "Specific Asset"], ["global", "Global Request"]].map(([v, l]) => (
            <button key={v} type="button"
              onClick={() => setType(v)}
              className={`btn ${type === v ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, justifyContent: "center" }}>
              {v === "specific" ? "📦 " : "🌐 "}{l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {type === "specific" ? (
            <div className="form-group">
              <label>Available Asset *</label>
              <select value={assetId} onChange={e => setAssetId(e.target.value)} required>
                <option value="">— Select an available asset —</option>
                {available.map(a => (
                  <option key={a.id} value={a.id}>{a.name}  ·  {a.serial_number}</option>
                ))}
              </select>
              {available.length === 0 && (
                <span style={{ fontSize: "0.78rem", color: "var(--warning)", marginTop: 4, display: "block" }}>
                  No available assets right now. Use a Global Request instead.
                </span>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label>Asset Type Needed *</label>
              <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)}
                placeholder='e.g. "Dell Laptop", "Projector"' />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                This will be visible to all team members who may transfer their asset to you.
              </span>
            </div>
          )}

          <div className="form-group">
            <label>Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Why do you need this asset? Any context…" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>

      {/* Info panel */}
      <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <div className="card-header"><h3>How it works</h3></div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["📦 Specific Request", "Pick an available asset from the list. Your admin will see the request and can approve (assign it to you) or reject it."],
              ["🌐 Global Request", "Describe the asset type you need. This is posted on the Open Board visible to all team members. Anyone holding that asset type can transfer it to you directly."],
            ].map(([title, body]) => (
              <div key={title}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: My Requests ──────────────────────────────────────────────────────────
function MyRequestsTab({ requests, onCancel }) {
  const toast = useToast();
  const [cancelling, setCancelling] = useState(null);

  const handleCancel = async req => {
    setCancelling(req.id);
    try {
      await cancelRequest(req.id);
      toast("Request cancelled");
      onCancel();
    } catch (err) { toast(err.message, "error"); }
    finally { setCancelling(null); }
  };

  if (requests.length === 0)
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>You haven't made any requests yet.</p>
        </div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-header">
        <div><h3>My Requests</h3><p>{requests.length} request{requests.length !== 1 ? "s" : ""}</p></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th><th>Asset</th><th>Note</th>
              <th>Status</th><th>Submitted</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>
                  <span style={{ fontSize: "0.78rem", fontWeight: 500 }}>
                    {r.type === "global" ? "🌐 Global" : "📦 Specific"}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>
                  {r.asset_name || "—"}
                  {r.asset_serial && (
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                      {r.asset_serial}
                    </span>
                  )}
                </td>
                <td style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 180 }}>{r.note || "—"}</td>
                <td><StatusPill status={r.status} /></td>
                <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(r.created_at)}</td>
                <td>
                  {r.status === "pending" ? (
                    <button className="btn btn-danger btn-sm"
                      disabled={cancelling === r.id}
                      onClick={() => handleCancel(r)}>
                      {cancelling === r.id ? "…" : "Cancel"}
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {r.resolved_by ? `by ${r.resolved_by}` : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Admin Inbox (specific requests) ─────────────────────────────────────
function AdminInboxTab({ requests, onAction }) {
  const toast = useToast();
  const [acting, setActing] = useState(null);

  const handle = async (req, action) => {
    setActing(req.id + action);
    try {
      await actionRequest(req.id, { action });
      toast(action === "approve" ? "Request approved — asset assigned!" : "Request rejected");
      onAction();
    } catch (err) { toast(err.message, "error"); }
    finally { setActing(null); }
  };

  if (requests.length === 0)
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📥</div>
          <p>No pending asset requests from employees.</p>
        </div>
      </div>
    );

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Pending Requests</h3>
          <p>{requests.length} request{requests.length !== 1 ? "s" : ""} awaiting action</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Employee</th><th>Asset</th><th>Serial</th><th>Note</th><th>Submitted</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.requested_by}</td>
                <td style={{ fontWeight: 500 }}>{r.asset_name}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{r.asset_serial || "—"}</td>
                <td style={{ fontSize: "0.82rem", color: "var(--text-muted)", maxWidth: 160 }}>{r.note || "—"}</td>
                <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(r.created_at)}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary btn-sm"
                      disabled={!!acting}
                      onClick={() => handle(r, "approve")}>
                      {acting === r.id + "approve" ? "…" : "Approve"}
                    </button>
                    <button className="btn btn-danger btn-sm"
                      disabled={!!acting}
                      onClick={() => handle(r, "reject")}>
                      {acting === r.id + "reject" ? "…" : "Reject"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Open Board (global requests) ────────────────────────────────────────
function OpenBoardTab({ openRequests, myAssets, currentUser, onFulfil }) {
  const toast = useToast();
  // Per-request: which of my assets to offer
  const [offers, setOffers]   = useState({});
  const [acting, setActing]   = useState(null);

  const getOffer = id => offers[id] || "";
  const setOffer = (id, val) => setOffers(f => ({ ...f, [id]: val }));

  const handleFulfil = async req => {
    const assetId = getOffer(req.id);
    if (!assetId) { toast("Select one of your assets to transfer", "error"); return; }
    setActing(req.id);
    try {
      await actionRequest(req.id, { action: "fulfil", asset_id: parseInt(assetId) });
      toast(`Fulfilled! Asset transferred to ${req.requested_by}`);
      onFulfil();
    } catch (err) { toast(err.message, "error"); }
    finally { setActing(null); }
  };

  if (openRequests.length === 0)
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <p>No open global requests right now.</p>
        </div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
        padding: "12px 16px", fontSize: "0.83rem", color: "#1d4ed8",
      }}>
        These are open requests from your teammates. If you hold an asset they need, you can transfer it to them directly.
      </div>

      {openRequests.map(req => {
        const isOwn = req.requested_by_id === currentUser.id;
        // My assets that match the requested asset name (case-insensitive)
        const matchingAssets = myAssets.filter(
          a => a.current_holder === currentUser.name &&
               a.status === "assigned" &&
               a.name.toLowerCase().includes((req.asset_name || "").toLowerCase())
        );

        return (
          <div className="card" key={req.id}>
            <div style={{ padding: "16px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{req.requested_by}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: 8 }}>
                    needs a <strong>{req.asset_name}</strong>
                  </span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt(req.created_at)}</span>
              </div>

              {req.note && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 12 }}>
                  "{req.note}"
                </div>
              )}

              {isOwn ? (
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  This is your request.
                </span>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    value={getOffer(req.id)}
                    onChange={e => setOffer(req.id, e.target.value)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.83rem", minWidth: 220 }}
                  >
                    <option value="">— Select your asset to transfer —</option>
                    {myAssets.filter(a => a.current_holder === currentUser.name && a.status === "assigned").map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}  ·  {a.serial_number}
                        {matchingAssets.find(m => m.id === a.id) ? "  ✓ matches" : ""}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-sm"
                    disabled={acting === req.id}
                    onClick={() => handleFulfil(req)}>
                    {acting === req.id ? "Transferring…" : "Transfer to them"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page entry point ──────────────────────────────────────────────────────────
export default function RequestsPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [assets,       setAssets]       = useState([]);
  const [users,        setUsers]        = useState([]);
  const [myRequests,   setMyRequests]   = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Admin tabs: "inbox" | "open"
  // Employee tabs: "new" | "mine" | "open"
  const defaultTab = isAdmin ? "inbox" : "new";
  const [tab, setTab] = useState(defaultTab);

  const load = useCallback(async () => {
    try {
      const [a, u, mine, open] = await Promise.all([
        fetchAssets(), fetchUsers(), fetchMyRequests(), fetchOpenRequests(),
      ]);
      setAssets(a); setUsers(u); setMyRequests(mine); setOpenRequests(open);
    } catch { toast("Failed to load requests", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const adminTabs    = [["inbox", "📥 Pending Requests"], ["open", "🌐 Open Board"]];
  const employeeTabs = [["new", "➕ New Request"], ["mine", "📋 My Requests"], ["open", "🌐 Open Board"]];
  const tabs = isAdmin ? adminTabs : employeeTabs;

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;

  return (
    <>
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 24, gap: 4 }}>
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: "9px 18px", background: "none", border: "none",
              borderBottom: tab === key ? "2px solid var(--primary)" : "2px solid transparent",
              color: tab === key ? "var(--primary)" : "var(--text-muted)",
              fontWeight: tab === key ? 600 : 400, fontSize: "0.88rem",
              cursor: "pointer", transition: "all 0.15s",
            }}>
            {label}
            {/* Badge counts */}
            {key === "inbox" && myRequests.length === 0 && openRequests.length === 0 ? null : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "new"   && <NewRequestTab   assets={assets} onCreated={load} />}
      {tab === "mine"  && <MyRequestsTab   requests={myRequests} onCancel={load} />}
      {tab === "inbox" && <AdminInboxTab   requests={myRequests} onAction={load} />}
      {tab === "open"  && (
        <OpenBoardTab
          openRequests={openRequests}
          myAssets={assets}
          currentUser={user}
          onFulfil={load}
        />
      )}
    </>
  );
}
