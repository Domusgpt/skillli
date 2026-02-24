# Skill Format Specification

This document is the authoritative reference for the SKILL.md format as implemented
by skillli. It covers five layers:

1. **Agent Skills Open Standard** — Portable across 26+ agent platforms
2. **Claude Code Extensions** — Claude Code-specific behavior and lifecycle
3. **Skillli Registry Extensions** — Indexing, search, trust scoring, package management
4. **Interactive / Branching Skills** — Experimental quiz gates for context ingestion
5. **Decentralized Discovery** — `.well-known/skills/` endpoint publishing

Reference: [agentskills.io/specification](https://agentskills.io/specification) |
[code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)

### Table of Contents

- [SKILL.md Structure](#skillmd-structure)
- [Layer 1: Agent Skills Open Standard](#layer-1-agent-skills-open-standard)
- [Layer 2: Claude Code Extensions](#layer-2-claude-code-extensions)
- [Layer 3: Skillli Registry Extensions](#layer-3-skillli-registry-extensions)
- [Trust Levels](#trust-levels)
- [Categories](#categories)
- [Progressive Disclosure](#progressive-disclosure)
- [Layer 4: Interactive / Branching Skills](#layer-4-interactive--branching-skills-experimental)
- [Decentralized Discovery: .well-known/skills/](#decentralized-discovery-well-knownskills)
- [Copy-Paste Templates](#copy-paste-templates)
- [Naming Conventions](#naming-conventions)
- [YAML Authoring Notes](#yaml-authoring-notes)

---

## SKILL.md Structure

Every skill is a **directory** containing a `SKILL.md` file. The file has YAML
frontmatter (between `---` markers) followed by a Markdown body.

```
my-skill/
├── SKILL.md         # Required — frontmatter + instructions
├── scripts/         # Optional — executable code (.sh, .py, .js, .ts)
├── references/      # Optional — additional docs loaded on demand
├── assets/          # Optional — templates, configs, static files
└── LICENSE          # Recommended
```

---

## Layer 1: Agent Skills Open Standard

These fields are portable across 26+ agent platforms (Claude Code, GitHub Copilot,
Cursor, Gemini CLI, OpenAI Codex, and more).

### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `name` | string | 1-64 chars. Lowercase `[a-z0-9-]`. No leading/trailing/consecutive hyphens. Must match directory name. | Becomes the `/slash-command` name. |
| `description` | string | 1-1024 chars. Single-line recommended. | How the agent decides when to invoke this skill. Include trigger keywords here. |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `license` | string | SPDX identifier (e.g. `MIT`, `Apache-2.0`). |
| `compatibility` | string or string[] | Environment requirements (e.g. `"Requires git, docker"`). Informational only. |
| `allowed-tools` | string | Space-delimited tool pre-approvals. E.g. `"Bash(git:*) Read Grep Glob"`. Experimental. |
| `metadata` | map<string, string> | Arbitrary key-value pairs. Skillli uses this for registry fields. |

### Minimal Valid SKILL.md

```markdown
---
name: hello-world
description: Greets the user with a friendly message
---

# Hello World

When invoked, respond with a warm greeting.
```

---

## Layer 2: Claude Code Extensions

These fields extend the open standard for Claude Code-specific features. Other
agent platforms will ignore them.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `argument-hint` | string | none | Shown during `/` autocomplete. E.g. `"[issue-number]"`. |
| `disable-model-invocation` | boolean | `false` | If `true`, only user can invoke via `/name`. Claude cannot auto-load. |
| `user-invocable` | boolean | `true` | If `false`, hidden from `/` menu. Only Claude can invoke. |
| `mode` | boolean | `false` | If `true`, appears in "Mode Commands" section. |
| `context` | string | none | Set to `"fork"` to run in isolated subagent. |
| `agent` | string | `"general-purpose"` | Subagent type when `context: fork`. Options: `Explore`, `Plan`, `Bash`, `general-purpose`, or custom agent name. |
| `model` | string | inherits | Model alias (`sonnet`, `opus`, `haiku`) or full ID. |
| `hooks` | object | none | Lifecycle hooks scoped to this skill. See hooks section below. |

### Runtime Substitutions (in Markdown body)

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking the skill. |
| `$ARGUMENTS[N]` / `$N` | Nth argument (0-indexed). |
| `${CLAUDE_SESSION_ID}` | Current session ID. |
| `` !`command` `` | Dynamic context injection — runs shell command, output replaces placeholder. |

### Context: Fork

When `context: fork` is set, the skill runs in an isolated subagent:
- No access to parent conversation history
- Skill content becomes the subagent's task prompt
- Results are summarized and returned to the main conversation
- Best for skills with explicit tasks, not guidelines

### Agent Types

| Type | Model | Tools | Use Case |
|------|-------|-------|----------|
| `Explore` | Haiku | Read-only | File discovery, code search |
| `Plan` | Inherits | Read-only | Codebase research for planning |
| `Bash` | Inherits | Terminal only | Running commands in isolation |
| `general-purpose` | Inherits | All tools | Complex multi-step tasks |

Custom agents from `.claude/agents/` can also be referenced by name.

### Hooks Block

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
          timeout: 30
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/lint.sh"
          async: true
  Stop:
    - hooks:
        - type: prompt
          prompt: "Check if all tasks are complete: $ARGUMENTS"
          model: haiku
```

Hook handler types: `command` (shell), `prompt` (single-turn LLM), `agent` (multi-turn subagent).

---

## Layer 3: Skillli Registry Extensions

These fields are used by the skillli registry for indexing, search, trust scoring,
and package management. They can be placed **either** as top-level frontmatter
fields or inside the `metadata` block. Top-level fields take priority.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | string (semver) | `"0.0.0"` | Package version for registry. |
| `author` | string | `"unknown"` | GitHub username or organization. |
| `tags` | string[] or CSV string | `[]` | 1-20 tags for discovery. |
| `category` | enum | `"other"` | `development`, `creative`, `enterprise`, `data`, `devops`, `other`. |
| `trust-level` | enum | `"community"` | `community`, `verified`, `official`. |
| `repository` | URL | none | GitHub repository URL. |
| `homepage` | URL | none | Homepage or docs URL. |
| `min-skillli-version` | string | none | Minimum skillli CLI version required. |
| `checksum` | string | auto-generated | SHA-256 checksum (set by publish). |

### Placing in metadata block (spec-compliant)

```yaml
---
name: my-skill
description: Does something useful for developers
license: MIT
metadata:
  version: "1.2.0"
  author: "my-github-user"
  tags: "typescript, testing, ci"
  category: "development"
---
```

### Placing as top-level fields (convenience, backwards-compatible)

```yaml
---
name: my-skill
description: Does something useful for developers
version: 1.2.0
author: my-github-user
license: MIT
tags: [typescript, testing, ci]
category: development
trust-level: community
---
```

Both formats are accepted. Top-level fields always win when both are present.

---

## Trust Levels

| Level | Description | How to get |
|-------|-------------|------------|
| `community` | Default. Basic validation only. | Publish to registry. |
| `verified` | Author identity verified. Additional review. | Apply for verification. |
| `official` | Maintained by the skillli team. | Skillli team only. |

---

## Categories

| Category | Covers |
|----------|--------|
| `development` | Code, testing, CI/CD, debugging, linting |
| `creative` | Writing, design, content creation |
| `enterprise` | Business, compliance, reporting |
| `data` | Analytics, ETL, visualization |
| `devops` | Infrastructure, deployment, monitoring |
| `other` | Everything else |

---

## Progressive Disclosure

Skills use three levels of loading:

1. **Always loaded**: `name` + `description` are injected into the system prompt
2. **On invocation**: Full SKILL.md body is loaded when skill is activated
3. **On demand**: Files in `scripts/`, `references/`, `assets/` loaded as needed

Keep `description` concise (it's always in context). Put detailed instructions in
the body. Keep SKILL.md under 500 lines / 5,000 tokens.

---

## Layer 4: Interactive / Branching Skills (Experimental)

Skills can include **quiz gates** that force context ingestion before the agent
proceeds. Like licensing exams in real life — the agent must actually process
and understand the material to answer correctly, which narrows the context
window to what matters and drives onboarding flow.

### How It Works

1. Skill author defines quiz questions in YAML frontmatter
2. When skill is invoked, the agent encounters quiz gates
3. The agent must answer correctly to proceed (if `gate: true`)
4. Wrong answers branch to other docs, skills, or sections — redirecting
   context to fill gaps before retrying
5. The onboarding flow adapts based on what the agent gets right/wrong

### Quiz Frontmatter

```yaml
---
name: auth-setup
description: Guides through authentication setup with context verification
quiz:
  - title: "Auth Prerequisites Check"
    description: "Verify understanding of the auth flow before proceeding"
    gate: true
    passing-score: 100
    questions:
      - question: "Which token type does this API use for authentication?"
        options:
          - label: "JWT Bearer tokens"
            correct: true
          - label: "API key in query string"
          - label: "OAuth 1.0a signatures"
        explanation: "This API uses JWT Bearer tokens. See the auth reference."
        on-correct:
          goto: "## Setup Steps"
        on-incorrect:
          load-reference: "references/auth-overview.md"
          message: "Review the auth overview first, then retry."
      - question: "Where should refresh tokens be stored?"
        options:
          - label: "localStorage"
          - label: "httpOnly secure cookie"
            correct: true
          - label: "sessionStorage"
        explanation: "Refresh tokens must be in httpOnly secure cookies to prevent XSS."
        on-incorrect:
          load-skill: "security-basics"
          message: "Load the security-basics skill for context on token storage."
---
```

### Quiz Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `quiz` | array or object | none | One or more quiz blocks. |
| `quiz[].title` | string | none | Quiz heading. |
| `quiz[].description` | string | none | Purpose of the quiz. |
| `quiz[].gate` | boolean | `false` | If `true`, agent must pass before proceeding. |
| `quiz[].passing-score` | number (0-100) | `100` | Percentage of correct answers needed. |
| `quiz[].questions` | array | required | At least 1 question. |

### Question Fields

| Field | Type | Description |
|-------|------|-------------|
| `question` | string | The question text. |
| `options` | array (2-6) | Answer choices. At least one must have `correct: true`. |
| `options[].label` | string | Display text for this choice. |
| `options[].correct` | boolean | Marks the correct answer. |
| `explanation` | string | Shown after answering — context for learning. |
| `on-correct` | branch | What to do when answered correctly. |
| `on-incorrect` | branch | What to do when answered incorrectly. |

### Branch Actions

| Field | Description |
|-------|-------------|
| `goto` | Jump to a section anchor in the skill body (e.g. `"## Setup Steps"`). |
| `load-skill` | Load another skill by name (e.g. `"security-basics"`). |
| `load-reference` | Load a reference doc (e.g. `"references/auth-overview.md"`). |
| `message` | Message to show the agent/user. |

### Use Cases

- **Onboarding**: Quiz the agent on project conventions before it writes code
- **API setup**: Verify understanding of auth flow before generating integration code
- **Compliance**: Ensure the agent understands data handling rules before accessing PII
- **Multi-path tutorials**: Branch to beginner/intermediate/advanced based on quiz results
- **Context narrowing**: Force the agent to ingest specific docs by quizzing on their content

---

## Decentralized Discovery: .well-known/skills/

Any domain can publish skills at a `.well-known` endpoint, enabling decentralized
discovery without a central registry. Think of it like a company's skill portfolio.

```
https://stripe.com/.well-known/skills/default/skill.md
https://vercel.com/.well-known/skills/default/skill.md
```

Use the trawler with `domains` to probe for published skills:

```typescript
import { trawl } from 'skillli';

const results = await trawl('payments', {
  domains: ['stripe.com', 'square.com', 'adyen.com'],
});
```

This complements the centralized registry — companies publish their own skills
on their domain, users discover them by probing known domains.

---

## Copy-Paste Templates

### Minimal (open standard only)

```markdown
---
name: my-skill
description: One line explaining when to use this skill
---

# My Skill

Instructions for the agent.
```

### With Claude Code extensions

```markdown
---
name: my-skill
description: One line explaining when to use this skill
argument-hint: "[filename]"
context: fork
agent: Explore
model: haiku
user-invocable: true
---

# My Skill

Use `$ARGUMENTS` as the target file.
Do the thing, report results.
```

### Full skillli registry skill

```markdown
---
name: my-skill
description: One line explaining when to use this skill
license: MIT
metadata:
  version: "1.0.0"
  author: "github-user"
  tags: "typescript, testing"
  category: "development"
user-invocable: true
---

# My Skill

Instructions for the agent.

## When to Use

Trigger keywords and scenarios.

## Instructions

Step-by-step behavior.

## Examples

Example inputs and expected outputs.
```

### Interactive skill with quiz gate

```markdown
---
name: api-onboarding
description: Guides through API integration with context verification quizzes
license: MIT
quiz:
  - title: "Prerequisites Check"
    gate: true
    passing-score: 100
    questions:
      - question: "What authentication method does this API use?"
        options:
          - label: "Bearer token"
            correct: true
          - label: "API key"
          - label: "Basic auth"
        on-incorrect:
          load-reference: "references/auth-guide.md"
          message: "Review the auth guide before continuing."
      - question: "What is the base URL for the production API?"
        options:
          - label: "https://api.example.com/v2"
            correct: true
          - label: "https://example.com/api"
          - label: "https://api.example.com/v1"
        on-incorrect:
          goto: "## API Reference"
metadata:
  version: "1.0.0"
  author: "example-team"
  tags: "api, onboarding"
  category: "development"
---

# API Onboarding

This skill verifies you understand the API before generating integration code.
The quiz above must pass before the instructions below are followed.

## API Reference

Base URL: `https://api.example.com/v2`
Auth: Bearer token in Authorization header.

## Setup Steps

1. Create a `.env` file with your API key
2. Initialize the SDK client
3. Test with a health check endpoint
```

---

## Naming Conventions

### Skill Names
- 1-64 characters
- Lowercase alphanumeric and hyphens only: `[a-z0-9-]`
- No leading, trailing, or consecutive hyphens
- Must match the directory name
- Becomes the `/slash-command` in Claude Code

**Good**: `code-reviewer`, `api-client`, `k8s-deploy`, `a`
**Bad**: `MySkill`, `-bad`, `bad-`, `my--skill`, `skill_name`

### Frontmatter Field Names
- Open standard and Claude Code fields use **kebab-case** in YAML: `argument-hint`, `allowed-tools`, `user-invocable`, `disable-model-invocation`
- Skillli registry fields also use **kebab-case** in YAML: `trust-level`, `min-skillli-version`
- The parser normalizes all kebab-case fields to **camelCase** in TypeScript: `argumentHint`, `allowedTools`, `userInvocable`, `trustLevel`

### Tag Conventions
- Use lowercase
- Prefer established terms: `typescript` not `ts`, `kubernetes` not `k8s`
- 1-20 tags per skill, each 1-50 characters
- Can be YAML array or comma-separated string

---

## YAML Authoring Notes

### Strings That Need Quoting
YAML has gotchas with certain values. Quote these:

```yaml
# Version numbers — YAML interprets 1.0 as a float, not "1.0"
version: "1.0.0"    # correct
version: 1.0.0      # wrong — YAML parses as float 1.0

# Descriptions with colons
description: "Setup: configure the API client"  # correct
description: Setup: configure the API client     # wrong — YAML parsing error

# Tags as CSV string
tags: "typescript, testing, ci"  # correct
tags: typescript, testing, ci    # wrong — YAML parsing error
```

### Multiline Descriptions
Use YAML block scalar if your description is long:

```yaml
description: >-
  Helps developers set up authentication for the Stripe API
  including webhook configuration and key management
```

### Boolean Fields
YAML accepts multiple boolean forms. Prefer `true`/`false`:

```yaml
gate: true           # preferred
gate: yes            # works but less clear
gate: on             # works but less clear
```

### Null vs Missing
Omitting a field entirely is the same as setting it to null. The parser treats
both as "not provided" and applies the appropriate default.
