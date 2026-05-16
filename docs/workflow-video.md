# Workflow Quay Video Demo & Thuyết Trình

> **Đề tài:** Advanced Identity & Access Management (IAM)
> **Key Points:** OAuth 2.0 · JWT · Biometric Authentication (WebAuthn) · Role-Based Access Control (RBAC)
> **Demo:** Login system với Google OAuth, 2FA (Authenticator App), password hashing Argon2id, WebAuthn/Passkey, RBAC.
> **Thời lượng video:** Tối đa **15 phút** · **2 thành viên** đều phải nói.

---

## ⚠️ Lưu ý quan trọng trước khi quay (đọc kỹ)

| Vấn đề | Thực tế trong codebase | Cách xử lý khi thuyết trình |
|---|---|---|
| Google **& GitHub** OAuth | Đã có **cả hai**: `server/config/passport.js` có `GoogleStrategy` + `GitHubStrategy`; route `/api/oauth/google` và `/api/oauth/github`; UI có 2 nút. | Demo lần lượt cả hai nút. Cần đăng ký **GitHub OAuth App** và điền `GITHUB_CLIENT_ID/SECRET/CALLBACK_URL` vào `server/.env` (xem Chuẩn bị). |
| "Biometric authentication" | Đã có **WebAuthn/Passkey** (`server/routes/webauthn.js`, SimpleWebAuthn) — đăng nhập bằng vân tay/Windows Hello. | Đây chính là phần "biometric" — demo trên máy có vân tay hoặc Windows Hello. Nếu máy không hỗ trợ, dùng passkey ảo của Chrome DevTools (xem mục Chuẩn bị). |
| Password hashing | **Argon2id** (`server/services/hashService.js`), tham số OWASP: 64MB memory, timeCost 3. | Mở file này show trực tiếp khi nói về hashing. |

> GitHub OAuth chỉ chạy khi đã điền đủ biến môi trường `GITHUB_*`. **Kiểm tra đăng nhập GitHub chạy được trước khi quay** — nếu chưa cấu hình kịp, mới quay về phương án chỉ demo Google.

---

## 1. Phân công 2 thành viên

| | **Người A** | **Người B** |
|---|---|---|
| **Vai trò** | Dẫn dắt, lý thuyết nền tảng, demo luồng cơ bản | Kiến trúc, bảo mật nâng cao, demo nâng cao |
| **Phụ trách lý thuyết** | OAuth 2.0, JWT | WebAuthn (biometric), RBAC, Argon2 |
| **Phụ trách demo** | Register + Login + Argon2 + JWT inspect | 2FA setup/login + Google OAuth + Passkey + RBAC/Admin |
| **Tổng thời lượng nói** | ~7 phút | ~7 phút |

Mở đầu và kết luận: **cả hai cùng xuất hiện/nói**.

---

## 2. Checklist chuẩn bị TRƯỚC khi bấm ghi hình

**Môi trường chạy (theo README):**

