import { readFile } from 'fs/promises';
import matter from 'gray-matter';
import { SkillMetadataSchema, type RawSkillMetadata } from './schema.js';
import { SkillValidationError } from './errors.js';
import type { SkillMetadata, SkillCategory, ParsedSkill } from './types.js';

/**
 * Normalize tags from various input formats:
 * - Array of strings: ["a", "b"]
 * - Comma-separated string: "a, b, c"
 */
function normalizeTags(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return undefined;
}

/**
 * Extract skillli-specific fields from the `metadata` block.
 * The open standard says metadata is map<string, string>, so we pull out
 * known skillli keys and coerce types as needed.
 */
function extractFromMetadataBlock(meta: Record<string, string>): Record<string, unknown> {
  const extracted: Record<string, unknown> = {};

  if (meta.version) extracted.version = meta.version;
  if (meta.author) extracted.author = meta.author;
  if (meta.category) extracted.category = meta.category;
  if (meta['trust-level']) extracted['trust-level'] = meta['trust-level'];
  if (meta.repository) extracted.repository = meta.repository;
  if (meta.homepage) extracted.homepage = meta.homepage;
  if (meta['min-skillli-version']) extracted['min-skillli-version'] = meta['min-skillli-version'];
  if (meta.license) extracted.license = meta.license;

  // Tags in metadata block are comma-separated strings
  if (meta.tags) {
    extracted.tags = meta.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  return extracted;
}

/**
 * Merge frontmatter data with metadata block.
 * Top-level fields always win over metadata block fields.
 */
function mergeWithMetadataBlock(data: Record<string, unknown>): Record<string, unknown> {
  const metadataBlock = data.metadata as Record<string, string> | undefined;
  if (!metadataBlock || typeof metadataBlock !== 'object') return data;

  const fromBlock = extractFromMetadataBlock(metadataBlock);
  const merged = { ...fromBlock, ...data };

  // Re-attach original metadata block (pass through to schema)
  merged.metadata = metadataBlock;

  return merged;
}

function normalizeMetadata(raw: RawSkillMetadata): SkillMetadata {
  const tags = normalizeTags(raw.tags);

  return {
    // Open Standard: Required
    name: raw.name,
    description: raw.description,

    // Open Standard: Optional
    license: raw.license,
    compatibility: raw.compatibility,
    allowedTools: raw['allowed-tools'],
    metadata: raw.metadata,

    // Claude Code Extensions
    argumentHint: raw['argument-hint'],
    disableModelInvocation: raw['disable-model-invocation'],
    userInvocable: raw['user-invocable'],
    mode: raw.mode,
    context: raw.context,
    agent: raw.agent,
    model: raw.model,
    hooks: raw.hooks as Record<string, unknown> | undefined,

    // Skillli Registry Extensions
    version: raw.version,
    author: raw.author,
    tags,
    category: raw.category,
    repository: raw.repository,
    homepage: raw.homepage,
    minSkillliVersion: raw['min-skillli-version'],
    trustLevel: raw['trust-level'],
    checksum: raw.checksum,
  };
}

export function validateMetadata(data: unknown): SkillMetadata {
  // Merge metadata block fields before validation
  const merged = mergeWithMetadataBlock(data as Record<string, unknown>);

  const result = SkillMetadataSchema.safeParse(merged);
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
    version: metadata.version ?? '0.0.0',
    description: metadata.description,
    author: metadata.author ?? 'unknown',
    license: metadata.license,
    tags: metadata.tags ?? [],
    category: metadata.category ?? 'other',
    repository: metadata.repository,
    trust_level: metadata.trustLevel,
    checksum: metadata.checksum,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
