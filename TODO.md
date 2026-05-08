# TODO — Midterm Topic #1: Advanced Identity & Access Management (IAM)
> Course: WEB PROGRAMMING & APPLICATIONS — 503073  
> Stack: React + Vite (Frontend) · Node.js + Express (Backend)  
> Target: Hệ thống xác thực đầy đủ — OAuth 2.0, JWT, 2FA (TOTP), WebAuthn, RBAC

---

## PHASE 0 — Project Setup

### Repository & Structure
- [ ] Tạo GitHub repo, invite thành viên, set branch protection trên `main`
- [x] Khởi tạo monorepo structure:
  ```
  midterm-topic1/
  ├── client/          ← React + Vite
  ├── server/          ← Node.js + Express
  ├── README.md
  └── .env.example
  ```
- [x] Viết `.env.example` với các biến:
  ```
  PORT=5000
  CLIENT_URL=http://localhost:5173
  MONGO_URI=mongodb://localhost:27017/iam_db
  JWT_ACCESS_SECRET=
  JWT_REFRESH_SECRET=
  JWT_ACCESS_EXPIRES=15m
  JWT_REFRESH_EXPIRES=7d
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_CALLBACK_URL=http://localhost:5000/api/oauth/google/callback
  SESSION_SECRET=
  ```
- [x] Setup `.gitignore` (node_modules, .env, dist, uploads/)

### Frontend — React + Vite
- [x] `npm create vite@latest client -- --template react`
- [x] Cài dependencies:
  ```bash
  npm install axios react-router-dom react-hook-form
  npm install @simplewebauthn/browser
  npm install react-hot-toast
  ```
- [x] Cài dev dependencies: `tailwindcss`, `postcss`, `autoprefixer` (Tailwind v4 + @tailwindcss/vite)
- [x] Setup TailwindCSS (v4: plugin trong vite.config.js + @import "tailwindcss" trong index.css)
- [x] Tạo cấu trúc thư mục:
  ```
  client/src/
  ├── components/
  │   ├── ProtectedRoute.jsx
  │   ├── Navbar.jsx
  │   ├── TwoFAModal.jsx
  │   └── QRCodeDisplay.jsx
  ├── context/
  │   └── AuthContext.jsx
  ├── hooks/
  │   └── useAuth.js
  ├── pages/
  │   ├── LoginPage.jsx
  │   ├── RegisterPage.jsx
  │   ├── DashboardPage.jsx
  │   ├── AdminPage.jsx
  │   ├── ProfilePage.jsx
  │   └── OAuthCallback.jsx
  ├── services/
  │   └── api.js
  └── App.jsx
  ```

### Backend — Node.js + Express
- [x] `npm init -y` trong thư mục `server/`
- [x] Cài dependencies:
  ```bash
  npm install express cors dotenv cookie-parser helmet express-rate-limit
  npm install mongoose uuid
  npm install passport passport-local passport-google-oauth20
  npm install jsonwebtoken
  npm install argon2
  npm install speakeasy qrcode
  npm install @simplewebauthn/server
  ```
- [x] Cài dev dependencies: `nodemon`
- [x] Tạo cấu trúc thư mục:
  ```
  server/
  ├── config/
  │   ├── db.js
  │   └── passport.js
  ├── middleware/
  │   ├── authenticate.js
  │   ├── authorize.js
  │   └── errorHandler.js
  ├── models/
  │   ├── User.js
  │   └── RefreshToken.js
  ├── routes/
  │   ├── auth.js
  │   ├── oauth.js
  │   ├── twofa.js
  │   └── admin.js
  ├── services/
  │   ├── tokenService.js
  │   ├── hashService.js
  │   └── totpService.js
  └── index.js
  ```

---

## PHASE 1 — Email/Password Auth với JWT

> Mục tiêu: Đăng ký / đăng nhập bằng email+password, hash Argon2, cấp JWT access + refresh token

### Backend — User Model & Hashing
- [ ] Trong `models/User.js`, định nghĩa Mongoose schema:
  - Các trường: `email`, `passwordHash`, `username`, `role` (`user`|`admin`|`moderator`), `isTwoFAEnabled`, `twoFASecret`, `webauthnCredentials[]`, `createdAt`
  - `role` mặc định là `user`
