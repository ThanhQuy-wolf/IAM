# Advanced Identity & Access Management (IAM)

> Midterm Project — Web Programming & Applications (503073)  
> Stack: React + Vite · Node.js + Express · MongoDB Atlas

A full-featured authentication system implementing modern IAM patterns: OAuth 2.0, JWT with refresh token rotation, Two-Factor Authentication (TOTP), WebAuthn/Passkey, and Role-Based Access Control (RBAC).

## Features

- **Email/Password Auth** — Registration & login with Argon2id password hashing (RFC 9106)
- **JWT** — Short-lived access token (memory) + long-lived refresh token (httpOnly cookie) with rotation
- **Google OAuth 2.0** — Authorization Code Flow via Passport.js; auto-links existing accounts by email
- **2FA TOTP** — QR code setup with Google Authenticator / Authy (RFC 6238), backup codes
- **WebAuthn / Passkey** — Biometric login (fingerprint, Face ID) via SimpleWebAuthn
- **RBAC** — `user` / `admin` roles; admin panel for user management and stats

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Project with OAuth 2.0 credentials (for Google login)

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd Midterm
```

### 2. Configure environment variables

```bash
cp .env.example server/.env
```

Open `server/.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

### 3. Install & run the backend

```bash
cd server
npm install
npm run dev
```

Server starts at `http://localhost:5000`.

### 4. Install & run the frontend

```bash
cd client
npm install
npm run dev
```

Client starts at `http://localhost:5173`.

---

## Environment Variables

Create `server/.env` based on `.env.example`:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `5000`) |
| `CLIENT_URL` | Frontend URL (default: `http://localhost:5173`) |
| `MONGO_URI` | MongoDB connection string from Atlas |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRES` | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRES` | Refresh token expiry (default: `7d`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CALLBACK_URL` | `http://localhost:5000/api/oauth/google/callback` |
| `SESSION_SECRET` | Random string for express-session (OAuth flow only) |

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized redirect URI: `http://localhost:5000/api/oauth/google/callback`
6. Copy **Client ID** and **Client Secret** into `server/.env`

---

## Test Credentials

Pre-seeded accounts for grading:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@iam.dev` | `Admin@123456` |
| User | `user@iam.dev` | `User@123456` |

> The admin account has 2FA disabled by default for easy access during grading.

---

## Project Structure

```
midterm-topic1/
├── client/                 ← React + Vite frontend
│   └── src/
│       ├── api/            ← axios instance & API calls
│       ├── components/     ← ProtectedRoute, Navbar, TwoFAModal, etc.
│       ├── context/        ← AuthContext
│       ├── hooks/          ← useAuth
│       ├── pages/          ← LoginPage, RegisterPage, Dashboard, Admin, Profile
│       └── routes/         ← React Router config
├── server/                 ← Node.js + Express backend
│   ├── config/             ← db.js, passport.js
│   ├── middleware/         ← authenticate, authorize, errorHandler
│   ├── models/             ← User, RefreshToken
│   ├── routes/             ← auth, oauth, twofa, admin, webauthn
│   └── services/           ← hashService, tokenService, totpService
├── .env.example
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite, Tailwind CSS v4, react-hook-form, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Password Hashing | `argon2` (argon2id) |
| Auth Tokens | `jsonwebtoken` (JWT access + refresh token rotation) |
| OAuth 2.0 | `passport`, `passport-google-oauth20` |
| 2FA / TOTP | `speakeasy` + `qrcode` |
| WebAuthn | `@simplewebauthn/server` + `@simplewebauthn/browser` |
| Security | `helmet`, `express-rate-limit`, `cookie-parser` |
