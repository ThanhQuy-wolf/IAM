# Advanced Identity & Access Management (IAM)

> Midterm Project — Web Programming & Applications (503073)  
> Stack: React + Vite · Node.js + Express · MongoDB Atlas

A full-featured authentication system implementing modern IAM patterns: OAuth 2.0, JWT with refresh token rotation, Two-Factor Authentication (TOTP), WebAuthn/Passkey, and Role-Based Access Control (RBAC).

## Features

- **Email/Password Auth** — Registration & login with Argon2id password hashing (RFC 9106)
- **JWT** — Short-lived access token (in-memory) + long-lived refresh token (httpOnly cookie) with rotation
- **Google OAuth 2.0** — Authorization Code Flow via Passport.js; auto-links existing accounts by email
- **2FA TOTP** — QR code setup with Google Authenticator / Authy (RFC 6238), backup codes
- **WebAuthn / Passkey** — Biometric/hardware key login via SimpleWebAuthn; register and manage passkeys from Profile
- **RBAC** — `user` / `admin` roles; admin panel for user management and stats

---

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Auth Flow](#auth-flow)
- [API Routes Map](#api-routes-map)
- [Data Models](#data-models)
- [Service & Middleware Layer](#service--middleware-layer)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Test Credentials](#test-credentials)

---

## Quick Start

### Prerequisites

- Node.js >= 18, npm >= 9
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Project with OAuth 2.0 credentials

### 1. Clone

```bash
git clone <repo-url>
cd Midterm
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Fill in required values — see Environment Variables section
```

### 3. Run backend

```bash
cd server
npm install
npm run seed      # creates admin@iam.dev with role:admin
npm run dev       # http://localhost:5000
```

### 4. Run frontend

```bash
cd client
npm install
npm run dev       # http://localhost:5173
```

---

## Environment Variables

`server/.env` (copy from `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `5000`) |
| `CLIENT_URL` | Yes | Frontend origin — `http://localhost:5173` |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens (min 32 chars) — currently unused in DB rotation flow |
| `JWT_ACCESS_EXPIRES` | No | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRES` | No | Refresh token TTL (default: `7d`) |
| `GOOGLE_CLIENT_ID` | OAuth | From Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth | From Google Cloud Console → Credentials |
| `GOOGLE_CALLBACK_URL` | OAuth | `http://localhost:5000/api/oauth/google/callback` |
| `SESSION_SECRET` | OAuth | Random string for express-session |

### Getting Google OAuth credentials

1. [Google Cloud Console](https://console.cloud.google.com/) → New project → APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client ID → Web application
3. Authorized redirect URI: `http://localhost:5000/api/oauth/google/callback`
4. Copy Client ID + Client Secret to `server/.env`

---

## Auth Flow

Token storage convention:
- **Access token** — stored in `window.__accessToken` (in-memory, never localStorage)
- **Refresh token** — httpOnly cookie (`refreshToken`, SameSite: strict, 7d)
- **Temp token** — in-memory only during 2FA challenge, expires in 5 min

### 1. Password Login (no 2FA)

```
Client  →  POST /api/auth/login { email, password }
Server     argon2.verify(passwordHash, password)
           generateAccessToken(user)          → JWT signed w/ JWT_ACCESS_SECRET, 15m
           generateRefreshToken(userId)       → UUID stored in RefreshToken collection
           setRefreshCookie(res, refreshToken)
Server  →  { accessToken, user }  +  Set-Cookie: refreshToken=<uuid>; HttpOnly
Client     window.__accessToken = accessToken
```

### 2. Password Login (2FA enabled)

```
Client  →  POST /api/auth/login { email, password }
Server     argon2.verify → OK, user.isTwoFAEnabled = true
           generateTempToken(userId)   → JWT { sub, type:'2fa-pending' }, 5m
Server  →  { requiresTwoFA: true, tempToken }

Client     shows OTP screen (6-digit or backup code)
Client  →  POST /api/twofa/login-verify { tempToken, token | backupCode }
Server     verifyTempToken(tempToken)  → checks signature + type:'2fa-pending'
           speakeasy.totp.verify(twoFASecret, token, window:1)
           OR argon2.verify(hashedBackupCode, backupCode) → removes used code
           generateAccessToken + generateRefreshToken
Server  →  { accessToken, user }  +  Set-Cookie: refreshToken=<uuid>; HttpOnly
```

### 3. Google OAuth

```
Client  →  GET /api/oauth/google
Server     passport.authenticate('google') → redirect to Google consent screen

Google  →  GET /api/oauth/google/callback?code=...
Server     GoogleStrategy: find user by googleId OR email
           if email exists but no googleId → link account (save googleId)
           if new user → create { email, googleId }
           generateAccessToken + generateRefreshToken
Server  →  redirect to CLIENT_URL/oauth/callback#token=<accessToken>

Client     OAuthCallbackPage reads token from URL fragment (never hits server logs)
           window.__accessToken = token
           GET /api/auth/me  → load user profile → dispatch SET_USER
```

### 4. Refresh Token Rotation

```
axios interceptor  →  receives 401 with Authorization header present
                   →  POST /api/auth/refresh  (sends refreshToken cookie)
Server     RefreshToken.findOneAndDelete({ token: oldToken })
           if not found or expired → return null → client dispatches auth:logout
           generateRefreshToken(userId)   → new UUID in DB
           setRefreshCookie(res, newToken)
Server  →  { accessToken }
Client     window.__accessToken = newToken.accessToken
           retry original failed request with new access token
```

### 5. Logout

```
Client  →  POST /api/auth/logout  (sends refreshToken cookie)
Server     RefreshToken.deleteOne({ token })
           res.clearCookie('refreshToken')
Server  →  { message: 'Logged out' }
Client     window.__accessToken = null  →  dispatch LOGOUT
```

---

## API Routes Map

Rate limit: `authLimiter` = 20 req / 60s on `/api/auth` and `/api/twofa`.

| Method | Path | Auth | Body / Params | Response |
|--------|------|------|---------------|----------|
| `POST` | `/api/auth/register` | None | `{ email, password }` | `{ message, userId }` |
| `POST` | `/api/auth/login` | None | `{ email, password }` | `{ accessToken, user }` or `{ requiresTwoFA, tempToken }` |
| `POST` | `/api/auth/refresh` | Cookie | — | `{ accessToken }` |
| `POST` | `/api/auth/logout` | Cookie | — | `{ message }` |
| `GET` | `/api/auth/me` | `authenticate` | — | User object (no secrets) |
| `GET` | `/api/oauth/google` | None | — | Redirect to Google |
| `GET` | `/api/oauth/google/callback` | None | `?code=...` | Redirect to frontend with `#token=` |
| `POST` | `/api/twofa/login-verify` | None (tempToken in body) | `{ tempToken, token }` or `{ tempToken, backupCode }` | `{ accessToken, user }` |
| `POST` | `/api/twofa/setup` | `authenticate` | — | `{ qrCodeDataUrl, secret }` |
| `POST` | `/api/twofa/verify-setup` | `authenticate` | `{ token }` | `{ backupCodes }` (10 codes, shown once) |
| `DELETE` | `/api/twofa/disable` | `authenticate` | — | `{ message }` |
| `GET` | `/api/admin/users` | `authenticate` + `authorize('admin')` | — | `[User]` (no secrets) |
| `GET` | `/api/admin/stats` | `authenticate` + `authorize('admin')` | — | `{ total, admins, twoFAEnabled, oauthUsers }` |
| `PATCH` | `/api/admin/users/:id/role` | `authenticate` + `authorize('admin')` | `{ role }` | Updated user |
| `DELETE` | `/api/admin/users/:id` | `authenticate` + `authorize('admin')` | — | `{ message }` |
| `GET` | `/api/webauthn/credentials` | `authenticate` | — | `[{ id, transports, createdAt }]` |
| `POST` | `/api/webauthn/register/start` | `authenticate` | — | WebAuthn registration options |
| `POST` | `/api/webauthn/register/finish` | `authenticate` | Credential attestation object | `{ message }` |
| `POST` | `/api/webauthn/login/start` | None | `{ email }` | WebAuthn authentication options + `userId` |
| `POST` | `/api/webauthn/login/finish` | None | `{ userId, ...assertion }` | `{ accessToken, user }` |
| `DELETE` | `/api/webauthn/credentials/:id` | `authenticate` | — | `{ message }` |

---

## Data Models

### User (`server/models/User.js`)

| Field | Type | Notes |
|-------|------|-------|
| `email` | String | Required, unique, lowercase + trim enforced at schema level |
| `passwordHash` | String | Argon2id hash. `null` for Google-only accounts |
| `role` | String | `'user'` (default) or `'admin'` |
| `googleId` | String | Sparse index. Present only if user authenticated via Google |
| `isTwoFAEnabled` | Boolean | `false` by default |
| `twoFASecret` | String | Base32 speakeasy secret. **Never returned by any API** |
| `backupCodes` | [String] | Array of 10 argon2id-hashed codes. Consumed on use |
| `webauthnCredentials` | [Object] | Array of `{ credentialID, credentialPublicKey, counter, transports }` |
| `lastLoginAt` | Date | Timestamp of most recent successful login (password, OAuth, 2FA, or passkey). `null` until first login after D12 |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### RefreshToken (`server/models/RefreshToken.js`)

| Field | Type | Notes |
|-------|------|-------|
| `token` | String | UUID v4 (plain text — used as DB lookup key for rotation) |
| `userId` | ObjectId | Ref to User |
| `expiresAt` | Date | `Date.now() + 7d` — checked on rotation, stale tokens auto-prunable |

---

## Service & Middleware Layer

### Services (`server/services/`)

| Service | Responsibility |
|---------|---------------|
| `hashService` | `hash(password)` → argon2id hash · `verify(hash, password)` → boolean |
| `tokenService` | `generateAccessToken(user)` → JWT 15m · `generateRefreshToken(userId)` → UUID in DB · `generateTempToken(userId)` → JWT 5m with `type:'2fa-pending'` · `rotateRefreshToken(oldToken)` → atomic delete + create |
| `totpService` | `generateSecret(email)` → speakeasy secret + otpauth URL · `generateQRCodeDataUrl(url)` → base64 PNG · `verifyToken(secret, token)` → boolean (window: 1 = ±30s drift) |
| `twoFAService` | `generateRawCodes(10)` → 10 × 5-byte hex strings · `hashBackupCodes(codes)` → argon2id array · `verifyBackupCode(raw, hashed[])` → index or -1 |

### Middleware stack (request order in `server/index.js`)

```
helmet()                         ← security headers (CSP, HSTS, X-Frame, etc.)
cors({ origin, credentials })    ← allow CLIENT_URL with cookies
express.json()                   ← parse JSON body
passport.initialize()            ← OAuth strategy init (stateless, session: false)
cookieParser()                   ← parse refreshToken cookie

authLimiter (20/min)             ← on /api/auth and /api/twofa routes only
→ routes/auth.js
→ routes/oauth.js
→ routes/twofa.js
→ routes/admin.js
→ routes/webauthn.js

errorHandler                     ← catch-all 500
```

### Route-level middleware

```
authenticate   →  verify JWT (rejects type:'2fa-pending') → populates req.user
authorize(...roles)  →  checks req.user.role ∈ allowedRoles → 403 if not
```

---

## Project Structure

```
Midterm/
├── client/                     ← React + Vite frontend
│   └── src/
│       ├── api/
│       │   └── axios.js        ← axios instance, access token interceptor, 401 retry
│       ├── components/
│       │   ├── OTPInput.jsx    ← 6-box OTP input with paste + backspace handling
│       │   ├── ProtectedRoute.jsx
│       │   └── TwoFASetupModal.jsx
│       ├── context/
│       │   └── AuthContext.jsx ← useReducer state, login/logout/restoreSession
│       └── pages/
│           ├── LoginPage.jsx   ← email/password form + 2FA challenge screen
│           ├── RegisterPage.jsx
│           ├── DashboardPage.jsx
│           ├── ProfilePage.jsx ← 2FA enable/disable UI
│           ├── AdminPage.jsx
│           ├── OAuthCallbackPage.jsx
│           └── ProfilePage.jsx         ← 2FA enable/disable + passkey management
├── server/
│   ├── config/
│   │   ├── db.js               ← mongoose.connect
│   │   └── passport.js         ← GoogleStrategy (link by email or googleId)
│   ├── middleware/
│   │   ├── authenticate.js     ← JWT verify + type guard + user exists check
│   │   ├── authorize.js        ← role-based access control
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── RefreshToken.js
│   ├── routes/
│   │   ├── auth.js             ← register, login, refresh, logout, me
│   │   ├── oauth.js            ← Google OAuth initiate + callback
│   │   ├── twofa.js            ← login-verify, setup, verify-setup, disable
│   │   ├── admin.js            ← users list, stats, role change, delete
│   │   └── webauthn.js         ← TODO stubs (D10)
│   ├── scripts/
│   │   └── seedAdmin.js        ← creates admin@iam.dev
│   └── services/
│       ├── hashService.js
│       ├── tokenService.js
│       ├── totpService.js
│       ├── twoFAService.js
│       └── webauthnService.js          ← SimpleWebAuthn v13 wrapper, in-memory challenge store
├── .env.example
├── CLAUDE.md
├── PROJECT_PLAN.md
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite, Tailwind CSS v4, react-hook-form, react-hot-toast, react-router-dom v7 |
| Backend | Node.js, Express.js v5 |
| Database | MongoDB + Mongoose |
| Password Hashing | `argon2` (Argon2id, RFC 9106) |
| Auth Tokens | `jsonwebtoken` — access token (JWT) + refresh token (UUID in DB) |
| OAuth 2.0 | `passport`, `passport-google-oauth20` |
| 2FA / TOTP | `speakeasy` + `qrcode` |
| WebAuthn | `@simplewebauthn/server` + `@simplewebauthn/browser` |
| Security | `helmet`, `express-rate-limit`, `cookie-parser` |

---

## Test Credentials

Seed the admin account with:

```bash
cd server && npm run seed
```

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@iam.dev` | `Admin@1234` | Seeded by `npm run seed` |
| User | `user@iam.dev` | `User@123456` | Register manually or pre-loaded |

> The admin account has 2FA disabled by default for easy grading access.  
> To test 2FA: register a new account → Profile → Set Up 2FA → scan QR with Google Authenticator.
