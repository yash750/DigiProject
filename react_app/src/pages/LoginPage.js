import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const from                    = location.state?.from || "/";

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Both fields are required"); return; }
    setLoading(true);
    try {
      await login(form.email.trim().toLowerCase(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <span className="login-brand-icon">🗂</span>
          <h1 className="login-brand-name">AssetTracker</h1>
          <p className="login-brand-sub">Shared Asset Management</p>
        </div>

        <h2 className="login-title">Sign in to your account</h2>

        {error && (
          <div className="login-error" role="alert">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              style={error ? { borderColor: "var(--danger)" } : {}}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="login-pass-wrap">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={error ? { borderColor: "var(--danger)" } : {}}
              />
              <button
                type="button"
                className="login-pass-toggle"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "11px" }}
            disabled={loading}
          >
            {loading ? <span className="login-spinner" /> : "Sign In"}
          </button>
        </form>

        <div className="login-hint">
          <strong>Demo credentials</strong><br />
          Admin: admin@company.com / admin123<br />
          Employee: rahul@test.com / password123
        </div>
      </div>
    </div>
  );
}
