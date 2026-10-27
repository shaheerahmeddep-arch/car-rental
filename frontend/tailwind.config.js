/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  // The app sets data-theme="dark"|"light" on <html>; semantic color tokens
  // below already resolve to per-theme CSS variables, so dark: variants are
  // rarely needed, but this keeps them consistent when they are.
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — each resolves to a CSS variable that changes
        // with [data-theme], so utilities like bg-surface / text-ink work
        // in both themes without dark: variants.
        bg: 'var(--bg)',
        elevated: 'var(--bg-elevated)',
        surface: 'var(--bg-card)',
        ink: 'var(--text-primary)',
        'ink-soft': 'var(--text-secondary)',
        'ink-muted': 'var(--text-muted)',
        line: 'var(--border-color)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        nav: 'var(--nav-bg)',
        brand: {
          100: '#fbe1e5',
          400: '#ef4a63',
          500: '#e2213f',
          600: '#c8102e',
          700: '#a50d26',
        },
        success: '#1c8a4c',
      },
      fontFamily: {
        display: ['Poppins', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        soft: 'var(--shadow-soft)',
        'accent-glow': '0 8px 20px rgba(200, 16, 46, 0.35)',
        'accent-glow-lg': '0 12px 26px rgba(200, 16, 46, 0.45)',
      },
      borderRadius: {
        field: '8px',
        panel: '14px',
        card: '22px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Route-enter transition: subtle fade + slide-up, replayed on every
        // navigation by remounting the route tree (see AnimatedRoutes).
        'page-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 700ms ease forwards',
        shimmer: 'shimmer 1.4s infinite',
        'fade-in': 'fade-in 200ms ease',
        'pop-in': 'pop-in 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'page-in': 'page-in 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
