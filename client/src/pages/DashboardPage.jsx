import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useDarkMode from '../hooks/useDarkMode';

function SunIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function StatusBadge({ active, activeLabel, inactiveLabel }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        {activeLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700">
      {inactiveLabel}
    </span>
  );
}

function formatCountdown(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [isDark, toggleDark] = useDarkMode();
  const [sessionSeconds, setSessionSeconds] = useState(null);

  useEffect(() => {
    const token = window.__accessToken;
    if (!token) return;
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
      const payload = JSON.parse(atob(padded));
      const computeRemaining = () => Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
      setSessionSeconds(computeRemaining());
      const interval = setInterval(() => setSessionSeconds(computeRemaining()), 1000);
      return () => clearInterval(interval);
    } catch { /* invalid token format — don't show countdown */ }
  }, []);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">SecureIAM</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700 select-none">/</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          {sessionSeconds !== null && sessionSeconds > 0 && (
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 hidden sm:inline tabular-nums">
              Session {formatCountdown(sessionSeconds)}
            </span>
          )}
          {sessionSeconds !== null && sessionSeconds === 0 && (
            <span className="text-xs text-red-400 hidden sm:inline">Session expired</span>
          )}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-4">

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center justify-between bg-linear-to-r from-blue-600 to-indigo-700 rounded-xl px-5 py-4 group shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Admin Panel</p>
                <p className="text-xs text-blue-200 mt-0.5">Manage users and permissions</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0 select-none">
              {initial}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full capitalize bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {user?.role}
              </span>
              {user?.lastLoginAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Last login: {new Date(user.lastLoginAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Security</h2>
          </div>

          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Two-Factor Authentication</span>
              <StatusBadge active={user?.isTwoFAEnabled} activeLabel="Enabled" inactiveLabel="Disabled" />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Passkey / Biometric</span>
              {user?.webauthnCredentials?.length ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {user.webauthnCredentials.length} key{user.webauthnCredentials.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">Not set up</span>
              )}
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-left">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Manage security settings
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
