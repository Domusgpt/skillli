#!/usr/bin/env node

import { Command } from 'commander';
import { VERSION } from '../core/constants.js';
import { runOnboarding } from './onboarding.js';
import { registerInitCommand } from './commands/init.js';
import { registerSearchCommand } from './commands/search.js';
import { registerInstallCommand } from './commands/install.js';
import { registerUninstallCommand } from './commands/uninstall.js';
import { registerInfoCommand } from './commands/info.js';
import { registerListCommand } from './commands/list.js';
import { registerRateCommand } from './commands/rate.js';
import { registerUpdateCommand } from './commands/update.js';
import { registerPublishCommand } from './commands/publish.js';
import { registerTrawlCommand } from './commands/trawl.js';

async function main() {
  // Run first-time onboarding before any command
  // Skip for --version and --help flags (don't interrupt quick lookups)
  const args = process.argv.slice(2);
  const skipOnboarding = args.includes('--version') || args.includes('-V') ||
    (args.length === 0) || // bare `skillli` shows help, don't onboard
    (args.length === 1 && (args[0] === '--help' || args[0] === '-h' || args[0] === 'help'));

  if (!skipOnboarding) {
    await runOnboarding();
  }

  const program = new Command();

  program
    .name('skillli')
    .description('Discover, publish, rate, and use agentic AI skills packages')
    .version(VERSION);

  registerInitCommand(program);
  registerSearchCommand(program);
  registerInstallCommand(program);
  registerUninstallCommand(program);
  registerInfoCommand(program);
  registerListCommand(program);
  registerRateCommand(program);
  registerUpdateCommand(program);
  registerPublishCommand(program);
  registerTrawlCommand(program);

  program.parse();
}

main();
