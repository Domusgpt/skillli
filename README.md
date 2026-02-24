# skillli

**The Skill Librarian** — Discover, install, publish, rate, and manage agentic AI skills.

```
npm install -g skillli
```

skillli is a complete ecosystem for managing agentic AI skills (SKILL.md files). It ships a CLI, a programmatic library, an MCP server for Claude Code integration, and a multi-source trawler for skill discovery across the registry, GitHub, npm, and the open web.

Skills follow the [Agent Skills open standard](https://agentskills.io/specification), making them portable across 26+ agent platforms including Claude Code, GitHub Copilot, Cursor, Gemini CLI, and OpenAI Codex.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Skill Format](#skill-format)
- [CLI Reference](#cli-reference)
- [MCP Server](#mcp-server)
- [Programmatic API](#programmatic-api)
- [Trawler: Multi-Source Discovery](#trawler-multi-source-discovery)
- [Decentralized Discovery](#decentralized-discovery-well-knownskills)
- [Interactive Skills (Experimental)](#interactive-skills-experimental)
- [Safeguards & Trust](#safeguards--trust)
- [Architecture](#architecture)
- [License](#license)

## Installation

```bash
# Global (recommended for CLI usage)
npm install -g skillli

# Local (for programmatic usage)
npm install skillli
```

Requires Node.js >= 18.0.0.

## Quick Start

```bash
# Create a new skill from template
skillli init my-skill

# Validate before publishing
skillli validate ./my-skill

# Search the registry
skillli search "code review"

# Install a skill and link it to Claude Code
skillli install code-reviewer --link

# Trawl across registry, GitHub, and npm
skillli trawl "kubernetes deployment" --sources registry github npm

# Probe company domains for published skills
skillli trawl "payments" --domains stripe.com square.com

# Rate a skill you've used
skillli rate code-reviewer 5 --comment "Excellent coverage"
```

## Skill Format

Every skill is a directory containing a `SKILL.md` file with YAML frontmatter and a Markdown body. Only `name` and `description` are required:

```yaml
---
name: my-skill
description: A clear description of when and how to use this skill
---

# My Skill

Instructions that the agent follows when this skill is invoked.
```

skillli supports three layers of fields in the frontmatter:

| Layer | Purpose | Examples |
|-------|---------|---------|
| **Open Standard** | Portable across 26+ platforms | `name`, `description`, `license`, `compatibility`, `allowed-tools`, `metadata` |
| **Claude Code Extensions** | Claude Code-specific behavior | `argument-hint`, `context`, `agent`, `model`, `mode`, `hooks` |
| **Skillli Registry Extensions** | Registry indexing and trust | `version`, `author`, `tags`, `category`, `trust-level`, `repository` |

Registry fields can go in the `metadata` block (spec-compliant) or as top-level fields (convenience shorthand). Top-level always wins.

```yaml
---
name: my-skill
description: Helps developers write better tests
license: MIT
metadata:
  version: "1.0.0"
  author: "your-github-username"
  tags: "typescript, testing, ci"
  category: "development"
user-invocable: true
---
```

See [references/skill-format-spec.md](.claude/skills/skillli/references/skill-format-spec.md) for the complete specification with all fields, constraints, defaults, hooks, runtime substitutions, and copy-paste templates.

### Categories

| Category | Covers |
|----------|--------|
| `development` | Code, testing, CI/CD, debugging, linting |
| `creative` | Writing, design, content creation |
| `enterprise` | Business, compliance, reporting |
| `data` | Analytics, ETL, visualization |
| `devops` | Infrastructure, deployment, monitoring |
| `other` | Everything else |

### Trust Levels

| Level | Description | How to Get |
|-------|-------------|------------|
| `community` | Default. Basic validation only. | Publish to the registry. |
| `verified` | Author identity verified. Additional review. | Apply for verification. |
| `official` | Maintained by the skillli team. | Skillli team only. |

## CLI Reference

| Command | Description |
|---------|-------------|
| `skillli init [name]` | Create a new skill from an interactive template |
| `skillli validate [path]` | Validate a SKILL.md — schema, safeguards, metadata completeness |
| `skillli search <query>` | Search the registry by keyword, tag, or category |
| `skillli install <skill>` | Install a skill from the registry or GitHub |
| `skillli uninstall <skill>` | Uninstall a skill and remove symlinks |
| `skillli info <skill>` | Show detailed metadata and trust score |
| `skillli list` | List all installed skills |
| `skillli rate <skill> <1-5>` | Rate a skill with optional comment |
| `skillli update` | Sync the local registry index |
| `skillli publish [path]` | Publish a skill to the registry |
| `skillli trawl <query>` | Multi-source search across registry, GitHub, npm, and domains |

### Trawl Options

```bash
skillli trawl "api client" \
  --sources registry github npm \
  --domains stripe.com vercel.com \
  --max-results 20
```

| Flag | Description |
|------|-------------|
| `-s, --sources <sources...>` | Sources to search: `registry`, `github`, `npm` (default: `registry github`) |
| `-d, --domains <domains...>` | Probe domains for `.well-known/skills/` discovery |
| `-n, --max-results <n>` | Maximum number of results |

## MCP Server

skillli includes a built-in MCP server for native Claude Code integration. Add it to your MCP configuration:

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

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_skills` | Search the registry | `query`, `tags?`, `category?`, `limit?` |
| `install_skill` | Install and optionally link to `.claude/skills/` | `name`, `link?` |
| `get_skill_info` | Detailed metadata and trust score | `name` |
| `trawl_skills` | Multi-source agentic search | `query`, `sources?`, `maxResults?` |
| `rate_skill` | Submit a 1-5 star rating | `name`, `rating`, `comment?` |

### MCP Resources

| URI | Description |
|-----|-------------|
| `skillli://installed` | JSON list of all installed skills |
| `skillli://index` | Full registry index |

## Programmatic API

```typescript
import {
  parseSkillFile,
  parseSkillContent,
  validateMetadata,
  extractManifest,
  search,
  searchByTags,
  searchByCategory,
  trawl,
  installFromRegistry,
  installFromGithub,
  installFromLocal,
  uninstall,
  linkToClaudeSkills,
  runSafeguards,
  computeTrustScore,
  fetchIndex,
  getSkillEntry,
  syncIndex,
  submitRating,
  getRatings,
  formatRating,
  packageSkill,
  getConfig,
  getInstalledSkills,
  getLocalIndex,
  createSkillliMcpServer,
  SkillMetadataSchema,
  VERSION,
} from 'skillli';
```

### Parsing

```typescript
// Parse from file
const skill = await parseSkillFile('./my-skill/SKILL.md');

// Parse from string
const skill = parseSkillContent(markdownString);

// Validate metadata only (throws SkillValidationError on failure)
const metadata = validateMetadata({ name: 'test', description: 'A test' });

// Extract a registry manifest with defaults for missing fields
const manifest = extractManifest(skill);
```

### Search

```typescript
const index = await getLocalIndex();

// Full-text search with filters
const results = search(index, {
  query: 'code review',
  tags: ['security'],
  category: 'development',
  trustLevel: 'verified',
  minRating: 3.5,
  limit: 10,
  offset: 0,
});

// Shorthand searches
const byTag = searchByTags(index, ['typescript', 'testing']);
const byCat = searchByCategory(index, 'devops');
```

### Installation

```typescript
// From the registry
const installed = await installFromRegistry('code-reviewer');

// From a GitHub URL
const installed = await installFromGithub('https://github.com/user/skill-repo');

// From a local directory
const installed = await installFromLocal('./my-skill');

// Link to Claude Code's .claude/skills/ directory
const linkPath = await linkToClaudeSkills(installed);

// Uninstall (removes install directory and symlinks)
await uninstall('code-reviewer');
```

### Safety

```typescript
const skill = await parseSkillFile('./SKILL.md');
const result = await runSafeguards(skill, './my-skill');

console.log(result.passed);  // boolean — true if no error-severity checks failed
console.log(result.score);   // 0-100 trust score
console.log(result.checks);  // SafeguardCheck[] — individual check results

// Compute trust score independently (with optional registry entry for download/rating data)
const score = computeTrustScore(skill, registryEntry);
```

### Types

All types are exported for consumers:

```typescript
import type {
  SkillMetadata,      // Parsed frontmatter (all three layers)
  ParsedSkill,        // Metadata + body content + file path + quizzes
  RegistryEntry,      // Registry index entry with downloads and ratings
  SearchOptions,      // Query + filters for search()
  SearchResult,       // Skill + relevance score + match reasons
  RatingInfo,         // Average, count, distribution
  RatingSubmission,   // User rating submission payload
  SafeguardResult,    // Passed flag + trust score + check details
  SafeguardCheck,     // Individual check (name, passed, severity, message)
  TrawlResult,        // Source + partial skill + confidence + URL
  TrawlOptions,       // Sources, domains, maxResults
  InstalledSkill,     // Name, version, path, source, timestamp
  LocalConfig,        // Installed skills map, registry URL, sync time
  LocalIndex,         // Registry index (version, timestamp, skills map)
  SkillCategory,      // 'development' | 'creative' | ... | 'other'
  TrustLevel,         // 'community' | 'verified' | 'official'
  SkillQuiz,          // Quiz block (title, gate, passing-score, questions)
  SkillQuizQuestion,  // Question + options + explanation + branching
  SkillQuizOption,    // Label + correct flag
  SkillQuizBranch,    // goto | load-skill | load-reference | message
} from 'skillli';
```

## Trawler: Multi-Source Discovery

The trawler fans out searches across multiple sources in parallel, deduplicates by skill name, and ranks results by relevance:

```typescript
const results = await trawl('kubernetes deployment', {
  sources: ['registry', 'github', 'npm'],
  domains: ['kubernetes.io', 'helm.sh'],
  maxResults: 10,
});
```

| Source | How It Works |
|--------|-------------|
| `registry` | Searches the local skillli index by name, description, and tags |
| `github` | Queries the GitHub search API for repositories containing `SKILL.md` |
| `npm` | Queries the npm registry for packages matching skill-related keywords |
| `.well-known` | Probes specified domains at `/.well-known/skills/default/skill.md` |

Each result includes a confidence score (0-1) that factors in source trust, name relevance, tag matches, and repository popularity. Results are deduplicated by name (highest confidence wins) and sorted by final rank.

## Decentralized Discovery: .well-known/skills/

Any domain can publish skills at a `.well-known` endpoint for decentralized discovery without relying on a central registry. Companies publish their own skills on their domain — users discover them by probing known domains.

```
https://stripe.com/.well-known/skills/default/skill.md
https://vercel.com/.well-known/skills/default/skill.md
https://notion.com/.well-known/skills/default/skill.md
```

```bash
# CLI
skillli trawl "payments" --domains stripe.com square.com adyen.com

# Programmatic
const results = await trawl('payments', {
  domains: ['stripe.com', 'square.com', 'adyen.com'],
});
```

The trawler fetches each endpoint in parallel (5s timeout per domain), validates the response as a valid SKILL.md with frontmatter, and returns results with 85% confidence (high, because `.well-known` is an explicit publishing signal).

## Interactive Skills (Experimental)

Skills can include **quiz gates** that force context ingestion before the agent proceeds. Like licensing exams — the agent must process and understand the material to answer correctly, which narrows the context window to what matters and drives the onboarding flow based on responses.

```yaml
---
name: api-onboarding
description: Guides API integration with context verification
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
        explanation: "This API uses Bearer tokens in the Authorization header."
        on-incorrect:
          load-reference: "references/auth-guide.md"
          message: "Review the auth guide before continuing."
      - question: "Where should refresh tokens be stored?"
        options:
          - label: "localStorage"
          - label: "httpOnly secure cookie"
            correct: true
          - label: "sessionStorage"
        on-incorrect:
          load-skill: "security-basics"
          message: "Load security-basics for context on token storage."
---
```

### How It Works

1. Skill author defines quiz questions in YAML frontmatter
2. When invoked, the agent encounters quiz gates
3. The agent must answer correctly to proceed (`gate: true`)
4. Wrong answers branch to other docs, skills, or body sections — redirecting context to fill knowledge gaps
5. The onboarding flow adapts based on what the agent gets right/wrong

### Quiz Schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `quiz` | array or object | none | One or more quiz blocks |
| `quiz[].title` | string | none | Quiz heading |
| `quiz[].description` | string | none | Purpose of the quiz |
| `quiz[].gate` | boolean | `false` | Agent must pass before proceeding |
| `quiz[].passing-score` | number (0-100) | `100` | Required correct answer percentage |
| `quiz[].questions[].question` | string | required | The question text |
| `quiz[].questions[].options` | array (2-6) | required | Answer choices (at least one `correct: true`) |
| `quiz[].questions[].explanation` | string | none | Shown after answering |
| `quiz[].questions[].on-correct` | branch | none | Action on correct answer |
| `quiz[].questions[].on-incorrect` | branch | none | Action on incorrect answer |

### Branch Actions

| Action | Description |
|--------|-------------|
| `goto` | Jump to a section in the skill body (e.g. `"## Setup Steps"`) |
| `load-skill` | Load another skill by name (e.g. `"security-basics"`) |
| `load-reference` | Load a reference doc (e.g. `"references/auth-overview.md"`) |
| `message` | Message shown to the agent/user |

### Use Cases

- **Onboarding**: Quiz the agent on project conventions before it writes code
- **API setup**: Verify understanding of auth flow before generating integration code
- **Compliance**: Ensure the agent understands data handling rules before accessing PII
- **Multi-path tutorials**: Branch to beginner/intermediate/advanced based on results
- **Context narrowing**: Force ingestion of specific docs by quizzing on their content

## Safeguards & Trust

skillli runs safety checks on every skill before installation:

| Check | Severity | Description |
|-------|----------|-------------|
| Schema validation | Pass/fail | Validates all frontmatter fields against the Zod schema |
| Line count | Warning | SKILL.md should be under 500 lines |
| Prohibited patterns | Error | Detects `eval()`, `exec()`, `execSync()`, hardcoded credentials, `rm -rf /`, `child_process`, large base64 blobs |
| Script allowlist | Error | Only `.sh`, `.py`, `.js`, `.ts` files allowed in `scripts/` |
| File size | Warning | Total skill directory must be under 5MB |
| Checksum | Integrity | SHA-256 verification of published packages |

### Trust Score (0-100)

The trust score is computed from multiple signals:

| Signal | Points |
|--------|--------|
| No prohibited patterns detected | +20 |
| Under line count limit | +15 |
| Has repository URL | +10 |
| Has license | +10 |
| Has version | +5 |
| Has author | +5 |
| Official trust level | +20 |
| Verified trust level | +15 |
| Community rating >= 3.5 | +15 |
| Downloads > 100 | +5 |
| Downloads > 1,000 | +5 |

Skills with a trust score below 30 trigger warnings before installation. The maximum possible score is 100.

## Architecture

```
skillli/
├── src/
│   ├── core/              # Foundation layer
│   │   ├── types.ts       # All TypeScript interfaces and type definitions
│   │   ├── schema.ts      # Zod validation schemas (3-layer + quiz)
│   │   ├── parser.ts      # SKILL.md parser (gray-matter + normalization + quiz)
│   │   ├── search.ts      # Full-text search with scoring and filtering
│   │   ├── installer.ts   # Install from registry, GitHub, or local directory
│   │   ├── safeguards.ts  # Safety checks and trust score computation
│   │   ├── registry.ts    # Registry index fetching and syncing
│   │   ├── ratings.ts     # Rating submission and formatting
│   │   ├── publisher.ts   # Skill packaging for registry submission
│   │   ├── local-store.ts # Local config, index, and installed skills (with JSON recovery)
│   │   ├── constants.ts   # Paths, URLs, limits, version
│   │   └── errors.ts      # Typed error hierarchy (SkillliError base)
│   ├── cli/               # Commander.js CLI
│   │   ├── index.ts       # Program setup and command registration
│   │   ├── commands/      # init, search, install, uninstall, info, list, validate,
│   │   │                  # rate, update, publish, trawl
│   │   └── utils/         # Display formatting and interactive prompts
│   ├── mcp/               # Model Context Protocol server
│   │   └── server.ts      # MCP tools (5) and resources (2) for Claude Code
│   └── trawler/           # Multi-source discovery engine
│       ├── index.ts       # Trawl orchestrator (fan-out, dedupe, rank)
│       ├── strategies.ts  # Source search: registry, GitHub, npm, .well-known/skills/
│       └── ranker.ts      # Deduplication and relevance ranking
├── test/                  # Vitest tests (90 tests across 7 suites)
│   ├── core/              # schema (32), parser (25), search (12), safeguards (8),
│   │                      # ratings (3), local-store (2)
│   ├── trawler/           # ranker (8)
│   └── fixtures/          # valid-skill, invalid-skill, minimal-skill, sample-index.json
├── .claude/skills/skillli # The skillli skill itself (dog-fooding)
│   ├── SKILL.md           # In-house skill for Claude Code integration
│   └── references/        # skill-format-spec.md — full format specification
└── dist/                  # Build output (CJS + ESM + DTS via tsup)
```

### Key Design Decisions

- **Minimal required fields**: Only `name` + `description` per the Agent Skills open standard. Everything else is optional with safe defaults.
- **Three-layer schema**: Open standard fields are portable, Claude Code extensions are platform-specific, skillli extensions are registry-specific.
- **Metadata block**: Registry fields can live in `metadata:` (spec-compliant) or as top-level frontmatter (convenience). Top-level wins on conflict.
- **Defensive optionality**: All optional fields guarded with `?.` or `?? fallback`. No "undefined" strings in any output path.
- **Progressive disclosure**: Names and descriptions always loaded, body on invocation, references on demand.
- **Passthrough validation**: `.passthrough()` on the Zod schema allows unknown fields to flow through without rejection — forward-compatible.
- **Resilient local store**: Corrupted JSON files auto-recover to defaults instead of crashing.

### Build System

| Tool | Purpose |
|------|---------|
| **tsup** | Builds CJS, ESM, and DTS outputs targeting Node.js 18+ |
| **Vitest** | Unit testing (90 tests, 7 suites) |
| **TypeScript** | Strict mode type checking |
| **gray-matter** | YAML frontmatter parsing |
| **Zod** | Schema validation with passthrough |
| **Commander.js** | CLI framework |
| **@modelcontextprotocol/sdk** | MCP server |

```bash
npm install          # Install dependencies
npx vitest run       # Run tests
npx tsc --noEmit     # Typecheck
npx tsup             # Build (CJS + ESM + DTS)
```

## License

MIT
