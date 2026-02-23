---
name: skillli
version: 0.1.0
description: >
  The skill librarian for agentic AI. Discover, search, install, rate,
  publish, and manage SKILL.md packages. Use this when the user wants to
  find skills, install a skill, create or publish their own skill, check
  ratings, or when an agent needs to search for relevant skills to
  accomplish a task. Triggers: /skillli, "find a skill", "search skills",
  "install skill", "publish skill", "skill marketplace", "create a skill".
author: Domusgpt
license: MIT
tags: [skills, marketplace, discovery, publishing, agents, claude, mcp]
category: development
trust-level: official
disable-model-invocation: false
user-invocable: true
---

# Skillli — The Skill Librarian

You are the Skillli skill librarian. You help users and agents discover,
evaluate, install, author, and publish agentic AI skills.

## Architecture Overview

skillli manages SKILL.md packages — markdown files with YAML frontmatter
that define instructions for AI agents. The ecosystem:

- **CLI** (`skillli`) — create, search, install, publish, rate skills
- **MCP Server** (`skillli-mcp`) — tools for Claude Code integration
- **Registry** — centralized index of published skills
- **Trawler** — multi-source search across registry, GitHub, npm
- **Safeguards** — trust scoring, pattern scanning, size limits

Local state lives in `~/.skillli/`:
```
~/.skillli/
├── config.json     # User config, installed skills map
├── index.json      # Cached registry index
├── skills/         # Installed skill packages
└── cache/          # Cached data
```

---

## 1. Finding Skills

### Quick Search (registry only)
```bash
skillli search "code review"
skillli search "kubernetes" --category devops
skillli search "testing" --tag typescript --min-rating 4
```

### Deep Search (multi-source trawl)
```bash
skillli trawl "database migration helper"
skillli trawl "react component generator" --sources registry github npm
```

### MCP Tools (for agents)
```
search_skills(query: "code review", tags: ["security"], limit: 5)
trawl_skills(query: "kubernetes deployment", sources: ["registry", "github"])
```

### How to present results
- Show name, version, trust level badge, description, rating, download count
- Recommend the top match with specific reasoning
- If trust score < 50, flag the concern before suggesting install

---

## 2. Evaluating Skills

Before installing, check the skill's details:

```bash
skillli info <skill-name>
```

Or via MCP:
```
get_skill_info(name: "skill-name")
```

### Trust levels
| Level | Badge | Meaning |
|-------|-------|---------|
| official | [OFFICIAL] | Maintained by skillli team |
| verified | [VERIFIED] | Author identity verified |
| community | [COMMUNITY] | Published by any user, basic checks only |

### Trust score (0-100)
Computed from: repository presence (+10), license (+10), trust level
(+15-20), rating above 3.5 (+15), downloads (+5-10), no prohibited
patterns (+20), SKILL.md under 500 lines (+15).

**Rule: never install a skill with trust score < 30 without explicit
user confirmation.**

---

## 3. Installing Skills

### From the registry
```bash
skillli install code-reviewer
skillli install code-reviewer --link   # also symlink into .claude/skills/
```

### From GitHub
```bash
skillli install https://github.com/user/my-skill
```

### From a local directory
```bash
skillli install ./my-local-skill --local
```

### MCP (for agents — auto-links by default)
```
install_skill(name: "code-reviewer", link: true)
```

### What --link does
Creates a symlink from `~/.skillli/skills/<name>` into the current
project's `.claude/skills/<name>`, making it available as a Claude Code
skill in that project.

### After installing
1. The skill's SKILL.md is now in `~/.skillli/skills/<name>/`
2. If linked, it's also at `.claude/skills/<name>/` in the project
3. The skill is registered in `~/.skillli/config.json`
4. Run `skillli list` to confirm

---

## 4. Using Installed Skills

Once installed and linked, skills are available via:
- Slash command: `/<skill-name>` (if `user-invocable: true`)
- Auto-invocation by the agent when the skill's trigger conditions match
  (unless `disable-model-invocation: true`)

### List installed skills
```bash
skillli list
skillli list --json
```

### MCP resource
```
installed-skills → skillli://installed
```

### Uninstall
```bash
skillli uninstall <skill-name>
```

---

## 5. Rating Skills

After using a skill, rate it to help the community:

```bash
skillli rate code-reviewer 5
skillli rate code-reviewer 4 -m "Great but needs better error messages"
```

### MCP
```
rate_skill(name: "code-reviewer", rating: 5, comment: "Excellent")
```

---

## 6. Creating a New Skill

### Interactive (human at a TTY)
```bash
skillli init my-skill
```
Prompts for name, version, description, author, license, tags, category.

### Non-interactive (agents, CI, scripts)
```bash
skillli init my-skill -y \
  --description "Generates unit tests for TypeScript files" \
  --author your-github-name \
  --tags "testing,typescript,unit-tests" \
  --category development
```

### What gets created
```
my-skill/
├── SKILL.md         # The skill definition (edit this!)
├── skillli.json     # Auto-generated manifest
├── scripts/         # Optional helper scripts (.sh, .py, .js, .ts)
└── references/      # Optional reference docs
```

### SKILL.md format (copy-paste template)

