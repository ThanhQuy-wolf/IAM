const router = require('express').Router();
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const {
  generateAccessToken,
  generateRefreshToken,
  setRefreshCookie,
} = require('../services/tokenService');
const {
  generateRegOptions,
  verifyRegResponse,
  generateAuthOptions,
  verifyAuthResponse,
} = require('../services/webauthnService');

// GET /api/webauthn/credentials — list passkeys for the current user
router.get('/credentials', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const credentials = user.webauthnCredentials.map((cred) => ({
      id: cred.credentialID.toString('base64url'),
      transports: cred.transports,
      createdAt: cred._id?.getTimestamp?.() ?? null,
    }));
    res.json(credentials);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/webauthn/register/start — generate registration options
router.post('/register/start', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const options = await generateRegOptions(user);
    res.json(options);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /api/webauthn/register/finish — verify and save the new credential
router.post('/register/finish', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const result = await verifyRegResponse(req.user.id, req.body);
    if (!result.verified) return res.status(400).json({ message: 'Registration failed' });

    const { credential } = result.registrationInfo;
    // credential.id is a base64url string in v13 — decode to Buffer for storage
    const credIdBuffer = Buffer.from(credential.id, 'base64url');

    const alreadyExists = user.webauthnCredentials.some((c) =>
      c.credentialID.equals(credIdBuffer)
    );
    if (alreadyExists) return res.status(409).json({ message: 'Credential already registered' });

    user.webauthnCredentials.push({
      credentialID: credIdBuffer,
      credentialPublicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
    });
    await user.save();
    res.json({ message: 'Passkey registered' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /api/webauthn/login/start — public, accepts { email }
router.post('/login/start', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.webauthnCredentials.length === 0) {
      return res.status(404).json({ message: 'No passkeys registered for this account' });
    }
    const options = await generateAuthOptions(user);
    res.json({ ...options, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// POST /api/webauthn/login/finish — verify assertion, issue tokens
router.post('/login/finish', async (req, res) => {
  const { userId, ...assertionResponse } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId required' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const credIdBuffer = Buffer.from(assertionResponse.id, 'base64url');
    const credential = user.webauthnCredentials.find((c) =>
      c.credentialID.equals(credIdBuffer)
    );
    if (!credential) return res.status(401).json({ message: 'Credential not found' });

    const result = await verifyAuthResponse(userId, assertionResponse, credential);
    if (!result.verified) return res.status(401).json({ message: 'Authentication failed' });

    // Update counter to prevent replay attacks
    credential.counter = result.authenticationInfo.newCounter;
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.twoFASecret;
    delete userObj.backupCodes;
    delete userObj.__v;

    res.json({ accessToken, user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// DELETE /api/webauthn/credentials/:credentialId — remove a passkey
router.delete('/credentials/:credentialId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const credIdBuffer = Buffer.from(req.params.credentialId, 'base64url');
    const before = user.webauthnCredentials.length;
    user.webauthnCredentials = user.webauthnCredentials.filter(
      (c) => !c.credentialID.equals(credIdBuffer)
    );
    if (user.webauthnCredentials.length === before) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    await user.save();
    res.json({ message: 'Passkey removed' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
