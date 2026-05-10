# OAuth 2.0 — Study Notes

> Tài liệu tổng hợp cho báo cáo Midterm · Topic #1: Advanced IAM
> Course: WEB PROGRAMMING & APPLICATIONS · 503073

---

## 1. Khái niệm cốt lõi

### 4 Nhân vật

| Nhân vật | Ví dụ thực tế | Trách nhiệm |
|----------|--------------|------------|
| **Resource Owner** | User ngồi trước màn hình | Quyết định có cho phép hay không |
| **Client** | App web của nhóm | Xin quyền, dùng token để gọi API |
| **Authorization Server** | `accounts.google.com` | Xác thực user, cấp token |
| **Resource Server** | `photos.googleapis.com` | Chứa dữ liệu, kiểm tra token |

> Authorization Server và Resource Server tách biệt về khái niệm, dù cùng do Google vận hành.

### Access Token

- Chuỗi string gửi kèm mỗi request: `Authorization: Bearer <token>`
- **Ngắn hạn** (15 phút – 1 giờ) — giới hạn thiệt hại nếu bị lộ
- **Không phải password** — bị lộ token không lộ password, revoke token là đủ
- Hai dạng:
  - **Opaque**: Resource Server phải hỏi Authorization Server để verify — chậm hơn
  - **JWT**: Resource Server tự verify bằng public key — nhanh hơn, không cần round-trip

### Refresh Token

| | Access Token | Refresh Token |
|--|-------------|--------------|
| **Thời hạn** | Ngắn (15 phút – 1 giờ) | Dài (7–30 ngày) |
| **Gửi đến** | Resource Server mỗi request | Chỉ Authorization Server khi cần |
| **Lưu ở đâu** | Memory (không localStorage) | httpOnly cookie |
| **Nếu bị lộ** | Thiệt hại giới hạn ~15 phút | Nguy hiểm hơn — cần revoke ngay |

### Scope

- Danh sách quyền Client xin từ user — user thấy và đồng ý trên consent screen
- Nguyên tắc **Least Privilege**: chỉ xin đúng những gì cần
- Ví dụ dự án: `scope: ['openid', 'email', 'profile']`

---

## 2. Các Flow (Grant Types)

| Flow | Dùng khi nào | Có client_secret? |
|------|-------------|-------------------|
| **Authorization Code** | Web app có backend — an toàn nhất | Có |
| **Authorization Code + PKCE** | SPA / Mobile — không có backend bí mật | Không |
| **Client Credentials** | Server-to-server, không có user | Có |
| **Implicit** | Deprecated — không dùng nữa | Không |

**Dự án dùng Authorization Code flow** qua Passport.js.

### Tại sao Implicit bị deprecated?

Token được trả thẳng qua redirect URL → xuất hiện trong browser history, server logs, referer headers → dễ bị lộ.

### PKCE (Proof Key for Code Exchange)

Dành cho mobile/SPA không thể giữ bí mật `client_secret`:
- Tạo `code_verifier` (random string)
- Hash thành `code_challenge = SHA256(code_verifier)`
- Gửi `code_challenge` lúc xin code, gửi `code_verifier` lúc đổi token
- Authorization Server verify: `SHA256(code_verifier) == code_challenge`

---

## 3. Authorization Code Flow — Walkthrough

### Sơ đồ tổng quát

```
User click "Login Google"
      ↓
[1] App redirect → Google kèm client_id, scope, redirect_uri, state
      ↓
[2] Google hiển thị consent screen → User đồng ý
      ↓
[3] Google redirect về callback kèm ?code=AUTH_CODE&state=xyz
      ↓
[4] Backend đổi code + client_secret → access_token + refresh_token + id_token
      ↓
[5] Backend gọi Google API lấy profile (email, name, avatar)
      ↓
[6] Tạo/tìm user trong DB → Issue JWT của app → Redirect FE
```

### Chi tiết từng bước

**Bước 1 — Authorization URL:**
```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/api/oauth/google/callback
  &response_type=code
  &scope=openid email profile
  &state=random_string_xyz      ← chống CSRF
  &access_type=offline           ← xin cả refresh_token
```

**Bước 3 — Callback URL từ Google:**
```
https://yourapp.com/api/oauth/google/callback
  ?code=4/0AX4XfWh...            ← dùng 1 lần, tồn tại ~10 phút
  &state=random_string_xyz
```

**Bước 4 — Đổi code lấy token (ẩn, chỉ ở backend):**
```
POST https://oauth2.googleapis.com/token
  code=...
  client_id=...
  client_secret=...              ← không bao giờ ra FE
  redirect_uri=...
  grant_type=authorization_code
```

### Tại sao cần 2 bước (code → token)?

```
Nếu trả token thẳng qua URL  →  token lộ trong browser history ❌
Thay vào đó: trả code qua URL, backend đổi lấy token qua POST ẩn  ✅
```

### `state` parameter — chống CSRF

- Backend tạo `state` ngẫu nhiên, lưu vào session
- Khi callback về, kiểm tra `state` trong URL có khớp session không
- Không khớp → reject (có thể bị CSRF attack)

---

## 4. OAuth 2.0 vs Các Công Nghệ Liên Quan

### OAuth 2.0 vs OpenID Connect (OIDC)

