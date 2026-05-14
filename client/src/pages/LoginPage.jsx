import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import OTPInput, { EMPTY_OTP } from '../components/OTPInput';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();

  const [pendingTwoFA, setPendingTwoFA] = useState(null); // { tempToken }
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

  const otpFilled = otp.every((d) => d !== '');
  const canSubmitTwoFA = useBackupCode ? backupCode.trim().length > 0 : otpFilled;

  if (pendingTwoFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold mb-1 text-center">Two-Factor Auth</h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            {useBackupCode ? 'Enter a backup code' : 'Enter the 6-digit code from your authenticator app'}
          </p>

          {useBackupCode ? (
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.trim())}
              placeholder="Backup code"
              className="w-full border rounded px-3 py-2 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <OTPInput value={otp} onChange={setOtp} />
          )}

          <button
            onClick={handleTwoFAVerify}
            disabled={!canSubmitTwoFA || verifying}
            className="mt-5 w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </button>

          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={() => { setUseBackupCode((v) => !v); setOtp([...EMPTY_OTP]); setBackupCode(''); }}
              className="text-xs text-blue-600 hover:underline"
            >
              {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
            </button>
            <button
              onClick={() => setPendingTwoFA(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">or</div>
          </div>
          <a
            href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/oauth/google`}
            className="mt-3 flex w-full items-center justify-center gap-2 border rounded py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </a>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
