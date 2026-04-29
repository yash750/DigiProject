import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets, returnAsset } from "../api/client";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function Dashboard() {
  const [assets, setAssets]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState(() => localStorage.getItem("dash_search") || "");
  const [filter, setFilter]     = useState(() => localStorage.getItem("dash_filter") || "all");
  const [returning, setReturning] = useState(null);
  const toast    = useToast();
  const navigate = useNavigate();

  // Flexibility: persist search + filter across page refreshes
  const handleSearch = (val) => { setSearch(val); localStorage.setItem("dash_search", val); };
  const handleFilter = (val) => { setFilter(val); localStorage.setItem("dash_filter", val); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAssets(await fetchAssets());
    } catch {
      toast("Failed to load assets", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleReturn = async (asset) => {
    setReturning(asset.id);
    try {
      await returnAsset(asset.id);
      toast(`✅ "${asset.name}" returned successfully`);
      load();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setReturning(null);
    }
  };

  // Stats
  const total       = assets.length;
  const available   = assets.filter((a) => a.status === "available").length;
  const assigned    = assets.filter((a) => a.status === "assigned").length;
  const maintenance = assets.filter((a) => a.status === "maintenance").length;

  // Chart data — assets by name
  const byName = assets.reduce((acc, a) => {
    acc[a.name] = (acc[a.name] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(byName).map(([name, count]) => ({ name, count }));

  // Filtered list
  const visible = assets.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      (a.current_holder || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="🗂" value={total}       label="Total Assets"       colorClass="blue"   />
        <StatCard icon="✅" value={available}   label="Available"          colorClass="green"  />
        <StatCard icon="🔗" value={assigned}    label="Currently Assigned" colorClass="yellow" />
        <StatCard icon="🔧" value={maintenance} label="In Maintenance"     colorClass="red"    />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <h3>Asset Distribution</h3>
              <p>Number of units per asset type</p>
            </div>
          </div>
          <div style={{ padding: "16px 22px 22px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={["#3b82f6","#22c55e","#f59e0b","#a855f7","#ef4444"][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>All Assets</h3>
            <p>{visible.length} of {total} assets shown</p>
          </div>
          <div className="toolbar">
            <input
              className="search-input"
              placeholder="Search name, serial, holder…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search assets"
            />
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => handleFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <button className="btn btn-primary" onClick={() => navigate("/assign")}>
              + Assign Asset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loader-wrap" role="status" aria-label="Loading assets">
            <div className="spinner" />
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No assets match your search or filter.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Asset Name</th>
                  <th>Serial Number</th>
                  <th>Status</th>
                  <th>Current Holder</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((asset, idx) => (
                  <tr key={asset.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{asset.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{asset.serial_number}</td>
                    <td><StatusBadge status={asset.status} /></td>
                    <td>{asset.current_holder || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {asset.status === "assigned" && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={returning === asset.id}
                            onClick={() => handleReturn(asset)}
                          >
                            {returning === asset.id ? "…" : "↩ Return"}
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/history/${asset.id}`)}
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
