# skillli — Development Guide

## What This Is

skillli is an npm package for managing agentic AI skills (SKILL.md files). It provides a
CLI, a core library, an MCP server for Claude Code integration, and a multi-source trawler
for skill discovery across the registry, GitHub, npm, and `.well-known/skills/` endpoints.

## Architecture

```
src/
  core/          # Schema, parser, types, search, safeguards, installer, registry, ratings,
                 # publisher, local-store, constants, errors
  cli/           # Commander.js CLI — commands/ (11 commands) + utils/ (display, prompts)
  mcp/           # MCP server (5 tools, 2 resources) for Claude Code integration
  trawler/       # Multi-source skill discovery (registry, GitHub, npm, .well-known/skills/)
test/            # Vitest tests mirroring src/ structure (90 tests, 7 suites)
.claude/skills/  # The skillli skill itself (dog-fooding)
```

### Module Dependency Flow

```
types.ts ← schema.ts ← parser.ts ← installer.ts, safeguards.ts, publisher.ts
                                  ← search.ts, registry.ts, ratings.ts
                                  ← cli/commands/*, mcp/server.ts
                                  ← trawler/strategies.ts → trawler/index.ts
```

### Error Hierarchy

```
SkillliError (base)
├── SkillValidationError  — schema/parse failures (includes details[])
├── SkillNotFoundError    — skill not in registry/index
├── RegistryError         — registry fetch/sync failures
├── SafeguardError        — safety check failures
└── InstallError          — git clone, missing SKILL.md, safeguard rejection
```

## Key Design Decisions

- **Schema**: Only `name` + `description` required per Agent Skills open standard (agentskills.io).
  All other fields optional. Zod schema uses `.passthrough()` for forward compatibility.
- **Three layers**: Open standard fields, Claude Code extensions, skillli registry extensions.
  See `src/core/schema.ts` for the full Zod schema.
- **Metadata block**: Skillli registry fields can go in top-level frontmatter OR inside a
  `metadata:` block. Top-level always wins. Parser handles both via `mergeWithMetadataBlock()`.
- **Defensive optionality**: All optional fields MUST be guarded with `?.` or `?? fallback`
  throughout the codebase. RegistryEntry fields (version, author, tags, category) are also
  optional for safety even though the registry populates defaults.
- **Resilient local store**: `getConfig()` and `getLocalIndex()` catch JSON parse errors
  and reset to defaults instead of crashing.
- **Interactive quizzes (experimental)**: Skills can include `quiz` blocks in frontmatter.
  Validated by `SkillQuizSchema`, normalized in `parser.ts` from kebab-case YAML to
  camelCase types. Exposed on both `SkillMetadata.quiz` and `ParsedSkill.quizzes`.
- **Decentralized discovery**: Trawler supports `domains` option to probe `.well-known/skills/`
  endpoints. Runs in parallel with other sources. 5s timeout per domain.

## Build & Test

```bash
npm install          # Install dependencies
npx vitest run       # Run all tests (90 tests)
npx tsc --noEmit     # Typecheck
npx tsup             # Build (CJS + ESM + DTS → dist/)
```

## Common Patterns

### Fallbacks for optional fields
```typescript
skill.metadata.version ?? '0.0.0'
skill.metadata.author ?? 'unknown'
skill.metadata.tags ?? []
skill.metadata.category ?? 'other'
```

### Array guards before operations
```typescript
const entryTags = entry.tags ?? [];
entryTags.map(...)   // safe
entryTags.join(', ') // safe
entryTags.some(...)  // safe
```

### Display code — skip missing fields, never show "undefined"
```typescript
if (entry.version) console.log(`v${entry.version}`);
if (entry.tags?.length) console.log(`Tags: ${entry.tags.join(', ')}`);
```

### Error serialization
```typescript
const msg = error instanceof Error ? error.message : String(error);
```

### Test fixtures
- `test/fixtures/valid-skill/SKILL.md` — full skill with all fields
- `test/fixtures/invalid-skill/SKILL.md` — intentionally broken (triggers SkillValidationError)
- `test/fixtures/minimal-skill/SKILL.md` — only name + description
- `test/fixtures/sample-index.json` — registry index for search tests (includes minimal-skill)

## Adding a New CLI Command

1. Create `src/cli/commands/my-command.ts` with `export function registerMyCommand(program: Command)`
2. Import and call `registerMyCommand(program)` in `src/cli/index.ts`
3. Add the command to the CLI Reference table in `README.md`

## Adding a New Schema Field

1. Add the Zod validator in `src/core/schema.ts` (pick the right layer)
2. Add the typed field in `src/core/types.ts` (matching interface section)
3. Add normalization in `src/core/parser.ts` → `normalizeMetadata()` (map kebab-case to camelCase)
4. If it's a skillli registry field, add extraction in `extractFromMetadataBlock()`
5. Add tests in `test/core/schema.test.ts` and `test/core/parser.test.ts`
6. Update `skill-format-spec.md` with the field documentation

## Adding a New Trawler Source

1. Add the search function in `src/trawler/strategies.ts`
2. Wire it into `src/trawler/index.ts` (add to the fan-out block)
3. Add the source to the `TrawlResult.source` union in `src/core/types.ts`
4. Add CLI flag if needed in `src/cli/commands/trawl.ts`
5. Document in README.md under "Trawler: Multi-Source Discovery"

## File Size & Token Budgets

- SKILL.md max: 500 lines / 5,000 tokens (enforced by safeguards)
- Skill directory max: 5MB total
- Description: 1-1024 characters (kept short — always in system prompt)
- Name: 1-64 characters, lowercase `[a-z0-9-]`
- Tags: 1-20 tags, each 1-50 characters
