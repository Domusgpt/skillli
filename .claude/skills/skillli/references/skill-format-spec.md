# Skillli Skill Format Specification (2026)

Complete reference for authoring SKILL.md packages. Copy-paste the
templates below and fill in your details.

---

## Quick Copy-Paste: Minimal SKILL.md

The simplest valid skill. Copy this, change the values, write your
instructions in the body:

```markdown
---
name: my-skill
version: 1.0.0
description: Short clear description of what this skill does (10-500 chars)
author: your-github-username
license: MIT
tags: [primary-tag, secondary-tag]
category: development
trust-level: community
user-invocable: true
---

# My Skill

What this skill does in one sentence.

## When to Use

- User says "do X" or "/my-skill"
- Agent encounters Y situation

## Instructions

1. Step one
2. Step two
3. Step three

## Examples

**Input:** "do X for file.ts"
**Output:** Modified file.ts with X applied
```

---

## Quick Copy-Paste: Full SKILL.md

All optional fields and recommended body sections:

```markdown
---
name: my-skill
version: 1.0.0
description: Generates comprehensive unit tests for TypeScript files using vitest
author: your-github-username
license: MIT
tags: [testing, typescript, vitest, unit-tests, code-quality]
category: development
repository: https://github.com/you/my-skill
homepage: https://my-skill-docs.example.com
trust-level: community
user-invocable: true
disable-model-invocation: false
min-skillli-version: 0.1.0
---

# My Skill

Generates comprehensive unit tests for TypeScript files. Reads source
files, identifies exported functions and classes, and produces vitest
test suites with edge case coverage.

## When to Use

Activate this skill when:
- User asks to "generate tests", "add unit tests", or "write tests"
- User invokes `/my-skill`
- Agent finds TypeScript files with no corresponding test files
- User mentions "test coverage" for TypeScript code

Do NOT use when:
- Files are not TypeScript (.ts, .tsx)
- User wants integration or e2e tests (different skill)

## Instructions

1. Identify the target file(s) from user input or context
2. Read each target file completely
3. For each exported function/class:
   a. Determine input types, return types, and side effects
   b. Generate test cases covering: happy path, edge cases, error cases
   c. Use vitest `describe`/`it` blocks with clear test names
4. Write the test file to `test/<filename>.test.ts`
5. Run `npx vitest run <test-file>` to verify tests pass
6. If tests fail, read the error, fix, and re-run

## Input Format

Accepts one of:
- A file path: "generate tests for src/utils.ts"
- A directory: "test everything in src/core/"
- Implicit: agent detects untested files in context

## Output Format

Creates test files following this structure:
```typescript
import { describe, it, expect } from 'vitest';
import { functionName } from '../src/module.js';

describe('functionName', () => {
  it('should handle normal input', () => {
    expect(functionName('input')).toBe('expected');
  });

  it('should handle edge case', () => {
    expect(functionName('')).toBe('default');
  });
});
```

## Examples

### Example 1: Single file
**Input:** "generate tests for src/math.ts"
**Action:** Read src/math.ts, find exported `add()` and `multiply()`
**Output:** Creates test/math.test.ts with tests for both functions

### Example 2: Directory
**Input:** "add tests for src/core/"
**Action:** Scan directory, find untested exports
**Output:** Creates test files for each source file

## Constraints

- Only handles TypeScript (.ts, .tsx)
- Generates vitest tests (not jest, mocha, etc.)
- Maximum 50 test cases per file
- Does not modify source files

## References

- See `references/testing-patterns.md` for edge case strategies
- Uses `scripts/check-coverage.sh` for post-run coverage check
```

---

## SKILL.md Structure

### YAML Frontmatter

Everything between the `---` markers. Parsed by gray-matter, validated
by Zod.

### Required Fields

| Field | Type | Constraints | Example |
|-------|------|-------------|---------|
| `name` | string | Lowercase alphanumeric + hyphens. 1-100 chars. Cannot start/end with hyphen. | `code-reviewer` |
| `version` | string | Strict semver: `MAJOR.MINOR.PATCH` | `1.0.0` |
| `description` | string | 10-500 characters | `"Reviews PR diffs for bugs and style"` |
| `author` | string | Non-empty. Typically GitHub username. | `your-name` |
| `license` | string | SPDX identifier | `MIT`, `Apache-2.0` |
| `tags` | string[] | 1-20 tags, each 1-50 chars | `[review, security, typescript]` |
| `category` | enum | See categories below | `development` |

### Optional Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `repository` | URL string | — | GitHub repo for source code |
| `homepage` | URL string | — | Documentation website |
| `trust-level` | enum | `community` | `community`, `verified`, `official` |
| `user-invocable` | boolean | `true` | Allow slash-command invocation (`/<name>`) |
| `disable-model-invocation` | boolean | `false` | Prevent agent auto-invocation |
| `min-skillli-version` | string | — | Require minimum skillli version |
| `checksum` | string | — | SHA-256, auto-generated on publish |

### Categories

