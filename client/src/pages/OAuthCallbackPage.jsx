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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <span className="text-gray-500 text-sm">Signing you in…</span>
    </div>
  );
}
