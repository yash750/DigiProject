import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets, fetchUsers, assignAsset, transferAsset } from "../api/client";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

// ── Admin view: assign any available asset to any user ───────────────────────
function AdminAssignForm({ assets, users, onSuccess }) {
  const [form, setForm]         = useState({ asset_id: "", to_user_id: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();
  const available = assets.filter(a => a.status === "available");

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.asset_id || !form.to_user_id) { toast("Please fill all required fields", "error"); return; }
    setSubmitting(true);
    try {
      await assignAsset({
        asset_id:   parseInt(form.asset_id),
        to_user_id: parseInt(form.to_user_id),
        notes:      form.notes || undefined,
      });
      toast("Asset assigned successfully!");
      onSuccess();
      navigate("/");
    } catch (err) { toast(err.message, "error"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div className="form-card" style={{ flex: "1 1 400px" }}>
        <div className="form-title">Assign an Asset</div>
        <div className="form-subtitle">Select an available asset and assign it to a team member.</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Asset *</label>
            <select name="asset_id" value={form.asset_id} onChange={handleChange} required>
              <option value="">— Select an asset —</option>
              {available.map(a => (
                <option key={a.id} value={a.id}>{a.name}  ·  {a.serial_number}</option>
              ))}
            </select>
            {available.length === 0 && (
              <p style={{ fontSize: "0.78rem", color: "var(--warning)", marginTop: 4 }}>
                No available assets right now.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Assign To *</label>
            <select name="to_user_id" value={form.to_user_id} onChange={handleChange} required>
              <option value="">— Select recipient —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Any remarks about this assignment…" />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Assigning…" : "Assign Asset"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>Cancel</button>
          </div>
        </form>
      </div>

      {/* Available assets panel */}
      <div style={{ flex: "1 1 260px" }}>
        <div className="card">
          <div className="card-header"><h3>Available Assets</h3></div>
          {available.length === 0 ? (
            <div className="empty-state"><p>All assets are currently assigned.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Serial</th></tr></thead>
                <tbody>
                  {available.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.name}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{a.serial_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Employee view: transfer one of their held assets to another user ──────────
function EmployeeTransferView({ assets, users, currentUser, onSuccess }) {
  // Assets currently held by this employee
  const myAssets = assets.filter(
    a => a.status === "assigned" && a.current_holder === currentUser.name
  );

  // Per-asset transfer form state: { [asset_id]: { to_user_id, notes, submitting } }
  const [forms, setForms] = useState({});
  const toast = useToast();

  const getForm = id => forms[id] || { to_user_id: "", notes: "", submitting: false };
  const setForm = (id, patch) =>
    setForms(f => ({ ...f, [id]: { ...getForm(id), ...patch } }));

  const otherUsers = users.filter(u => u.id !== currentUser.id);

  const handleTransfer = async (asset) => {
    const f = getForm(asset.id);
    if (!f.to_user_id) { toast("Please select a recipient", "error"); return; }
    setForm(asset.id, { submitting: true });
    try {
      await transferAsset(asset.id, { to_user_id: parseInt(f.to_user_id), notes: f.notes || undefined });
      toast(`"${asset.name}" transferred successfully!`);
      onSuccess();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setForm(asset.id, { submitting: false });
    }
  };

  return (
    <div>
      {/* Info banner */}
      <div style={{
        background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
        padding: "14px 18px", marginBottom: 24, fontSize: "0.85rem", color: "#1d4ed8",
        lineHeight: 1.6,
      }}>
        <strong>Employee Transfer Mode</strong><br />
        As an employee, you can only transfer assets that are currently assigned to you.
        Admins handle all new assignments from available inventory.
      </div>

      {myAssets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>You don't currently hold any assets.</p>
            <p style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Ask your admin to assign an asset to you.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {myAssets.map(asset => {
            const f = getForm(asset.id);
            return (
              <div className="card" key={asset.id}>
                <div className="card-header">
                  <div>
                    <h3 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {asset.name}
                      <StatusBadge status={asset.status} />
                    </h3>
                    <p style={{ fontFamily: "monospace", fontSize: "0.8rem", marginTop: 2 }}>
                      {asset.serial_number}
                    </p>
                  </div>
                </div>
                <div style={{ padding: "16px 22px" }}>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div className="form-group" style={{ flex: "1 1 200px", marginBottom: 0 }}>
                      <label>Transfer To *</label>
                      <select
                        value={f.to_user_id}
                        onChange={e => setForm(asset.id, { to_user_id: e.target.value })}
                      >
                        <option value="">— Select recipient —</option>
                        {otherUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: "2 1 260px", marginBottom: 0 }}>
                      <label>Notes (optional)</label>
                      <input
                        type="text"
                        value={f.notes}
                        onChange={e => setForm(asset.id, { notes: e.target.value })}
                        placeholder="Reason for transfer…"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ marginBottom: 0, flexShrink: 0 }}
                      disabled={f.submitting}
                      onClick={() => handleTransfer(asset)}
                    >
                      {f.submitting ? "Transferring…" : "Transfer"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page entry point ──────────────────────────────────────────────────────────
export default function AssignPage() {
  const [assets, setAssets] = useState([]);
  const [users,  setUsers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin }   = useAuth();
  const toast = useToast();

  const load = useCallback(() => {
    Promise.all([fetchAssets(), fetchUsers()])
      .then(([a, u]) => { setAssets(a); setUsers(u); })
      .catch(() => toast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;

  return isAdmin
    ? <AdminAssignForm  assets={assets} users={users} onSuccess={load} />
    : <EmployeeTransferView assets={assets} users={users} currentUser={user} onSuccess={load} />;
}
