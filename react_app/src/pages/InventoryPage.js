import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets, deleteAsset } from "../api/client";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#06b6d4"];

export default function InventoryPage() {
  const [assets, setAssets]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);   // asset being deleted
  const [modal, setModal]         = useState(null);   // asset pending confirmation
  const toast    = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAssets(await fetchAssets());
    } catch {
      toast("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteClick = (asset) => {
    // Warn extra loudly if the asset is currently assigned
    setModal(asset);
  };

  const handleConfirmDelete = async () => {
    const asset = modal;
    setModal(null);
    setDeleting(asset.id);
    try {
      await deleteAsset(asset.id);
      toast(`🗑 "${asset.name}" has been permanently deleted`);
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  // Build per-type summary (for the summary table)
  const summary = assets.reduce((acc, a) => {
    if (!acc[a.name]) acc[a.name] = { total: 0, available: 0, assigned: 0, maintenance: 0 };
    acc[a.name].total += 1;
    if (a.status === "available")   acc[a.name].available   += 1;
    if (a.status === "assigned")    acc[a.name].assigned    += 1;
    if (a.status === "maintenance") acc[a.name].maintenance += 1;
    return acc;
  }, {});
  const rows = Object.entries(summary);

  // Pie data
  const statusCounts = assets.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const stockLabel = (row) => {
    if (row.available === 0)         return <span style={{ color: "var(--danger)" }}>Out of Stock</span>;
    if (row.available === row.total) return <span style={{ color: "var(--success)" }}>Full Stock</span>;
    return <span style={{ color: "var(--primary)" }}>Partially In Use</span>;
  };

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>;

  return (
    <>
      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Inventory Overview</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>
            A consolidated view of all asset types and their current stock levels.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/add-asset")}>
          ➕ Add New Asset
        </button>
      </div>

      {/* ── Charts ── */}
      <div className="charts-grid" style={{ marginBottom: 28 }}>
        <div className="card">
          <div className="card-header"><h3>Status Breakdown</h3></div>
          <div style={{ padding: "16px 0 22px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Quick Stats</h3></div>
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Total Asset Types", value: rows.length,                                        color: "#3b82f6" },
              { label: "Total Units",       value: assets.length,                                      color: "#6366f1" },
              { label: "Available Units",   value: assets.filter(a => a.status === "available").length,   color: "#22c55e" },
              { label: "Assigned Units",    value: assets.filter(a => a.status === "assigned").length,    color: "#f59e0b" },
              { label: "In Maintenance",    value: assets.filter(a => a.status === "maintenance").length, color: "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 700, color, fontSize: "1rem" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Per-type summary table ── */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div>
            <h3>Inventory Summary</h3>
            <p>Stock levels per asset type</p>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No inventory data available.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset Type</th>
                  <th>Total Units</th>
                  <th>Available</th>
                  <th>Assigned</th>
                  <th>Maintenance</th>
                  <th>Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([name, stats]) => (
                  <tr key={name}>
                    <td style={{ fontWeight: 500 }}>{name}</td>
                    <td>{stats.total}</td>
                    <td style={{ color: "var(--success)", fontWeight: 500 }}>{stats.available}</td>
                    <td style={{ color: "var(--primary)", fontWeight: 500 }}>{stats.assigned}</td>
                    <td style={{ color: "var(--warning)", fontWeight: 500 }}>{stats.maintenance}</td>
                    <td>{stockLabel(stats)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Individual assets table with delete ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>All Individual Assets</h3>
            <p>Delete individual units from the system</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Current Holder</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, idx) => (
                <tr key={asset.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{asset.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{asset.serial_number}</td>
                  <td>
                    <span className={`badge ${asset.status}`}>● {asset.status}</span>
                  </td>
                  <td>{asset.current_holder || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td>
                    {asset.status === "assigned" ? (
                      <span
                        title="Return the asset first before deleting"
                        style={{ fontSize: "0.75rem", color: "var(--text-muted)", cursor: "not-allowed" }}
                      >
                        🔒 Return first
                      </span>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deleting === asset.id}
                        onClick={() => handleDeleteClick(asset)}
                      >
                        {deleting === asset.id ? "…" : "🗑 Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={!!modal}
        title={`Delete "${modal?.name}"?`}
        body={
          <>
            You are about to permanently delete{" "}
            <strong>{modal?.name}</strong> (Serial: <code>{modal?.serial_number}</code>).
            <br /><br />
            This will remove the asset and <strong>all its assignment history</strong> from the database.
          </>
        }
        confirmLabel="Yes, Delete Permanently"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
