import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TwoFASetupModal from '../components/TwoFASetupModal';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const handleDisable = async () => {
    if (!window.confirm('Disable 2FA? Your account will be less secure.')) return;
    setDisabling(true);
    try {
      await api.delete('/twofa/disable');
      await refreshUser();
      toast.success('2FA disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <h1 className="text-xl font-bold">Profile</h1>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-4">

        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-base font-semibold">Account</h2>
          <dl className="space-y-1 text-sm text-gray-600">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700 w-20">Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700 w-20">Role</dt>
              <dd className="capitalize">{user?.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-700 w-20">Joined</dt>
              <dd>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-base font-semibold">Security</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.isTwoFAEnabled
                  ? 'TOTP is active — your account requires a 6-digit code on login'
                  : 'Add a second layer of security with Google Authenticator'}
              </p>
            </div>
            {user?.isTwoFAEnabled ? (
              <button
                onClick={handleDisable}
                disabled={disabling}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {disabling ? 'Disabling…' : 'Disable'}
              </button>
            ) : (
              <button
                onClick={() => setShowSetupModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-3 py-1.5 transition-colors"
              >
                Set Up
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Passkey / Biometric</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.webauthnCredentials?.length
                  ? `${user.webauthnCredentials.length} key(s) registered`
                  : 'Available in D10'}
              </p>
            </div>
          </div>
        </div>

      </main>

      {showSetupModal && (
        <TwoFASetupModal
          onClose={() => setShowSetupModal(false)}
          onEnabled={refreshUser}
        />
      )}
    </div>
  );
}