- [ ] Trong `models/RefreshToken.js`:
  - Các trường: `token` (string, indexed), `userId` (ref User), `expiresAt`, `isRevoked`
- [ ] Trong `services/hashService.js`:
  - Hàm `hashPassword(plain)` dùng `argon2.hash()` với config: `type: argon2id`, `memoryCost: 2**16`, `timeCost: 3`
  - Hàm `verifyPassword(plain, hash)` dùng `argon2.verify()`
- [ ] Trong `config/db.js`: kết nối Mongoose với `MONGO_URI`

### Backend — JWT Token Service
- [ ] Trong `services/tokenService.js`:
  - Hàm `generateAccessToken(userId, role)` → ký `JWT_ACCESS_SECRET`, expires `15m`, payload `{ sub: userId, role }`
  - Hàm `generateRefreshToken(userId)` → ký `JWT_REFRESH_SECRET`, expires `7d`, lưu hash vào DB
  - Hàm `rotateRefreshToken(oldToken)` → revoke token cũ, tạo token mới (refresh token rotation)
  - Hàm `revokeAllUserTokens(userId)` → đánh dấu `isRevoked: true` tất cả token của user

### Backend — Auth Routes
- [ ] Tạo `POST /api/auth/register`:
  - Validate email + password (tối thiểu 8 ký tự, có chữ hoa + số)
  - Kiểm tra email chưa tồn tại trong DB
  - Hash password bằng Argon2, lưu User mới với `role: 'user'`
  - Trả về `{ message: 'Registered successfully' }`
- [ ] Tạo `POST /api/auth/login`:
  - Tìm user theo email, gọi `verifyPassword()`
  - Nếu user bật 2FA → trả về `{ requiresTwoFA: true, tempToken }` (JWT ngắn 5 phút)
  - Nếu không → cấp `accessToken` (header) + `refreshToken` (httpOnly cookie)
- [ ] Tạo `POST /api/auth/refresh`:
  - Đọc `refreshToken` từ cookie
  - Verify, gọi `rotateRefreshToken()`, trả về `accessToken` mới
- [ ] Tạo `POST /api/auth/logout`:
  - Revoke refresh token hiện tại, xoá cookie

### Backend — Middleware xác thực
- [ ] Trong `middleware/authenticate.js`:
  - Đọc `Authorization: Bearer <token>` từ header
  - Verify bằng `jsonwebtoken.verify()` với `JWT_ACCESS_SECRET`
  - Gán `req.user = { id, role }` nếu hợp lệ, trả 401 nếu không
- [ ] Áp dụng `helmet()` và `express-rate-limit` (tối đa 20 req/phút cho auth routes)

### Frontend — Auth Context & Forms
- [ ] Tạo `AuthContext.jsx`:
  - State: `user` (object | null), `loading`
  - Hàm `login(email, password)` → gọi `POST /api/auth/login`, lưu `accessToken` vào memory (không localStorage)
  - Hàm `logout()` → gọi `POST /api/auth/logout`, xoá state
  - Hàm `refreshToken()` → gọi `POST /api/auth/refresh` để gia hạn access token
  - Axios interceptor: tự động gọi `refreshToken()` khi nhận 401
- [ ] Tạo `RegisterPage.jsx` với react-hook-form:
  - Fields: `username`, `email`, `password`, `confirmPassword`
  - Client-side validation khớp password
  - Toast thành công / lỗi
- [ ] Tạo `LoginPage.jsx`:
  - Fields: `email`, `password`
  - Nếu server trả `requiresTwoFA: true` → chuyển sang `TwoFAModal`
- [ ] Tạo `ProtectedRoute.jsx`:
  - Redirect về `/login` nếu `user === null`
  - Nhận prop `allowedRoles` để kiểm tra phân quyền

---

## PHASE 2 — OAuth 2.0 với Google

> Mục tiêu: Đăng nhập bằng Google, tự động tạo account nếu chưa có, liên kết với account email

### Backend — Passport.js Google Strategy
- [ ] Trong `config/passport.js`, cấu hình `passport-google-oauth20`:
  - `clientID`, `clientSecret`, `callbackURL` lấy từ `.env`
  - Trong callback: tìm user theo `email`
    - Nếu đã tồn tại → trả về user đó (liên kết tài khoản)
    - Nếu chưa có → tạo User mới với `passwordHash: null`, `role: 'user'`
  - Lưu `googleId` vào User model (thêm trường `oauthProviders: [{ provider, providerId }]`)
