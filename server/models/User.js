const mongoose = require('mongoose');

const webauthnCredentialSchema = new mongoose.Schema({
  credentialID: { type: Buffer, required: true },
  credentialPublicKey: { type: Buffer, required: true },
  counter: { type: Number, required: true, default: 0 },
  transports: [String],
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // Google OAuth
  googleId: { type: String, sparse: true },

  // GitHub OAuth
  githubId: { type: String, sparse: true },

  // 2FA TOTP
  isTwoFAEnabled: { type: Boolean, default: false },
  twoFASecret: { type: String },
  backupCodes: [String],

  // WebAuthn
  webauthnCredentials: [webauthnCredentialSchema],

  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