| | OAuth 2.0 | OpenID Connect (OIDC) |
|--|-----------|----------------------|
| **Mục đích** | Authorization — "app được làm gì" | Authentication — "user là ai" |
| **Xây trên** | — | OAuth 2.0 |
| **Token thêm** | Access Token | ID Token (JWT) |
| **Scope bắt buộc** | Tuỳ | `openid` |

> "Login with Google" thực chất là **OIDC** — OAuth 2.0 + ID Token. Passport.js xử lý tự động.

**ID Token sau khi decode:**
```json
{
  "sub": "118234567890",
  "email": "user@gmail.com",
  "name": "Nguyen Van A",
  "iat": 1715000000,
  "exp": 1715003600
}
```

### OAuth 2.0 vs JWT

| | OAuth 2.0 | JWT |
|--|-----------|-----|
| **Là gì** | Protocol/Flow | Định dạng token |
| **Giải quyết** | Ai được phép làm gì | Cách đóng gói thông tin an toàn |

OAuth 2.0 **có thể dùng JWT** làm Access Token — nhưng đây là 2 tầng khác nhau.

### OAuth 2.0 vs Session-based Auth

| | Session | JWT |
|--|---------|-----|
| **Server lưu state?** | Có (DB/Redis) | Không (stateless) |
| **Scale ngang** | Khó — cần share session store | Dễ — không cần share gì |
| **Revoke ngay lập tức** | Dễ — xóa session trong DB | Khó — cần blocklist |
| **Phù hợp** | Monolith | Microservices, API + OAuth |

### OAuth 2.0 vs OAuth 1.0

OAuth 1.0 (2007) đã bị thay thế hoàn toàn — không cần học. Lý do bị bỏ:
- Phải ký từng request bằng HMAC — phức tạp, error-prone
- OAuth 2.0 đơn giản hơn nhờ dựa vào HTTPS thay vì crypto thủ công

---

## 5. Passport.js — Áp dụng vào Dự Án

### Cấu hình Strategy

```js
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/oauth/google/callback'   // phải khớp Google Cloud Console
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });

  if (!user) {
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
    });
  }

  done(null, user);   // null = không có lỗi
}));
```

**4 tham số callback:**
| Tham số | Ý nghĩa |
|---------|---------|
| `accessToken` | Token gọi Google API (thường không dùng) |
| `refreshToken` | Ít khi Google cấp |
| `profile` | Thông tin user — `profile.id`, `profile.emails[0].value`, `profile.displayName` |
| `done` | Báo Passport xong: `done(null, user)` hoặc `done(err)` |

### 2 Routes cần thiết

```js
// Route 1 — redirect sang Google
router.get('/google',
  passport.authenticate('google', { scope: ['openid', 'email', 'profile'] })
);

// Route 2 — Google callback về, issue JWT của app
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const accessToken = tokenService.signAccessToken(req.user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.redirect(`http://localhost:5173/oauth-callback?token=${accessToken}`);
  }
);
```

---

## 6. JWT — Cấu Trúc và Verify

### Cấu trúc: 3 phần base64url, nối bằng `.`

```
HEADER.PAYLOAD.SIGNATURE
```

**Header:**
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload — các claim quan trọng:**
```json
{
  "userId": "664123",
  "role": "admin",
  "iss": "yourapp.com",
  "iat": 1715000000,
  "exp": 1715003600,
  "jti": "unique-id-for-revoke"
}
```

> Payload **không được encrypt** — chỉ base64url encode. Không bao giờ bỏ password, secret vào payload.

**Thuật toán ký:**
| Thuật toán | Loại | Dùng khi nào |
|-----------|------|-------------|
| `HS256` | Symmetric (1 key) | Internal — đủ cho dự án này |
| `RS256` | Asymmetric (private/public key) | Public API, nhiều service verify |

### Quá trình Verify

```
1. Tách 3 phần: header, payload, signature
2. Verify signature: ký lại header+payload bằng secret, so sánh
3. Decode payload, check exp (hết hạn chưa?)
4. Gắn req.user = { userId, role }
```

```js
// Middleware authenticate
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message: msg });
  }
};
```

### Vấn đề Revoke và Giải Pháp

JWT stateless không thể revoke trước `exp`. Các giải pháp:

| Giải pháp | Khi nào dùng | Trade-off |
|-----------|-------------|-----------|
| Access Token ngắn hạn (15 phút) | Mặc định | Thiệt hại giới hạn theo thời gian |
| Redis blocklist (`jti`) | Ban user cụ thể | Cần thêm Redis, thêm lookup mỗi request |
| Đổi `JWT_SECRET` | Emergency — secret bị lộ | Logout toàn bộ user |

---

## 7. Tài Liệu Tham Khảo

| Chủ đề | Nguồn |
|--------|-------|
| OAuth 2.0 | RFC 6749 — https://datatracker.ietf.org/doc/html/rfc6749 |
| OAuth 2.0 | oauth.com — Aaron Parecki |
| JWT | RFC 7519 — https://datatracker.ietf.org/doc/html/rfc7519 |
| JWT | jwt.io playground |
| PKCE | RFC 7636 |
| OpenID Connect | https://openid.net/connect/ |
| Passport.js | https://www.passportjs.org/packages/passport-google-oauth20/ |
