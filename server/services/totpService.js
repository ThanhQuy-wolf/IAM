const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

function generateSecret(email) {
  return speakeasy.generateSecret({
    name: email,
    issuer: 'IAM App',
    length: 20,
  });
}

async function generateQRCodeDataUrl(otpauthUrl) {
  return qrcode.toDataURL(otpauthUrl);
}

function verifyToken(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}

module.exports = { generateSecret, generateQRCodeDataUrl, verifyToken };
