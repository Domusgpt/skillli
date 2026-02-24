import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';
import { SKILL_FILENAME } from '../../core/constants.js';
import { parseSkillFile } from '../../core/parser.js';
import { runSafeguards } from '../../core/safeguards.js';
import { displaySafeguardReport } from '../utils/display.js';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate [path]')
    .description('Validate a SKILL.md file without publishing')
    .action(async (path: string | undefined) => {
      const skillDir = path ?? process.cwd();
      const skillFile = join(skillDir, SKILL_FILENAME);

      if (!existsSync(skillFile)) {
        console.error(chalk.red(`No ${SKILL_FILENAME} found in ${skillDir}`));
        process.exit(1);
      }

      try {
        const skill = await parseSkillFile(skillFile);
        const version = skill.metadata.version ? ` v${skill.metadata.version}` : '';
        console.log(chalk.green(`\n  Parsed: ${chalk.cyan(skill.metadata.name)}${version}`));
        console.log(chalk.gray(`  ${skill.metadata.description}\n`));

        // Show metadata completeness
        const fields = {
          version: skill.metadata.version,
          author: skill.metadata.author,
          license: skill.metadata.license,
          tags: skill.metadata.tags?.length ? skill.metadata.tags.join(', ') : undefined,
          category: skill.metadata.category,
          repository: skill.metadata.repository,
        };
        const present = Object.entries(fields).filter(([, v]) => v !== undefined);
        const missing = Object.entries(fields).filter(([, v]) => v === undefined);

        if (present.length > 0) {
          console.log(chalk.bold('  Registry fields:'));
          for (const [key, value] of present) {
            console.log(`    ${chalk.green('\u2713')} ${key}: ${value}`);
          }
        }
        if (missing.length > 0) {
          console.log(chalk.bold('  Missing (optional):'));
          for (const [key] of missing) {
            console.log(`    ${chalk.gray('\u2022')} ${key}`);
          }
        }
        console.log();

        // Run safeguards
        const safeguards = await runSafeguards(skill, skillDir);
        displaySafeguardReport(safeguards);

        if (safeguards.passed) {
          console.log(chalk.green.bold('  Validation passed.\n'));
        } else {
          console.log(chalk.red.bold('  Validation failed.\n'));
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red(`Validation error: ${error}`));
        process.exit(1);
      }
    });
}
