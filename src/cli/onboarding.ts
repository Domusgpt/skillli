import { existsSync } from 'fs';
import { mkdir, cp, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { CONFIG_PATH, SKILLLI_DIR, SKILLS_DIR } from '../core/constants.js';
import { markInstalled } from '../core/local-store.js';
import type { InstalledSkill } from '../core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the bundled skillli skill that ships with the npm package.
 * It lives at <package-root>/.claude/skills/skillli/
 */
function getBundledSkillPath(): string {
  // From dist/cli/onboarding.js → go up to package root
  const packageRoot = join(__dirname, '..', '..');
  return join(packageRoot, '.claude', 'skills', 'skillli');
}

/**
 * Check if this is the first time skillli is being run.
 * We check for the existence of config.json AND an onboarded flag inside it.
 */
async function isFirstRun(): Promise<boolean> {
  if (!existsSync(CONFIG_PATH)) {
    return true;
  }
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw);
    return !config.onboarded;
  } catch {
    return true;
  }
}

/**
 * Mark onboarding as complete in the config file.
 */
async function markOnboarded(): Promise<void> {
  if (!existsSync(SKILLLI_DIR)) {
    await mkdir(SKILLLI_DIR, { recursive: true });
  }

  let config: Record<string, unknown> = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      const raw = await readFile(CONFIG_PATH, 'utf-8');
      config = JSON.parse(raw);
    } catch {
      // corrupted config, start fresh
    }
  }
  config.onboarded = true;
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Install the bundled skillli skill into ~/.skillli/skills/skillli/
 */
async function installBundledSkill(): Promise<void> {
  const bundledPath = getBundledSkillPath();
  if (!existsSync(bundledPath)) {
    console.log(chalk.yellow('  Bundled skillli skill not found, skipping.'));
    return;
  }

  const installPath = join(SKILLS_DIR, 'skillli');
  await mkdir(SKILLS_DIR, { recursive: true });

  // Copy the bundled skill to the skills directory
  await cp(bundledPath, installPath, { recursive: true });

  // Register it as installed
  const installed: InstalledSkill = {
    name: 'skillli',
    version: '0.1.0',
    installedAt: new Date().toISOString(),
    path: installPath,
    source: 'local',
  };
  await markInstalled(installed);

  console.log(chalk.green('  Installed skillli skill to ~/.skillli/skills/skillli/'));
}

/**
 * Run first-time onboarding. Called before any command executes.
 *
 * Shows a welcome message and asks if the user wants to install
 * the skillli skill (which teaches AI agents how to use skillli).
 *
 * In non-TTY environments, auto-installs without prompting.
 */
export async function runOnboarding(): Promise<void> {
  if (!(await isFirstRun())) {
    return;
  }

  console.log('');
  console.log(chalk.bold.cyan('  Welcome to skillli!'));
  console.log(chalk.gray('  The skill librarian for agentic AI.'));
  console.log('');

  let shouldInstall = true;

  if (process.stdin.isTTY) {
    const { install } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: 'Install the skillli skill? (teaches AI agents how to use skillli)',
        default: true,
      },
    ]);
    shouldInstall = install;
  } else {
    console.log(chalk.gray('  Auto-installing skillli skill (non-interactive mode)...'));
  }

  if (shouldInstall) {
    try {
      await installBundledSkill();
    } catch (error) {
      console.log(chalk.yellow(`  Could not install bundled skill: ${error}`));
    }
  } else {
    console.log(chalk.gray('  Skipped. Run `skillli install skillli --local` later to install.'));
  }

  await markOnboarded();

  console.log('');
  console.log(chalk.gray('  Quick start:'));
  console.log(chalk.gray('    skillli search <query>   Search for skills'));
  console.log(chalk.gray('    skillli init <name>       Create a new skill'));
  console.log(chalk.gray('    skillli --help            See all commands'));
  console.log('');
}
