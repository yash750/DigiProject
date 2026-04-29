import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import QuickActionsWidget from "./components/QuickActionsWidget";
import ThemePicker from "./components/ThemePicker";
import LoginPage    from "./pages/LoginPage";
import Dashboard    from "./pages/Dashboard";
import AssignPage   from "./pages/AssignPage";
import AddAssetPage from "./pages/AddAssetPage";
import HistoryPage  from "./pages/HistoryPage";
import InventoryPage from "./pages/InventoryPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProfilePage   from "./pages/ProfilePage";
import RequestsPage  from "./pages/RequestsPage";

const pageMeta = {
  "/":           { title: "Dashboard",    sub: "Overview of all assets and activity" },
  "/assign":     { title: "Assign / Transfer", sub: "Assign an asset (admin) or transfer your held asset (employee)" },
  "/add-asset":  { title: "Add Asset",    sub: "Register a new asset into the inventory" },
  "/employees":  { title: "Employees",       sub: "Manage employee accounts" },
  "/requests":   { title: "Requests",         sub: "Request assets or view the open board" },
  "/history":    { title: "History",          sub: "Full assignment timeline" },
  "/inventory":  { title: "Inventory",    sub: "Stock levels and asset type breakdown" },
  "/profile":    { title: "My Profile",   sub: "View and edit your profile" },
};

function AppShell() {
  const { pathname } = useLocation();
  const base = "/" + pathname.split("/")[1];
  const meta = pageMeta[base] || { title: "Asset Tracker", sub: "" };

  // Login page renders without the shell
  if (pathname === "/login") return <Routes><Route path="/login" element={<LoginPage />} /></Routes>;

  return (
    <ToastProvider>
      {/* Accessibility: skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        style={{
          position: "absolute", top: -40, left: 8,
          background: "var(--primary)", color: "#fff",
          padding: "8px 16px", borderRadius: 8, fontSize: "0.85rem",
          zIndex: 9999, transition: "top 0.15s",
        }}
        onFocus={e => e.target.style.top = "8px"}
        onBlur={e  => e.target.style.top = "-40px"}
      >
        Skip to content
      </a>
      <div className="layout">
        <Sidebar />
        <div className="main">
          <header className="topbar">
            <div>
              <div className="topbar-title">{meta.title}</div>
              <div className="topbar-sub">{meta.sub}</div>
            </div>
            <div className="topbar-right">
              <ThemePicker />
              <span className="badge-dot" aria-hidden="true" />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }} aria-label="API connection status: connected">
                Connected to Flask API
              </span>
            </div>
          </header>

          <main className="page-content" id="main-content" role="main">
            <Routes>
              <Route path="/" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/assign" element={
                <ProtectedRoute><AssignPage /></ProtectedRoute>
              } />
              <Route path="/add-asset" element={
                <ProtectedRoute adminOnly><AddAssetPage /></ProtectedRoute>
              } />
              <Route path="/history/:assetId" element={
                <ProtectedRoute><HistoryPage /></ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute><HistoryPage /></ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute><InventoryPage /></ProtectedRoute>
              } />
              <Route path="/employees" element={
                <ProtectedRoute adminOnly><EmployeesPage /></ProtectedRoute>
              } />
              <Route path="/requests" element={
                <ProtectedRoute><RequestsPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </div>
      <QuickActionsWidget />
    </ToastProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
