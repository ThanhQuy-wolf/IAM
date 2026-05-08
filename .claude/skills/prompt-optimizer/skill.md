---
name: prompt-optimizer
description: Help users rewrite and improve AI/LLM prompts by adding specificity, context, and constraints. Trigger this skill whenever users ask to improve, rewrite, optimize, or refine prompts for AI models. Focus on making prompts clearer, more specific, and more likely to produce better AI results. Present suggestions interactively so users can choose which improvements to apply.
---

# Prompt Optimizer

A beginner-friendly skill for improving AI/LLM prompts to get better results.

## What This Skill Does

This skill helps you rewrite prompts to work better with AI models like Claude. Instead of just giving you a rewritten prompt, it shows you specific improvement suggestions that you can choose to apply or skip.

## Key Improvements

When optimizing a prompt, focus on three main areas:

### 1. **Specificity** — Making the Request Clear
Good prompts are specific about what you want. Vague prompts get vague results.

**Example improvements:**
- Add details about format: "Give me a bullet list of 5 items" instead of "tell me about X"
- Be clear about length: "Write 200 words" instead of "Write something short"
- Define who the audience is: "Explain this for a 10-year-old" or "Use technical language"

### 2. **Context** — Giving the AI Background Information
More context helps the AI make better decisions.

**Example improvements:**
- Explain the goal: "I'm writing a resume, so focus on professional language"
- Share constraints: "We only have $500 budget" or "It needs to work on mobile"
- Provide background: "I already know Python but not JavaScript"

### 3. **Constraints** — Setting Boundaries
Constraints prevent unwanted outputs.

**Example improvements:**
- Set length limits: "Keep it under 100 words"
- Specify format: "Use JSON format" or "Write as a numbered list"
- Define tone: "Be casual and friendly, not formal"
- Say what NOT to include: "Don't use technical jargon"

## How to Use This Skill

1. **Share your prompt** — Give me the original prompt you want to improve
2. **Review suggestions** — I'll show you specific improvements in each area
3. **Choose what you like** — Pick which suggestions to apply
4. **Get the final version** — I'll rewrite your prompt with your chosen improvements

## Interactive Selection Process

When you use this skill, you'll see:

- **Original prompt** — Your starting point
- **Improvement suggestions** — Specific changes grouped by category (Specificity, Context, Constraints)
- **Preview examples** — What each change would look like with the improvement applied
- **Your choices** — You pick which suggestions help most (you can apply all, some, or none)

Then you get a rewritten prompt combining all your choices.

### Example Interaction

**Original:** "Write me a blog post"

**Suggestions I might offer:**
- **Specificity**: Add a topic (e.g., "about sustainable living")
- **Context**: Explain your goal (e.g., "to build authority on my website")
- **Constraints**: Set a word count (e.g., "800-1000 words")

**Your choice:** "I want all three — add topic, goal, and word count"

**Final rewritten prompt:**
"Write an 800-1000 word blog post about sustainable living for my website. The goal is to establish my authority on eco-friendly practices. Target an audience of people interested in reducing their carbon footprint. Include 3-4 practical tips they can implement immediately, and end with a call-to-action encouraging them to sign up for my newsletter."

## Tips for Best Results

- **Start simple** — Even small improvements help
- **Focus on your goal** — What outcome do you want?
- **Add one constraint at a time** — Too many rules can be confusing
- **Test and iterate** — Try the new prompt and see if results improve

## What Makes a Good Prompt

A prompt becomes "good" when:
- The AI understands exactly what you want ✓
- You've given enough context to explain why ✓
- You've set boundaries to prevent bad outputs ✓
- Someone else could read it and understand your intent ✓

---

## Anti-Pattern Detection

Before suggesting improvements, scan the original prompt for these common mistakes and report them with a warning:

| Anti-Pattern | Description | Example |
|---|---|---|
| Too generic | No clear subject, action, or goal | "Tell me about AI" |
| Ambiguous pronouns | "it", "that", "this" with no clear referent | "Fix it so it works better" |
| Internal contradiction | Two requirements that cancel each other out | "Be concise but cover everything in detail" |
| Missing context | Requests an action without explaining why or for whom | "Rewrite this paragraph" |

**Output format:** Before showing improvement suggestions, print a "Detected Issues" block listing any anti-patterns found. If none are found, skip this block silently. Example:

```
⚠️ Detected Issues:
- Too generic: No output format specified
- Missing context: No audience or goal provided
```

---

## Prompt Classification

Automatically classify the input prompt into one of these types, then tailor your improvement suggestions accordingly:

| Type | Trigger Keywords | Extra Suggestions to Offer |
|---|---|---|
| `code` | write, fix, debug, refactor, implement | Programming language & version, runtime environment, input/output examples |
| `content` | write, blog, email, post, describe, summarize | Target audience, tone (formal/casual), word count, platform |
| `analysis` | analyze, compare, evaluate, review, assess | Criteria for evaluation, output format (table, prose), depth of detail |
| `qa` | explain, what is, how does, why, define | Knowledge level of audience, analogies allowed?, length of answer |
| `task` | do, create, set up, build, generate, automate | Step-by-step vs one-shot, tools/permissions available, success criteria |

Show the detected type at the top of your response: `📌 Prompt type detected: [type]`

---

## Chain-of-Thought Mode

Offer "Chain-of-Thought Enhancement" as an optional improvement when showing suggestions. When the user selects it, add reasoning instructions to the end of the optimized prompt based on type:

| Prompt Type | Chain-of-Thought Addition |
|---|---|
| General | `"Think step by step before answering."` |
| Analysis | `"Explain your reasoning for each point before giving a conclusion."` |
| Code | `"Outline your approach and data structures before writing any code."` |
| Decision-making | `"List pros and cons, then state your recommendation with justification."` |

**Why it works:** Chain-of-Thought forces the AI to externalize its reasoning process. This reduces hallucination (the AI catches its own errors mid-reasoning), makes outputs easier to verify, and produces more structured answers. Studies show CoT improves accuracy on complex tasks by 20–40%.
