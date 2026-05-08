---
name: IAM Midterm — tech stack lock
description: 6 quyết định kỹ thuật đã chốt cho midterm Topic 1 IAM, không được tự ý đổi sang lựa chọn khác khi gợi ý code/refactor
type: feedback
---

Khi làm việc với midterm Topic 1 (Advanced IAM) trong repo `C:\VS code\LapTrinhWeb\Midterm`, phải tuân thủ 6 lựa chọn tech stack đã chốt:

1. **Database**: MongoDB + Mongoose (KHÔNG đề xuất Postgres/Prisma/SQLite)
2. **WebAuthn**: làm full với @simplewebauthn/server + browser, có cut-off D11 (nếu trễ thì cắt, không skip ngay từ đầu)
3. **Deploy**: Vercel (FE) + Railway (BE) + MongoDB Atlas (DB)
4. **UI Library**: shadcn/ui (KHÔNG MUI/Mantine/Tailwind raw)
5. **Token storage**: Access token IN MEMORY (React state) + Refresh token trong httpOnly + SameSite=Strict cookie
6. **Password hashing**: argon2 native trước, fallback bcryptjs nếu Windows build fail. Có thể đề xuất @node-rs/argon2 nếu argon2 fail

**Why:** User đã review pros/cons của từng option và chốt sau khi cân nhắc với deadline 14 ngày + team 2-3 người. Đổi quyết định giữa chừng tốn thời gian rebuild và phá timeline.

**How to apply:** Khi đề xuất code, snippet, refactor, hoặc giải pháp cho repo này — luôn dùng đúng 6 lựa chọn trên. Nếu cần đề xuất khác (vd Postgres cho RBAC quan hệ), phải nói rõ "đây là deviation từ decision lock" và yêu cầu user confirm trước khi triển khai.
