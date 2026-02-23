import { readFile } from 'fs/promises';
import matter from 'gray-matter';
import { SkillMetadataSchema, type RawSkillMetadata } from './schema.js';
import { SkillValidationError } from './errors.js';
import type { SkillMetadata, ParsedSkill, SkillCategory, TrustLevel } from './types.js';

/**
 * Normalize raw frontmatter into the internal SkillMetadata shape.
 *
 * Handles two formats:
 * 1. Open standard: skillli-specific fields under `metadata` block
 * 2. Legacy: skillli-specific fields at top level
 *
 * Top-level fields win over metadata block values.
 */
function normalizeMetadata(raw: RawSkillMetadata): SkillMetadata {
  const meta = raw.metadata ?? {};

  // Tags: array, comma-separated string, or from metadata block
  let tags: string[] | undefined;
  if (Array.isArray(raw.tags)) {
    tags = raw.tags;
  } else if (typeof raw.tags === 'string') {
    tags = raw.tags.split(',').map((t) => t.trim()).filter(Boolean);
  } else if (meta.tags) {
    tags = meta.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  return {
    // Open standard required
    name: raw.name,
    description: raw.description,

    // Open standard optional
    license: raw.license,
    compatibility: raw.compatibility,
    metadata: raw.metadata,
    allowedTools: raw['allowed-tools'],

    // Claude Code extensions
    argumentHint: raw['argument-hint'],
    disableModelInvocation: raw['disable-model-invocation'],
    userInvocable: raw['user-invocable'],
    model: raw.model,
    context: raw.context,
    agent: raw.agent,
    hooks: raw.hooks,

    // Skillli extensions: top-level wins, metadata block fallback
    version: raw.version ?? meta.version,
    author: raw.author ?? meta.author,
    tags,
    category: (raw.category ?? meta.category as SkillCategory | undefined),
    repository: raw.repository ?? meta.repository,
    homepage: raw.homepage ?? meta.homepage,
    minSkillliVersion: raw['min-skillli-version'] ?? meta['min-skillli-version'],
    trustLevel: (raw['trust-level'] ?? meta['trust-level'] as TrustLevel | undefined) ?? 'community',
    checksum: raw.checksum ?? meta.checksum,
  };
}

export function validateMetadata(data: unknown): SkillMetadata {
  const result = SkillMetadataSchema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new SkillValidationError('Invalid skill metadata', details);
  }
  return normalizeMetadata(result.data);
}

export function parseSkillContent(content: string, filePath = '<inline>'): ParsedSkill {
  const { data, content: body, matter: rawFrontmatter } = matter(content);
  const metadata = validateMetadata(data);
  return {
    metadata,
    content: body.trim(),
    rawFrontmatter: rawFrontmatter || '',
    filePath,
  };
}

export async function parseSkillFile(filePath: string): Promise<ParsedSkill> {
  const content = await readFile(filePath, 'utf-8');
  return parseSkillContent(content, filePath);
}

export function extractManifest(skill: ParsedSkill): Record<string, unknown> {
  const { metadata } = skill;
  return {
    name: metadata.name,
    version: metadata.version,
    description: metadata.description,
    author: metadata.author,
    license: metadata.license,
    tags: metadata.tags,
    category: metadata.category,
    repository: metadata.repository,
    trust_level: metadata.trustLevel,
    checksum: metadata.checksum,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
