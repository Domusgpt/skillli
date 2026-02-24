# skillli

**The Skill Librarian** — Discover, publish, rate, and use agentic AI skills packages.

```
npm install -g skillli
```

skillli is an npm package that provides a complete ecosystem for managing agentic AI skills (SKILL.md files). It includes a CLI, a core library, an MCP server for Claude Code integration, and an agentic trawler for multi-source skill discovery.

## Features

- **Open Standard** — Follows the [Agent Skills spec](https://agentskills.io/specification) (26+ platforms)
- **CLI** — `skillli init`, `search`, `install`, `publish`, `validate`, `rate`, `trawl`, and more
- **MCP Server** — Native Claude Code integration via Model Context Protocol
- **Agentic Trawler** — Search across the registry, GitHub, and npm for relevant skills
- **Safeguards** — Trust scoring, prohibited pattern detection, size limits, checksum verification
- **Ratings** — Community ratings and reviews for skill quality

## Quick Start

```bash
# Install globally
npm install -g skillli

# Create a new skill
skillli init my-skill

# Validate a SKILL.md
skillli validate ./my-skill

# Search for skills
skillli search "code review"

# Install a skill
skillli install code-reviewer --link

# Trawl across multiple sources
skillli trawl "kubernetes deployment"
```

## Skill Format

Skills follow the [Agent Skills open standard](https://agentskills.io/specification).
Only `name` and `description` are required:

```yaml
---
name: my-skill
description: A clear description of when and how to use this skill
---

# My Skill

Instructions that Claude follows when this skill is invoked...
```

### Full example with skillli registry fields

```yaml
---
name: my-skill
description: A clear description of when and how to use this skill
license: MIT
metadata:
  version: "1.0.0"
  author: "your-github-username"
  tags: "typescript, testing"
  category: "development"
user-invocable: true
---

# My Skill

Instructions that Claude follows when this skill is invoked...
```

Registry fields (`version`, `author`, `tags`, `category`) can go in the `metadata`
block (spec-compliant) or as top-level fields (convenience). See
[references/skill-format-spec.md](.claude/skills/skillli/references/skill-format-spec.md)
for the full specification covering all three layers: open standard, Claude Code
extensions, and skillli registry extensions.

### Categories

`development` | `creative` | `enterprise` | `data` | `devops` | `other`

### Trust Levels

- **community** — Published by any user, basic validation
- **verified** — Author identity verified, additional review
- **official** — Maintained by the skillli team

## CLI Commands

| Command | Description |
|---------|-------------|
| `skillli init [name]` | Create a new skill from template |
| `skillli search <query>` | Search the registry |
| `skillli install <skill>` | Install a skill |
| `skillli uninstall <skill>` | Uninstall a skill |
| `skillli info <skill>` | Show skill details |
| `skillli list` | List installed skills |
| `skillli validate [path]` | Validate a SKILL.md without publishing |
| `skillli rate <skill> <1-5>` | Rate a skill |
| `skillli update` | Sync registry index |
| `skillli publish [path]` | Publish a skill |
| `skillli trawl <query>` | Agentic multi-source search |

## MCP Server

skillli includes a built-in MCP server for Claude Code integration:

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

### MCP Tools

- `search_skills` — Search the registry by query, tags, or category
- `install_skill` — Install and link a skill to .claude/skills/
- `get_skill_info` — Get detailed skill metadata and trust score
- `trawl_skills` — Multi-source agentic search
- `rate_skill` — Submit a 1-5 star rating

### MCP Resources

- `skillli://installed` — List of installed skills
- `skillli://index` — Full registry index

## Safeguards

skillli runs safety checks on all skills:

1. Schema validation (Zod)
2. File size limits (5MB total, 500 lines for SKILL.md)
3. Prohibited pattern scanning (eval, exec, credentials, etc.)
4. Script allowlisting (.sh, .py, .js, .ts only)
5. Checksum verification
6. Trust score computation (0-100)

## Programmatic Usage

```typescript
import { parseSkillFile, search, trawl, createSkillliMcpServer } from 'skillli';

// Parse a SKILL.md file
const skill = await parseSkillFile('./SKILL.md');

// Search the index
const results = search(index, { query: 'code review', tags: ['security'] });

// Trawl across sources
const found = await trawl('kubernetes deployment', {
  sources: ['registry', 'github', 'npm'],
});

// Create an MCP server
const server = createSkillliMcpServer();
```

## License

MIT
