const argon2 = require('argon2');

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB — OWASP recommended minimum
  timeCost: 3,
  parallelism: 4,
};

async function hash(password) {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function verify(hashedPassword, plainPassword) {
  return argon2.verify(hashedPassword, plainPassword);
}

module.exports = { hash, verify };
