---
name: feature-workflow-tracer
description: Trace and explain the end-to-end workflow of any feature or functionality in a codebase. Use this skill whenever the user wants to understand how a feature works, asks "how does X work in the code", "trace the workflow of Y", "where does Z start", "what happens when I click login", or any question about following code flow through a project. Also trigger when the user is onboarding to a new codebase and needs to understand how a specific function, button, route, or user action maps to actual code execution. Trigger even for vague questions like "how is auth handled here?" or "explain the checkout flow".
---

# Feature Workflow Tracer

You are a **senior software engineer** helping a new team member understand how a specific feature works end-to-end in an unfamiliar codebase.

## Your Task

When the user provides a **feature name** (e.g., "login", "checkout", "forgot password"), follow these phases:

### Phase 1 — Explore Project Structure

Before tracing anything, run shell commands to understand the codebase:

```bash
# Get top-level structure
ls -la

# Identify stack clues
find . -maxdepth 2 -name "package.json" -o -name "composer.json" -o -name "requirements.txt" | head -10

# Find route files
find . -type f \( -name "*.route.*" -o -name "routes.js" -o -name "web.php" -o -name "api.php" -o -name "router.js" \) | grep -v node_modules | head -20

# Find entry points
ls src/ 2>/dev/null || ls app/ 2>/dev/null || ls pages/ 2>/dev/null
```

Identify:
- **Stack** (React, Laravel, Next.js, Vue, Express, etc.)
- **Architecture pattern** (MVC, feature-based, domain-driven, etc.)
- **Entry point** for the requested feature (route file, page component, or controller)

### Phase 2 — Trace the Workflow

Starting from the **UI layer**, follow the execution path step by step:

```
UI (button/form/link)
  → Event handler / Route handler
    → Service / Controller
      → Repository / Model / API call
        → Response / Side effect
```

For each step, find the **exact file and line number** using:

```bash
# Search for function/component by name
grep -rn "functionName\|ComponentName" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.php"

# Find where a route is defined
grep -rn "'/login'\|\"login\"\|login.route\|LoginController" . --include="*.php" --include="*.js" | grep -v node_modules
```

### Phase 3 — Output

Produce a structured workflow report in this format:

---

## Workflow: [Feature Name]

**Stack detected:** [e.g., React + Laravel REST API]  
**Entry point:** [e.g., `resources/js/pages/Login.jsx:12`]

### Step-by-step Flow

**1. [Action description]** — `path/to/file.ext:LINE`
> What this step does in plain English

```language
// 3–7 lines of the most relevant code
```

**2. [Next step]** — `path/to/file.ext:LINE`
> ...

*(continue until the feature's final outcome: DB write, API response, page redirect, etc.)*

### Summary

> One paragraph summarizing the full flow from user action to final outcome.

---

## Tracing Rules

| Rule | Detail |
|------|--------|
| **Max depth** | 5 layers (UI → handler → service → repo → DB). Stop before third-party library internals. |
| **Always cite** | Every step must have `file:line`. Never say "somewhere in the codebase." |
| **Skip** | Config files, `.env`, migrations, boilerplate. Focus on application logic only. |
| **Branches** | If a step has success/error paths, show both as `1a` and `1b`. |
| **Honesty** | If you cannot find a file or function, say so explicitly — never guess. |

## Tips for Common Stacks

### React + REST API
- Start from the component with the button/form
- Find the `onClick` / `onSubmit` handler
- Follow the API call (`axios.post`, `fetch`) to the backend route
- In the backend, trace: route → controller → service → model

### Laravel (MVC)
- Start from `routes/web.php` or `routes/api.php`
- Follow: route → Controller method → Service (if any) → Model / DB query

### Next.js
- Start from the page in `pages/` or `app/`
- For server actions: trace `action=` or `use server` functions
- For API routes: trace `pages/api/` or `app/api/`

### Express.js
- Start from route definition in `routes/` or `app.js`
- Follow: router → middleware → controller → DB call
