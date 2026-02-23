import { existsSync } from 'fs';
import { mkdir, cp, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { CONFIG_PATH, SKILLLI_DIR, SKILLS_DIR, VERSION } from '../core/constants.js';
import { markInstalled } from '../core/local-store.js';
import type { InstalledSkill } from '../core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Find the bundled skillli skill that ships with the npm package.
 * It lives at <package-root>/.claude/skills/skillli/
 */
function getBundledSkillPath(): string {
  // From dist/cli/onboarding.js -> go up to package root
  const packageRoot = join(__dirname, '..', '..');
  return join(packageRoot, '.claude', 'skills', 'skillli');
}

/**
 * Check whether the skillli skill is installed and current.
 *
 * This runs every time — not a one-shot "onboarded" flag.
 * A fresh agent on a new machine, a new environment that shares the same
 * home directory, or an upgrade that ships a newer bundled skill all
 * trigger re-installation so the agent always has the latest docs.
 */
async function needsSkillInstall(): Promise<'missing' | 'outdated' | false> {
  const installPath = join(SKILLS_DIR, 'skillli', 'SKILL.md');
  if (!existsSync(installPath)) {
    return 'missing';
  }

  // Check if bundled version is newer than installed version
  const bundledPath = getBundledSkillPath();
  const bundledSkillMd = join(bundledPath, 'SKILL.md');
  if (!existsSync(bundledSkillMd)) {
    return false; // can't compare, assume fine
  }

  try {
    const installed = await readFile(installPath, 'utf-8');
    const bundled = await readFile(bundledSkillMd, 'utf-8');
    // Simple content comparison — if the bundled skill changed, re-install
    if (installed !== bundled) {
      return 'outdated';
    }
  } catch {
    return 'missing';
  }

  return false;
}

/**
 * Has this environment ever seen the welcome banner?
 * We still track this so we show the full welcome only once,
 * but skill installation is independent of it.
 */
async function hasSeenWelcome(): Promise<boolean> {
  if (!existsSync(CONFIG_PATH)) {
    return false;
  }
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw);
    return !!config.onboarded;
  } catch {
    return false;
  }
}

async function markWelcomeSeen(): Promise<void> {
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
    version: VERSION,
    installedAt: new Date().toISOString(),
    path: installPath,
    source: 'local',
  };
  await markInstalled(installed);
}

/**
 * Run onboarding. Called before any command executes.
 *
 * Two independent concerns:
 * 1. Welcome banner — shown once per environment (tracked by onboarded flag)
 * 2. Skill installation — runs whenever the bundled skill is missing or
 *    outdated, so fresh agents and upgrades always get the latest docs.
 *
 * In non-TTY environments, auto-installs without prompting.
 */
export async function runOnboarding(): Promise<void> {
  const installStatus = await needsSkillInstall();
  const showWelcome = !(await hasSeenWelcome());

  // Nothing to do
  if (!installStatus && !showWelcome) {
    return;
  }

  // --- Welcome banner (first time only) ---
  if (showWelcome) {
    console.log('');
    console.log(chalk.bold.cyan('  Welcome to skillli!'));
    console.log(chalk.gray('  The skill librarian for agentic AI.'));
    console.log('');
  }

  // --- Skill installation (whenever missing or outdated) ---
  if (installStatus) {
    const action = installStatus === 'outdated' ? 'Update' : 'Install';
    const actionLower = installStatus === 'outdated' ? 'Updating' : 'Installing';
    let shouldInstall = true;

    if (process.stdin.isTTY && showWelcome) {
      // Only prompt on first welcome — updates are silent
      if (installStatus === 'missing') {
        const { install } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'install',
            message: `${action} the skillli skill? (teaches AI agents how to use skillli)`,
            default: true,
          },
        ]);
        shouldInstall = install;
      }
    } else if (!process.stdin.isTTY) {
      console.log(chalk.gray(`  ${actionLower} skillli skill (non-interactive mode)...`));
    }

    if (shouldInstall) {
      try {
        await installBundledSkill();
        console.log(chalk.green(`  ${installStatus === 'outdated' ? 'Updated' : 'Installed'} skillli skill to ~/.skillli/skills/skillli/`));
      } catch (error) {
        console.log(chalk.yellow(`  Could not install bundled skill: ${error}`));
      }
    } else {
      console.log(chalk.gray('  Skipped. Run `skillli install skillli --local` later to install.'));
    }
  }

  // --- Quick start + links (first time only) ---
  if (showWelcome) {
    await markWelcomeSeen();

    console.log('');
    console.log(chalk.bold('  Quick start:'));
    console.log(chalk.white('    skillli search <query>     ') + chalk.gray('Search for skills'));
    console.log(chalk.white('    skillli install <skill>    ') + chalk.gray('Install and link a skill'));
    console.log(chalk.white('    skillli init <name>        ') + chalk.gray('Create a new skill'));
    console.log(chalk.white('    skillli trawl <query>      ') + chalk.gray('Deep search across GitHub, npm, registry'));
    console.log(chalk.white('    skillli publish [path]     ') + chalk.gray('Validate and publish your skill'));
    console.log(chalk.white('    skillli --help             ') + chalk.gray('See all commands'));
    console.log('');
    console.log(chalk.bold('  For agents & CI:'));
    console.log(chalk.white('    skillli init my-skill -y --description "..." --author you --tags "a,b"'));
    console.log(chalk.gray('    All commands work non-interactively when stdin is not a TTY.'));
    console.log('');
    console.log(chalk.bold('  Docs:'));
    console.log(chalk.gray('    Skill format spec:  ~/.skillli/skills/skillli/references/skill-format-spec.md'));
    console.log(chalk.gray('    Quick start guide:  ~/.skillli/skills/skillli/references/quick-start.md'));
    console.log(chalk.gray('    GitHub:             https://github.com/Domusgpt/skillli'));
    console.log('');
  }
}
