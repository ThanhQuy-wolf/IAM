# PROJECT_PLAN — Midterm Topic #1: Advanced Identity & Access Management

> **Source of truth** — không sửa decisions trong file này nếu chưa qua team review.
> Course: WEB PROGRAMMING & APPLICATIONS · 503073
> Stack: React + Vite (FE) · Node.js + Express (BE)
> Team 2–3 · Deadline 14 ngày từ start

---

## 1. Timeline 14 ngày

### Tuần 1 — Core Auth Foundation

| Ngày | Backend Track | Frontend Track | Specialist Track | Blocking? |
|------|---------------|----------------|-------------------|-----------|
| D1 | Setup repo, MongoDB Atlas, `.env`, Express boilerplate, helmet/cors/rate-limit | Vite + Tailwind + react-router setup, layout skeleton | Đọc tài liệu OAuth 2.0 + WebAuthn | D1 phải xong trước Phase 1 |
| D2 | User model, RefreshToken model, hashService (Argon2) | AuthContext + axios interceptor | Tạo Google Cloud Project, lấy OAuth credentials | Song song |
| D3 | tokenService (JWT access + refresh + rotation), POST /register, POST /login cơ bản | RegisterPage form (react-hook-form + zod) | Setup passport-google-oauth20 config | Song song |
| D4 | POST /refresh, POST /logout, authenticate middleware, GET /me | LoginPage form, ProtectedRoute, DashboardPage skeleton | OAuth route GET /api/oauth/google + callback | Song song |
| D5 | RBAC: authorize middleware, seed admin user, GET /admin/users | OAuthCallback page, nút Login Google | Continue OAuth: link account khi email trùng | Song song |
| D6 | AdminPage backend: stats, role change, delete user | AdminPage UI (table users, role dropdown, stats) | Buffer / hỗ trợ debug | Song song |
| D7 | Integration test toàn bộ Tuần 1 — fix bug, KHÔNG thêm feature | Đảm bảo flow register → login → admin chạy mượt | Sync 3 người, demo nội bộ | Blocking |

### Tuần 2 — Advanced + Submission

| Ngày | Backend Track | Frontend Track | Specialist Track | Blocking? |
|------|---------------|----------------|-------------------|-----------|
| D8 | totpService (speakeasy), POST /twofa/setup, /twofa/verify-setup | TwoFAModal UI (6 ô OTP), ProfilePage section bảo mật | Backup codes logic + hash storage | Song song |
| D9 | Update POST /login branch theo isTwoFAEnabled, tempToken flow, /twofa/login-verify | Login flow nối TwoFAModal, hiển thị QR sau setup | Test 2FA bằng Google Authenticator thật | Song song |
| D10 | WebAuthn endpoints: register/start, register/finish, login/start, login/finish | ProfilePage section Biometric, list credentials | Cài mkcert chạy HTTPS localhost | HTTPS phải xong sớm |
| D11 | Feature freeze — chỉ fix bug | UI polish: dark mode, responsive, empty states, toast | Sync, integration test toàn dự án | Blocking |
| D12 | Code comments, README backend section | UI cuối: token counter, last login, error boundaries | Architecture diagrams (draw.io) | Song song |
| D13 | Đóng góp Implementation Detail | Đóng góp UI/UX rationale | Soạn báo cáo Word/PDF chính | Specialist drive |
| D14 | Quay video demo 15' (cả team nói) | README final + test credentials | Submit: nén code, upload video, nộp report | Blocking |

### Critical Path

```
D1 setup → D2 hashService → D3 login route → D7 integration test
                                                  ↓
                              D8 2FA → D9 branch → D11 freeze → D14 video
                                  ↓
                              D10 WebAuthn (cut-off D11 nếu chưa work)
```

---

## 2. Team Roles (3 người)

| Vai trò | Phụ trách | Tải |
|---------|-----------|-----|
| Backend Auth Core (A) | User model, hashService, tokenService, JWT middleware, RBAC, Admin API | ~95% |
| Frontend + UX Lead (B) | Toàn bộ UI, AuthContext, state, react-hook-form, dark mode, responsive | ~95% |
| Auth Specialist + Report Lead (C) | Google OAuth, 2FA TOTP, WebAuthn, HTTPS setup, báo cáo + diagrams | ~110% |

**Lưu ý**: Member C tải nặng nhất → A & B nhả 30% effort cuối Tuần 2 hỗ trợ viết report.