| Category | When to use |
|----------|-------------|
| `development` | Code generation, testing, CI/CD, debugging, refactoring, linting |
| `creative` | Writing, design, content creation, media, storytelling |
| `enterprise` | Business processes, compliance, reporting, workflows, legal |
| `data` | Analytics, ETL, visualization, machine learning, data pipelines |
| `devops` | Infrastructure, deployment, monitoring, cloud, containers |
| `other` | Anything that doesn't fit the above |

### Trust Levels

| Level | Who can set it | Meaning |
|-------|----------------|---------|
| `community` | Anyone | Basic validation only. Users should review SKILL.md before installing. |
| `verified` | Registry maintainers | Author identity confirmed. Additional manual review. |
| `official` | Skillli team | First-party maintained. Highest trust. |

---

## Markdown Body Best Practices

The body after frontmatter is the actual skill instructions. Agents
read this to know what to do.

### Recommended Sections

1. **Title + summary** — One sentence, what does this skill do
2. **When to Use** — Explicit trigger conditions. Agents use this to
   decide whether to invoke. Be specific: list user phrases, file
   patterns, situations.
3. **Instructions** — Numbered steps. Specific and actionable. This is
   the core of the skill.
4. **Input Format** — What the skill expects to receive
5. **Output Format** — What the skill produces (files, console, data)
6. **Examples** — Concrete input/output pairs. Agents learn from these.
7. **Constraints** — What the skill does NOT do. Prevents misuse.
8. **References** — Pointers to files in `references/` or `scripts/`

### Writing Tips

- Write for an AI agent, not a human reading docs. Be direct and
  imperative: "Read the file", "Generate tests", "Run the command".
- Include specific file paths, command syntax, and output formats.
- Use examples liberally — agents learn best from concrete examples.
- Keep under 500 lines. If you need more, put reference material in
  `references/` and point to it.
- Don't use emojis unless the skill specifically needs them.

---

## Skill Package Directory Structure

```
my-skill/
├── SKILL.md            # Required — the skill definition
├── skillli.json        # Auto-generated manifest (created by init/publish)
├── scripts/            # Optional — helper scripts
│   ├── validate.sh     # Only .sh, .py, .js, .ts allowed
│   └── transform.py
├── references/         # Optional — reference documents
│   ├── style-guide.md  # Supplementary docs the skill can reference
│   └── api-spec.json
├── assets/             # Optional — templates, configs, data
│   └── template.hbs
└── LICENSE             # Recommended
```

### Allowed script extensions
Only these are permitted in `scripts/`: `.sh`, `.py`, `.js`, `.ts`

Any other extension causes the safeguard check to fail.

---

## Safeguard Checks

Every skill is validated before install and publish. These checks must
pass:

| Check | Severity | What it catches |
|-------|----------|-----------------|
| Schema validation | error | Missing/malformed frontmatter |
| Line count | warning | SKILL.md over 500 lines |
| Prohibited patterns | error | `eval()`, `exec()`, `execSync()`, `rm -rf /`, `child_process`, `Process.kill`, hardcoded passwords/API keys, large base64 blobs |
| Script safety | error | Disallowed file extensions in scripts/ |
| File size | warning | Package over 5MB total |

Skills that fail **error**-severity checks are rejected. Warning-severity
checks produce warnings but allow installation.

---

## Trust Score Computation (0-100)

| Factor | Points |
|--------|--------|
| Has repository URL | +10 |
| Has license | +10 |
| Trust level: verified | +15 |
| Trust level: official | +20 |
| Rating >= 3.5 stars | +15 |
| Downloads > 100 | +5 |
| Downloads > 1000 | +10 |
| No prohibited patterns | +20 |
| SKILL.md under 500 lines | +15 |

Maximum: 100. Recommended minimum for auto-install: 50.
Hard minimum before warning: 30.

---

## CLI Reference for Authors

```bash
# Create a new skill (interactive)
skillli init my-skill

# Create a new skill (non-interactive / CI / agent)
skillli init my-skill -y \
  --description "What it does" \
  --author your-name \
  --tags "tag1,tag2" \
  --category development \
  --license MIT \
  --version 1.0.0

# Validate without publishing
skillli publish --dry-run
skillli publish ./my-skill --dry-run

# Publish (generates manifest + checksum, shows PR instructions)
skillli publish ./my-skill
```

---

## Registry Submission

After `skillli publish` validates your skill:

1. Fork `https://github.com/skillli/registry`
2. Add your skill entry to `index.json`
3. Submit a pull request with the generated manifest
4. Automated checks run on your PR
5. Once merged, your skill appears in `skillli search`

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Name starts with hyphen | Use lowercase alphanumeric start: `my-skill` not `-my-skill` |
| Description too short | Must be 10+ characters |
| No tags | At least 1 tag required |
| SKILL.md too long | Keep under 500 lines, use references/ for extras |
| Using exec() in instructions | Prohibited pattern — use specific commands instead |
| Binary files in scripts/ | Only .sh, .py, .js, .ts allowed |
