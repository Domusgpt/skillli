# Skillli Quick Start

Get up and running in under 2 minutes.

---

## Install

```bash
npm install -g skillli
```

On first run, skillli auto-installs its own skill (the one teaching
agents how to use it). No extra setup needed.

---

## Find a Skill

```bash
# Search the registry
skillli search "code review"

# Deep search across GitHub and npm too
skillli trawl "react component generator"
```

---

## Install a Skill

```bash
# From the registry
skillli install code-reviewer --link

# From GitHub
skillli install https://github.com/user/my-skill --link

# From a local folder
skillli install ./my-local-skill --local
```

The `--link` flag symlinks the skill into your project's
`.claude/skills/` so Claude Code can use it immediately.

---

## Create Your Own Skill

### Interactive (human)
```bash
skillli init my-skill
```

### Non-interactive (agent / CI)
```bash
skillli init my-skill -y \
  --description "Generates unit tests for TypeScript" \
  --author your-name \
  --tags "testing,typescript" \
  --category development
```

Then edit `my-skill/SKILL.md` — that's where you write the instructions
the AI agent follows.

---

## Publish

```bash
# Validate first
skillli publish ./my-skill --dry-run

# Publish when ready
skillli publish ./my-skill
```

---

## MCP Server for Claude Code

Add to your project's Claude Code MCP config:

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

This gives Claude Code direct access to search, install, and rate
skills through MCP tools.

---

## All Commands

| Command | What it does |
|---------|-------------|
| `skillli init [name]` | Create a new skill from template |
| `skillli search <query>` | Search the registry |
| `skillli install <skill>` | Install a skill |
| `skillli uninstall <skill>` | Remove a skill |
| `skillli info <skill>` | Show skill details and trust score |
| `skillli list` | List installed skills |
| `skillli rate <skill> <1-5>` | Rate a skill |
| `skillli update` | Sync the local registry index |
| `skillli publish [path]` | Validate and publish a skill |
| `skillli trawl <query>` | Multi-source search (registry + GitHub + npm) |

---

## For Agents

All commands work without a TTY. skillli detects non-interactive mode
automatically and:
- Skips prompts
- Uses defaults for missing optional values
- Errors clearly on missing required values
- Auto-installs the bundled skill on first run

You can also force non-interactive mode with `-y` or `--yes`:

```bash
skillli init my-skill -y --description "..." --author me
```

---

## File Locations

| Path | Contents |
|------|----------|
| `~/.skillli/config.json` | Your settings, installed skills map |
| `~/.skillli/index.json` | Cached registry index |
| `~/.skillli/skills/` | All installed skill packages |
| `~/.skillli/skills/skillli/` | This skill (the one you're reading) |
| `.claude/skills/<name>/` | Linked skills for current project |

---

## More Docs

- **Skill format spec:** `~/.skillli/skills/skillli/references/skill-format-spec.md`
- **This quick start:** `~/.skillli/skills/skillli/references/quick-start.md`
- **GitHub:** https://github.com/Domusgpt/skillli