- [ ] Trong `routes/oauth.js`:
  - `GET /api/oauth/google` → `passport.authenticate('google', { scope: ['profile', 'email'] })`
  - `GET /api/oauth/google/callback` → xử lý callback, cấp JWT + refresh token, redirect về client kèm `accessToken` trong query param (chỉ dùng 1 lần, short-lived)
- [ ] Thêm `express-session` (chỉ dùng cho OAuth flow, không dùng cho session auth chính)

### Frontend — OAuth Flow
- [ ] Tạo nút "Đăng nhập với Google" trong `LoginPage.jsx`:
  - Redirect tới `GET /api/oauth/google`
- [ ] Tạo `OAuthCallback.jsx`:
  - Đọc `accessToken` từ query param URL
  - Lưu vào memory, gọi `GET /api/auth/me` để lấy thông tin user
  - Xoá token khỏi URL (`window.history.replaceState`)
  - Redirect về `/dashboard`
- [ ] Trong `ProfilePage.jsx`, hiển thị trạng thái:
  - Badge "Google Account" nếu user đăng nhập qua OAuth
  - Nếu chưa set password → hiển thị nút "Đặt mật khẩu" (để có thể login bằng email sau)

---

## PHASE 3 — Two-Factor Authentication (TOTP)

> Mục tiêu: Bật 2FA bằng Authenticator App (Google/Authy), verify TOTP khi login

### Backend — TOTP Setup & Verify
- [ ] Trong `services/totpService.js`:
  - Hàm `generateSecret(email)` → dùng `speakeasy.generateSecret({ name: \`IAM App (${email})\` })`  
    Trả về `{ secret: secret.base32, otpauthUrl: secret.otpauth_url }`
  - Hàm `verifyToken(secret, token)` → `speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 })`
- [ ] Tạo `POST /api/twofa/setup` (cần authenticate):
  - Gọi `generateSecret()`, lưu secret tạm vào user (trường `twoFASecretTemp`)
  - Dùng `qrcode.toDataURL(otpauthUrl)` tạo QR code base64
  - Trả về `{ qrCodeDataUrl, secret }` (để user nhập thủ công nếu camera không dùng được)
- [ ] Tạo `POST /api/twofa/verify-setup` (cần authenticate):
  - Nhận `{ token }` từ body
  - Gọi `verifyToken(twoFASecretTemp, token)`
  - Nếu hợp lệ: copy `twoFASecretTemp` → `twoFASecret`, bật `isTwoFAEnabled: true`, xoá temp
  - Trả về `{ success: true, backupCodes }` (tạo 8 backup codes ngẫu nhiên, hash và lưu DB)
- [ ] Tạo `POST /api/twofa/login-verify` (nhận `tempToken` từ Phase 1):
  - Verify `tempToken`, lấy userId
  - Gọi `verifyToken(user.twoFASecret, token)`
  - Nếu đúng → cấp access token + refresh token đầy đủ
- [ ] Tạo `DELETE /api/twofa/disable` (cần authenticate + xác nhận password):
  - Verify password lần nữa, đặt `isTwoFAEnabled: false`, xoá `twoFASecret`

### Frontend — 2FA UI
- [ ] Tạo `TwoFAModal.jsx` (hiện sau bước login nếu `requiresTwoFA: true`):
  - 6 ô nhập số OTP (auto-focus, tự chuyển ô)
  - Nút "Verify" gọi `POST /api/twofa/login-verify`
  - Nút "Dùng backup code" → input text thường
- [ ] Trong `ProfilePage.jsx`, section "Bảo mật 2 lớp":
  - Nếu chưa bật: nút "Bật 2FA"
    - Gọi `POST /api/twofa/setup` → hiển thị QR code + secret text
    - Ô nhập TOTP để confirm
  - Nếu đã bật: badge "2FA: Đang bật ✓", nút "Tắt 2FA" (yêu cầu nhập password)
  - Hiển thị backup codes một lần duy nhất sau khi setup thành công

---

## PHASE 4 — WebAuthn / Biometric & RBAC

