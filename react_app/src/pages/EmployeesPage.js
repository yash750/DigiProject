import React, { useEffect, useState, useCallback } from "react";
import { fetchAllUsers, createUser, deleteUser } from "../api/client";
import { useToast } from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

const INITIAL = { name: "", email: "", password: "" };

function FieldError({ msg }) {
  return (
    <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: 4, display: "block" }}>
      ⚠ {msg}
    </span>
  );
}

export default function EmployeesPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(INITIAL);
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal]       = useState(null);   // user pending delete confirmation
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setUsers(await fetchAllUsers());
    } catch {
      toast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name     = "Name is required";
    if (!form.email.trim())                       e.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
                                                  e.email    = "Enter a valid email address";
    if (!form.password)                           e.password = "Password is required";
    else if (form.password.length < 6)            e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await createUser({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password });
      toast(`✅ Employee "${form.name.trim()}" added successfully`);
      setForm(INITIAL);
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    const user = modal;
    setModal(null);
    setDeleting(user.id);
    try {
      await deleteUser(user.id);
      toast(`🗑 "${user.name}" has been removed`);
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  const employees = users.filter(u => u.role === "employee");
  const admins    = users.filter(u => u.role === "admin");

  return (
    <>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>

        {/* ── Add Employee Form ── */}
        <div className="form-card" style={{ flex: "1 1 380px" }}>
          <div className="form-title">👤 Add New Employee</div>
          <div className="form-subtitle">Create a new employee account with login access.</div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder='e.g. "Rahul Sharma"'
                style={errors.name ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.name && <FieldError msg={errors.name} />}
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="rahul@company.com"
                style={errors.email ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.email && <FieldError msg={errors.email} />}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                style={errors.password ? { borderColor: "var(--danger)" } : {}}
              />
              {errors.password && <FieldError msg={errors.password} />}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Adding…" : "👤 Add Employee"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setForm(INITIAL); setErrors({}); }}>
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* ── Info panel ── */}
        <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header"><h3>ℹ️ Notes</h3></div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Role", "New accounts are always created as Employee. Admin accounts cannot be created or deleted from here."],
                ["Password", "The employee can use this password to log in. Minimum 6 characters."],
                ["Email", "Must be unique. Used as the login identifier."],
              ].map(([title, body]) => (
                <div key={title}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary counts */}
          <div className="card">
            <div className="card-header"><h3>👥 Summary</h3></div>
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total Users",  value: users.length,     color: "#3b82f6" },
                { label: "Employees",    value: employees.length, color: "#22c55e" },
                { label: "Admins",       value: admins.length,    color: "#f59e0b" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontWeight: 700, color, fontSize: "1rem" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Employees Table ── */}
      <div className="card" style={{ marginTop: 28 }}>
        <div className="card-header">
          <div>
            <h3>All Employees</h3>
            <p>{employees.length} employee{employees.length !== 1 ? "s" : ""} registered</p>
          </div>
        </div>

        {loading ? (
          <div className="loader-wrap"><div className="spinner" /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No employees registered yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((u, idx) => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</td>
                    <td>
                      <span className="badge assigned">👤 Employee</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deleting === u.id}
                        onClick={() => setModal(u)}
                      >
                        {deleting === u.id ? "…" : "🗑 Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={!!modal}
        title={`Delete "${modal?.name}"?`}
        body={
          <>
            You are about to permanently delete the employee account for{" "}
            <strong>{modal?.name}</strong> ({modal?.email}).
          </>
        }
        confirmLabel="Yes, Delete Employee"
        danger
        warningText="This action cannot be undone."
        warningDetail="The employee will lose all login access immediately."
        onConfirm={handleConfirmDelete}
        onCancel={() => setModal(null)}
      />
    </>
  );
}
