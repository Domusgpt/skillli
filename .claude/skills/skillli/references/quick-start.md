# Skillli Quick Start

## Install

```bash
npm install -g skillli
```

On first run, skillli auto-installs its bundled skill. No extra setup.

## Find a Skill

```bash
skillli search "code review"
skillli trawl "react component generator"   # also searches GitHub + npm
```

## Install a Skill

```bash
skillli install code-reviewer --link        # from registry + link to .claude/skills/
skillli install https://github.com/user/my-skill   # from GitHub
skillli install ./my-local-skill --local    # from local folder
```

`--link` symlinks into `.claude/skills/` so Claude Code can use it.

## Create Your Own

```bash
skillli init my-skill                       # interactive
skillli init my-skill -y --description "Generates unit tests for TypeScript" --author you --tags "testing,ts" --category development  # non-interactive
```

Edit `my-skill/SKILL.md`. The `description` field triggers invocation. The body has instructions.

Generated SKILL.md follows the [Agent Skills open standard](https://agentskills.io/specification):

```yaml
---
name: my-skill
description: What it does and when to use it. Include trigger keywords. Single-line string, max 1024 chars.
license: MIT
metadata:
  author: your-name
  version: "1.0.0"
  tags: testing, typescript
  category: development
---

Instructions for the agent...
```

Only `name` and `description` are required by the standard. Everything else is optional.

## Publish

```bash
skillli publish ./my-skill --dry-run        # validate
skillli publish ./my-skill                  # publish
```

## Rate

```bash
skillli rate code-reviewer 5 -m "Excellent"
```

## MCP Server

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

## All Commands

| Command | Description |
|---------|-------------|
| `skillli init [name]` | Create skill from template |
| `skillli search <query>` | Search registry |
| `skillli install <skill>` | Install a skill |
| `skillli uninstall <skill>` | Remove a skill |
| `skillli info <skill>` | Show details + trust score |
| `skillli list` | List installed skills |
| `skillli rate <skill> <1-5>` | Rate a skill |
| `skillli update` | Sync registry index |
| `skillli publish [path]` | Validate and publish |
| `skillli trawl <query>` | Multi-source search |

## Non-Interactive / Agent Mode

All commands work without a TTY. Auto-detected, or force with `-y`.

## File Locations

| Path | Contents |
|------|----------|
| `~/.skillli/config.json` | Settings, installed skills map |
| `~/.skillli/index.json` | Cached registry index |
| `~/.skillli/skills/` | Installed skill packages |
| `.claude/skills/` | Linked skills for current project |
| `.github/skills/` | Cross-platform skills (open standard) |

## More Docs

- Format spec: `~/.skillli/skills/skillli/references/skill-format-spec.md`
- Agent Skills standard: https://agentskills.io/specification
- Claude Code skills: https://code.claude.com/docs/en/skills
- GitHub: https://github.com/Domusgpt/skillli