- [ ] Backend chạy: `cd server` → `npm install` → `npm run seed` → `npm run dev` (http://localhost:5000)
- [ ] Frontend chạy: `cd client` → `npm install` → `npm run dev` (http://localhost:5173)
- [ ] `server/.env` đã điền đủ: `MONGO_URI`, `JWT_ACCESS_SECRET`, `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL`, `SESSION_SECRET`
- [ ] MongoDB Atlas kết nối OK (xem log server không báo lỗi DB)
- [ ] `npm run seed` đã tạo sẵn tài khoản admin: **`admin@iam.dev`** (role: `admin`)

**Tài khoản & công cụ:**

- [ ] 1 tài khoản Google thật + 1 tài khoản GitHub thật (để demo OAuth) — đã đăng nhập sẵn trên trình duyệt
- [ ] **GitHub OAuth App** đã đăng ký (github.com → Settings → Developer settings → OAuth Apps), callback `http://localhost:5000/api/oauth/github/callback`; `GITHUB_CLIENT_ID/SECRET/CALLBACK_URL` đã điền vào `server/.env`
- [ ] Điện thoại có app **Google Authenticator / Authy** (để demo 2FA), pin đầy, sạc sẵn
- [ ] Máy quay có **vân tay/Windows Hello** HOẶC bật **Virtual Authenticator** trong Chrome DevTools (`F12` → `⋮` → More tools → WebAuthn → Enable virtual authenticator) để demo Passkey không cần phần cứng
- [ ] Tài khoản user thường để demo RBAC (đăng ký mới trong lúc demo cũng được)
- [ ] DB sạch/đủ data mẫu — xoá user test cũ nếu cần để demo register không bị lỗi "Email already in use"

**Quay phim:**

- [ ] Phần mềm quay màn hình + mic (OBS / Camtasia / Loom), test âm thanh trước
- [ ] Độ phân giải **1080p**, phóng to trình duyệt/editor đủ lớn để chữ đọc được
- [ ] Mở sẵn các tab/file cần dùng (xem từng đoạn bên dưới) để không loay hoay tìm trên camera
- [ ] Slide lý thuyết (3–5 slide) đã chuẩn bị
- [ ] Tắt thông báo (email, chat) trên máy quay
- [ ] Quay thử 1 phút kiểm tra tiếng + hình trước khi quay thật

---

## 3. Timeline kịch bản chi tiết (mốc phút)

> Mỗi đoạn ghi rõ: **Ai nói** · **Lời thoại (script)** · **Màn hình / thao tác**.

### 🟢 00:00 – 01:00 — Mở đầu (Người A + B)

- **Ai nói:** Người A mở đầu, Người B tự giới thiệu.
- **Lời thoại (A):** *"Xin chào thầy/cô và các bạn. Nhóm chúng em xin trình bày đề tài Advanced Identity and Access Management — hệ thống quản lý định danh và truy cập hiện đại. Em là [A], phụ trách phần OAuth, JWT và demo luồng đăng nhập cơ bản."*
- **Lời thoại (B):** *"Em là [B], phụ trách phần xác thực sinh trắc học WebAuthn, phân quyền RBAC và bảo mật mật khẩu. Hệ thống của nhóm gồm 4 trụ cột: OAuth 2.0, JWT, WebAuthn và RBAC. Sau đây là phần lý thuyết."*
- **Màn hình:** Slide tiêu đề (tên đề tài, tên 2 thành viên, MSSV).

### 🟢 01:00 – 02:45 — Lý thuyết: OAuth 2.0 & JWT (Người A)

- **Ai nói:** Người A.
- **Lời thoại:** *"OAuth 2.0 là chuẩn uỷ quyền cho phép người dùng đăng nhập bằng tài khoản Google hoặc GitHub mà không chia sẻ mật khẩu cho ứng dụng của chúng em. Hệ thống dùng luồng Authorization Code: người dùng được chuyển hướng sang Google/GitHub, nhà cung cấp trả về một mã, server đổi mã đó lấy thông tin người dùng. — JWT, JSON Web Token, là token chứa thông tin định danh đã được ký số. Hệ thống dùng access token ngắn hạn 15 phút lưu trong bộ nhớ, và refresh token dài hạn 7 ngày lưu trong cookie httpOnly, có cơ chế xoay vòng (rotation) chống đánh cắp."*
- **Màn hình:** Slide sơ đồ OAuth Authorization Code Flow + slide JWT (access vs refresh token).

### 🟢 02:45 – 04:30 — Lý thuyết: WebAuthn, RBAC, Argon2 (Người B)

- **Ai nói:** Người B.
- **Lời thoại:** *"WebAuthn là chuẩn xác thực sinh trắc học — đăng nhập bằng vân tay hoặc Windows Hello thay vì mật khẩu, dựa trên cặp khoá công khai/bí mật, khoá bí mật không bao giờ rời thiết bị nên chống được phishing. — RBAC, Role-Based Access Control, phân quyền theo vai trò: hệ thống có hai vai trò `user` và `admin`; chỉ admin mới truy cập được trang quản trị. — Về mật khẩu, nhóm dùng thuật toán băm Argon2id — chuẩn khuyến nghị của OWASP, cấu hình 64MB bộ nhớ, chống tấn công brute-force bằng GPU."*
- **Màn hình:** Slide WebAuthn (public/private key) + slide RBAC (user vs admin) + slide Argon2.

### 🟢 04:30 – 07:30 — Kiến trúc hệ thống (Người B)

- **Ai nói:** Người B.
- **Lời thoại:** *"Về kiến trúc: frontend là React + Vite, backend Node.js + Express, database MongoDB Atlas. Backend chia lớp rõ ràng: tầng `routes` xử lý request, tầng `services` chứa logic — như `hashService` cho Argon2, `tokenService` cho JWT, `webauthnService` cho passkey; tầng `middleware` gồm `authenticate` kiểm tra token và `authorize` kiểm tra vai trò. Mô hình dữ liệu `User` lưu email, passwordHash, role, googleId, secret 2FA và danh sách passkey. Đây là sơ đồ luồng xác thực tổng thể."*
- **Màn hình:**
  1. Mở cây thư mục dự án trong VS Code, lướt qua `server/routes`, `server/services`, `server/middleware`.
  2. Mở `server/models/User.js` — chỉ ra các field.
  3. Slide sơ đồ kiến trúc tổng (hoặc vẽ trên README phần "Auth Flow").

### 🟢 07:30 – 10:30 — Demo phần 1 (Người A): Register → Login → Argon2 → JWT

- **Ai nói:** Người A (vừa thao tác vừa nói).
- **Lời thoại + thao tác:**
  1. *"Em đăng ký một tài khoản mới."* → Vào `http://localhost:5173/register`, nhập email + password (≥ 8 ký tự), submit. **Kết quả mong đợi:** thông báo đăng ký thành công.
  2. *"Mật khẩu không bao giờ lưu dạng thô. Đây là code băm bằng Argon2id."* → Mở `server/services/hashService.js`, chỉ vào `ARGON2_OPTIONS` (memoryCost 65536, timeCost 3) và hàm `hash()`.
  3. *"Trong database, mật khẩu lưu dưới dạng hash bắt đầu bằng `$argon2id$`."* → Mở MongoDB Atlas (hoặc Compass), show field `passwordHash` của user vừa tạo.
  4. *"Bây giờ em đăng nhập."* → Về `/login`, nhập đúng email/password → vào Dashboard. **Kết quả:** đăng nhập thành công.
  5. *"Access token là một JWT."* → `F12` → Application/Console, lấy access token, dán vào **jwt.io** (mở sẵn tab) → chỉ payload có `sub`, `role`, `exp` (15 phút).
- **Màn hình:** Trình duyệt (register/login) + VS Code (`hashService.js`) + MongoDB Atlas + tab jwt.io.

### 🟢 10:30 – 13:30 — Demo phần 2 (Người B): 2FA → Google OAuth → Passkey → RBAC

- **Ai nói:** Người B.
- **Lời thoại + thao tác:**
  1. **2FA setup:** *"Em bật xác thực 2 lớp."* → Vào Profile → bật 2FA → hiện QR code → quét bằng Google Authenticator trên điện thoại → nhập mã 6 số → nhận **backup codes**. *"Backup code cũng được băm bằng Argon2, không lưu thô."*
  2. **2FA login:** Logout → login lại bằng email/password → hệ thống yêu cầu nhập mã TOTP → nhập mã 6 số từ app → vào được Dashboard. **Kết quả:** đăng nhập 2 lớp thành công.
  3. **Google & GitHub OAuth:** Logout → bấm **"Continue with Google"** → chọn tài khoản → về `/oauth/callback` rồi vào Dashboard. Logout lần nữa → bấm **"Continue with GitHub"** → authorize → vào Dashboard. *"Cả hai dùng luồng Authorization Code; hệ thống tự liên kết tài khoản theo email nếu đã tồn tại."*
  4. **Passkey (biometric):** Vào Profile → "Thêm Passkey" → xác thực bằng vân tay/Windows Hello (hoặc Virtual Authenticator) → logout → login bằng passkey. **Kết quả:** đăng nhập không cần mật khẩu.
  5. **RBAC:** *"Tài khoản thường không vào được trang admin."* → Với user thường, vào URL `/admin` → bị chặn (Forbidden / redirect). → Logout, đăng nhập `admin@iam.dev` → vào `/admin` thành công, show danh sách user. → Mở nhanh `server/middleware/authorize.js` giải thích kiểm tra `role`.
- **Màn hình:** Trình duyệt (Profile, Login, Admin) + điện thoại quay cận cảnh app Authenticator + VS Code (`authorize.js`).

> **Plan B nếu lỗi khi quay:** Nếu Google OAuth lỗi → chuyển sang nói "luồng đã hoạt động, đây là phần code xử lý" và mở `server/routes/oauth.js`. Nếu máy không có vân tay → đã bật Virtual Authenticator từ trước (mục Chuẩn bị). Nếu 2FA lệch giờ → đồng bộ giờ điện thoại trước khi quay.

### 🟢 13:30 – 14:30 — Kết luận & điểm nổi bật bảo mật (Người A + B)

- **Ai nói:** Người A tổng kết, Người B chốt bảo mật.
- **Lời thoại (A):** *"Nhóm đã xây dựng hệ thống IAM hoàn chỉnh với 4 trụ cột: OAuth 2.0, JWT có rotation, WebAuthn sinh trắc học và RBAC."*
- **Lời thoại (B):** *"Điểm nổi bật về bảo mật: mật khẩu băm Argon2id, refresh token xoay vòng chống replay, access token ngắn hạn, và passkey chống phishing. Cảm ơn thầy/cô và các bạn đã lắng nghe."*
- **Màn hình:** Slide tổng kết (gạch đầu dòng 4 trụ cột + 4 điểm bảo mật).

### ⏱️ 14:30 – 15:00 — Buffer dự phòng

Khoảng đệm cho thao tác chậm/sự cố nhỏ. **Không vượt 15:00.** Nếu thiếu giờ, cắt bớt bước Passkey hoặc rút gọn phần inspect JWT.

---

## 4. Phân bổ thời lượng (tổng quan)

| Phần | Thời lượng | Người nói |
|---|---|---|
| Mở đầu | 1 phút | A + B |
| Lý thuyết | 3.5 phút | A (OAuth/JWT) + B (WebAuthn/RBAC/Argon2) |
| Kiến trúc | 3 phút | B |
| Demo trực tiếp | 6 phút | A (3') + B (3') |
| Kết luận | 1 phút | A + B |
| Buffer | 0.5 phút | — |
| **Tổng** | **≤ 15 phút** | |

---

## 5. Tips trình bày & xử lý sự cố

- **Nói tự nhiên, không đọc vẹt:** học ý chính, đừng đọc nguyên văn script — script chỉ là khung.
- **Vừa làm vừa nói:** khi thao tác demo, mô tả mình đang làm gì để người xem theo kịp.
- **Chuyển người mượt:** người trước nói câu nối: *"Tiếp theo, mời [B] trình bày phần kiến trúc."*
- **Tập trước ≥ 2 lần** và bấm giờ — đảm bảo demo chạy trơn, dưới 15 phút.
- **Quay demo riêng nếu cần:** có thể quay phần demo trước, lồng tiếng/ghép sau để tránh sự cố live.
- **Dữ liệu sạch:** trước khi quay, xoá user test trùng email để bước Register không báo lỗi.
- **Đồng bộ giờ điện thoại** trước khi demo 2FA (TOTP phụ thuộc thời gian).
- **Backup codes:** chụp/lưu lại lúc setup 2FA để có đường đăng nhập dự phòng nếu mất mã.

---

## 6. Tự kiểm tra trước khi nộp video

- [ ] Tổng thời lượng ≤ 15:00
- [ ] Cả Người A và Người B đều nói, thời lượng cân đối
- [ ] Đủ 4 key points: OAuth 2.0, JWT, WebAuthn (biometric), RBAC
- [ ] Đủ demo: Google OAuth, GitHub OAuth, 2FA Authenticator, Argon2 hashing, (Passkey, RBAC)
- [ ] Đủ 3 phần: lý thuyết · kiến trúc · demo trực tiếp codebase + app đang chạy
- [ ] GitHub OAuth đã cấu hình env và test chạy được trước khi quay
- [ ] Âm thanh rõ, màn hình đọc được chữ (1080p)
- [ ] Demo chạy thật, không lỗi đỏ trên màn hình
