---
name: IAM Midterm — security rules không được vi phạm
description: Các best practice bảo mật bắt buộc khi viết code auth cho midterm IAM, vi phạm sẽ bị giảng viên trừ điểm
type: feedback
---

Khi viết code auth cho midterm Topic 1 IAM, các rule sau là BẮT BUỘC:

**Token storage:**
- KHÔNG lưu access token hay refresh token vào `localStorage` (XSS sẽ lấy được)
- Access token chỉ lưu trong React state (memory)
- Refresh token chỉ trong cookie với `{ httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7d }`

**JWT config:**
- Access token expiry: 15 phút
- Refresh token expiry: 7 ngày
- Bắt buộc implement refresh token rotation: cấp token mới phải revoke token cũ trong DB
- KHÔNG dùng cùng 1 secret cho access và refresh

**Password hashing:**
- Argon2id config: `memoryCost: 2**16`, `timeCost: 3`, `type: argon2id`
- Nếu fallback bcryptjs: rounds tối thiểu 10
- KHÔNG bao giờ trả `passwordHash` về client (loại trường này khi serialize User)

**Hardening Express:**
- Phải có `helmet()` middleware
- Phải có `express-rate-limit` (auth routes ≤ 20 req/phút)
- Phải có CORS whitelist chỉ `CLIENT_URL` từ env

**Repo hygiene:**
- KHÔNG commit `.env` thật lên GitHub (chỉ `.env.example`)
- KHÔNG hardcode API key, secret, OAuth credentials trong code
- Khuyến nghị pre-commit hook `gitleaks`

**Why:** Đây là rubric "Web Security & Vulnerability Mitigation" gián tiếp của Topic 1. Vi phạm token storage hoặc commit secret là -điểm bảo mật trực tiếp. Argon2id config dưới chuẩn OWASP cũng bị trừ.

**How to apply:** Mỗi lần generate code liên quan đến auth/cookie/JWT/password trong repo này, kiểm tra checklist trên trước khi đưa cho user. Nếu user yêu cầu cách "đơn giản hơn" mà vi phạm rule (vd lưu localStorage cho dễ), phải cảnh báo trade-off rõ ràng.
