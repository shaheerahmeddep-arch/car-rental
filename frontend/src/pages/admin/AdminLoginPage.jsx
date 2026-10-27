import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, sessionExpired, clearSessionExpired } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Read once: shows for a genuine token rejection (API 401) or a redirect
  // from the protected route, but not again on later visits.
  const [expired] = useState(() => Boolean(location.state?.expired) || sessionExpired);

  useEffect(() => {
    if (sessionExpired) clearSessionExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section max-w-[420px]">
      <h1>Admin login</h1>
      {expired && (
        <div className="admin-banner admin-banner-error mb-3 text-[0.9rem]">
          Your session expired (the saved login no longer matches the server) — please log in again.
        </div>
      )}
      <p className="text-[0.9rem] text-ink-muted">
        First time? Run <code className="rounded bg-surface px-1.5 py-0.5 text-[0.85em]">python manage.py seed_data</code> to create the default admin
        account — username <strong>admin</strong>, password <strong>admin123</strong>. Change it
        after logging in.
      </p>
      <form className="card card-static p-[26px]" onSubmit={handleSubmit}>
        <div className="field">
          <label>Username</label>
          <input type="text" required autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="field-error mb-3.5">{error}</p>}
        <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
