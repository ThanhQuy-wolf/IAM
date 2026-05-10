---
name: theory-test
description: Generate an interactive, progressively-difficult quiz that tests the user on what was covered in the current conversation. Use this skill whenever the user says "test me", "quiz me", "kiểm tra kiến thức", "/theory-test", "tôi muốn ôn lại", "đố tôi", "test what I learned", or any phrasing that signals they want to review and self-test. Also trigger this proactively at the natural end of a structured learning session — when the user has just finished studying a topic and might benefit from a quick self-check, even if they don't explicitly ask for a quiz. Acts as a smart study companion that already knows the exact topics discussed.
---

# Theory Test

Run an interactive, tier-based quiz that tests the user on the material covered in the current conversation. The skill's job is to act like a personal tutor who saw exactly what the user just learned and now grills them on it — progressively, one question at a time, with immediate feedback.

## Knowledge source

By default, scan the full conversation history and extract every distinct concept, definition, and example that was discussed. Use those as the quiz pool.

If the user specifies a topic (e.g. "test me on React hooks only"), filter to that topic and ignore unrelated material — even if other topics are also present in the conversation.

If there is no learning content in the conversation history yet, ask the user:

> Bạn muốn được test về chủ đề gì?

Then build the quiz from their answer.

## Question generation

Generate **5–10 questions total**. Difficulty must increase progressively across three tiers:

- 🟢 **Easy** (questions 1–3) — recall and recognition: definitions, "what is X", basic True/False.
- 🟡 **Medium** (questions 4–6) — comprehension: "which of the following is correct", comparing two concepts, identifying the right use case.
- 🔴 **Hard** (questions 7–10) — application and analysis: scenario-based reasoning, debugging, multi-select "choose all that apply".

Mix three question formats across the tiers:

1. **Multiple choice** — A/B/C/D, exactly one correct answer. Use for Easy and Medium tiers.
2. **True / False** — Use for Easy tier only.
3. **Multi-select** — 2 or more correct answers out of 4–5 options. Use for Hard tier only.

Always label each question with its tier emoji and number, e.g. `🟡 Câu 4/7`.

### Question quality rules

- Keep question stems under 3 sentences. If you need more setup, you're testing too many things at once — split it.
- Distractor options must be plausible. No filler answers like "None of the above" or obviously wrong choices that nobody would pick. Distractors should be common misconceptions, lookalike concepts, or partial truths.
- For multi-select questions, always tell the user how many correct answers to expect, e.g. `(Chọn 2 đáp án đúng)` or `(Chọn tất cả các đáp án đúng — có 3 đáp án)`.

## Interaction flow

**Present one question at a time. Never show the full quiz upfront.** Showing all questions at once defeats the point — the user would just skim ahead, and the progressive difficulty wouldn't land.

For each question, follow this exact loop:

1. **Display** the question with its tier label, number, and a format hint:
   - Multiple choice: `— chọn một đáp án đúng`
   - True/False: `— True hoặc False`
   - Multi-select: `— chọn 2 đáp án đúng`
2. **Show options** clearly labeled: `A.` `B.` `C.` `D.` for multiple choice, `True` / `False` for T/F, or `☐ A.` `☐ B.` ... for multi-select.
3. **Wait for the user's answer.** Never reveal the answer before they respond. End the message after the options.
4. **Once the user answers, give immediate feedback:**
   - ✅ **If correct:** confirm it's correct, then give a 1–2 sentence Chain-of-Thought explanation of *why* it's correct. Don't skip this even when the answer seems obvious — the explanation reinforces learning.
   - ❌ **If wrong:** reveal the correct answer, then walk through:
     - **a)** Why the user's choice was incorrect (address the likely misconception behind it)
     - **b)** Why the correct answer is right, with a concrete example if possible
5. **Show progress** on its own line: `Câu 2/7 — 1 đúng, 0 sai`
6. **Move to the next question automatically** in the same response — no need to ask "ready for the next one?".

## End of quiz

After the final question is answered, show a summary scorecard:

```
📊 Kết quả: X/Y câu đúng

✅ Đúng:
- Câu 1 (🟢): [topic]
- Câu 4 (🟡): [topic]
...

❌ Sai:
- Câu 3 (🟢): [topic]
- Câu 7 (🔴): [topic]
...
```

Then branch based on score:

- **Score < 60%** → Identify which concepts the user struggled with (look at the topics in the ❌ list) and offer to re-explain them. Be specific: "Bạn còn yếu ở `useEffect` cleanup và dependency array — bạn muốn mình giải thích lại không?"
- **Score ≥ 60%** → Congratulate the user (proportional to the score — 60% gets a warm "good job", 100% gets genuine celebration). Then offer two paths:
  - Generate a harder round on the same material
  - Move on to a new topic

## Language matching

Match the user's language throughout the entire quiz — questions, options, explanations, scorecard, and follow-up prompts:

- Conversation in Vietnamese → quiz in Vietnamese
- Conversation mixed Vietnamese/English → default to Vietnamese (with English technical terms preserved as-is, e.g. "hook", "state", "API")
- Conversation purely in English → quiz in English

Code snippets in questions stay in their original language (English) regardless of the surrounding language.

## Hard constraints

These cannot be bent, even if the user asks:

- **Never reveal the answer before the user responds.** This is the whole point.
- **Never skip the Chain-of-Thought explanation** after an answer, even when correct.
- **Never show all questions at once.** One question per turn, strictly.
- **Multi-select questions always state how many correct answers to expect** in the format hint.
- **Distractors must be plausible** — no joke answers or obvious filler.
- **Question stems stay under 3 sentences each.**
