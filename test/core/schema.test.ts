import { describe, it, expect } from 'vitest';
import { SkillMetadataSchema, SkillCategorySchema, TrustLevelSchema } from '../../src/core/schema.js';

describe('SkillCategorySchema', () => {
  it('accepts valid categories', () => {
    for (const cat of ['development', 'creative', 'enterprise', 'data', 'devops', 'other']) {
      expect(SkillCategorySchema.parse(cat)).toBe(cat);
    }
  });

  it('rejects invalid categories', () => {
    expect(() => SkillCategorySchema.parse('invalid')).toThrow();
  });
});

describe('TrustLevelSchema', () => {
  it('accepts valid trust levels', () => {
    for (const level of ['community', 'verified', 'official']) {
      expect(TrustLevelSchema.parse(level)).toBe(level);
    }
  });
});

describe('SkillMetadataSchema', () => {
  // === Minimal metadata (open standard) ===

  it('accepts minimal metadata with only name + description', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'A useful skill',
    });
    expect(result.name).toBe('my-skill');
    expect(result.description).toBe('A useful skill');
    expect(result['trust-level']).toBe('community');
    expect(result['user-invocable']).toBe(true);
    expect(result['disable-model-invocation']).toBe(false);
  });

  it('accepts single-character name', () => {
    const result = SkillMetadataSchema.parse({ name: 'x', description: 'test' });
    expect(result.name).toBe('x');
  });

  it('accepts name up to 64 characters', () => {
    const longName = 'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01';
    expect(longName.length).toBe(64);
    const result = SkillMetadataSchema.parse({ name: longName, description: 'test' });
    expect(result.name).toBe(longName);
  });

  it('accepts description up to 1024 characters', () => {
    const description = 'x'.repeat(1024);
    const result = SkillMetadataSchema.parse({ name: 'test', description });
    expect(result.description).toBe(description);
  });

  // === Name validation ===

  it('rejects name with uppercase', () => {
    expect(() => SkillMetadataSchema.parse({ name: 'MySkill', description: 'test' })).toThrow();
  });

  it('rejects name starting with hyphen', () => {
    expect(() => SkillMetadataSchema.parse({ name: '-bad', description: 'test' })).toThrow();
  });

  it('rejects name ending with hyphen', () => {
    expect(() => SkillMetadataSchema.parse({ name: 'bad-', description: 'test' })).toThrow();
  });

  it('rejects name with consecutive hyphens', () => {
    expect(() => SkillMetadataSchema.parse({ name: 'my--skill', description: 'test' })).toThrow();
  });

  it('rejects name longer than 64 characters', () => {
    const name = 'a'.repeat(65);
    expect(() => SkillMetadataSchema.parse({ name, description: 'test' })).toThrow();
  });

  it('rejects empty description', () => {
    expect(() => SkillMetadataSchema.parse({ name: 'test', description: '' })).toThrow();
  });

  it('rejects description over 1024 characters', () => {
    expect(() =>
      SkillMetadataSchema.parse({ name: 'test', description: 'x'.repeat(1025) }),
    ).toThrow();
  });

  // === Full metadata (backwards compatible) ===

  const fullMetadata = {
    name: 'my-skill',
    description: 'A valid skill for testing',
    version: '1.0.0',
    author: 'testuser',
    license: 'MIT',
    tags: ['test', 'validation'],
    category: 'development',
  };

  it('accepts full metadata with all legacy required fields', () => {
    const result = SkillMetadataSchema.parse(fullMetadata);
    expect(result.name).toBe('my-skill');
    expect(result.version).toBe('1.0.0');
    expect(result.author).toBe('testuser');
    expect(result.license).toBe('MIT');
    expect(result.tags).toEqual(['test', 'validation']);
    expect(result.category).toBe('development');
    expect(result['trust-level']).toBe('community');
    expect(result['user-invocable']).toBe(true);
  });

  it('accepts metadata with optional URL fields', () => {
    const result = SkillMetadataSchema.parse({
      ...fullMetadata,
      repository: 'https://github.com/test/repo',
      'trust-level': 'verified',
      checksum: 'sha256:abc',
    });
    expect(result.repository).toBe('https://github.com/test/repo');
    expect(result['trust-level']).toBe('verified');
  });

  // === Claude Code extension fields ===

  it('accepts Claude Code extension fields', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'A skill with extensions',
      'argument-hint': '[filename]',
      context: 'fork',
      agent: 'Explore',
      model: 'haiku',
      mode: true,
      'disable-model-invocation': true,
      'user-invocable': false,
    });
    expect(result['argument-hint']).toBe('[filename]');
    expect(result.context).toBe('fork');
    expect(result.agent).toBe('Explore');
    expect(result.model).toBe('haiku');
    expect(result.mode).toBe(true);
    expect(result['disable-model-invocation']).toBe(true);
    expect(result['user-invocable']).toBe(false);
  });

  it('accepts hooks in frontmatter', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'A skill with hooks',
      hooks: {
        PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: './lint.sh' }] }],
      },
    });
    expect(result.hooks).toBeDefined();
  });

  // === Open standard fields ===

  it('accepts compatibility as string', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'test',
      compatibility: 'Requires git and docker',
    });
    expect(result.compatibility).toBe('Requires git and docker');
  });

  it('accepts compatibility as array', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'test',
      compatibility: ['git', 'docker'],
    });
    expect(result.compatibility).toEqual(['git', 'docker']);
  });

  it('accepts allowed-tools', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'test',
      'allowed-tools': 'Bash(git:*) Read Grep Glob',
    });
    expect(result['allowed-tools']).toBe('Bash(git:*) Read Grep Glob');
  });

  it('accepts metadata block', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'test',
      metadata: { author: 'someone', version: '1.0.0' },
    });
    expect(result.metadata).toEqual({ author: 'someone', version: '1.0.0' });
  });

  // === Tags formats ===

  it('accepts tags as array', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'test',
      tags: ['a', 'b', 'c'],
    });
    expect(result.tags).toEqual(['a', 'b', 'c']);
  });

  it('accepts tags as comma-separated string', () => {
    const result = SkillMetadataSchema.parse({
      name: 'my-skill',
      description: 'test',
      tags: 'typescript, testing, ci',
    });
    expect(result.tags).toBe('typescript, testing, ci');
  });

  // === Semver validation ===

  it('accepts valid semver', () => {
    const result = SkillMetadataSchema.parse({
      name: 'test',
      description: 'test',
      version: '2.1.3',
    });
    expect(result.version).toBe('2.1.3');
  });

  it('rejects invalid semver when version is provided', () => {
    expect(() =>
      SkillMetadataSchema.parse({ name: 'test', description: 'test', version: 'not-semver' }),
    ).toThrow();
  });

  it('version is optional', () => {
    const result = SkillMetadataSchema.parse({ name: 'test', description: 'test' });
    expect(result.version).toBeUndefined();
  });

  // === Quiz (interactive/branching) ===

  it('accepts a skill with a quiz gate', () => {
    const result = SkillMetadataSchema.parse({
      name: 'quiz-skill',
      description: 'A skill with quizzes',
      quiz: {
        title: 'Prereqs',
        gate: true,
        'passing-score': 100,
        questions: [
          {
            question: 'What auth method?',
            options: [
              { label: 'JWT', correct: true },
              { label: 'API Key' },
            ],
            'on-incorrect': { 'load-reference': 'references/auth.md' },
          },
        ],
      },
    });
    expect(result.quiz).toBeDefined();
  });

  it('accepts quiz as an array of quizzes', () => {
    const result = SkillMetadataSchema.parse({
      name: 'multi-quiz',
      description: 'Multiple quizzes',
      quiz: [
        {
          title: 'Quiz 1',
          questions: [
            { question: 'Q1?', options: [{ label: 'A', correct: true }, { label: 'B' }] },
          ],
        },
        {
          title: 'Quiz 2',
          questions: [
            { question: 'Q2?', options: [{ label: 'C' }, { label: 'D', correct: true }] },
          ],
        },
      ],
    });
    expect(Array.isArray(result.quiz)).toBe(true);
  });

  it('rejects quiz with fewer than 2 options', () => {
    expect(() =>
      SkillMetadataSchema.parse({
        name: 'bad-quiz',
        description: 'test',
        quiz: {
          questions: [
            { question: 'Q?', options: [{ label: 'Only one' }] },
          ],
        },
      }),
    ).toThrow();
  });

  it('rejects quiz with no questions', () => {
    expect(() =>
      SkillMetadataSchema.parse({
        name: 'empty-quiz',
        description: 'test',
        quiz: { questions: [] },
      }),
    ).toThrow();
  });

  // === Passthrough unknown fields ===

  it('passes through unknown fields', () => {
    const result = SkillMetadataSchema.parse({
      name: 'test',
      description: 'test',
      'custom-field': 'value',
    });
    expect((result as Record<string, unknown>)['custom-field']).toBe('value');
  });
});
