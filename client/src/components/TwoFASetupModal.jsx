import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import OTPInput, { EMPTY_OTP } from './OTPInput';

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

        {step === 'loading' && (
          <div className="p-8 text-center text-sm text-gray-400">Setting up…</div>
        )}

        {step === 'scan' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b">
              <h2 className="text-base font-semibold">Set Up Two-Factor Authentication</h2>
              <p className="text-xs text-gray-500 mt-1">Step 1: Scan the QR code with Google Authenticator</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex justify-center">
                <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-44 h-44 rounded" />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Or enter the key manually:</p>
                <div className="flex items-center gap-2 bg-gray-50 border rounded px-3 py-2">
                  <code className="text-xs flex-1 break-all font-mono text-gray-700">{secret}</code>
                  <button onClick={copySecret} className="text-xs text-blue-500 hover:text-blue-700 shrink-0">
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Step 2: Enter the 6-digit code from your app</p>
                <OTPInput value={otp} onChange={setOtp} />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!otpFilled || submitting}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Verifying…' : 'Enable 2FA'}
              </button>
            </div>
          </>
        )}

        {step === 'codes' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b">
              <h2 className="text-base font-semibold">2FA Enabled!</h2>
              <p className="text-xs text-gray-500 mt-1">Save these backup codes. Each can only be used once.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-1">
                  {backupCodes.map((code) => (
                    <code key={code} className="text-xs font-mono text-gray-700 py-0.5">{code}</code>
                  ))}
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                These codes will not be shown again. Store them somewhere safe.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={copyAllCodes}
                  className="text-sm text-gray-600 hover:text-gray-800 border rounded-lg px-4 py-2 transition-colors"
                >
                  Copy All
                </button>
                <button
                  onClick={onClose}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
