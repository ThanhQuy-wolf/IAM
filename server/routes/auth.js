const router = require('express').Router();
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { hash, verify } = require('../services/hashService');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
  rotateRefreshToken,
  generateTempToken,
} = require('../services/tokenService');
const authenticate = require('../middleware/authenticate');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  const normalizedEmail = email.toLowerCase().trim();

  try {
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const passwordHash = await hash(password);
    const user = await User.create({ email: normalizedEmail, passwordHash });
    res.status(201).json({ message: 'Registered', userId: user._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use' });
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await verify(user.passwordHash, password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.isTwoFAEnabled) {
      const tempToken = generateTempToken(user._id);
      return res.status(200).json({ requiresTwoFA: true, tempToken });
    }

    user.lastLoginAt = new Date();
    await User.findByIdAndUpdate(user._id, { $set: { lastLoginAt: user.lastLoginAt } });

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

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const oldToken = req.cookies?.refreshToken;
  if (!oldToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    // rotateRefreshToken atomically deletes the old token before creating the new one,
    // so a stolen refresh token can only be used once — replay is detected on the second use.
    const result = await rotateRefreshToken(oldToken);
    if (!result) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    const { newToken, userId } = result;
    const user = await User.findById(userId).select('_id role email');
    if (!user) return res.status(401).json({ message: 'User not found' });

    const accessToken = generateAccessToken(user);
    setRefreshCookie(res, newToken);
    res.json({ accessToken });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await RefreshToken.deleteOne({ token }).catch(() => {});
  }
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -twoFASecret -backupCodes -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
