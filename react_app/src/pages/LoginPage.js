import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FieldError({ msg }) {
  return <span style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: 4, display: "block" }}>⚠ {msg}</span>;
}

export default function LoginPage() {
  const [tab, setTab]           = useState("login");   // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  // Register form
  const [regForm, setRegForm]   = useState({ org_name: "", name: "", email: "", password: "" });
  const [regErrors, setRegErrors] = useState({});

  const { login, registerOrg } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from || "/";

  // ── Login ──
  const handleLoginChange = (e) => {
    setLoginForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { setError("Both fields are required"); return; }
    setLoading(true);
    try {
      await login(loginForm.email.trim().toLowerCase(), loginForm.password);
      navigate(from, { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Register ──
  const validateReg = () => {
    const e = {};
    if (!regForm.org_name.trim())  e.org_name  = "Organization name is required";
    if (!regForm.name.trim())      e.name      = "Your name is required";
    if (!regForm.email.trim())     e.email     = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) e.email = "Enter a valid email";
    if (!regForm.password)         e.password  = "Password is required";
    else if (regForm.password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const handleRegChange = (e) => {
    setRegForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (regErrors[e.target.name]) setRegErrors(er => ({ ...er, [e.target.name]: undefined }));
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateReg();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setLoading(true);
    try {
      await registerOrg({
        org_name: regForm.org_name.trim(),
        name:     regForm.name.trim(),
        email:    regForm.email.trim().toLowerCase(),
        password: regForm.password,
      });
      navigate("/", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
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

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          {["login", "register"].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setRegErrors({}); }}
              style={{
                flex: 1, padding: "9px 0", background: "none", border: "none",
                borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent",
                color: tab === t ? "var(--primary)" : "var(--text-muted)",
                fontWeight: tab === t ? 600 : 400, fontSize: "0.88rem", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t === "login" ? "Sign In" : "Register Organization"}
            </button>
          ))}
        </div>

        {error && <div className="login-error" role="alert">⚠ {error}</div>}

        {/* ── Login Form ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" name="email" autoComplete="email" autoFocus
                value={loginForm.email} onChange={handleLoginChange} placeholder="you@company.com"
                style={error ? { borderColor: "var(--danger)" } : {}} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="login-pass-wrap">
                <input id="password" type={showPass ? "text" : "password"} name="password"
                  autoComplete="current-password" value={loginForm.password}
                  onChange={handleLoginChange} placeholder="••••••••"
                  style={error ? { borderColor: "var(--danger)" } : {}} />
                <button type="button" className="login-pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "11px" }}
              disabled={loading}>
              {loading ? <span className="login-spinner" /> : "Sign In"}
            </button>
          </form>
        )}

        {/* ── Register Form ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} noValidate>
            <div className="form-group">
              <label>Organization Name *</label>
              <input type="text" name="org_name" value={regForm.org_name} onChange={handleRegChange}
                placeholder='e.g. "Acme Corp"'
                style={regErrors.org_name ? { borderColor: "var(--danger)" } : {}} />
              {regErrors.org_name && <FieldError msg={regErrors.org_name} />}
            </div>
            <div className="form-group">
              <label>Your Full Name *</label>
              <input type="text" name="name" value={regForm.name} onChange={handleRegChange}
                placeholder='e.g. "Rahul Sharma"'
                style={regErrors.name ? { borderColor: "var(--danger)" } : {}} />
              {regErrors.name && <FieldError msg={regErrors.name} />}
            </div>
            <div className="form-group">
              <label>Admin Email *</label>
              <input type="email" name="email" value={regForm.email} onChange={handleRegChange}
                placeholder="admin@yourcompany.com"
                style={regErrors.email ? { borderColor: "var(--danger)" } : {}} />
              {regErrors.email && <FieldError msg={regErrors.email} />}
            </div>
            <div className="form-group">
              <label>Password *</label>
              <div className="login-pass-wrap">
                <input type={showPass ? "text" : "password"} name="password"
                  value={regForm.password} onChange={handleRegChange} placeholder="Min. 6 characters"
                  style={regErrors.password ? { borderColor: "var(--danger)" } : {}} />
                <button type="button" className="login-pass-toggle"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
              {regErrors.password && <FieldError msg={regErrors.password} />}
            </div>
            <button type="submit" className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "11px" }}
              disabled={loading}>
              {loading ? <span className="login-spinner" /> : "🏢 Create Organization"}
            </button>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
              You will be registered as the <strong>Admin</strong> of your organization.<br />
              Add employees from the Employees page after signing in.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
