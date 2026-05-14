const router = require('express').Router();
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const { generateSecret, generateQRCodeDataUrl, verifyToken } = require('../services/totpService');
const { generateRawCodes, hashBackupCodes, verifyBackupCode } = require('../services/twoFAService');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  verifyTempToken,
} = require('../services/tokenService');

// POST /api/twofa/login-verify — no authenticate middleware (user is not logged in yet)
router.post('/login-verify', async (req, res) => {
  const { tempToken, token, backupCode } = req.body;

  if (!tempToken) return res.status(400).json({ message: 'tempToken required' });

  const decoded = verifyTempToken(tempToken);
  if (!decoded) return res.status(401).json({ message: 'Session expired — please log in again' });

  if (!token && !backupCode) {
    return res.status(400).json({ message: 'TOTP token or backup code required' });
  }
  if (token && !/^\d{6}$/.test(token)) {
    return res.status(400).json({ message: 'Token must be a 6-digit number' });
  }

  try {
    const user = await User.findById(decoded.sub);
    if (!user || !user.isTwoFAEnabled) return res.status(401).json({ message: 'Invalid session' });

    if (token) {
      const valid = verifyToken(user.twoFASecret, token);
      if (!valid) return res.status(401).json({ message: 'Invalid token' });
    } else {
      const idx = await verifyBackupCode(backupCode, user.backupCodes);
      if (idx === -1) return res.status(401).json({ message: 'Invalid backup code' });
      const newCodes = user.backupCodes.filter((_, i) => i !== idx);
      await User.findByIdAndUpdate(user._id, { $set: { backupCodes: newCodes } });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.twoFASecret;
    delete userObj.backupCodes;
    delete userObj.__v;

    res.json({ accessToken, user: userObj });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// All routes below require authentication
router.use(authenticate);

// POST /api/twofa/setup
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
