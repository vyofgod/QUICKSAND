#!/usr/bin/env node

/**
 * DevFocus Dashboard - Start Script
 * Cross-platform script to start the development server
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) =>
    console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
};

function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

function cleanupPorts() {
  log.step("🧹 Cleaning up ports...");
  const ports = [3000, 3001];
  for (const port of ports) {
    try {
      // Portu kullanan süreci bul ve zorla kapat (fuser -k alternatifi)
      if (process.platform !== "win32") {
        execSync(`fuser -k ${port}/tcp 2>/dev/null || true`);
      }
    } catch (e) {
      // Port zaten boşsa veya yetki yoksa hata vermesin
    }
  }
  log.success("Ports are clean");
}

function checkSetup() {
  log.step("🔍 Checking Setup...");

  // Check package.json
  if (!fileExists("package.json")) {
    log.error("package.json not found. Are you in the right directory?");
    process.exit(1);
  }

  // Check and install dependencies
  if (!fileExists("node_modules")) {
    log.warning("Dependencies not installed. Installing...");
    try {
      execSync("npm install", { stdio: "inherit" });
      log.success("Dependencies installed");
    } catch (error) {
      log.error("Failed to install dependencies");
      process.exit(1);
    }
  }

  // Check .env
  if (!fileExists(".env")) {
    log.warning(".env file not found. Creating from .env.example...");
    if (fileExists(".env.example")) {
      fs.copyFileSync(".env.example", ".env");
      log.success(".env file created");
      log.warning("Please configure your .env file before continuing");
    } else {
      log.error(".env.example not found");
      process.exit(1);
    }
  }

  log.success("All checks passed");
}

let surrealProcess = null;

// Path to persistent data directory
const os = require("os");
const SURREAL_DATA_DIR = path.join(os.homedir(), ".surrealdb", "data");
const SURREAL_DB_PATH = path.join(SURREAL_DATA_DIR, "database.db");

function ensureDataDir() {
  if (!fs.existsSync(SURREAL_DATA_DIR)) {
    fs.mkdirSync(SURREAL_DATA_DIR, { recursive: true });
    log.info(`Created SurrealDB data directory: ${SURREAL_DATA_DIR}`);
  }
}

function startSurrealDB() {
  log.step("🗄️  Starting SurrealDB (persistent RocksDB)...");

  // Check if SurrealDB is already running on port 8000
  try {
    const isWindows = process.platform === "win32";
    if (!isWindows) {
      const result = execSync("lsof -i :8000 2>/dev/null || true", {
        encoding: "utf8",
      });
      if (result.includes("LISTEN")) {
        log.success("SurrealDB is already running on port 8000 (data is persistent)");
        return;
      }
    }
  } catch (error) {
    // Continue to start SurrealDB
  }

  // Try to start via systemd user service (preferred - survives reboots)
  try {
    execSync("systemctl --user is-enabled surrealdb.service 2>/dev/null", { stdio: "pipe" });
    // Service is registered, start it
    execSync("systemctl --user start surrealdb.service", { stdio: "pipe" });
    log.success("SurrealDB started via systemd (auto-start on login enabled)");
    return new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    // Systemd service not available, fall back to direct spawn
    log.info("Systemd service not available, starting directly...");
  }

  // Check if surreal command exists
  let surrealBin = "surreal";
  const homeSurreal = path.join(os.homedir(), ".surrealdb", "surreal");
  if (fs.existsSync(homeSurreal)) {
    surrealBin = homeSurreal;
  } else {
    try {
      execSync("surreal version", { stdio: "pipe" });
    } catch (error) {
      log.error("SurrealDB is not installed!");
      log.info("Install with: curl -sSf https://install.surrealdb.com | sh");
      process.exit(1);
    }
  }

  // Ensure the data directory exists before starting
  ensureDataDir();

  // Start SurrealDB with RocksDB (persistent storage) - NOT memory!
  log.info(`Starting SurrealDB with persistent storage at: ${SURREAL_DB_PATH}`);
  const isWindows = process.platform === "win32";
  const args = [
    "start",
    "--log",
    "info",
    "--user",
    "root",
    "--pass",
    "root",
    `rocksdb:${SURREAL_DB_PATH}`,
  ];

  surrealProcess = spawn(surrealBin, args, {
    stdio: ["ignore", "pipe", "pipe"],
    detached: !isWindows,
    shell: isWindows,
  });

  // Wait for SurrealDB to be ready
  return new Promise((resolve) => {
    let output = "";
    const timeout = setTimeout(() => {
      log.warning("SurrealDB startup timeout, but continuing...");
      resolve();
    }, 8000);

    surrealProcess.stdout.on("data", (data) => {
      output += data.toString();
      if (output.includes("Started web server")) {
        clearTimeout(timeout);
        log.success("SurrealDB is ready on http://127.0.0.1:8000 (RocksDB persistent)");
        resolve();
      }
    });

    surrealProcess.stderr.on("data", (data) => {
      // SurrealDB logs to stderr, check for success message
      output += data.toString();
      if (output.includes("Started web server")) {
        clearTimeout(timeout);
        log.success("SurrealDB is ready on http://127.0.0.1:8000 (RocksDB persistent)");
        resolve();
      }
    });

    surrealProcess.on("error", (error) => {
      clearTimeout(timeout);
      log.error("Failed to start SurrealDB");
      console.error(error);
      process.exit(1);
    });

    surrealProcess.on("close", (code) => {
      if (code !== 0 && code !== null) {
        log.error(`SurrealDB exited with code ${code}`);
      }
    });
  });
}

function startDevServer() {
  log.step("🚀 Starting Development Server...");

  console.log("");
  log.info("Server will be available at: http://localhost:3000");
  log.info("Press Ctrl+C to stop the server");
  console.log("");

  const isWindows = process.platform === "win32";
  const command = isWindows ? "npm.cmd" : "npm";

  const devServer = spawn(command, ["run", "dev"], {
    stdio: "inherit",
    shell: isWindows, // Only use shell on Windows
  });

  devServer.on("error", (error) => {
    log.error("Failed to start development server");
    console.error(error);
    cleanup();
    process.exit(1);
  });

  devServer.on("close", (code) => {
    if (code !== 0) {
      log.error(`Development server exited with code ${code}`);
      cleanup();
      process.exit(code);
    }
  });

  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    console.log("");
    log.info("Stopping servers...");
    devServer.kill("SIGINT");
    cleanup();
    process.exit(0);
  });

  // Handle other termination signals
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}

function cleanup() {
  if (surrealProcess) {
    log.info("Stopping SurrealDB...");
    try {
      if (process.platform === "win32") {
        surrealProcess.kill();
      } else {
        // Kill the entire process group on Unix
        process.kill(-surrealProcess.pid);
      }
    } catch (error) {
      // Process might already be dead
    }
  }
}

async function main() {
  console.log("");
  console.log(
    colors.bright +
      colors.cyan +
      "╔════════════════════════════════════════╗" +
      colors.reset
  );
  console.log(
    colors.bright +
      colors.cyan +
      "║   DevFocus Dashboard - Dev Server     ║" +
      colors.reset
  );
  console.log(
    colors.bright +
      colors.cyan +
      "╚════════════════════════════════════════╝" +
      colors.reset
  );
  console.log("");

  cleanupPorts();
  checkSetup();
  await startSurrealDB();
  startDevServer();
}

main();
