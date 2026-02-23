import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { parseSkillFile, parseSkillContent, validateMetadata, extractManifest } from '../../src/core/parser.js';
import { SkillValidationError } from '../../src/core/errors.js';

const FIXTURES = join(__dirname, '..', 'fixtures');

describe('parseSkillFile', () => {
  it('parses a valid SKILL.md file', async () => {
    const skill = await parseSkillFile(join(FIXTURES, 'valid-skill', 'SKILL.md'));
    expect(skill.metadata.name).toBe('test-skill');
    expect(skill.metadata.version).toBe('1.0.0');
    expect(skill.metadata.author).toBe('testuser');
    expect(skill.metadata.tags).toEqual(['testing', 'validation']);
    expect(skill.metadata.category).toBe('development');
    expect(skill.metadata.trustLevel).toBe('community');
    expect(skill.metadata.userInvocable).toBe(true);
    expect(skill.content).toContain('# Test Skill');
  });

  it('throws SkillValidationError for invalid SKILL.md', async () => {
    await expect(
      parseSkillFile(join(FIXTURES, 'invalid-skill', 'SKILL.md')),
    ).rejects.toThrow(SkillValidationError);
  });
});

describe('parseSkillContent', () => {
  it('parses minimal skill with only name + description', () => {
    const content = `---
name: minimal
description: A minimal skill
---

# Minimal

Body content here.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.name).toBe('minimal');
    expect(skill.metadata.description).toBe('A minimal skill');
    expect(skill.metadata.trustLevel).toBe('community');
    expect(skill.metadata.version).toBeUndefined();
    expect(skill.metadata.author).toBeUndefined();
    expect(skill.metadata.tags).toBeUndefined();
    expect(skill.metadata.category).toBeUndefined();
    expect(skill.content).toContain('# Minimal');
  });

  it('parses full skill with all legacy fields', () => {
    const content = `---
name: inline-skill
version: 0.1.0
description: An inline skill for testing the parser directly
author: tester
license: MIT
tags: [test]
category: other
---

# Inline Skill

Body content here.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.name).toBe('inline-skill');
    expect(skill.metadata.version).toBe('0.1.0');
    expect(skill.metadata.license).toBe('MIT');
    expect(skill.metadata.author).toBe('tester');
    expect(skill.content).toContain('# Inline Skill');
    expect(skill.filePath).toBe('<inline>');
  });

  it('applies defaults for optional fields', () => {
    const content = `---
name: minimal
description: Minimal skill
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.trustLevel).toBe('community');
    expect(skill.metadata.disableModelInvocation).toBe(false);
    expect(skill.metadata.userInvocable).toBe(true);
  });

  it('parses Claude Code extension fields', () => {
    const content = `---
name: forked-skill
description: A skill that forks
argument-hint: "[filename]"
context: fork
agent: Explore
model: haiku
mode: true
---

Do the thing.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.argumentHint).toBe('[filename]');
    expect(skill.metadata.context).toBe('fork');
    expect(skill.metadata.agent).toBe('Explore');
    expect(skill.metadata.model).toBe('haiku');
    expect(skill.metadata.mode).toBe(true);
  });

  it('parses open standard fields', () => {
    const content = `---
name: open-skill
description: An open standard skill
license: Apache-2.0
compatibility: Requires git and docker
allowed-tools: Bash(git:*) Read Grep
---

Instructions.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.license).toBe('Apache-2.0');
    expect(skill.metadata.compatibility).toBe('Requires git and docker');
    expect(skill.metadata.allowedTools).toBe('Bash(git:*) Read Grep');
  });

  it('normalizes tags from comma-separated string', () => {
    const content = `---
name: csv-tags
description: Test CSV tags
tags: "typescript, testing, ci"
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.tags).toEqual(['typescript', 'testing', 'ci']);
  });

  it('normalizes tags from array', () => {
    const content = `---
name: array-tags
description: Test array tags
tags: [typescript, testing, ci]
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.tags).toEqual(['typescript', 'testing', 'ci']);
  });
});

describe('metadata block extraction', () => {
  it('extracts skillli fields from metadata block', () => {
    const content = `---
name: meta-skill
description: A skill using metadata block
metadata:
  version: "2.0.0"
  author: "meta-author"
  tags: "a, b, c"
  category: "development"
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.version).toBe('2.0.0');
    expect(skill.metadata.author).toBe('meta-author');
    expect(skill.metadata.tags).toEqual(['a', 'b', 'c']);
    expect(skill.metadata.category).toBe('development');
  });

  it('top-level fields win over metadata block', () => {
    const content = `---
name: priority-skill
description: A skill testing field priority
version: 3.0.0
author: top-level-author
metadata:
  version: "1.0.0"
  author: "meta-author"
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.version).toBe('3.0.0');
    expect(skill.metadata.author).toBe('top-level-author');
  });

  it('metadata block fills gaps not covered by top-level', () => {
    const content = `---
name: mixed-skill
description: A skill with mixed sources
version: 1.0.0
metadata:
  author: "from-metadata"
  category: "data"
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.version).toBe('1.0.0');
    expect(skill.metadata.author).toBe('from-metadata');
    expect(skill.metadata.category).toBe('data');
  });
});

