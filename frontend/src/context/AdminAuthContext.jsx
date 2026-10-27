import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';
const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    // Legacy key from when the session was kept in localStorage; removed so
    // a stale entry can't make the app act as if an admin is still logged in.
    try { localStorage.removeItem('shaheer-admin'); } catch { /* ignore */ }
    try {
      const raw = sessionStorage.getItem('shaheer-admin');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    // Safety net — login()/logout() already persist synchronously, this keeps
    // storage in sync if the state is ever changed from anywhere else.
    try {
      if (admin) sessionStorage.setItem('shaheer-admin', JSON.stringify(admin));
      else sessionStorage.removeItem('shaheer-admin');
    } catch {
      // ignore — session still works without persistence
    }
  }, [admin]);

  // adminApi dispatches this when the server rejects the stored token
  // (e.g. "Invalid token." after the database was reset). Clearing admin
  // here is what actually makes AdminLayout's guard send you to login —
  // adminApi clearing localStorage alone doesn't update this React state.
  useEffect(() => {
    const handleExpired = () => {
      setAdmin(null);
      setSessionExpired(true);
    };
    window.addEventListener('admin-session-expired', handleExpired);
    return () => window.removeEventListener('admin-session-expired', handleExpired);
  }, []);

  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/admin/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Login failed.');
    // Persist BEFORE setAdmin: the dashboard fires its first authenticated
    // request in a useEffect right after this state update renders, and that
    // request reads the token from sessionStorage. Persisting there (instead of
    // in an effect of our own) guarantees the token exists before any child
    // effect can run — otherwise the first call goes out unauthorized, gets a
    // 401, and the session-expired handler logs the admin straight back out.
    try { sessionStorage.setItem('shaheer-admin', JSON.stringify(data)); } catch { /* ignore */ }
    setSessionExpired(false);
    setAdmin(data);
    return data;
  };

  const logout = () => {
    try { sessionStorage.removeItem('shaheer-admin'); } catch { /* ignore */ }
    setSessionExpired(false);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ admin, login, logout, sessionExpired, clearSessionExpired: () => setSessionExpired(false) }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
