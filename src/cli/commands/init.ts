import { Command } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { promptInit } from '../utils/prompts.js';

const SKILL_TEMPLATE = (answers: {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  tags: string[];
  category: string;
}) => `---
name: ${answers.name}
version: ${answers.version}
description: ${answers.description}
author: ${answers.author}
license: ${answers.license}
tags: [${answers.tags.join(', ')}]
category: ${answers.category}
trust-level: community
user-invocable: true
---

# ${answers.name}

${answers.description}

## When to Use

Activate this skill when:
- User asks to "..." or invokes \`/${answers.name}\`
- Agent encounters a situation where ...

Do NOT use when:
- (list exclusions so the agent knows boundaries)

## Instructions

1. First, ...
2. Then, ...
3. Finally, ...

## Input Format

Describe what input this skill expects (file paths, queries, etc.).

## Output Format

Describe what this skill produces (file changes, console output, etc.).

## Examples

### Example 1: Basic usage
**Input:** "..."
**Action:** What the agent does step by step
**Output:** What gets created or changed

## Constraints

- List any limitations
- Note what this skill does NOT handle

## References

- See \`references/\` for supplementary docs
- See \`scripts/\` for helper scripts
`;

interface InitOptions {
  dir: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  tags?: string;
  category?: string;
  yes?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command('init [name]')
    .description('Create a new skill from template')
    .option('-d, --dir <path>', 'Output directory', '.')
    .option('--version <version>', 'Skill version (default: 1.0.0)')
    .option('--description <desc>', 'Skill description')
    .option('--author <author>', 'Author (GitHub username)')
    .option('--license <license>', 'License (default: MIT)')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--category <category>', 'Category: development|creative|enterprise|data|devops|other')
    .option('-y, --yes', 'Non-interactive mode, use defaults for missing values')
    .action(async (name: string | undefined, options: InitOptions) => {
      try {
        const answers = await promptInit({ name }, {
          name,
          version: options.version,
          description: options.description,
          author: options.author,
          license: options.license,
          tags: options.tags,
          category: options.category,
          yes: options.yes,
        });
        const tags = answers.tags.split(',').map((t) => t.trim()).filter(Boolean);
        const outputDir = join(options.dir, answers.name);

        if (existsSync(outputDir)) {
          console.log(chalk.red(`Directory ${outputDir} already exists.`));
          process.exit(1);
        }

        await mkdir(outputDir, { recursive: true });
        await mkdir(join(outputDir, 'scripts'), { recursive: true });
        await mkdir(join(outputDir, 'references'), { recursive: true });

        const content = SKILL_TEMPLATE({ ...answers, tags });
        await writeFile(join(outputDir, 'SKILL.md'), content);

        const manifest = {
          name: answers.name,
          version: answers.version,
          description: answers.description,
          author: answers.author,
          license: answers.license,
          tags,
          category: answers.category,
        };
        await writeFile(join(outputDir, 'skillli.json'), JSON.stringify(manifest, null, 2));

        console.log(chalk.green(`\nSkill "${answers.name}" created at ${outputDir}`));
        console.log(chalk.gray('  Edit SKILL.md to add your skill instructions.'));
        console.log(chalk.gray('  Run `skillli publish` when ready to share.\n'));
      } catch (error) {
        console.error(chalk.red('Error:'), error);
        process.exit(1);
      }
    });
}
