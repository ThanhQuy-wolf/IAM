const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const RefreshToken = require('../models/RefreshToken');

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES }
  );
}

async function generateRefreshToken(userId) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({ token, userId, expiresAt });
  return token;
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function rotateRefreshToken(oldToken) {
  const existing = await RefreshToken.findOneAndDelete({ token: oldToken });
  if (!existing || existing.expiresAt < new Date()) return null;
  const newToken = await generateRefreshToken(existing.userId);
  return { newToken, userId: existing.userId };
}

function generateTempToken(userId) {
  return jwt.sign(
    { sub: userId.toString(), type: '2fa-pending' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
}

function verifyTempToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.type !== '2fa-pending') return null;
    return decoded;
  } catch {
    return null;
  }
}

module.exports = { generateAccessToken, generateRefreshToken, setRefreshCookie, rotateRefreshToken, generateTempToken, verifyTempToken };
