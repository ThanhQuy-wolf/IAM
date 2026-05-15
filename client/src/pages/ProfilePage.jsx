import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { startRegistration } from '@simplewebauthn/browser';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TwoFASetupModal from '../components/TwoFASetupModal';

function TransportBadge({ transport }) {
  const styles = {
    internal: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    bluetooth: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    usb: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    nfc: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };
  const labels = { internal: 'Built-in', bluetooth: 'Bluetooth', usb: 'USB', nfc: 'NFC' };
  const cls = styles[transport] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {labels[transport] ?? transport}
    </span>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [addingPasskey, setAddingPasskey] = useState(false);

  useEffect(() => {
    api.get('/webauthn/credentials')
      .then((res) => setCredentials(res.data))
      .catch(() => setCredentials([]))
      .finally(() => setLoadingCreds(false));
  }, []);

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

  const handleAddPasskey = async () => {
    setAddingPasskey(true);
    try {
      const { data: options } = await api.post('/webauthn/register/start');
      const credential = await startRegistration({ optionsJSON: options });
      await api.post('/webauthn/register/finish', credential);
      toast.success('Passkey registered');
      const { data } = await api.get('/webauthn/credentials');
      setCredentials(data);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Registration cancelled');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleRemovePasskey = async (credentialId) => {
    if (!window.confirm('Remove this passkey?')) return;
    try {
      await api.delete(`/webauthn/credentials/${credentialId}`);
      setCredentials((prev) => prev.filter((c) => c.id !== credentialId));
      toast.success('Passkey removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove passkey');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Dashboard
        </Link>
        <span className="text-gray-300 dark:text-gray-700 select-none">/</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Profile</span>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">

          {/* Left — Account info */}
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-3 select-none">
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-all leading-snug">{user?.email}</p>
                <span className="mt-2 inline-block px-2.5 py-0.5 text-xs font-medium rounded-full capitalize bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  {user?.role}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Joined</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Security */}
          <div className="space-y-4">

            {/* 2FA card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Two-Factor Authentication</h2>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-left">
                  {user?.isTwoFAEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      Not configured
                    </span>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                    {user?.isTwoFAEnabled
                      ? 'TOTP is active — your account requires a 6-digit code on login'
                      : 'Add a second layer of security with Google Authenticator'}
                  </p>
                </div>
                {user?.isTwoFAEnabled ? (
                  <button
                    onClick={handleDisable}
                    disabled={disabling}
                    className="shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {disabling ? 'Disabling…' : 'Disable'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSetupModal(true)}
                    className="shrink-0 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Set Up
                  </button>
                )}
              </div>
            </div>

            {/* Passkeys card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11c0 4 4.5 6.5 4.5 6.5" />
                    <path d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3c0 5-5.5 8.5-5.5 8.5" />
                    <path d="M8.5 8A5.5 5.5 0 0 1 12 6.5a5.5 5.5 0 0 1 5.5 5.5c0 3-1.5 5.5-3.5 7" />
                  </svg>
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Passkeys</h2>
                </div>
                <button
                  onClick={handleAddPasskey}
                  disabled={addingPasskey}
                  className="text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  {addingPasskey ? 'Registering…' : '+ Add Passkey'}
                </button>
              </div>

              {loadingCreds ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-2 text-left">Loading…</p>
              ) : credentials.length === 0 ? (
                <div className="py-8 text-center">
                  <svg className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                    <path d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11c0 4 4.5 6.5 4.5 6.5" />
                    <path d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3c0 5-5.5 8.5-5.5 8.5" />
                    <path d="M8.5 8A5.5 5.5 0 0 1 12 6.5a5.5 5.5 0 0 1 5.5 5.5c0 3-1.5 5.5-3.5 7" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No passkeys registered</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add one to enable passwordless login</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {credentials.map((cred) => (
                    <li
                      key={cred.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate max-w-[160px]">
                          {cred.id.slice(0, 20)}…
                        </p>
                        {cred.transports?.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {cred.transports.map((t) => (
                              <TransportBadge key={t} transport={t} />
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePasskey(cred.id)}
                        className="shrink-0 text-xs text-red-500 hover:text-red-700 border border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 rounded px-2 py-1 transition-colors ml-3"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
