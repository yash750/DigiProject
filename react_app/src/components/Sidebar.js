import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const allLinks = [
  { to: "/",          icon: "📊", label: "Dashboard",   adminOnly: false },
  { to: "/assign",    icon: "🔗", label: "Assign Asset", adminOnly: false },
  { to: "/add-asset", icon: "➕", label: "Add Asset",    adminOnly: true  },
  { to: "/employees", icon: "👥", label: "Employees",    adminOnly: true  },
  { to: "/history",   icon: "📋", label: "History",      adminOnly: false },
  { to: "/inventory", icon: "📦", label: "Inventory",    adminOnly: false },
  { to: "/profile",   icon: "👤", label: "My Profile",   adminOnly: false },
];

export default function Sidebar() {
  const { user, org, isAdmin, logout } = useAuth();
  const navigate                  = useNavigate();
  const links = allLinks.filter(l => !l.adminOnly || isAdmin);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🗂 AssetTracker</h2>
        <span>Shared Asset Management</span>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user.name}</div>
              <span className={`sidebar-role-badge ${user.role}`}>
                {user.role === "admin" ? "🔑 Admin" : "👤 Employee"}
              </span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
            ⏻
          </button>
        </div>
      )}

      <div className="sidebar-footer">
        {org ? `🏢 ${org.name}` : "v2.0 · React Edition"}
      </div>
    </aside>
  );
}
