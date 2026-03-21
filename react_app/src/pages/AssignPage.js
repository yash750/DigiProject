import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets, fetchUsers, assignAsset } from "../api/client";
import { useToast } from "../components/Toast";

export default function AssignPage() {
  const [assets, setAssets]   = useState([]);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ asset_id: "", to_user_id: "", by_user_id: "", notes: "" });
  const toast    = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchAssets(), fetchUsers()])
      .then(([a, u]) => { setAssets(a); setUsers(u); })
      .catch(() => toast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const available = assets.filter((a) => a.status === "available");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id || !form.to_user_id || !form.by_user_id) {
      toast("Please fill all required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      await assignAsset({
        asset_id:   parseInt(form.asset_id),
        to_user_id: parseInt(form.to_user_id),
        by_user_id: parseInt(form.by_user_id),
        notes:      form.notes || undefined,
      });
      toast("✅ Asset assigned successfully!");
      navigate("/");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Form */}
      <div className="form-card" style={{ flex: "1 1 400px" }}>
        <div className="form-title">Assign an Asset</div>
        <div className="form-subtitle">
          Select an available asset and assign it to a team member.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Asset *</label>
            <select name="asset_id" value={form.asset_id} onChange={handleChange} required>
              <option value="">— Select an asset —</option>
              {available.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}  ·  {a.serial_number}
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p style={{ fontSize: "0.78rem", color: "var(--warning)", marginTop: -10 }}>
                ⚠ No available assets right now.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Assign To *</label>
            <select name="to_user_id" value={form.to_user_id} onChange={handleChange} required>
              <option value="">— Select recipient —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assigned By *</label>
            <select name="by_user_id" value={form.by_user_id} onChange={handleChange} required>
              <option value="">— Select assigner —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any remarks about this assignment…"
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Assigning…" : "🔗 Assign Asset"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Info panel */}
      <div style={{ flex: "1 1 260px" }}>
        <div className="card">
          <div className="card-header"><h3>📦 Available Assets</h3></div>
          {available.length === 0 ? (
            <div className="empty-state"><p>All assets are currently assigned.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Serial</th></tr>
                </thead>
                <tbody>
                  {available.map((a) => (
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