> Mục tiêu: Đăng nhập bằng vân tay / Face ID, phân quyền RBAC theo role

### Backend — WebAuthn (FIDO2)
- [ ] Cài và import `@simplewebauthn/server`
- [ ] Thêm trường `webauthnCredentials` vào User model:
  ```js
  [{ credentialID: String, publicKey: Buffer, counter: Number, transports: [String] }]
  ```
- [ ] Tạo `POST /api/webauthn/register/start` (cần authenticate):
  - Gọi `generateRegistrationOptions()` với `rpName`, `rpID`, `userID`, `userName`
  - Lưu `challenge` tạm vào session/cache
  - Trả về `options` cho client
- [ ] Tạo `POST /api/webauthn/register/finish` (cần authenticate):
  - Nhận `response` từ client
  - Gọi `verifyRegistrationResponse()` với `challenge` đã lưu
  - Nếu hợp lệ → push credential mới vào `user.webauthnCredentials`
- [ ] Tạo `POST /api/webauthn/login/start`:
  - Nhận `email`, tìm user, lấy danh sách `allowCredentials`
  - Gọi `generateAuthenticationOptions()`, lưu challenge
  - Trả về `options`
- [ ] Tạo `POST /api/webauthn/login/finish`:
  - Gọi `verifyAuthenticationResponse()`, kiểm tra `counter` chống replay attack
  - Nếu hợp lệ → cấp access token + refresh token

### Backend — RBAC Middleware
- [ ] Trong `middleware/authorize.js`:
  ```js
  // Nhận danh sách role được phép, kiểm tra req.user.role
  const authorize = (...allowedRoles) => (req, res, next) => { ... }
  ```
- [ ] Tạo `routes/admin.js` với prefix `/api/admin` (tất cả route dùng `authenticate` + `authorize('admin')`):
  - `GET /api/admin/users` → lấy toàn bộ user (phân trang, filter theo role)
  - `PATCH /api/admin/users/:id/role` → thay đổi role của user
  - `DELETE /api/admin/users/:id` → xoá user
  - `GET /api/admin/stats` → thống kê: tổng user, user bật 2FA, user OAuth
- [ ] Tạo `GET /api/auth/me` (authenticate) → trả về thông tin user hiện tại (không có passwordHash)

### Frontend — WebAuthn UI
- [ ] Trong `LoginPage.jsx`, thêm nút "Đăng nhập bằng Biometric":
  - Gọi `POST /api/webauthn/login/start` → nhận options
  - Gọi `@simplewebauthn/browser` `startAuthentication(options)`
  - Gửi kết quả tới `POST /api/webauthn/login/finish`
- [ ] Trong `ProfilePage.jsx`, section "Biometric / Passkey":
  - Danh sách credential đã đăng ký (hiển thị thời gian tạo)
  - Nút "Thêm thiết bị mới" → chạy flow `register/start` + `register/finish`
  - Nút xoá từng credential

### Frontend — RBAC & Dashboard
- [ ] Tạo `DashboardPage.jsx`:
  - Hiển thị thông tin user, role badge
  - Section "Hoạt động gần đây" (last login, IP)
- [ ] Tạo `AdminPage.jsx` (chỉ role `admin` được vào):
  - Bảng danh sách user với cột: username, email, role, 2FA, createdAt
  - Dropdown thay đổi role, nút xoá user
  - Card thống kê (total users, 2FA enabled, OAuth users)
- [ ] `ProtectedRoute` kiểm tra `allowedRoles` và redirect về `/dashboard` nếu không đủ quyền

---

## PHASE 5 — Báo cáo, Video & Submission

### Báo cáo (Word + PDF — theo template khoa)
- [ ] **Introduction**: giới thiệu bài toán IAM, lý do chọn topic, tầm quan trọng của xác thực hiện đại
- [ ] **Theoretical Survey**:
  - [ ] OAuth 2.0: Authorization Code Flow, Access Token vs Refresh Token, scope
  - [ ] JWT: cấu trúc header/payload/signature, RS256 vs HS256, lưu ở đâu (memory vs cookie vs localStorage)
  - [ ] Password Hashing: MD5/SHA → bcrypt → Argon2id, tại sao Argon2 thắng
  - [ ] TOTP (RFC 6238): HOTP, time window, seed secret
  - [ ] WebAuthn/FIDO2: Relying Party, Authenticator, Attestation vs Assertion
  - [ ] RBAC: Role, Permission, Subject — so sánh với ABAC và ACL
  - [ ] So sánh: Session-based Auth vs JWT-based Auth (pros/cons bảng)
