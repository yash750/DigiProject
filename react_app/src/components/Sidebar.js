import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/",          icon: "📊", label: "Dashboard"   },
  { to: "/assign",    icon: "🔗", label: "Assign Asset" },
  { to: "/add-asset", icon: "➕", label: "Add Asset"    },
  { to: "/history",   icon: "📋", label: "History"      },
  { to: "/inventory", icon: "📦", label: "Inventory"    },
];

export default function Sidebar() {
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

      <div className="sidebar-footer">
        v2.0 · React Edition
      </div>
    </aside>
  );
}
