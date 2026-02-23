---
name: skillli
description: The skill librarian for agentic AI. Discover, search, install, rate, publish, and manage SKILL.md packages. Use when the user wants to find skills, install a skill, create or publish their own skill, check ratings, or when an agent needs to search for relevant skills. Triggers on /skillli, "find a skill", "search skills", "install skill", "publish skill", "skill marketplace", "create a skill".
license: MIT
compatibility: Requires Node.js >= 18. Works in Claude Code, Cursor, GitHub Copilot, Codex CLI, and any Agent Skills compatible tool.
metadata:
  author: Domusgpt
  version: "0.1.0"
  tags: skills, marketplace, discovery, publishing, agents, mcp
  category: development
  trust-level: official
  repository: https://github.com/Domusgpt/skillli
---

# Skillli — The Skill Librarian

Help users and agents discover, evaluate, install, author, and publish
agentic AI skills following the [Agent Skills](https://agentskills.io)
open standard.

skillli manages SKILL.md packages. The ecosystem:

- **CLI** (`skillli`) — create, search, install, publish, rate skills
- **MCP Server** (`skillli-mcp`) — tools for Claude Code integration
- **Registry** — centralized index of published skills
- **Trawler** — multi-source search across registry, GitHub, npm
- **Safeguards** — trust scoring, pattern scanning, size limits

Local state: `~/.skillli/` (config.json, index.json, skills/, cache/)

---

## Find Skills

```bash
skillli search "code review"
skillli search "kubernetes" --category devops --min-rating 4
skillli trawl "database migration helper" --sources registry github npm
```

MCP tools for agents:
```
search_skills(query: "code review", tags: ["security"], limit: 5)
trawl_skills(query: "kubernetes deployment", sources: ["registry", "github"])
```

Present results with name, trust level badge, description, rating.
If trust score < 50, flag the concern before suggesting install.

---

## Evaluate Skills

```bash
skillli info <skill-name>
```

MCP: `get_skill_info(name: "skill-name")`

Trust levels: [OFFICIAL] (skillli team), [VERIFIED] (identity confirmed), [COMMUNITY] (basic checks only).

Trust score 0-100: repo (+10), license (+10), trust level (+15-20), rating >= 3.5 (+15), downloads (+5-10), no prohibited patterns (+20), under 500 lines (+15).

Never install trust score < 30 without explicit user confirmation.

---

## Install Skills

```bash
skillli install code-reviewer --link
skillli install https://github.com/user/my-skill
skillli install ./my-local-skill --local
```

MCP: `install_skill(name: "code-reviewer", link: true)`

`--link` symlinks into `.claude/skills/` for the current project.

After install: skill is in `~/.skillli/skills/<name>/`, registered in config, run `skillli list` to confirm.

---

## Use Installed Skills

Once linked, invoke via `/<skill-name>` (if `user-invocable: true`) or let the agent auto-invoke when triggers match.

```bash
skillli list
skillli list --json
skillli uninstall <skill-name>
```

MCP resource: `skillli://installed`

---

## Rate Skills

```bash
skillli rate code-reviewer 5 -m "Great for catching security issues"
```

MCP: `rate_skill(name: "code-reviewer", rating: 5, comment: "Excellent")`

---

## Create a New Skill

Interactive:
```bash
skillli init my-skill
```

Non-interactive (agents, CI):
```bash
skillli init my-skill -y \
  --description "Generates unit tests for TypeScript" \
  --author your-github-name \
  --tags "testing,typescript" \
  --category development
```

Creates:
```
my-skill/
├── SKILL.md         # Edit this — the skill definition
├── skillli.json     # Auto-generated manifest
├── scripts/         # Optional helper scripts
└── references/      # Optional reference docs
```

### Agent Skills Open Standard frontmatter (agentskills.io)

Only `name` and `description` are required by the standard:

```yaml
---
name: my-skill
description: What this skill does and when to use it. Include trigger keywords. Max 1024 chars. Use a single-line string.
license: MIT
compatibility: Requires Python 3.10+
metadata:
  author: your-github-name
  version: "1.0.0"
  tags: testing, typescript
  category: development
---
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Max 64 chars, lowercase + hyphens, no `--`, must match directory name |
| `description` | Yes | Max 1024 chars, single-line string, include trigger keywords |
| `license` | No | SPDX identifier or license file reference |
| `compatibility` | No | Max 500 chars, environment requirements |
| `metadata` | No | Key-value map for extensions (author, version, tags, etc.) |
| `allowed-tools` | No | Space-delimited, experimental |

### Claude Code extension fields

| Field | Purpose |
|-------|---------|
| `argument-hint` | Autocomplete hint: `[issue-number]` |
| `disable-model-invocation` | `true` = only user can invoke via `/name` |
| `user-invocable` | `false` = hide from slash menu, Claude-only |
| `model` | Force specific model |
| `context` | `fork` = run in isolated subagent |
| `agent` | Subagent type: `Explore`, `Plan`, `general-purpose`, or custom |
| `hooks` | Lifecycle hooks: PreToolUse, PostToolUse, Stop |

### Runtime substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All args passed to `/skill-name args` |
| `$0`, `$1`, `$2` | Positional args |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `` !`command` `` | Shell command output injected before skill runs |

### Body content

No format restrictions per the spec. Write whatever helps agents perform the task. The description is the triggering mechanism — do not duplicate trigger info in the body.

Keep SKILL.md under 500 lines. Move detailed reference material to `references/`.

See [references/skill-format-spec.md](references/skill-format-spec.md) for the complete authoring guide with copy-paste templates.

---

## Publish

```bash
skillli publish --dry-run    # validate first
skillli publish ./my-skill   # generates manifest, checksum, PR instructions
```

Safeguard checks: schema validation, 5MB size limit, 500 line limit, prohibited patterns (eval, exec, rm -rf /, hardcoded secrets), script allowlisting (.sh .py .js .ts only), SHA-256 checksum.

---

## MCP Server Integration

```json
{
  "mcpServers": {
    "skillli": {
      "command": "npx",
      "args": ["skillli-mcp"]
    }
  }
}
```

Tools: `search_skills`, `install_skill`, `get_skill_info`, `trawl_skills`, `rate_skill`
Resources: `skillli://installed`, `skillli://index`

---

## Agent Workflow Patterns

**"I need a skill for X"**: search_skills → trawl_skills if needed → present with trust scores → install on approval → prompt to rate after use.

**"Create a skill that does X"**: skillli init → edit SKILL.md → skillli publish --dry-run → skillli publish.

**Agent self-equipping**: trawl for relevant skills → evaluate trust → install high-trust matches → read installed SKILL.md → proceed with task.

All commands work non-interactively (auto-detected when stdin is not a TTY, or forced with `-y`).
