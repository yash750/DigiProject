import React from "react";

export default function StatusBadge({ status }) {
  const map = {
    available:   { label: "Available",    cls: "available" },
    assigned:    { label: "Assigned",     cls: "assigned"  },
    maintenance: { label: "Maintenance",  cls: "maintenance" },
    retired:     { label: "Retired",      cls: "retired"   },
  };
  const { label, cls } = map[status] || { label: status, cls: "" };
  return <span className={`badge ${cls}`}>● {label}</span>;
}