describe('validateMetadata', () => {
  it('rejects invalid name format', () => {
    expect(() =>
      validateMetadata({
        name: 'INVALID_NAME!!',
        description: 'A skill with an invalid name format',
      }),
    ).toThrow(SkillValidationError);
  });

  it('rejects invalid semver when version provided', () => {
    expect(() =>
      validateMetadata({
        name: 'test',
        description: 'A skill with an invalid version string',
        version: 'not-semver',
      }),
    ).toThrow(SkillValidationError);
  });

  it('rejects missing name', () => {
    expect(() => validateMetadata({ description: 'test' })).toThrow(SkillValidationError);
  });

  it('rejects missing description', () => {
    expect(() => validateMetadata({ name: 'test' })).toThrow(SkillValidationError);
  });

  it('rejects invalid category when provided', () => {
    expect(() =>
      validateMetadata({
        name: 'test',
        description: 'test',
        category: 'not-a-category',
      }),
    ).toThrow(SkillValidationError);
  });

  it('accepts minimal valid metadata', () => {
    const result = validateMetadata({ name: 'test', description: 'A minimal skill' });
    expect(result.name).toBe('test');
    expect(result.description).toBe('A minimal skill');
    expect(result.trustLevel).toBe('community');
  });
});

describe('extractManifest', () => {
  it('extracts manifest with defaults for missing fields', () => {
    const content = `---
name: manifest-test
description: Testing manifest extraction
---

Content.`;

    const skill = parseSkillContent(content);
    const manifest = extractManifest(skill);

    expect(manifest.name).toBe('manifest-test');
    expect(manifest.description).toBe('Testing manifest extraction');
    expect(manifest.version).toBe('0.0.0');
    expect(manifest.author).toBe('unknown');
    expect(manifest.tags).toEqual([]);
    expect(manifest.category).toBe('other');
    expect(manifest.trust_level).toBe('community');
    expect(manifest.created_at).toBeDefined();
    expect(manifest.updated_at).toBeDefined();
  });

  it('extracts manifest with provided fields', () => {
    const content = `---
name: full-manifest
description: Full manifest test
version: 2.0.0
author: someone
tags: [a, b]
category: devops
license: MIT
---

Content.`;

    const skill = parseSkillContent(content);
    const manifest = extractManifest(skill);

    expect(manifest.name).toBe('full-manifest');
    expect(manifest.version).toBe('2.0.0');
    expect(manifest.author).toBe('someone');
    expect(manifest.tags).toEqual(['a', 'b']);
    expect(manifest.category).toBe('devops');
    expect(manifest.license).toBe('MIT');
  });
});
