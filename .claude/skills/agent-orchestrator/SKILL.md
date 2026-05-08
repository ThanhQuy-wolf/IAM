---
name: agent-orchestrator
description: >
  Breaks down large, multi-step software tasks into structured sub-agents on the Claude Code CLI using the Task tool.
  Use this skill whenever the user describes a complex project or feature that has multiple components — e.g., "build a login API with JWT and unit tests", "set up a CI/CD pipeline with Docker and GitHub Actions", "create a full-stack todo app with auth, REST API, and frontend".
  Trigger this skill when the task clearly has more than one distinct sub-system, layer, or concern that could be worked on in parallel or in sequence.
  DO NOT trigger for simple, single-step tasks like "write a function to reverse a string" or "fix this bug".
---

# Agent Orchestrator

A skill for decomposing large engineering tasks into parallel and sequential sub-agents on Claude Code CLI using the **Task tool**.

## When to Use

Trigger when the user's task has **multiple distinct components** — for example:
- "Build a REST API with authentication, rate limiting, and unit tests"
- "Set up a monorepo with shared packages, CI pipeline, and deployment configs"
- "Create a data pipeline: ingest → transform → store → visualize"

Do **not** trigger for single-step tasks (e.g., "rename this variable", "add a README").

---

## Prompt Template

Copy the block below and paste it into your Agent Code CLI session. Replace the placeholder in the `TASK` variable with your actual task description.

---

```
You are a senior engineering orchestrator operating inside the Agent Code CLI.

TASK: "Build a login API with JWT and unit tests"

---

Your job is to analyze this task, decompose it into well-scoped sub-tasks, identify dependencies between them, and execute them using the Task tool.

Follow these steps exactly:

---

## STEP 1 — Guard: Is this task complex enough?

If the task can be completed in a single step by a single agent (e.g., "rename a variable", "write one function"), respond with:
> "This task is simple enough to handle directly — no orchestration needed."
Then complete it yourself. Stop here.

Otherwise, continue.

---

## STEP 2 — Decompose the task into sub-tasks

Analyze the TASK string. Break it into a flat list of concrete, independently scoped sub-tasks. Each sub-task must:
- Have a clear, specific goal
- Be executable by a single focused agent
- Produce a concrete output (file, module, config, test suite, etc.)

Output the list in this format:

Sub-tasks:
  [T1] <sub-task title> — <one-sentence description>
  [T2] <sub-task title> — <one-sentence description>
  [T3] ...

---

## STEP 3 — Identify dependencies and execution mode

For each sub-task, decide whether it can run in parallel with others, or must run after a specific predecessor.

Label each sub-task as one of:
  [PARALLEL]               — no dependencies, can start immediately
  [SEQUENTIAL - after Tx]  — must run only after sub-task Tx completes

Rules:
- If a sub-task depends on an artifact produced by another (a file, schema, interface, module), mark it SEQUENTIAL.
- If two sub-tasks are fully independent (different files, no shared state), mark both PARALLEL.
- Do not start any SEQUENTIAL sub-task until its prerequisite is confirmed complete.

Output the dependency plan in this format:

Dependency Plan:
  [T1] <title>  →  [PARALLEL]
  [T2] <title>  →  [PARALLEL]
  [T3] <title>  →  [SEQUENTIAL - after T1]
  [T4] <title>  →  [SEQUENTIAL - after T2, T3]

---

## STEP 4 — Confirm plan before execution

Print the full decomposition and dependency plan to the user.
Then print:
> "Starting execution. Spawning parallel sub-agents now..."

Do not skip this confirmation step.

---

## STEP 5 — Execute using the Task tool

Use the **Task tool** to spawn sub-agents. Follow this protocol:

### 5a. Spawn all [PARALLEL] sub-tasks simultaneously
- Call the Task tool for each PARALLEL sub-task at the same time (do not wait for one to finish before spawning the next).
- Each Task call must include a self-contained prompt describing exactly what to build, where to put files, and what the expected output is.

### 5b. Monitor and gate SEQUENTIAL sub-tasks
- Wait for each prerequisite Task to complete before spawning its dependent.
- Once a prerequisite completes, immediately spawn the next Task.

### 5c. Task prompt format
Each task spawned via the Task tool must include:

  - Role: "You are a focused sub-agent. Complete exactly this sub-task and nothing else."
  - Sub-task goal (from Step 2)
  - Output location (file path or module name)
  - Any relevant interfaces or contracts from predecessor tasks (if SEQUENTIAL)
  - Instruction to report back: "When done, summarize what you built and list output files."

---

## STEP 6 — Synthesize and report

After all Tasks complete:
1. Collect each sub-agent's summary.
2. Verify that all expected outputs exist.
3. Report to the user:
   - What was built
   - File/module structure
   - Any issues or gaps found
   - Suggested next steps (e.g., "Run `npm test` to verify", "Review the generated OpenAPI spec")

---

Begin now with STEP 1.
```

---

## Tips for Customizing the Template

- **Replace the TASK value** with your actual task string. Keep it on one line, in quotes.
- **Add context if needed**: Append lines after `TASK:` like `STACK: "Node.js, PostgreSQL, Jest"` or `CONSTRAINTS: "Use ESM modules only"` — the orchestrator will incorporate them.
- **For monorepos or specific file layouts**: Add a `STRUCTURE:` hint, e.g.:
  ```
  STRUCTURE: "src/api/, src/auth/, src/tests/, docker-compose.yml"
  ```
- **To limit parallelism** (e.g., on resource-constrained machines): Add `MAX_PARALLEL_AGENTS: 2` after the TASK line.

---

## Example Usage

**Input task:**
> "Build a login API with JWT authentication and unit tests"

**Expected orchestrator output (before execution):**

```
Sub-tasks:
  [T1] Project scaffold — Initialize Node.js project, folder structure, and dependencies
  [T2] Database schema — Define User model and migration for PostgreSQL
  [T3] Auth service — Implement JWT sign/verify logic and password hashing
  [T4] Login route — Build POST /auth/login endpoint with validation
  [T5] Middleware — Create JWT auth middleware for protected routes
  [T6] Unit tests — Write Jest tests for auth service and login route

Dependency Plan:
  [T1] Project scaffold    →  [PARALLEL]
  [T2] Database schema     →  [PARALLEL]
  [T3] Auth service        →  [SEQUENTIAL - after T1]
  [T4] Login route         →  [SEQUENTIAL - after T3]
  [T5] Middleware          →  [SEQUENTIAL - after T3]
  [T6] Unit tests          →  [SEQUENTIAL - after T4, T5]

Starting execution. Spawning parallel sub-agents now...
```

T1 and T2 spawn immediately. T3 spawns once T1 completes. T4 and T5 spawn once T3 completes. T6 spawns last.

---

## Notes

- This skill requires Agent Code CLI with the **Task tool** enabled.
- Each spawned sub-agent has no memory of the others — pass all needed context explicitly in the Task prompt.
- For very large tasks (10+ sub-tasks), consider breaking the orchestration into phases and applying this skill recursively per phase.
