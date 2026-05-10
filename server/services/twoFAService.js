const crypto = require('crypto');
const argon2 = require('argon2');

function generateRawCodes(count = 10) {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString('hex'));
}

async function hashBackupCodes(rawCodes) {
  return Promise.all(rawCodes.map((code) => argon2.hash(code)));
}

async function verifyBackupCode(rawCode, hashedCodes) {
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await argon2.verify(hashedCodes[i], rawCode)) {
      return i; // caller removes this index from the array
    }
  }
  return -1;
}

module.exports = { generateRawCodes, hashBackupCodes, verifyBackupCode };
