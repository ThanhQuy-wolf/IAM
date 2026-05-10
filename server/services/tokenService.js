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
  return generateRefreshToken(existing.userId);
}

module.exports = { generateAccessToken, generateRefreshToken, setRefreshCookie, rotateRefreshToken };