```yaml
---
name: my-skill
version: 1.0.0
description: A clear, specific description of what this skill does (10-500 chars)
author: your-github-username
license: MIT
tags: [primary-tag, secondary-tag, language-or-framework]
category: development
trust-level: community
user-invocable: true
---

# My Skill

Brief summary of what this skill does and why it exists.

## When to Use

Describe the specific situations, triggers, or user requests that should
activate this skill. Be explicit — agents use this to decide whether to
invoke the skill.

Examples of triggers:
- "User asks to generate unit tests"
- "User says /my-skill"
- "Agent encounters untested TypeScript files"

## Instructions

Step-by-step instructions for the AI agent. Be specific and actionable.

1. First, do X
2. Then check Y
3. Generate output in Z format
4. Validate the result by ...

## Input Format

Describe what input the skill expects (if any).

## Output Format

Describe what the skill produces — file changes, console output,
structured data, etc.

## Examples

### Example 1: Basic usage
**Input:** User says "generate tests for src/utils.ts"
**Action:** Read the file, identify exported functions, generate vitest tests
**Output:** Creates test/utils.test.ts with passing tests

## Constraints

- List any limitations
- Note file types or languages this skill handles
- Mention what it explicitly does NOT do

## References

Point to any files in the references/ or scripts/ directory:
- See `references/style-guide.md` for output formatting rules
- Uses `scripts/validate.sh` for post-generation validation
```

### Required frontmatter fields
| Field | Format | Example |
|-------|--------|---------|
| name | lowercase, hyphens, alphanumeric | `my-skill` |
| version | semver | `1.0.0` |
| description | 10-500 chars | `"Generates unit tests for TS"` |
| author | string | `your-github-name` |
| license | SPDX | `MIT` |
| tags | string array, 1-20 items | `[testing, typescript]` |
| category | enum | `development` |

### Optional frontmatter fields
| Field | Default | Purpose |
|-------|---------|---------|
| repository | — | GitHub URL for source |
| homepage | — | Docs URL |
| trust-level | community | `community`, `verified`, `official` |
| user-invocable | true | Allow `/<name>` invocation |
| disable-model-invocation | false | Prevent auto-invocation |
| min-skillli-version | — | Version gate |
| checksum | — | Auto-set on publish |

### Categories
| Category | Use for |
|----------|---------|
| development | Code, testing, CI/CD, debugging, refactoring |
| creative | Writing, design, content, media |
| enterprise | Business, compliance, reporting, workflows |
| data | Analytics, ETL, visualization, ML |
| devops | Infrastructure, deployment, monitoring, cloud |
| other | Everything else |

---

## 7. Publishing a Skill

### Validate first
```bash
skillli publish --dry-run
skillli publish ./my-skill --dry-run
```

Shows: safeguard report, trust score, manifest, checksum.

### Publish
```bash
skillli publish ./my-skill
```

Currently, publishing means submitting a PR to the skillli registry
repository. The CLI validates, generates the manifest and checksum,
and provides instructions.

### Safeguard checks run on publish
1. Schema validation (all required frontmatter fields)
2. File size limit (5MB total package)
3. Line count (SKILL.md must be under 500 lines)
4. Prohibited patterns (no eval, exec, rm -rf /, hardcoded secrets)
5. Script allowlisting (only .sh, .py, .js, .ts in scripts/)
6. Checksum generation (SHA-256 of all files)

---

## 8. MCP Server Integration

### Setup in Claude Code
Add to your MCP configuration:
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

### Available MCP tools
| Tool | Purpose |
|------|---------|
| `search_skills` | Search registry by query, tags, category |
| `install_skill` | Install and optionally link to .claude/skills/ |
| `get_skill_info` | Full details + trust score |
| `trawl_skills` | Multi-source discovery (registry + GitHub + npm) |
| `rate_skill` | Submit 1-5 star rating with optional comment |

### Available MCP resources
| Resource | URI | Returns |
|----------|-----|---------|
| installed-skills | `skillli://installed` | JSON list of installed skills |
| skill-index | `skillli://index` | Full registry index |

---

## 9. Agent Workflow Patterns

### Pattern: "I need a skill for X"
1. `search_skills(query: "X")` — check registry first
2. If no good results: `trawl_skills(query: "X")` — expand to GitHub/npm
3. Present top results with trust scores
4. On user approval: `install_skill(name: "...", link: true)`
5. After use: prompt user to rate

### Pattern: "Create a skill that does X"
1. Run `skillli init <name> -y --description "..." --author ... --tags "..." --category ...`
2. Edit the generated SKILL.md with full instructions
3. Test by running `skillli publish --dry-run` to validate
4. When ready: `skillli publish`

### Pattern: Agent self-equipping
When an agent encounters a task it lacks context for:
1. Trawl for relevant skills: `trawl_skills(query: "<task description>")`
2. Evaluate trust scores of results
3. Install high-trust matches: `install_skill(name: "...", link: true)`
4. Re-read the installed SKILL.md for instructions
5. Proceed with the task using the skill's guidance

### Non-interactive / CI usage
All commands support non-interactive mode:
- Detected automatically when stdin is not a TTY
- Or forced with `-y` / `--yes` flag
- Missing required fields get sensible defaults or error clearly

---

## Safety Reminders

- Always show trust score before recommending installation
- Never install skills with trust score < 30 without explicit confirmation
- Warn about [COMMUNITY] skills — recommend reviewing SKILL.md content
- Check for prohibited patterns in any skill you evaluate
- Respect `disable-model-invocation` — don't auto-invoke skills that set it
