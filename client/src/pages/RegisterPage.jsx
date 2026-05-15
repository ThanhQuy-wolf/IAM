import { useForm } from 'react-hook-form';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

function PasswordStrengthBar({ password }) {
  const len = (password || '').length;
  const strength = len === 0 ? 0 : len < 8 ? 1 : len < 12 ? 2 : 3;
  const segmentColors = [
    'bg-gray-200 dark:bg-gray-700',
    'bg-red-400',
    'bg-yellow-400',
    'bg-green-500',
  ];
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  const labelColors = ['', 'text-red-500', 'text-yellow-600 dark:text-yellow-400', 'text-green-600 dark:text-green-400'];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${strength >= i ? segmentColors[strength] : 'bg-gray-200 dark:bg-gray-700'}`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-xs ${labelColors[strength]}`}>{labels[strength]}</p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const passwordValue = watch('password');

  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/register', { email: data.email, password: data.password });
      toast.success('Account created — please sign in');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 pt-8 pb-7 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 shadow-inner">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-base font-bold text-white">Create your account</p>
            <p className="text-sm text-blue-100 mt-0.5">Join SecureIAM today</p>
          </div>

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
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="••••••••"
                />
                <PasswordStrengthBar password={passwordValue} />
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <div className="text-left">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Confirm password</label>
                <input
                  type="password"
                  {...register('confirm', {
                    required: 'Please confirm your password',
                    validate: (v) => v === watch('password') || 'Passwords do not match',
                  })}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  placeholder="••••••••"
                />
                {errors.confirm && <p className="text-red-500 text-xs mt-1.5">{errors.confirm.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
