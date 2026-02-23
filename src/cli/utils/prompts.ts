import inquirer from 'inquirer';
import type { SkillCategory } from '../../core/types.js';

export interface InitAnswers {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  tags: string;
  category: SkillCategory;
}

export interface InitFlags {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  tags?: string;
  category?: string;
  yes?: boolean;
}

const VALID_CATEGORIES: SkillCategory[] = ['development', 'creative', 'enterprise', 'data', 'devops', 'other'];

/**
 * Build init answers from CLI flags, falling back to interactive prompts
 * when values are missing. If --yes is passed or stdin is not a TTY,
 * missing values use sensible defaults instead of prompting.
 */
export async function promptInit(defaults?: Partial<InitAnswers>, flags?: InitFlags): Promise<InitAnswers> {
  const nonInteractive = flags?.yes || !process.stdin.isTTY;

  // Merge: explicit flags > defaults > fallback defaults
  const resolved: Partial<InitAnswers> = {
    name: flags?.name ?? defaults?.name,
    version: flags?.version ?? defaults?.version ?? '1.0.0',
    description: flags?.description ?? defaults?.description,
    author: flags?.author ?? defaults?.author,
    license: flags?.license ?? defaults?.license ?? 'MIT',
    tags: flags?.tags ?? defaults?.tags ?? '',
    category: (flags?.category as SkillCategory) ?? defaults?.category ?? 'other',
  };

  // Validate category if provided via flag
  if (flags?.category && !VALID_CATEGORIES.includes(flags.category as SkillCategory)) {
    throw new Error(`Invalid category "${flags.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // In non-interactive mode, fill in what we can and error on required missing fields
  if (nonInteractive) {
    if (!resolved.name) {
      throw new Error('--name is required in non-interactive mode (no TTY or --yes flag)');
    }
    if (!resolved.description) {
      resolved.description = `A ${resolved.name} skill`;
    }
    if (!resolved.author) {
      resolved.author = 'unknown';
    }
    return resolved as InitAnswers;
  }

  // Interactive mode: only prompt for fields not already provided via flags
  const questions: Parameters<typeof inquirer.prompt>[0] = [];

  if (!resolved.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Skill name (lowercase, hyphens):',
      default: defaults?.name,
      validate: (v: string) => /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(v) || 'Must be lowercase alphanumeric with hyphens',
    });
  }
  if (!resolved.version) {
    questions.push({
      type: 'input',
      name: 'version',
      message: 'Version:',
      default: '1.0.0',
    });
  }
  if (!resolved.description) {
    questions.push({
      type: 'input',
      name: 'description',
      message: 'Description (10-500 chars):',
      validate: (v: string) => (v.length >= 10 && v.length <= 500) || 'Must be 10-500 characters',
    });
  }
  if (!resolved.author) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'Author (GitHub username):',
    });
  }
  if (resolved.license === undefined) {
    questions.push({
      type: 'input',
      name: 'license',
      message: 'License:',
      default: 'MIT',
    });
  }
  if (resolved.tags === undefined) {
    questions.push({
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated):',
    });
  }
  if (!flags?.category) {
    questions.push({
      type: 'list',
      name: 'category',
      message: 'Category:',
      choices: VALID_CATEGORIES,
      default: resolved.category ?? 'other',
    });
  }

  if (questions.length === 0) {
    return resolved as InitAnswers;
  }

  const prompted = await inquirer.prompt(questions) as Partial<InitAnswers>;
  return { ...resolved, ...prompted } as InitAnswers;
}
