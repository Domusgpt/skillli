# skillli — Development Guide

## What this is

skillli is an npm package for managing agentic AI skills (SKILL.md files). It has
a CLI, a core library, an MCP server, and an agentic trawler.

## Architecture

```
src/
  core/          # Schema, parser, types, search, safeguards, installer, registry, ratings
  cli/           # Commander-based CLI with commands/ and utils/
  mcp/           # MCP server (Model Context Protocol) for Claude Code integration
  trawler/       # Multi-source skill discovery (registry, GitHub, npm)
test/            # Vitest tests mirroring src/ structure
.claude/skills/  # The skillli skill itself (dog-fooding)
```

## Key design decisions

- **Schema**: Only `name` + `description` required per Agent Skills open standard.
  Version, author, tags, category are optional. All optional fields MUST be guarded
  with `?.` or `?? fallback` throughout the codebase.
- **Three layers**: Open standard fields, Claude Code extensions, skillli registry
  extensions. See `src/core/schema.ts` for the Zod schema.
- **Metadata block**: Skillli fields can be in top-level frontmatter OR inside
  a `metadata:` block. Top-level wins. Parser handles both.
- **RegistryEntry fields are optional**: Even though the registry populates defaults,
  the type system treats version/author/tags/category as optional for safety.

## Build & test

```bash
npm install          # install deps
npx vitest run       # run tests
npx tsc --noEmit     # typecheck
npx tsup             # build (CJS + ESM + DTS)
```

## Common patterns

- Use `?? '0.0.0'` for version fallbacks, `?? 'unknown'` for author, `?? []` for tags
- Guard `.tags` before `.map()`, `.join()`, `.some()`, `.includes()`
- Display code should skip fields entirely when missing, not show "undefined"
- Tests use fixtures in `test/fixtures/` — `valid-skill`, `invalid-skill`, `minimal-skill`
- Tests use `sample-index.json` for search tests — includes a `minimal-skill` entry

## Adding a new CLI command

1. Create `src/cli/commands/my-command.ts` with `registerMyCommand(program)`
2. Import and call in `src/cli/index.ts`
3. Add to README.md CLI commands table
