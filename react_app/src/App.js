import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import Dashboard     from "./pages/Dashboard";
import AssignPage    from "./pages/AssignPage";
import AddAssetPage  from "./pages/AddAssetPage";
import HistoryPage   from "./pages/HistoryPage";
import InventoryPage from "./pages/InventoryPage";

const pageMeta = {
  "/":          { title: "Dashboard",    sub: "Overview of all assets and activity" },
  "/assign":    { title: "Assign Asset", sub: "Assign an available asset to a team member" },
  "/add-asset": { title: "Add Asset",    sub: "Register a new asset into the inventory" },
  "/history":   { title: "History",      sub: "Full assignment timeline" },
  "/inventory": { title: "Inventory",    sub: "Stock levels and asset type breakdown" },
};

export default function App() {
  const { pathname } = useLocation();
  const base = "/" + pathname.split("/")[1];
  const meta = pageMeta[base] || { title: "Asset Tracker", sub: "" };

  return (
    <ToastProvider>
      <div className="layout">
        <Sidebar />
        <div className="main">
          <header className="topbar">
            <div>
              <div className="topbar-title">{meta.title}</div>
              <div className="topbar-sub">{meta.sub}</div>
            </div>
            <div className="topbar-right">
              <span className="badge-dot" />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Connected to Flask API
              </span>
            </div>
          </header>

          <main className="page-content">
            <Routes>
              <Route path="/"                 element={<Dashboard />}    />
              <Route path="/assign"           element={<AssignPage />}   />
              <Route path="/add-asset"        element={<AddAssetPage />} />
              <Route path="/history/:assetId" element={<HistoryPage />}  />
              <Route path="/history"          element={<HistoryPage />}  />
              <Route path="/inventory"        element={<InventoryPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
