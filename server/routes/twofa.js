const router = require('express').Router();
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const { generateSecret, generateQRCodeDataUrl, verifyToken } = require('../services/totpService');
const { generateRawCodes, hashBackupCodes } = require('../services/twoFAService');

router.use(authenticate);

// POST /api/twofa/setup
// Generates a new TOTP secret, saves it (unconfirmed), returns QR code + secret
router.post('/setup', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isTwoFAEnabled) return res.status(400).json({ message: '2FA is already enabled' });

    const secret = generateSecret(user.email);
    user.twoFASecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await generateQRCodeDataUrl(secret.otpauth_url);
    res.json({ qrCodeDataUrl, secret: secret.base32 });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/twofa/verify-setup
// Verifies TOTP token, enables 2FA, issues backup codes
router.post('/verify-setup', async (req, res) => {
  const { token } = req.body;
  if (!token || !/^\d{6}$/.test(token)) {
    return res.status(400).json({ message: 'Token must be a 6-digit number' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isTwoFAEnabled) return res.status(400).json({ message: '2FA is already enabled' });
    if (!user.twoFASecret) return res.status(400).json({ message: 'Setup not initiated — call /setup first' });

    const valid = verifyToken(user.twoFASecret, token);
    if (!valid) return res.status(400).json({ message: 'Invalid token' });

    const rawCodes = generateRawCodes(10);
    const hashedCodes = await hashBackupCodes(rawCodes);

    user.isTwoFAEnabled = true;
    user.backupCodes = hashedCodes;
    await user.save();

    res.json({ backupCodes: rawCodes });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/twofa/login-verify — implemented in D9
router.post('/login-verify', (req, res) => res.json({ message: 'TODO' }));

// DELETE /api/twofa/disable
router.delete('/disable', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isTwoFAEnabled) return res.status(400).json({ message: '2FA is not enabled' });

    await User.findByIdAndUpdate(req.user.id, {
      $set: { isTwoFAEnabled: false, backupCodes: [] },
      $unset: { twoFASecret: 1 },
    });

    res.json({ message: '2FA disabled' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
