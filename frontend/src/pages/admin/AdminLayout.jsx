import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/cars', label: 'Cars' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/settings', label: 'Categories & Payments' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/admins', label: 'Admins' },
];

function currentTitle(pathname) {
  if (pathname === '/admin/cars/new') return 'Add new car';
  if (/^\/admin\/cars\/\d+/.test(pathname)) return 'Edit car';
  const match = [...TABS].reverse().find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to)));
  return match ? match.label : 'Admin panel';
}

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  // No `state={{ expired: true }}` here: that message is only honest when the
  // server actually rejected the token (adminApi's 401 path sets the context
  // flag). A plain visit while logged out shouldn't claim the session expired.
  if (!admin) return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="container py-8 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
        <aside className="rounded-[14px] border border-line bg-surface p-4 lg:sticky lg:top-[92px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display text-base font-bold uppercase text-white">
                {admin.username.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="truncate font-display font-semibold text-ink">{admin.username}</div>
                <div className="text-[0.75rem] text-ink-muted">Administrator</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label="Toggle admin menu"
              className="grid h-10 w-10 place-items-center rounded-[8px] border border-line text-ink lg:hidden"
            >
              <span className="relative block h-3.5 w-[18px]">
                <span className={`absolute left-0 h-0.5 w-full rounded bg-current transition-all duration-[180ms] ${menuOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-full rounded bg-current transition-opacity duration-[180ms] ${menuOpen ? 'opacity-0' : 'opacity-100'}`} />
                <span className={`absolute left-0 h-0.5 w-full rounded bg-current transition-all duration-[180ms] ${menuOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>
          </div>

          <div className={`${menuOpen ? 'block' : 'hidden'} lg:block`}>
            <nav className="mt-4 flex flex-col gap-1 border-t border-line pt-4">
              {TABS.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `rounded-[8px] px-3.5 py-2.5 text-[0.9rem] font-semibold transition-colors duration-[180ms] ${
                      isActive ? 'bg-accent text-white' : 'text-ink-soft hover:bg-accent/10 hover:text-ink'
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
            <button onClick={handleLogout} className="btn btn-ghost mt-4 w-full py-2.5 text-[0.85rem]">
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <div className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-accent">Admin panel</div>
              <h1 className="m-0 text-[1.6rem]">{currentTitle(pathname)}</h1>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
