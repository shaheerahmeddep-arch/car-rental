import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Page the user was on before being asked to log in (e.g. a car detail
  // page). Only same-site paths are honored, so a crafted `from` can't be
  // used to redirect people to an external site after login.
  const from = (() => {
    const f = location.state?.from;
    return typeof f === 'string' && f.startsWith('/') ? f : '/';
  })();

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(fullName, email, password);
      }
      navigate(from);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section max-w-[440px]">
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          className={`btn flex-1 ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => switchMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`btn flex-1 ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => switchMode('register')}
        >
          Register
        </button>
      </div>

      <form className="card p-[26px]" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="field-error mb-3.5">{error}</p>}

        <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
