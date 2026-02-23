import { describe, it, expect } from 'vitest';
import { join } from 'path';
import { parseSkillFile, parseSkillContent, validateMetadata } from '../../src/core/parser.js';
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
  it('parses inline content with top-level skillli fields', () => {
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
    expect(skill.content).toContain('# Inline Skill');
    expect(skill.filePath).toBe('<inline>');
  });

  it('parses open standard format with metadata block', () => {
    const content = `---
name: standard-skill
description: A skill using the Agent Skills open standard format
license: MIT
metadata:
  author: someone
  version: "2.0.0"
  tags: testing, standard
  category: development
---

Open standard skill body.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.name).toBe('standard-skill');
    expect(skill.metadata.author).toBe('someone');
    expect(skill.metadata.version).toBe('2.0.0');
    expect(skill.metadata.tags).toEqual(['testing', 'standard']);
    expect(skill.metadata.category).toBe('development');
  });

  it('top-level fields win over metadata block', () => {
    const content = `---
name: override-test
description: Testing field priority
author: top-level-author
metadata:
  author: metadata-author
---

Body.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.author).toBe('top-level-author');
  });

  it('applies defaults for optional fields', () => {
    const content = `---
name: minimal
description: A minimal skill with only required fields
---

Content.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.trustLevel).toBe('community');
    expect(skill.metadata.disableModelInvocation).toBe(false);
    expect(skill.metadata.userInvocable).toBe(true);
    expect(skill.metadata.version).toBeUndefined();
    expect(skill.metadata.author).toBeUndefined();
  });

  it('parses Claude Code extension fields', () => {
    const content = `---
name: extended
description: Skill with Claude Code extensions
context: fork
agent: Explore
model: claude-sonnet-4-20250514
argument-hint: "[file-path]"
disable-model-invocation: true
---

Extended skill.`;

    const skill = parseSkillContent(content);
    expect(skill.metadata.context).toBe('fork');
    expect(skill.metadata.agent).toBe('Explore');
    expect(skill.metadata.model).toBe('claude-sonnet-4-20250514');
    expect(skill.metadata.argumentHint).toBe('[file-path]');
    expect(skill.metadata.disableModelInvocation).toBe(true);
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

  it('rejects invalid semver when version is provided', () => {
    expect(() =>
      validateMetadata({
        name: 'test',
        description: 'A skill with an invalid version string',
        version: 'not-semver',
      }),
    ).toThrow(SkillValidationError);
  });

  it('rejects missing description', () => {
    expect(() => validateMetadata({ name: 'test' })).toThrow(SkillValidationError);
  });

  it('rejects invalid category when provided', () => {
    expect(() =>
      validateMetadata({
        name: 'test',
        description: 'A skill with an invalid category',
        category: 'not-a-category',
      }),
    ).toThrow(SkillValidationError);
  });
});
