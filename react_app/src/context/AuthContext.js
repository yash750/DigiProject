import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY   = "am_access_token";
const REFRESH_KEY = "am_refresh_token";
const USER_KEY    = "am_user";
const ORG_KEY     = "am_org";

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });
  const [org,  setOrg]    = useState(() => { try { return JSON.parse(localStorage.getItem(ORG_KEY));  } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  useEffect(() => { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); }, [token]);
  useEffect(() => { user  ? localStorage.setItem(USER_KEY,  JSON.stringify(user))  : localStorage.removeItem(USER_KEY);  }, [user]);
  useEffect(() => { org   ? localStorage.setItem(ORG_KEY,   JSON.stringify(org))   : localStorage.removeItem(ORG_KEY);   }, [org]);

  const _setSession = (data) => {
    setToken(data.access_token);
    setUser(data.user);
    setOrg(data.organization || null);
    localStorage.setItem(REFRESH_KEY, data.refresh_token);
  };

  const silentRefresh = useCallback(async () => {
    const rt = localStorage.getItem(REFRESH_KEY);
    if (!rt) { setUser(null); setOrg(null); setToken(null); setLoading(false); return; }
    try {
      const res = await fetch("/auth/refresh", { method: "POST", headers: { Authorization: `Bearer ${rt}` } });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToken(data.access_token);
      const meRes = await fetch("/auth/me", { headers: { Authorization: `Bearer ${data.access_token}` } });
      if (meRes.ok) setUser(await meRes.json());
    } catch {
      setUser(null); setOrg(null); setToken(null);
      localStorage.removeItem(REFRESH_KEY);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (token) {
      fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.ok) return r.json(); throw new Error(); })
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => silentRefresh());
    } else { silentRefresh(); }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!token) return;
    refreshTimer.current = setInterval(silentRefresh, 50 * 60 * 1000);
    return () => clearInterval(refreshTimer.current);
  }, [token, silentRefresh]);

  const login = useCallback(async (email, password) => {
    const res  = await fetch("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    _setSession(data);
    return data.user;
  }, []); // eslint-disable-line

  const registerOrg = useCallback(async (payload) => {
    const res  = await fetch("/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    _setSession(data);
    return data.user;
  }, []); // eslint-disable-line

  const logout = useCallback(async () => {
    try { await fetch("/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch {}
    setToken(null); setUser(null); setOrg(null);
    [TOKEN_KEY, REFRESH_KEY, USER_KEY, ORG_KEY].forEach(k => localStorage.removeItem(k));
  }, [token]);

  // Called after profile update to refresh user in context
  const refreshUser = useCallback(async () => {
    const res = await fetch("/auth/profile", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setUser(data); setOrg(data.organization || org); }
  }, [token, org]);

  return (
    <AuthContext.Provider value={{ user, org, token, loading, login, registerOrg, logout, refreshUser, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
