const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const RP_NAME = process.env.RP_NAME || 'IAM Midterm';
const RP_ID = process.env.RP_ID || 'localhost';
const EXPECTED_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';

// In-memory challenge store: userId_string → base64url_challenge
const challengeStore = new Map();

async function generateRegOptions(user) {
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email || user._id.toString(),
    userID: Buffer.from(user._id.toString()),
    userDisplayName: user.email || user._id.toString(),
    excludeCredentials: user.webauthnCredentials.map((cred) => ({
      id: cred.credentialID.toString('base64url'),
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    attestation: 'none',
  });
  challengeStore.set(user._id.toString(), options.challenge);
  return options;
}

async function verifyRegResponse(userId, body) {
  const expectedChallenge = challengeStore.get(userId.toString());
  if (!expectedChallenge) throw new Error('Challenge not found — restart registration');

  const result = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: EXPECTED_ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: false,
  });

  if (result.verified) challengeStore.delete(userId.toString());
  return result;
}

async function generateAuthOptions(user) {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: user.webauthnCredentials.map((cred) => ({
      id: cred.credentialID.toString('base64url'),
      transports: cred.transports,
    })),
    userVerification: 'preferred',
  });
  challengeStore.set(user._id.toString(), options.challenge);
  return options;
}

async function verifyAuthResponse(userId, body, credential) {
  const expectedChallenge = challengeStore.get(userId.toString());
  if (!expectedChallenge) throw new Error('Challenge not found — restart login');

  const result = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: EXPECTED_ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: credential.credentialID,
      publicKey: credential.credentialPublicKey,
      counter: credential.counter,
      transports: credential.transports,
    },
    requireUserVerification: false,
  });

  if (result.verified) challengeStore.delete(userId.toString());
  return result;
}

module.exports = { generateRegOptions, verifyRegResponse, generateAuthOptions, verifyAuthResponse };
