import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import OTPInput, { EMPTY_OTP } from './OTPInput';

function StepDots({ current }) {
  return (
    <div className="flex items-center gap-2 justify-center pt-6 pb-2">
      {[1, 2].map((n) => (
        <div
          key={n}
          className={`rounded-full transition-all duration-300 ${
            current >= n
              ? 'w-6 h-2 bg-blue-600'
              : 'w-2 h-2 bg-gray-200 dark:bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

export default function TwoFASetupModal({ onClose, onEnabled }) {
  const [step, setStep] = useState('loading');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [backupCodes, setBackupCodes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    api.post('/twofa/setup')
      .then(({ data }) => {
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setSecret(data.secret);
        setStep('scan');
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to start 2FA setup');
        onClose();
      });
  }, [onClose]);

  const otpFilled = otp.every((d) => d !== '');

  const handleVerify = async () => {
    if (!otpFilled) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/twofa/verify-setup', { token: otp.join('') });
      setBackupCodes(data.backupCodes);
      setStep('codes');
      onEnabled();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code — try again');
      setOtp([...EMPTY_OTP]);
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret).then(() => toast.success('Copied!'));
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n')).then(() => toast.success('Copied!'));
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => toast.success('Code copied'));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden">

        {step === 'loading' && (
          <div className="p-12 flex flex-col items-center gap-4">
            <svg className="animate-spin w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">Setting up…</p>
          </div>
        )}

        {step === 'scan' && (
          <>
            <StepDots current={1} />

            <div className="px-6 pb-2">
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 text-center">Set Up Authenticator</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Scan the QR code with Google Authenticator</p>
            </div>

            <div className="px-6 pt-4 pb-6 space-y-5">
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40 rounded-lg block" />
                </div>
              </div>

              <div className="text-left">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Manual entry key</p>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5">
                  <code className="text-xs flex-1 break-all font-mono text-gray-700 dark:text-gray-200 leading-relaxed">{secret}</code>
                  <button
                    onClick={copySecret}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 shrink-0 font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="text-left space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Enter 6-digit code</p>
                <OTPInput value={otp} onChange={setOtp} />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!otpFilled || submitting}
                className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
              >
                {submitting ? 'Verifying…' : 'Enable 2FA'}
              </button>
            </div>
          </>
        )}

        {step === 'codes' && (
          <>
            <StepDots current={2} />

            <div className="px-6 pb-2 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/40 mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">2FA Enabled!</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Save these backup codes. Each can only be used once.</p>
            </div>

            <div className="px-6 pt-4 pb-6 space-y-4">
              <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  These codes will not be shown again. Store them somewhere safe.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((code) => (
                    <button
                      key={code}
                      onClick={() => copyCode(code)}
                      className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                    >
                      <code className="text-xs font-mono text-gray-700 dark:text-gray-200">{code}</code>
                      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={copyAllCodes}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 transition-colors"
                >
                  Copy All
                </button>
                <button
                  onClick={onClose}
                  className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