**Phương án 2 người** (nếu chỉ có 2): Cắt WebAuthn ngay từ đầu, chia full-stack backend-bias / full-stack frontend-bias + report.

---

## 3. Decisions đã chốt (LOCK — không đổi nếu chưa team review)

| # | Decision | Lựa chọn | Action D1 |
|---|----------|----------|-----------|
| 1 | Database | **MongoDB + Mongoose** | Đăng ký MongoDB Atlas free cluster, lấy connection string |
| 2 | WebAuthn | **Làm full, cut-off D11** | Member C đọc webauthn.guide D1-D2 |
| 3 | Deploy | **Vercel + Railway + Atlas** | Tạo Vercel + Railway account, link GitHub repo |
| 4 | UI Library | **shadcn/ui** | `npx shadcn@latest init`, cấu hình Vite path alias `@/*` |
| 5 | Token Storage | **Access in memory + Refresh httpOnly cookie** | cookie config: `{ httpOnly, secure, sameSite: 'strict', maxAge: 7d }` |
| 6 | Hashing | **argon2 → fallback bcryptjs** | D1 test `npm install argon2` trên cả 3 máy team |

### Defaults đã ghim sẵn (không cần chọn)

| Khía cạnh | Mặc định | Lý do |
|-----------|----------|-------|
| State management | React Context + useReducer | Đủ cho IAM scope, không cần Zustand/Redux |
| Form library | react-hook-form + zod | Best DX, validation strong, ít re-render |
| HTTP client | axios + interceptor | Interceptor refresh token tự động khi 401 |
| Notification | react-hot-toast | Lightweight, đẹp, 1 dòng setup |
| Logging backend | morgan (dev) + console structured (prod) | Không cần Winston |
| Testing | Skip unit test trừ tokenService | Deadline gấp |
| Email verification | Skip | Không có trong rubric |
| Package manager | npm | Đồng nhất giữa team |

---

## 4. MVP Cut-line

```
🟢 MUST-HAVE (điểm sàn ~6.5/10)
├─ Email/Password đăng ký + Argon2 (hoặc bcryptjs fallback)
├─ JWT access token + login/logout
├─ Protected route + middleware authenticate
├─ RBAC tối thiểu 2 role (user, admin)
├─ Admin page xem danh sách user
├─ README đầy đủ + test credentials
└─ Báo cáo cơ bản (theory + architecture + implementation)

🟡 SHOULD-HAVE (~8/10)
├─ Refresh token rotation + httpOnly cookie
├─ Google OAuth full flow
├─ 2FA TOTP với QR code
├─ Backup codes
├─ Comparative Analysis (Argon2 vs bcrypt, JWT vs Session)
└─ UI dark mode + responsive

🔵 NICE-TO-HAVE (~9–10/10)
├─ WebAuthn / Passkey
├─ Deploy production Vercel + Railway
├─ Rate limiting + helmet hardening
├─ Docker Compose
└─ Audit log (last login, IP)
```

### Thứ tự HI SINH nếu trễ tiến độ

1. D7 chưa xong MUST-HAVE → Hủy WebAuthn ngay, dồn 2FA + report
2. D9 2FA chưa work → Hủy WebAuthn + Deploy production, demo localhost
3. D11 vẫn còn bug → Cắt Docker, cắt audit log, freeze ngay
4. D13 báo cáo chưa xong → Cắt Comparative Analysis sâu

**Tuyệt đối không hi sinh**: README, test credentials, video, IEEE references — đây là -1đ trừ trực tiếp.

---

## 5. Risk Register (Top 5)

| # | Risk | KN | Tác động | Phòng tránh |
|---|------|----|----|-------------|
| R1 | argon2 native build fail trên Windows (thiếu VS Build Tools) | Cao | Block Phase 1 | D1 test ngay trên 3 máy. Fail → cài windows-build-tools / fallback bcryptjs / dùng @node-rs/argon2 |
| R2 | WebAuthn yêu cầu HTTPS, không chạy http://localhost | TB | Hủy Phase 4 WebAuthn | D8 setup mkcert trước, chạy https://localhost. Test register passkey D8 |
| R3 | Google OAuth callback mismatch / verification chặn | TB | Mất 1 ngày debug | D2 đăng ký Google Cloud Project, set Testing mode, add 2 email test users |
| R4 | Member C overload | Cao | Trễ video / report sơ sài | Daily standup 15', nếu trễ 2 ngày liên tiếp → A+B nhả task. D11 cả 3 cùng viết report |
| R5 | Quay video 15' cần 2-3 lần retake | TB | Trễ submission | D13 viết kịch bản, D14 sáng test record + audio, chiều quay chính |

