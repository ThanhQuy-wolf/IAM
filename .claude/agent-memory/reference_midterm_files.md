---
name: Midterm IAM — file paths quan trọng
description: Các file ở repo Midterm chứa source-of-truth cho plan, đặc tả, breakdown — đọc trước khi đề xuất thay đổi lớn
type: reference
---

Repo: `C:\VS code\LapTrinhWeb\Midterm`

| File | Vai trò |
|------|---------|
| `PROJECT_PLAN.md` (root) | **Source of truth** — timeline 14 ngày, team roles, 6 decisions chốt, MVP cut-line, risk register, demo script. Đọc đầu tiên khi làm việc với midterm |
| `TODO.md` (root) | Breakdown chi tiết Phase 0 → Phase 5 (setup, email/pass auth, OAuth, 2FA, WebAuthn+RBAC, submission). Checklist task cụ thể |
| `docs/DacTa.md` | Đặc tả gốc của giảng viên — rubric chấm điểm, penalty policy, list 10 topics, requirements output |

**How to apply:**
- Trước khi đề xuất thay đổi tech stack hoặc timeline → đọc `PROJECT_PLAN.md` để biết decision đã chốt
- Trước khi đề xuất task mới → check `TODO.md` xem có trùng không
- Khi user hỏi về rubric / điểm số / penalty → tham chiếu `docs/DacTa.md`
- Khi `PROJECT_PLAN.md` mâu thuẫn với `TODO.md`: PROJECT_PLAN.md thắng (mới hơn, đã lock decisions)