- [ ] **Architecture Design**:
  - [ ] System architecture diagram (draw.io hoặc Excalidraw)
  - [ ] Sequence diagram: Login flow (email/password + 2FA)
  - [ ] Sequence diagram: OAuth 2.0 Authorization Code Flow
  - [ ] Sequence diagram: WebAuthn Registration & Authentication
  - [ ] RBAC permission matrix (role × resource × action)
- [ ] **Implementation Detail**: giải thích code từng module chính (hashService, tokenService, passport config, WebAuthn handler)
- [ ] **Results & Discussion**: demo screenshots, security analysis, hạn chế
- [ ] **Conclusion**: tổng kết, hướng phát triển (MFA với SMS, SCIM provisioning)
- [ ] IEEE citation format cho tất cả references

### Video Presentation (tối đa 15 phút)
- [ ] **Phần 1 — Theory** (~4 phút): slide giải thích OAuth 2.0, JWT, Argon2, TOTP, WebAuthn, RBAC
- [ ] **Phần 2 — Architecture** (~3 phút): walk through system diagram + sequence diagrams
- [ ] **Phần 3 — Live Demo** (~6 phút):
  - [ ] Demo đăng ký + đăng nhập email/password
  - [ ] Demo đăng nhập Google OAuth (cửa sổ pop-up → redirect)
  - [ ] Demo bật 2FA: quét QR code bằng Google Authenticator, nhập OTP
  - [ ] Demo đăng nhập với 2FA (nhập OTP sau bước password)
  - [ ] Demo đăng nhập Biometric (WebAuthn fingerprint/Face ID)
  - [ ] Demo Admin panel: đổi role user, xem thống kê
- [ ] **Phần 4 — Code walkthrough** (~2 phút): show Argon2 hash, JWT middleware, RBAC authorize
- [ ] Tất cả thành viên đều nói (ghi chú thời lượng từng người)
- [ ] Audio rõ, caption phụ đề tiếng Anh nếu được

### Submission Checklist
- [x] `README.md` ở root có đầy đủ:
  - [x] Mô tả project và các tính năng IAM
  - [x] Prerequisites (Node.js >= 18, MongoDB, npm)
  - [x] Step-by-step setup instructions (cả client và server)
  - [x] `.env` template (các biến cần điền, hướng dẫn lấy Google OAuth credentials)
  - [x] Lệnh chạy: `cd server && npm run dev` / `cd client && npm run dev`
  - [ ] Test credentials (tài khoản admin sẵn có để chấm điểm) ← seed DB ở D5–D6
- [ ] GitHub repo public (hoặc add giảng viên làm collaborator)
- [ ] Code có comment giải thích ở các đoạn quan trọng (Argon2 config, JWT rotation, WebAuthn verify)
- [ ] Không commit `.env` thật lên GitHub
- [ ] Report nộp đúng template khoa, có đủ IEEE references
- [ ] Video upload lên YouTube/Drive, link dán vào report

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, TailwindCSS, react-hook-form, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Password Hashing | `argon2` (argon2id) |
| Auth Tokens | `jsonwebtoken` (JWT access + refresh token rotation) |
| OAuth 2.0 | `passport`, `passport-google-oauth20` |
| 2FA / TOTP | `speakeasy` + `qrcode` |
| WebAuthn / Biometric | `@simplewebauthn/server` (backend) + `@simplewebauthn/browser` (frontend) |
| Security Middleware | `helmet`, `express-rate-limit`, `cookie-parser` |
| Session (OAuth only) | `express-session` |

---

## Penalty Checklist (đừng để mất điểm oan)

- [ ] Nộp đúng hạn (trễ 1 ngày = -1đ)
- [ ] Đủ 2–3 thành viên
- [ ] Report & video bằng **tiếng Anh** (-1đ nếu không)
- [ ] Có `README.md` đầy đủ với admin credentials (-1đ nếu thiếu)
- [ ] Không để lộ API key / secret thật trong repo
