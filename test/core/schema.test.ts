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
  // Open standard minimal: only name + description required
  const minimalMetadata = {
    name: 'my-skill',
    description: 'A valid skill for schema testing purposes',
  };

  // Full metadata with skillli registry fields
  const fullMetadata = {
    ...minimalMetadata,
    version: '1.0.0',
    author: 'testuser',
    license: 'MIT',
    tags: ['test', 'validation'],
    category: 'development',
  };

  it('accepts minimal metadata (open standard)', () => {
    const result = SkillMetadataSchema.parse(minimalMetadata);
    expect(result.name).toBe('my-skill');
    expect(result['trust-level']).toBe('community');
    expect(result['user-invocable']).toBe(true);
    expect(result['disable-model-invocation']).toBe(false);
  });

  it('accepts full metadata with skillli fields', () => {
    const result = SkillMetadataSchema.parse(fullMetadata);
    expect(result.name).toBe('my-skill');
    expect(result.version).toBe('1.0.0');
    expect(result.author).toBe('testuser');
  });

  it('accepts metadata block (open standard extensibility)', () => {
    const result = SkillMetadataSchema.parse({
      ...minimalMetadata,
      license: 'MIT',
      metadata: {
        author: 'testuser',
        version: '1.0.0',
        tags: 'test, validation',
        category: 'development',
      },
    });
    expect(result.metadata?.author).toBe('testuser');
    expect(result.metadata?.version).toBe('1.0.0');
  });

  it('accepts optional fields', () => {
    const result = SkillMetadataSchema.parse({
      ...fullMetadata,
      repository: 'https://github.com/test/repo',
      'trust-level': 'verified',
      checksum: 'sha256:abc',
      compatibility: 'Requires Node.js >= 18',
    });
    expect(result.repository).toBe('https://github.com/test/repo');
    expect(result['trust-level']).toBe('verified');
    expect(result.compatibility).toBe('Requires Node.js >= 18');
  });

  it('accepts Claude Code extension fields', () => {
    const result = SkillMetadataSchema.parse({
      ...minimalMetadata,
      'argument-hint': '[issue-number]',
      'disable-model-invocation': true,
      model: 'claude-sonnet-4-20250514',
      context: 'fork',
      agent: 'Explore',
    });
    expect(result['argument-hint']).toBe('[issue-number]');
    expect(result['disable-model-invocation']).toBe(true);
    expect(result.context).toBe('fork');
    expect(result.agent).toBe('Explore');
  });

  it('rejects name with uppercase', () => {
    expect(() => SkillMetadataSchema.parse({ ...minimalMetadata, name: 'MySkill' })).toThrow();
  });

  it('rejects name starting with hyphen', () => {
    expect(() => SkillMetadataSchema.parse({ ...minimalMetadata, name: '-bad' })).toThrow();
  });

  it('rejects name with consecutive hyphens', () => {
    expect(() => SkillMetadataSchema.parse({ ...minimalMetadata, name: 'my--skill' })).toThrow();
  });

  it('rejects name over 64 chars', () => {
    expect(() => SkillMetadataSchema.parse({ ...minimalMetadata, name: 'a'.repeat(65) })).toThrow();
  });

  it('rejects description over 1024 chars', () => {
    expect(() => SkillMetadataSchema.parse({ ...minimalMetadata, description: 'a'.repeat(1025) })).toThrow();
  });

  it('rejects missing name', () => {
    expect(() => SkillMetadataSchema.parse({ description: 'A skill' })).toThrow();
  });

  it('rejects missing description', () => {
    expect(() => SkillMetadataSchema.parse({ name: 'test' })).toThrow();
  });

  it('accepts single-character name', () => {
    const result = SkillMetadataSchema.parse({ ...minimalMetadata, name: 'x' });
    expect(result.name).toBe('x');
  });

  it('accepts tags as comma-separated string', () => {
    const result = SkillMetadataSchema.parse({ ...minimalMetadata, tags: 'foo, bar, baz' });
    expect(result.tags).toBe('foo, bar, baz');
  });
});
