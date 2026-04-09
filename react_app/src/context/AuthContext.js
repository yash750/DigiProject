import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY   = "am_access_token";
const REFRESH_KEY = "am_refresh_token";
const USER_KEY    = "am_user";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const refreshTimer          = useRef(null);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else       localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else      localStorage.removeItem(USER_KEY);
  }, [user]);

  const silentRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) { setUser(null); setToken(null); setLoading(false); return; }
    try {
      const res = await fetch("/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
      if (!res.ok) throw new Error("refresh failed");
      const data = await res.json();
      setToken(data.access_token);
      const meRes = await fetch("/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (meRes.ok) setUser(await meRes.json());
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem(REFRESH_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: validate existing session
  useEffect(() => {
    if (token) {
      fetch("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.ok) return r.json(); throw new Error("invalid"); })
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => silentRefresh());
    } else {
      silentRefresh();
    }
  }, []); // eslint-disable-line

  // Auto-refresh access token every 50 min (before 1h expiry)
  useEffect(() => {
    if (!token) return;
    refreshTimer.current = setInterval(silentRefresh, 50 * 60 * 1000);
    return () => clearInterval(refreshTimer.current);
  }, [token, silentRefresh]);

  const login = useCallback(async (email, password) => {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem(REFRESH_KEY, data.refresh_token);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* best-effort */ }
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
