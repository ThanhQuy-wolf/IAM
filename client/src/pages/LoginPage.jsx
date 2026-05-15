import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import OTPInput, { EMPTY_OTP } from '../components/OTPInput';

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z" />
    </svg>
  );
}

function FingerprintIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11c0 4 4.5 6.5 4.5 6.5" />
      <path d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3c0 5-5.5 8.5-5.5 8.5" />
      <path d="M8 9.5A6 6 0 0 1 12 8a6 6 0 0 1 6 6c0 3.5-2 6.5-4 8" />
      <path d="M5 12a7 7 0 0 1 1.5-4.3" />
      <path d="M5 12c0 5.5 4 10 7 11" />
      <path d="M12 5a9 9 0 0 1 9 9" />
      <path d="M3 12a9 9 0 0 1 1.8-5.4" />
    </svg>
  );
}

const brandHeader = (icon, title, subtitle) => (
  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 pt-8 pb-7 text-center">
    <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 shadow-inner">
      {icon}
    </div>
    <p className="text-base font-bold text-white">{title}</p>
    <p className="text-sm text-blue-100 mt-0.5">{subtitle}</p>
  </div>
);

export default function LoginPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const emailValue = watch('email');

  const [pendingTwoFA, setPendingTwoFA] = useState(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      if (res.data.requiresTwoFA) {
        setPendingTwoFA({ tempToken: res.data.tempToken });
        return;
      }
      login(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const handleTwoFAVerify = async () => {
    setVerifying(true);
    try {
      const payload = useBackupCode
        ? { tempToken: pendingTwoFA.tempToken, backupCode }
        : { tempToken: pendingTwoFA.tempToken, token: otp.join('') };
      const res = await api.post('/twofa/login-verify', payload);
      login(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
      setOtp([...EMPTY_OTP]);
      setBackupCode('');
    } finally {
      setVerifying(false);
    }
  };

  const handlePasskeyLogin = async () => {
    const email = emailValue?.trim();
    if (!email) { toast.error('Enter your email first'); return; }
    setPasskeyLoading(true);
    try {
      const { data } = await api.post('/webauthn/login/start', { email });
      const { userId, ...options } = data;
      const assertion = await startAuthentication({ optionsJSON: options });
      const res = await api.post('/webauthn/login/finish', { userId, ...assertion });
      login(res.data.user, res.data.accessToken);
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Authentication cancelled');
      } else {
        toast.error(err.response?.data?.message || 'Passkey login failed');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const otpFilled = otp.every((d) => d !== '');
  const canSubmitTwoFA = useBackupCode ? backupCode.trim().length > 0 : otpFilled;

  if (pendingTwoFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            {brandHeader(
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>,
              'Two-Factor Auth',
              useBackupCode ? 'Enter a backup code' : 'Enter the 6-digit code from your app'
            )}

            <div className="px-8 py-6 space-y-4">
              {useBackupCode ? (
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.trim())}
                  placeholder="e.g. a1b2c3d4"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <OTPInput value={otp} onChange={setOtp} />
              )}

              <button
                onClick={handleTwoFAVerify}
                disabled={!canSubmitTwoFA || verifying}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {verifying ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  onClick={() => { setUseBackupCode((v) => !v); setOtp([...EMPTY_OTP]); setBackupCode(''); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
                </button>
                <button
                  onClick={() => setPendingTwoFA(null)}
                  className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {brandHeader(
            <ShieldCheckIcon className="w-7 h-7 text-white" />,
            'Welcome back',
            'Sign in to SecureIAM'
          )}

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div className="text-left">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Password</label>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-gray-900 px-3 text-xs text-gray-400 dark:text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <a
                  href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/oauth/google`}
                  className="flex w-full items-center justify-center gap-2.5 border border-gray-200 dark:border-gray-700 rounded-lg py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </a>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={passkeyLoading || isSubmitting}
                  className="flex w-full items-center justify-center gap-2.5 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg py-2.5 text-sm text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FingerprintIcon className="w-4 h-4" />
                  {passkeyLoading ? 'Verifying…' : 'Sign in with Passkey'}
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              No account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