### Risk dự bị

- Refresh token rotation logic sai → revoke nhầm token đang dùng → unit test tokenService D3
- Speakeasy time drift → set `window: 1` (cho phép ±30s)
- Đẩy `.env` thật lên GitHub → cài pre-commit hook `gitleaks` D1

---

## 6. Tài liệu học bắt buộc

| Sub-system | Docs |
|------------|------|
| OAuth 2.0 | RFC 6749 (https://datatracker.ietf.org/doc/html/rfc6749), oauth.com (Aaron Parecki), Passport.js Google strategy |
| JWT | RFC 7519, jwt.io playground, Auth0 Refresh Token Rotation |
| Password Hashing | RFC 9106 (Argon2), OWASP Password Storage Cheat Sheet, node-argon2 docs |
| TOTP / 2FA | RFC 6238, Speakeasy GitHub, Google Authenticator KeyUriFormat |
| WebAuthn | W3C WebAuthn Level 2, webauthn.guide, SimpleWebAuthn docs |
| RBAC | NIST RBAC Model, Auth0 RBAC vs ABAC |

**Yêu cầu**: D1-D2 mỗi member submit ghi chú ~200 từ về tài liệu mình đọc → raw material cho Theoretical Survey trong báo cáo.

---

## 7. Demo Script — Video 15 phút

| Mốc | Nội dung | Người nói | Thời lượng |
|-----|----------|-----------|------------|
| 0:00–1:30 | Intro: bài toán IAM hiện đại | Member A | 1.5' |
| 1:30–4:00 | Theory: OAuth, JWT, Argon2, TOTP, WebAuthn, RBAC | Member C | 2.5' |
| 4:00–6:00 | Architecture diagrams + sequence | Member C | 2' |
| 6:00–13:00 | Live Demo (chi tiết bên dưới) | Cả 3 luân phiên | 7' |
| 13:00–14:30 | Code walkthrough: Argon2, JWT rotation, RBAC, WebAuthn verify | Member A & B | 1.5' |
| 14:30–15:00 | Conclusion + hướng phát triển | Member B | 0.5' |

### Live Demo Flow (7 phút) — chạm 6 trụ cột rubric

```
6:00  DEMO 1 — Đăng ký + Argon2
      ▸ Register thành công, mở Compass show passwordHash $argon2id$
      ▸ Nhấn mạnh: "Argon2id, theo RFC 9106"

7:30  DEMO 2 — Login + JWT
      ▸ DevTools show access token IN MEMORY (không localStorage)
      ▸ Refresh token là httpOnly cookie
      ▸ Decode JWT trên jwt.io

8:30  DEMO 3 — Google OAuth
      ▸ Click Login Google → consent screen → callback → auto login
      ▸ Show DB: user mới với googleId

9:30  DEMO 4 — 2FA TOTP
      ▸ Profile → Bật 2FA, quét QR bằng Google Authenticator
      ▸ Logout, login → modal OTP → nhập từ điện thoại

11:00 DEMO 5 — WebAuthn
      ▸ Profile → Thêm passkey, quét vân tay
      ▸ Logout, login Biometric → "0 password, 0 OTP"

12:00 DEMO 6 — RBAC + Admin
      ▸ Login admin → Dashboard stats, đổi role, xoá user
      ▸ User thường → cố vào /admin → 403 Forbidden
```

### Tips quay video

- OBS Studio record màn hình + webcam góc phải
- Audio: tai nghe có mic, KHÔNG mic laptop
- Edit nối: DaVinci Resolve / CapCut
- Caption tiếng Anh — auto-generate YouTube rồi review
- D13 quay nháp 1 lần test, D14 sáng quay chính
- Pre-loaded data: 5 user mẫu, 1 admin, 1 user đã bật 2FA

---

## 8. Penalty Checklist (đừng mất điểm oan)

- [ ] Nộp đúng hạn (trễ 1 ngày = -1đ)
- [ ] Đủ 2–3 thành viên
- [ ] Báo cáo + video bằng **tiếng Anh** (-1đ nếu không)
- [ ] README có admin credentials đầy đủ (-1đ nếu thiếu)
- [ ] Không commit `.env` thật / API key lên GitHub
- [ ] IEEE citation format trong report
