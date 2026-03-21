import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAsset } from "../api/client";
import { useToast } from "../components/Toast";

const STATUSES = [
  { value: "available",   label: "Available"   },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired",     label: "Retired"     },
];

const INITIAL = { name: "", serial_number: "", status: "available" };

export default function AddAssetPage() {
  const [form, setForm]         = useState(INITIAL);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name          = "Asset name is required";
    if (!form.serial_number.trim()) e.serial_number = "Serial number is required";
    else if (!/^[A-Za-z0-9\-_]+$/.test(form.serial_number.trim()))
      e.serial_number = "Only letters, numbers, hyphens and underscores allowed";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const created = await createAsset({
        name:          form.name.trim(),
        serial_number: form.serial_number.trim(),
        status:        form.status,
      });
      toast(`✅ "${created.name}" added to inventory`);
      navigate("/inventory");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>

      {/* ── Form ── */}
      <div className="form-card" style={{ flex: "1 1 420px" }}>
        <div className="form-title">➕ Add New Asset</div>
        <div className="form-subtitle">
          Register a new physical asset into the inventory. It will be marked
          <strong> Available</strong> by default and ready to assign.
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label>Asset Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder='e.g. "MacBook Pro 14", "Dell Monitor"'
              style={errors.name ? { borderColor: "var(--danger)" } : {}}
            />
            {errors.name && <FieldError msg={errors.name} />}
          </div>

          {/* Serial */}
          <div className="form-group">
            <label>Serial Number *</label>
            <input
              type="text"
              name="serial_number"
              value={form.serial_number}
              onChange={handleChange}
              placeholder='e.g. "SN-2024-001"'
              style={errors.serial_number ? { borderColor: "var(--danger)" } : {}}
            />
            {errors.serial_number && <FieldError msg={errors.serial_number} />}
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
              Must be unique across all assets.
            </span>
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Initial Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
              Assets in <em>Maintenance</em> or <em>Retired</em> status cannot be assigned.
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "➕ Add Asset"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/inventory")}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* ── Tips panel ── */}
      <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card">
          <div className="card-header"><h3>💡 Tips</h3></div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Asset Name",    "Use a clear, consistent naming convention — e.g. include the brand and model so it's easy to identify at a glance."],
              ["Serial Number", "Use the manufacturer's serial number or create your own scheme like SN-YYYY-NNN. It must be unique."],
              ["Status",        "Choose Available if the asset is ready to use. Use Maintenance for assets being repaired, Retired for decommissioned ones."],
            ].map(([title, body]) => (
              <div key={title}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
              ⚠ Note
            </div>
            <div style={{ fontSize: "0.78rem", color: "#78350f", lineHeight: 1.5 }}>
              Adding an asset here only registers it in the system. To assign it to
              someone, go to the <strong>Assign Asset</strong> page after saving.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function FieldError({ msg }) {
  return (
    <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: 4, display: "block" }}>
      ⚠ {msg}
    </span>
  );
}
