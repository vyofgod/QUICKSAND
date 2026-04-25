#!/usr/bin/env node

/**
 * DevFocus Dashboard - Setup Script
 * Cross-platform setup script for initializing the project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function exec(command, options = {}) {
  try {
    execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return true;
  } catch (error) {
    if (!options.ignoreError) {
      log.error(`Command failed: ${command}`);
      if (options.silent) {
        console.error(error.message);
      }
    }
    return false;
  }
}

function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

async function checkPrerequisites() {
  log.step('📋 Checking Prerequisites...');

  const checks = [
    { name: 'Node.js', command: 'node', required: true },
    { name: 'npm', command: 'npm', required: true },
    { name: 'Git', command: 'git', required: false },
  ];

  let allPassed = true;

  for (const check of checks) {
    if (checkCommand(check.command)) {
      log.success(`${check.name} is installed`);
    } else {
      if (check.required) {
        log.error(`${check.name} is not installed (required)`);
        allPassed = false;
      } else {
        log.warning(`${check.name} is not installed (optional)`);
      }
    }
  }

  if (!allPassed) {
    log.error('Please install required dependencies and try again');
    process.exit(1);
  }

  return true;
}

async function setupEnvironment() {
  log.step('🔧 Setting up Environment...');

  if (fileExists('.env')) {
    log.warning('.env file already exists');
    const overwrite = await question('Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      log.info('Skipping .env setup');
      return;
    }
  }

  if (!fileExists('.env.example')) {
    log.error('.env.example not found');
    return;
  }

  // Copy .env.example to .env
  fs.copyFileSync('.env.example', '.env');
  log.success('Created .env file from .env.example');

  log.info('\n📝 Please configure your .env file with:');
  log.info('   - SURREALDB_URL (SurrealDB connection string)');
  log.info('   - SURREALDB_NAMESPACE, SURREALDB_DATABASE, SURREALDB_USER, SURREALDB_PASSWORD');
  log.info('   - AUTH_SECRET (already generated)');
  log.info('   - AUTH_GITHUB_ID and AUTH_GITHUB_SECRET (optional)');
  log.info('   - AUTH_GITLAB_ID and AUTH_GITLAB_SECRET (optional)');
  log.info('   - OPENROUTER_API_KEY (optional, for AI features)\n');

  const continueSetup = await question('Continue with setup? (Y/n): ');
  if (continueSetup.toLowerCase() === 'n') {
    log.info('Setup paused. Run this script again when ready.');
    process.exit(0);
  }
}

async function installDependencies() {
  log.step('📦 Installing Dependencies...');

  if (fileExists('node_modules')) {
    log.info('node_modules already exists');
    const reinstall = await question('Do you want to reinstall? (y/N): ');
    if (reinstall.toLowerCase() !== 'y') {
      log.info('Skipping dependency installation');
      return;
    }
  }

  log.info('This may take a few minutes...');
  const success = exec('npm install');

  if (success) {
    log.success('Dependencies installed successfully');
  } else {
    log.error('Failed to install dependencies');
    process.exit(1);
  }
}

async function setupDatabase() {
  log.step('🗄️  Setting up Database...');

  // Check if SURREALDB_URL is set
  if (!fileExists('.env')) {
    log.error('.env file not found. Please run environment setup first.');
    return;
  }

  const envContent = fs.readFileSync('.env', 'utf-8');
  if (!envContent.includes('SURREALDB_URL=') || envContent.includes('SURREALDB_URL=""')) {
    log.warning('SURREALDB_URL not configured in .env');
    log.info('Please set your SurrealDB connection string in .env');
    const skip = await question('Skip database setup for now? (Y/n): ');
    if (skip.toLowerCase() !== 'n') {
      return;
    }
  }

  log.info('Setting up SurrealDB schema...');
  const setupSuccess = exec('npm run db:setup');

  if (setupSuccess) {
    log.success('Database schema setup successfully');
  } else {
    log.warning('Failed to setup database schema');
    log.info('You can run "npm run db:setup" manually later');
  }
}

async function runChecks() {
  log.step('🔍 Running Checks...');

  log.info('Type checking...');
  const typeCheck = exec('npm run type-check', { ignoreError: true });

  if (typeCheck) {
    log.success('Type check passed');
  } else {
    log.warning('Type check failed (this is okay for now)');
  }

  log.info('Linting...');
  const lint = exec('npm run lint', { ignoreError: true });

  if (lint) {
    log.success('Lint check passed');
  } else {
    log.warning('Lint check failed (this is okay for now)');
  }
}

async function printNextSteps() {
  log.step('🎉 Setup Complete!');

  console.log('\n' + colors.bright + 'Next Steps:' + colors.reset);
  console.log('');
  console.log('  1. Configure your .env file:');
  console.log(`     ${colors.cyan}nano .env${colors.reset} or ${colors.cyan}code .env${colors.reset}`);
  console.log('');
  console.log('  2. Start SurrealDB (if not using Docker):');
  console.log(`     ${colors.cyan}surreal start --log trace --user root --pass root memory${colors.reset}`);
  console.log('');
  console.log('  3. Or use Docker Compose:');
  console.log(`     ${colors.cyan}docker-compose up -d${colors.reset}`);
  console.log('');
  console.log('  4. Setup database schema:');
  console.log(`     ${colors.cyan}npm run db:setup${colors.reset}`);
  console.log('');
  console.log('  5. Start the development server:');
  console.log(`     ${colors.cyan}npm run dev${colors.reset}`);
  console.log('');
  console.log('  6. Open your browser:');
  console.log(`     ${colors.cyan}http://localhost:3000${colors.reset}`);
  console.log('');
  console.log(colors.bright + 'Documentation:' + colors.reset);
  console.log(`  - README.md - Project overview`);
  console.log(`  - docs/PAGES.md - Page documentation`);
  console.log(`  - docs/COMPLETE.md - Feature list`);
  console.log('');
  console.log(colors.green + '✨ Happy coding!' + colors.reset);
  console.log('');
}

async function main() {
  console.log('');
  console.log(colors.bright + colors.cyan + '╔════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + colors.cyan + '║   DevFocus Dashboard - Setup Script   ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '╚════════════════════════════════════════╝' + colors.reset);
  console.log('');

  try {
    await checkPrerequisites();
    await setupEnvironment();
    await installDependencies();
    await setupDatabase();
    await runChecks();
    await printNextSteps();
  } catch (error) {
    log.error('Setup failed: ' + error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();
