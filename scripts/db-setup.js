#!/usr/bin/env node

/**
 * SurrealDB Schema Setup Script
 * Initializes the database schema and creates necessary tables
 */

const Surreal = require('surrealdb.js').default;
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
};

// Load environment variables
function loadEnv() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });

  return envVars;
}

async function setupDatabase() {
  log.step('🗄️  Setting up SurrealDB Schema...');

  const env = loadEnv();
  const db = new Surreal();

  try {
    // Connect to SurrealDB
    log.info('Connecting to SurrealDB...');
    await db.connect(env.SURREALDB_URL, {
      namespace: env.SURREALDB_NAMESPACE,
      database: env.SURREALDB_DATABASE,
    });

    // Authenticate
    await db.signin({
      username: env.SURREALDB_USER,
      password: env.SURREALDB_PASSWORD,
    });

    // Use namespace and database
    await db.use({
      namespace: env.SURREALDB_NAMESPACE,
      database: env.SURREALDB_DATABASE,
    });

    log.success('Connected to SurrealDB');

    // Define schema
    log.info('Creating tables and schema...');

    // User table
    await db.query(`
      DEFINE TABLE user SCHEMAFULL;
      DEFINE FIELD name ON user TYPE option<string>;
      DEFINE FIELD email ON user TYPE option<string>;
      DEFINE FIELD emailVerified ON user TYPE option<datetime>;
      DEFINE FIELD image ON user TYPE option<string>;
      DEFINE FIELD createdAt ON user TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON user TYPE datetime DEFAULT time::now();
      DEFINE INDEX userEmailIdx ON user FIELDS email UNIQUE;
    `);
    log.success('Created user table');

    // Account table
    await db.query(`
      DEFINE TABLE account SCHEMAFULL;
      DEFINE FIELD userId ON account TYPE record<user>;
      DEFINE FIELD type ON account TYPE string;
      DEFINE FIELD provider ON account TYPE string;
      DEFINE FIELD providerAccountId ON account TYPE string;
      DEFINE FIELD refresh_token ON account TYPE option<string>;
      DEFINE FIELD access_token ON account TYPE option<string>;
      DEFINE FIELD expires_at ON account TYPE option<int>;
      DEFINE FIELD token_type ON account TYPE option<string>;
      DEFINE FIELD scope ON account TYPE option<string>;
      DEFINE FIELD id_token ON account TYPE option<string>;
      DEFINE FIELD session_state ON account TYPE option<string>;
      DEFINE FIELD createdAt ON account TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON account TYPE datetime DEFAULT time::now();
      DEFINE INDEX accountProviderIdx ON account FIELDS provider, providerAccountId UNIQUE;
    `);
    log.success('Created account table');

    // Session table
    await db.query(`
      DEFINE TABLE session SCHEMAFULL;
      DEFINE FIELD sessionToken ON session TYPE string;
      DEFINE FIELD userId ON session TYPE record<user>;
      DEFINE FIELD expires ON session TYPE datetime;
      DEFINE FIELD createdAt ON session TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON session TYPE datetime DEFAULT time::now();
      DEFINE INDEX sessionTokenIdx ON session FIELDS sessionToken UNIQUE;
    `);
    log.success('Created session table');

    // VerificationToken table
    await db.query(`
      DEFINE TABLE verificationToken SCHEMAFULL;
      DEFINE FIELD identifier ON verificationToken TYPE string;
      DEFINE FIELD token ON verificationToken TYPE string;
      DEFINE FIELD expires ON verificationToken TYPE datetime;
      DEFINE INDEX verificationTokenIdx ON verificationToken FIELDS identifier, token UNIQUE;
    `);
    log.success('Created verificationToken table');

    // UserPreferences table
    await db.query(`
      DEFINE TABLE userPreferences SCHEMAFULL;
      DEFINE FIELD userId ON userPreferences TYPE record<user>;
      DEFINE FIELD pomodoroWorkDuration ON userPreferences TYPE int DEFAULT 25;
      DEFINE FIELD pomodoroBreakDuration ON userPreferences TYPE int DEFAULT 5;
      DEFINE FIELD pomodoroLongBreak ON userPreferences TYPE int DEFAULT 15;
      DEFINE FIELD pomodoroSessionsUntilLongBreak ON userPreferences TYPE int DEFAULT 4;
      DEFINE FIELD theme ON userPreferences TYPE string DEFAULT "system";
      DEFINE FIELD sidebarCollapsed ON userPreferences TYPE bool DEFAULT false;
      DEFINE FIELD aiModel ON userPreferences TYPE string DEFAULT "openai/gpt-4-turbo-preview";
      DEFINE FIELD aiMaxTokens ON userPreferences TYPE int DEFAULT 2000;
      DEFINE FIELD aiTemperature ON userPreferences TYPE float DEFAULT 0.7;
      DEFINE FIELD aiSystemPrompt ON userPreferences TYPE option<string>;
      DEFINE FIELD enableNotifications ON userPreferences TYPE bool DEFAULT true;
      DEFINE FIELD enableSoundAlerts ON userPreferences TYPE bool DEFAULT true;
      DEFINE FIELD createdAt ON userPreferences TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON userPreferences TYPE datetime DEFAULT time::now();
      DEFINE INDEX userPreferencesUserIdx ON userPreferences FIELDS userId UNIQUE;
    `);
    log.success('Created userPreferences table');

    // Task table
    await db.query(`
      DEFINE TABLE task SCHEMAFULL;
      DEFINE FIELD userId ON task TYPE record<user>;
      DEFINE FIELD title ON task TYPE string;
      DEFINE FIELD description ON task TYPE option<string>;
      DEFINE FIELD status ON task TYPE string DEFAULT "TODO";
      DEFINE FIELD priority ON task TYPE string DEFAULT "MEDIUM";
      DEFINE FIELD labels ON task TYPE array<string> DEFAULT [];
      DEFINE FIELD position ON task TYPE int DEFAULT 0;
      DEFINE FIELD dueDate ON task TYPE option<datetime>;
      DEFINE FIELD completedAt ON task TYPE option<datetime>;
      DEFINE FIELD syncStatus ON task TYPE string DEFAULT "SYNCED";
      DEFINE FIELD lastSyncedAt ON task TYPE option<datetime>;
      DEFINE FIELD version ON task TYPE int DEFAULT 1;
      DEFINE FIELD createdAt ON task TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON task TYPE datetime DEFAULT time::now();
      DEFINE INDEX taskUserStatusIdx ON task FIELDS userId, status;
    `);
    log.success('Created task table');

    // FocusSession table
    await db.query(`
      DEFINE TABLE focusSession SCHEMAFULL;
      DEFINE FIELD userId ON focusSession TYPE record<user>;
      DEFINE FIELD type ON focusSession TYPE string;
      DEFINE FIELD duration ON focusSession TYPE int;
      DEFINE FIELD completed ON focusSession TYPE bool DEFAULT false;
      DEFINE FIELD taskId ON focusSession TYPE option<record<task>>;
      DEFINE FIELD notes ON focusSession TYPE option<string>;
      DEFINE FIELD startedAt ON focusSession TYPE datetime;
      DEFINE FIELD endedAt ON focusSession TYPE option<datetime>;
      DEFINE FIELD syncStatus ON focusSession TYPE string DEFAULT "SYNCED";
      DEFINE FIELD lastSyncedAt ON focusSession TYPE option<datetime>;
      DEFINE FIELD createdAt ON focusSession TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON focusSession TYPE datetime DEFAULT time::now();
      DEFINE INDEX focusSessionUserIdx ON focusSession FIELDS userId, startedAt;
    `);
    log.success('Created focusSession table');

    // AIPromptHistory table
    await db.query(`
      DEFINE TABLE aiPromptHistory SCHEMAFULL;
      DEFINE FIELD userId ON aiPromptHistory TYPE record<user>;
      DEFINE FIELD prompt ON aiPromptHistory TYPE string;
      DEFINE FIELD response ON aiPromptHistory TYPE string;
      DEFINE FIELD model ON aiPromptHistory TYPE string;
      DEFINE FIELD tokens ON aiPromptHistory TYPE option<int>;
      DEFINE FIELD type ON aiPromptHistory TYPE string DEFAULT "INSIGHT";
      DEFINE FIELD metadata ON aiPromptHistory TYPE option<object>;
      DEFINE FIELD createdAt ON aiPromptHistory TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON aiPromptHistory TYPE datetime DEFAULT time::now();
      DEFINE INDEX aiPromptHistoryUserIdx ON aiPromptHistory FIELDS userId, createdAt;
    `);
    log.success('Created aiPromptHistory table');

    // ActivityLog table
    await db.query(`
      DEFINE TABLE activityLog SCHEMAFULL;
      DEFINE FIELD userId ON activityLog TYPE record<user>;
      DEFINE FIELD source ON activityLog TYPE string;
      DEFINE FIELD type ON activityLog TYPE string;
      DEFINE FIELD title ON activityLog TYPE string;
      DEFINE FIELD description ON activityLog TYPE option<string>;
      DEFINE FIELD url ON activityLog TYPE option<string>;
      DEFINE FIELD metadata ON activityLog TYPE option<object>;
      DEFINE FIELD occurredAt ON activityLog TYPE datetime;
      DEFINE FIELD createdAt ON activityLog TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON activityLog TYPE datetime DEFAULT time::now();
      DEFINE INDEX activityLogUserIdx ON activityLog FIELDS userId, occurredAt;
    `);
    log.success('Created activityLog table');

    // Repository table
    await db.query(`
      DEFINE TABLE repository SCHEMAFULL;
      DEFINE FIELD userId ON repository TYPE record<user>;
      DEFINE FIELD externalId ON repository TYPE string;
      DEFINE FIELD provider ON repository TYPE string;
      DEFINE FIELD name ON repository TYPE string;
      DEFINE FIELD fullName ON repository TYPE string;
      DEFINE FIELD description ON repository TYPE option<string>;
      DEFINE FIELD url ON repository TYPE string;
      DEFINE FIELD homepage ON repository TYPE option<string>;
      DEFINE FIELD stars ON repository TYPE int DEFAULT 0;
      DEFINE FIELD forks ON repository TYPE int DEFAULT 0;
      DEFINE FIELD openIssues ON repository TYPE int DEFAULT 0;
      DEFINE FIELD watchers ON repository TYPE int DEFAULT 0;
      DEFINE FIELD language ON repository TYPE option<string>;
      DEFINE FIELD topics ON repository TYPE array<string> DEFAULT [];
      DEFINE FIELD isPrivate ON repository TYPE bool DEFAULT false;
      DEFINE FIELD isFork ON repository TYPE bool DEFAULT false;
      DEFINE FIELD isArchived ON repository TYPE bool DEFAULT false;
      DEFINE FIELD ownerName ON repository TYPE string;
      DEFINE FIELD ownerAvatar ON repository TYPE option<string>;
      DEFINE FIELD pushedAt ON repository TYPE option<datetime>;
      DEFINE FIELD lastSyncedAt ON repository TYPE datetime DEFAULT time::now();
      DEFINE FIELD syncStatus ON repository TYPE string DEFAULT "SYNCED";
      DEFINE FIELD createdAt ON repository TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON repository TYPE datetime DEFAULT time::now();
      DEFINE INDEX repositoryUserProviderIdx ON repository FIELDS userId, provider, externalId UNIQUE;
    `);
    log.success('Created repository table');

    // RepositoryCommit table
    await db.query(`
      DEFINE TABLE repositoryCommit SCHEMAFULL;
      DEFINE FIELD repositoryId ON repositoryCommit TYPE record<repository>;
      DEFINE FIELD sha ON repositoryCommit TYPE string;
      DEFINE FIELD message ON repositoryCommit TYPE string;
      DEFINE FIELD author ON repositoryCommit TYPE string;
      DEFINE FIELD authorEmail ON repositoryCommit TYPE option<string>;
      DEFINE FIELD authorAvatar ON repositoryCommit TYPE option<string>;
      DEFINE FIELD additions ON repositoryCommit TYPE int DEFAULT 0;
      DEFINE FIELD deletions ON repositoryCommit TYPE int DEFAULT 0;
      DEFINE FIELD changedFiles ON repositoryCommit TYPE int DEFAULT 0;
      DEFINE FIELD url ON repositoryCommit TYPE string;
      DEFINE FIELD committedAt ON repositoryCommit TYPE datetime;
      DEFINE FIELD createdAt ON repositoryCommit TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON repositoryCommit TYPE datetime DEFAULT time::now();
      DEFINE INDEX repositoryCommitRepoShaIdx ON repositoryCommit FIELDS repositoryId, sha UNIQUE;
    `);
    log.success('Created repositoryCommit table');

    // RepositoryBranch table
    await db.query(`
      DEFINE TABLE repositoryBranch SCHEMAFULL;
      DEFINE FIELD repositoryId ON repositoryBranch TYPE record<repository>;
      DEFINE FIELD name ON repositoryBranch TYPE string;
      DEFINE FIELD isDefault ON repositoryBranch TYPE bool DEFAULT false;
      DEFINE FIELD isProtected ON repositoryBranch TYPE bool DEFAULT false;
      DEFINE FIELD lastCommitSha ON repositoryBranch TYPE option<string>;
      DEFINE FIELD lastCommitMessage ON repositoryBranch TYPE option<string>;
      DEFINE FIELD lastCommitDate ON repositoryBranch TYPE option<datetime>;
      DEFINE FIELD createdAt ON repositoryBranch TYPE datetime DEFAULT time::now();
      DEFINE FIELD updatedAt ON repositoryBranch TYPE datetime DEFAULT time::now();
      DEFINE INDEX repositoryBranchRepoNameIdx ON repositoryBranch FIELDS repositoryId, name UNIQUE;
    `);
    log.success('Created repositoryBranch table');

    log.success('\n✨ Database schema setup complete!');

    await db.close();
  } catch (error) {
    log.error('Database setup failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
