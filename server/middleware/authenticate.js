const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // Reject 2fa-pending tokens: they're issued mid-login solely for /twofa/login-verify,
    // never for protected API routes — accepting them would let a half-authenticated user
    // bypass the second factor entirely.
    if (decoded.type === '2fa-pending') return res.status(401).json({ message: 'Invalid token' });

    // Verify user still exists (handles deleted accounts within token lifetime)
    const exists = await User.exists({ _id: decoded.sub });
    if (!exists) return res.status(401).json({ message: 'User no longer exists' });

    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
