import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function OAuthCallbackPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Guard against React StrictMode double-invocation
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const fragment = window.location.hash.slice(1); // strip leading '#'
    const params = new URLSearchParams(fragment);
    const token = params.get('token');

    if (!token) {
      // failureRedirect from passport goes to /login?error=oauth, not here.
      // Reaching this page without a token means direct/invalid navigation.
      navigate('/login', { replace: true });
      return;
    }

    // Clear the fragment immediately so a page refresh doesn't reuse the token
    window.history.replaceState(null, '', window.location.pathname);

    window.__accessToken = token;

    api.get('/auth/me')
      .then(({ data }) => {
        login(data, token);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        window.__accessToken = null;
        toast.error('Failed to load account');
        navigate('/login', { replace: true });
      });
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      <div className="flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
        </div>

        <svg className="animate-spin w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Signing you in…</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Please wait while we complete authentication</p>
        </div>
      </div>
    </div>
  );
}
