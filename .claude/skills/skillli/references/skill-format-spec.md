# Skill Format Specification

Based on the [Agent Skills open standard](https://agentskills.io/specification)
with [Claude Code extensions](https://code.claude.com/docs/en/skills) and
skillli registry extensions.

---

## Copy-Paste: Minimal SKILL.md

```yaml
---
name: my-skill
description: What this skill does and when to use it. Include trigger keywords so agents know when to activate. Max 1024 chars, single-line string.
license: MIT
---

Instructions for the agent. Be specific and actionable.

1. Step one
2. Step two
3. Step three
```

Only `name` and `description` are required by the open standard.

---

## Copy-Paste: Full SKILL.md (with skillli registry fields)

```yaml
---
name: my-skill
description: Generates unit tests for TypeScript files using vitest. Use when the user asks to generate tests, add unit tests, or improve test coverage for TypeScript code.
license: MIT
compatibility: Requires Node.js >= 18 and vitest
metadata:
  author: your-github-name
  version: "1.0.0"
  tags: testing, typescript, vitest
  category: development
  repository: https://github.com/you/my-skill
---

# my-skill

Generate vitest test suites for TypeScript files.

1. Read the target file
2. Identify exported functions and classes
3. Generate test cases: happy path, edge cases, error cases
4. Write to test/<filename>.test.ts
5. Run `npx vitest run <test-file>` to verify

## Examples

**Input:** "generate tests for src/utils.ts"
**Output:** Creates test/utils.test.ts with passing tests

## Constraints

- TypeScript only (.ts, .tsx)
- Generates vitest tests (not jest/mocha)
- Does not modify source files
```

---

## Agent Skills Open Standard Fields

Source: [agentskills.io/specification](https://agentskills.io/specification)

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | 1-64 chars. Lowercase letters, numbers, hyphens. No leading/trailing/consecutive hyphens. Must match the directory name. |
| `description` | Yes | 1-1024 chars. What the skill does AND when to use it. Use single-line strings — multiline YAML indicators (`>-`, `\|`) may not parse correctly. |
| `license` | No | SPDX identifier or license file reference. |
| `compatibility` | No | 1-500 chars. Environment requirements (runtime, packages, network). |
| `metadata` | No | Key-value map (string → string). For extensions not in the base spec. |
| `allowed-tools` | No | Space-delimited tool list. Experimental. Example: `Bash(git:*) Read` |

### Name rules
- `code-review` — valid
- `PDF-Processing` — invalid (uppercase)
- `-my-skill` — invalid (leading hyphen)
- `my--skill` — invalid (consecutive hyphens)

### Description tips
- Include trigger keywords: "Use when the user asks to...", "Activate when..."
- Be specific: "Extracts text from PDFs and fills forms" not "Helps with PDFs"
- The description is the primary triggering mechanism — agents decide whether to load the skill based on this field alone

---

## Claude Code Extension Fields

These are recognized by Claude Code on top of the open standard:

| Field | Default | Purpose |
|-------|---------|---------|
| `argument-hint` | — | Autocomplete hint: `[issue-number]`, `[file] [format]` |
| `disable-model-invocation` | `false` | `true` = only user can invoke via `/name`. Removes from Claude's context entirely. |
| `user-invocable` | `true` | `false` = hide from slash menu. Claude can still invoke. |
| `model` | — | Force model: `claude-sonnet-4-20250514` |
| `context` | — | `fork` = run in isolated subagent |
| `agent` | `general-purpose` | Subagent type: `Explore`, `Plan`, `general-purpose`, or custom from `.claude/agents/` |
| `hooks` | — | Lifecycle hooks: `PreToolUse`, `PostToolUse`, `Stop` |

### Invocation control

| Setting | Slash menu | Agent can invoke | Description loaded |
|---------|-----------|-----------------|-------------------|
| (default) | Yes | Yes | Always |
| `disable-model-invocation: true` | Yes | No | Only when user invokes |
| `user-invocable: false` | No | Yes | Always |

### Runtime substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All args from `/skill-name args here` |
| `$0`, `$1`, `$2` | Positional args by index |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `` !`command` `` | Shell command output injected before skill content is sent |

---

## Skillli Registry Extensions

When publishing to the skillli registry, these fields go under `metadata`:

| Key | Purpose |
|-----|---------|
| `author` | GitHub username |
| `version` | Semver: `1.0.0` |
| `tags` | Comma-separated: `testing, typescript` |
| `category` | `development`, `creative`, `enterprise`, `data`, `devops`, `other` |
| `repository` | GitHub URL |
| `trust-level` | `community` (default), `verified`, `official` |

For backwards compatibility, skillli also accepts these as top-level frontmatter fields. Top-level wins over metadata block.

---

## Directory Structure

```
my-skill/
├── SKILL.md          # Required — skill definition
├── skillli.json      # Auto-generated by skillli init/publish
├── scripts/          # Optional — executable code agents can run
│   └── validate.sh   # Languages depend on agent (Python, Bash, JS common)
├── references/       # Optional — docs loaded on demand
│   └── api-spec.md   # Keep focused — agents load these independently
├── assets/           # Optional — templates, data files, images
└── LICENSE           # Recommended
```

### Progressive disclosure

1. **Metadata (~100 tokens):** `name` + `description` loaded at startup for all skills
2. **Instructions (< 5000 tokens):** Full SKILL.md body loaded when activated
3. **Resources (on demand):** Files in scripts/, references/, assets/ loaded only when needed

Keep SKILL.md under 500 lines. Move detail to reference files.

---

## Safeguard Checks (skillli)

| Check | Severity | Catches |
|-------|----------|---------|
| Schema validation | error | Missing/malformed frontmatter |
| Line count | warning | SKILL.md over 500 lines |
| Prohibited patterns | error | `eval()`, `exec()`, `rm -rf /`, `child_process`, hardcoded secrets, large base64 |
| Script safety | error | Disallowed file extensions in scripts/ |
| File size | warning | Package over 5MB |

---

## Trust Score (0-100)

| Factor | Points |
|--------|--------|
| Has repository | +10 |
| Has license | +10 |
| Trust: verified | +15 |
| Trust: official | +20 |
| Rating >= 3.5 | +15 |
| Downloads > 100 | +5 |
| Downloads > 1000 | +10 |
| No prohibited patterns | +20 |
| Under 500 lines | +15 |

---

## Portability

Skills following the Agent Skills standard work across: Claude Code, Cursor, GitHub Copilot, Codex CLI, Windsurf, Gemini CLI, Roo Code, Trae, and others. Store in `.github/skills/` for cross-platform discovery, or `.claude/skills/` for Claude Code specifically.
