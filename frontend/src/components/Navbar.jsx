import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/cars', label: 'Cars' },
  { to: '/categories', label: 'Categories' },
  { to: '/my-bookings', label: 'Bookings' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const { user, logout } = useAuth();

  // Admin auth
  const { admin, logout: adminLogout } = useAdminAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    // Normal user logout
    logout();

    // Admin logout
    adminLogout();

    // Close hamburger menu
    setOpen(false);

    // Go to home
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-nav backdrop-blur-[10px]">

      {/* Main Navbar */}
      <div className="container flex h-[72px] items-center justify-between">

        {/* Logo */}
        <NavLink
          to="/"
          onClick={() => setOpen(false)}
          aria-label="Shaheer Car Rental — Home"
          className="flex items-center gap-2.5 font-display text-[1.1rem] font-bold"
        >
          <img
            src="/logo-1.png"
            alt="Shaheer Car Rental"
            className="h-[35px] w-[40px] shrink-0 rounded-[10px]  object-cover"
          />

          <span className="whitespace-nowrap">
            Shaheer <em className="not-italic text-accent">Car Rental</em>
          </span>
        </NavLink>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Login / Register OR Logout */}
          {user || admin ? (
            <button
              onClick={handleLogout}
              className="rounded-full border border-line bg-transparent px-4 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Login / Register
            </NavLink>
          )}

          {/* Light / Dark */}
          <ThemeToggle />

          {/* Hamburger */}
          <button
            type="button"
            className="flex flex-col gap-[5px] border-none bg-transparent p-2"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
          >
            <span
              className={`h-0.5 w-[23px] rounded-[2px] bg-ink transition-all duration-300 ${
                open ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />

            <span
              className={`h-0.5 w-[23px] rounded-[2px] bg-ink transition-all duration-300 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />

            <span
              className={`h-0.5 w-[23px] rounded-[2px] bg-ink transition-all duration-300 ${
                open ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </button>

        </div>
      </div>

      {/* Hamburger Menu */}
      <div
        className={`border-t border-line bg-elevated transition-all duration-300 ${
          open
            ? 'max-h-[600px] opacity-100'
            : 'pointer-events-none max-h-0 overflow-hidden opacity-0'
        }`}
      >

        <nav className="container px-5 py-5">

          <div className="flex flex-col">

            {/* Main Links */}
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? 'border-b border-line py-3 font-medium text-accent'
                    : 'border-b border-line py-3 font-medium text-ink-soft transition hover:text-ink'
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Admin Panel */}
            {admin && (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? 'border-b border-line py-3 font-bold text-accent'
                    : 'border-b border-line py-3 font-bold text-ink-soft transition hover:text-accent'
                }
              >
                Admin Panel
              </NavLink>
            )}

          </div>

        </nav>
      </div>

    </header>
  );
}