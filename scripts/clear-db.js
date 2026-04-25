#!/usr/bin/env node

/**
 * Clear SurrealDB database
 * This script removes all user, account, and session data
 */

import Surreal from "surrealdb.js";

const SURREALDB_URL = process.env.SURREALDB_URL || "http://localhost:8000";
const SURREALDB_NAMESPACE = process.env.SURREALDB_NAMESPACE || "devfocus";
const SURREALDB_DATABASE = process.env.SURREALDB_DATABASE || "main";
const SURREALDB_USER = process.env.SURREALDB_USER || "root";
const SURREALDB_PASSWORD = process.env.SURREALDB_PASSWORD || "root";

async function clearDatabase() {
  const db = new Surreal();

  try {
    console.log("🔌 Connecting to SurrealDB...");
    await db.connect(SURREALDB_URL, {
      namespace: SURREALDB_NAMESPACE,
      database: SURREALDB_DATABASE,
    });

    console.log("🔐 Authenticating...");
    await db.signin({
      username: SURREALDB_USER,
      password: SURREALDB_PASSWORD,
    });

    await db.use({
      namespace: SURREALDB_NAMESPACE,
      database: SURREALDB_DATABASE,
    });

    console.log("✅ Connected to SurrealDB");
    console.log("");

    // Delete all auth-related data
    console.log("🗑️  Deleting sessions...");
    await db.query("DELETE session;");

    console.log("🗑️  Deleting accounts...");
    await db.query("DELETE account;");

    console.log("🗑️  Deleting users...");
    await db.query("DELETE user;");

    console.log("🗑️  Deleting verification tokens...");
    await db.query("DELETE verificationToken;");

    console.log("");
    console.log("✅ Database cleared successfully!");
    console.log("");
    console.log("You can now sign in again with GitHub.");

    await db.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing database:", error);
    process.exit(1);
  }
}

clearDatabase();
