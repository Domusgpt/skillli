import { z } from 'zod';

// === Open Standard Fields (agentskills.io/specification) ===
// Only `name` and `description` are required by the spec.

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
const namePattern = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,62}[a-z0-9]$|^[a-z0-9]$/;

export const SkillMetadataSchema = z.object({
  // --- Open Standard: Required ---
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(namePattern, 'Must be 1-64 lowercase alphanumeric chars with hyphens, no leading/trailing/consecutive hyphens'),
  description: z.string().min(1).max(1024),

  // --- Open Standard: Optional ---
  license: z.string().min(1).optional(),
  compatibility: z.union([z.string(), z.array(z.string())]).optional(),
  'allowed-tools': z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),

  // --- Claude Code Extensions ---
  'argument-hint': z.string().optional(),
  'disable-model-invocation': z.boolean().default(false),
  'user-invocable': z.boolean().default(true),
  mode: z.boolean().optional(),
  context: z.string().optional(),
  agent: z.string().optional(),
  model: z.string().optional(),
  hooks: z.record(z.string(), z.unknown()).optional(),

  // --- Skillli Registry Extensions (accepted top-level for convenience) ---
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be valid semver (e.g. 1.0.0)').optional(),
  author: z.string().min(1).optional(),
  tags: z.union([
    z.array(z.string().min(1).max(50)).min(1).max(20),
    z.string().min(1), // comma-separated string
  ]).optional(),
  category: SkillCategorySchema.optional(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  'min-skillli-version': z.string().optional(),
  'trust-level': TrustLevelSchema.default('community'),
  checksum: z.string().optional(),
}).passthrough(); // Allow unknown fields to flow through

export type RawSkillMetadata = z.infer<typeof SkillMetadataSchema>;
