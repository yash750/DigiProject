import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api/client";
import { useToast } from "../components/Toast";

function Field({ label, name, value, onChange, type = "text", placeholder, error }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        style={error ? { borderColor: "var(--danger)" } : {}} />
      {error && <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: 4, display: "block" }}>⚠ {error}</span>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, org, refreshUser } = useAuth();
  const toast = useToast();

  const [info, setInfo]     = useState({ name: user?.name || "", phone: user?.phone || "", department: user?.department || "", job_title: user?.job_title || "" });
  const [pass, setPass]     = useState({ current_password: "", new_password: "", confirm: "" });
  const [passErr, setPassErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleInfo = (e) => setInfo(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePass = (e) => { setPass(f => ({ ...f, [e.target.name]: e.target.value })); setPassErr({}); };

  const saveInfo = async (e) => {
    e.preventDefault();
    if (!info.name.trim()) { toast("Name cannot be empty", "error"); return; }
    setSaving(true);
    try {
      await updateProfile({ name: info.name, phone: info.phone, department: info.department, job_title: info.job_title });
      await refreshUser();
      toast("✅ Profile updated");
    } catch (err) { toast(err.message, "error"); }
    finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!pass.current_password)  e2.current_password = "Required";
    if (!pass.new_password)      e2.new_password      = "Required";
    else if (pass.new_password.length < 6) e2.new_password = "Minimum 6 characters";
    if (pass.new_password !== pass.confirm) e2.confirm = "Passwords do not match";
    if (Object.keys(e2).length) { setPassErr(e2); return; }
    setSavingPass(true);
    try {
      await updateProfile({ current_password: pass.current_password, new_password: pass.new_password });
      toast("✅ Password changed");
      setPass({ current_password: "", new_password: "", confirm: "" });
    } catch (err) { toast(err.message, "error"); }
    finally { setSavingPass(false); }
  };

  const initials = user ? user.name.split(" ").slice(0, 2).map(p => p[0].toUpperCase()).join("") : "?";

  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>

      {/* ── Left: Avatar + Org card ── */}
      <div style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ padding: "28px 20px", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: "var(--primary)",
            color: "#fff", fontSize: "1.6rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            {initials}
          </div>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{user?.name}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>{user?.email}</div>
          <span className={`sidebar-role-badge ${user?.role}`} style={{ marginTop: 10, display: "inline-block" }}>
            {user?.role === "admin" ? "🔑 Admin" : "👤 Employee"}
          </span>
        </div>

        {org && (
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Organization</div>
            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>🏢 {org.name}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, fontFamily: "monospace" }}>/{org.slug}</div>
          </div>
        )}
      </div>

      {/* ── Right: Forms ── */}
      <div style={{ flex: "1 1 360px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Profile info */}
        <div className="form-card" style={{ maxWidth: "100%" }}>
          <div className="form-title">✏️ Edit Profile</div>
          <div className="form-subtitle">Update your personal information.</div>
          <form onSubmit={saveInfo} noValidate>
            <Field label="Full Name *"   name="name"       value={info.name}       onChange={handleInfo} placeholder="Your full name" />
            <Field label="Phone"         name="phone"      value={info.phone}      onChange={handleInfo} placeholder="+91 98765 43210" />
            <Field label="Department"    name="department" value={info.department} onChange={handleInfo} placeholder="e.g. Engineering" />
            <Field label="Job Title"     name="job_title"  value={info.job_title}  onChange={handleInfo} placeholder="e.g. Software Engineer" />
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="form-card" style={{ maxWidth: "100%" }}>
          <div className="form-title">🔒 Change Password</div>
          <div className="form-subtitle">Leave blank if you don't want to change your password.</div>
          <form onSubmit={savePassword} noValidate>
            <Field label="Current Password *" name="current_password" type="password" value={pass.current_password} onChange={handlePass} placeholder="••••••••" error={passErr.current_password} />
            <Field label="New Password *"     name="new_password"     type="password" value={pass.new_password}     onChange={handlePass} placeholder="Min. 6 characters" error={passErr.new_password} />
            <Field label="Confirm New Password *" name="confirm"      type="password" value={pass.confirm}          onChange={handlePass} placeholder="Repeat new password" error={passErr.confirm} />
            <button type="submit" className="btn btn-primary" disabled={savingPass}>
              {savingPass ? "Updating…" : "🔑 Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
