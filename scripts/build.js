#!/usr/bin/env node

/**
 * DevFocus Dashboard - Build Script
 * Cross-platform script to build the production version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
    }
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

function checkSetup() {
  log.step('🔍 Checking Setup...');

  if (!fileExists('node_modules')) {
    log.error('Dependencies not installed. Run: npm install');
    process.exit(1);
  }

  if (!fileExists('.env')) {
    log.warning('.env file not found');
    log.info('Make sure to set environment variables for production');
  }

  log.success('Setup check passed');
}

function runLint() {
  log.step('🔍 Running Linter...');

  const success = exec('npm run lint', { ignoreError: true });

  if (success) {
    log.success('Lint check passed');
  } else {
    log.warning('Lint check failed');
    log.info('Continuing with build...');
  }
}

function runTypeCheck() {
  log.step('📝 Running Type Check...');

  const success = exec('npm run type-check', { ignoreError: true });

  if (success) {
    log.success('Type check passed');
  } else {
    log.error('Type check failed');
    log.info('Please fix type errors before building for production');
    process.exit(1);
  }
}

function buildProject() {
  log.step('🏗️  Building Project...');

  log.info('This may take a few minutes...');

  const success = exec('npm run build');

  if (success) {
    log.success('Build completed successfully');
  } else {
    log.error('Build failed');
    process.exit(1);
  }
}

function printBuildInfo() {
  log.step('📊 Build Information');

  if (fileExists('.next')) {
    const stats = fs.statSync('.next');
    log.info(`Build directory: .next`);
    log.info(`Created: ${stats.mtime.toLocaleString()}`);
  }

  console.log('');
  console.log(colors.bright + 'Next Steps:' + colors.reset);
  console.log('');
  console.log('  1. Test the production build locally:');
  console.log(`     ${colors.cyan}npm start${colors.reset}`);
  console.log('');
  console.log('  2. Deploy to Vercel:');
  console.log(`     ${colors.cyan}vercel --prod${colors.reset}`);
  console.log('');
  console.log('  3. Or deploy with Docker:');
  console.log(`     ${colors.cyan}docker-compose up -d${colors.reset}`);
  console.log('');
}

function main() {
  console.log('');
  console.log(colors.bright + colors.cyan + '╔════════════════════════════════════════╗' + colors.reset);
  console.log(colors.bright + colors.cyan + '║   DevFocus Dashboard - Build Script   ║' + colors.reset);
  console.log(colors.bright + colors.cyan + '╚════════════════════════════════════════╝' + colors.reset);
  console.log('');

  try {
    checkSetup();
    runLint();
    runTypeCheck();
    buildProject();
    printBuildInfo();

    console.log('');
    log.success('Build process completed successfully! 🎉');
    console.log('');
  } catch (error) {
    log.error('Build process failed: ' + error.message);
    process.exit(1);
  }
}

main();
