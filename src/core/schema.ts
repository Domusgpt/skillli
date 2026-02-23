import { z } from 'zod';

// === Agent Skills Open Standard (agentskills.io) ===

export const SkillCategorySchema = z.enum([
  'development',
  'creative',
  'enterprise',
  'data',
  'devops',
  'other',
]);

export const TrustLevelSchema = z.enum(['community', 'verified', 'official']);

// Name: 1-64 chars, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens
const nameRegex = /^[a-z0-9](?:[a-z0-9]|-(?!-))*[a-z0-9]$|^[a-z0-9]$/;

// The open standard metadata map (arbitrary key-value)
const MetadataSchema = z.record(z.string(), z.string()).optional();

/**
 * Agent Skills Open Standard frontmatter.
 *
 * Required: name, description
 * Optional: license, compatibility, metadata, allowed-tools
 *
 * Claude Code extensions: argument-hint, disable-model-invocation,
 * user-invocable, model, context, agent, hooks
 *
 * Skillli registry extensions (stored in metadata): author, version,
 * tags, category, trust-level, repository, homepage, checksum
 */
export const SkillMetadataSchema = z.object({
  // --- Open standard required fields ---
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(nameRegex, 'Must be 1-64 lowercase alphanumeric chars with hyphens, no leading/trailing/consecutive hyphens'),
  description: z.string().min(1).max(1024),

  // --- Open standard optional fields ---
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  metadata: MetadataSchema,
  'allowed-tools': z.string().optional(),

  // --- Claude Code extension fields ---
  'argument-hint': z.string().optional(),
  'disable-model-invocation': z.boolean().default(false),
  'user-invocable': z.boolean().default(true),
  model: z.string().optional(),
  context: z.string().optional(),
  agent: z.string().optional(),
  hooks: z.unknown().optional(),

  // --- Skillli registry fields (top-level for backwards compat) ---
  // New skills should put these under metadata instead.
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be valid semver').optional(),
  author: z.string().optional(),
  tags: z.union([
    z.array(z.string().min(1).max(50)),
    z.string(), // comma-separated string form
  ]).optional(),
  category: SkillCategorySchema.optional(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  'min-skillli-version': z.string().optional(),
  'trust-level': TrustLevelSchema.default('community'),
  checksum: z.string().optional(),
});

export type RawSkillMetadata = z.infer<typeof SkillMetadataSchema>;
