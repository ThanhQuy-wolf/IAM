import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-4">
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-5 py-3 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <span className="font-medium">Admin Panel</span>
            <span>→</span>
          </Link>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-base font-semibold mb-3">Profile</h2>
          <dl className="space-y-1 text-sm text-gray-600">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700">Role</dt>
              <dd className="capitalize">{user?.role}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-base font-semibold mb-3">Security</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex justify-between">
              <span>Two-Factor Authentication</span>
              <span className={user?.isTwoFAEnabled ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {user?.isTwoFAEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Passkey / Biometric</span>
              <span className="text-gray-400">
                {user?.webauthnCredentials?.length
                  ? `${user.webauthnCredentials.length} key(s)`
                  : 'Not set up'}
              </span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-gray-400">Security settings available in D8–D10</p>
        </div>
      </main>
    </div>
  );
}
