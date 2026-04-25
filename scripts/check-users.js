#!/usr/bin/env node

/**
 * Check users in SurrealDB
 */

import Surreal from "surrealdb.js";

const SURREALDB_URL = process.env.SURREALDB_URL || "http://localhost:8000";
const SURREALDB_NAMESPACE = process.env.SURREALDB_NAMESPACE || "devfocus";
const SURREALDB_DATABASE = process.env.SURREALDB_DATABASE || "main";
const SURREALDB_USER = process.env.SURREALDB_USER || "root";
const SURREALDB_PASSWORD = process.env.SURREALDB_PASSWORD || "root";

async function checkUsers() {
  const db = new Surreal();

  try {
    console.log("🔌 Connecting to SurrealDB...");
    await db.connect(SURREALDB_URL, {
      namespace: SURREALDB_NAMESPACE,
      database: SURREALDB_DATABASE,
    });

    await db.signin({
      username: SURREALDB_USER,
      password: SURREALDB_PASSWORD,
    });

    await db.use({
      namespace: SURREALDB_NAMESPACE,
      database: SURREALDB_DATABASE,
    });

    console.log("✅ Connected to SurrealDB\n");

    // Check users
    console.log("👥 Users:");
    const users = await db.query("SELECT * FROM user");
    console.log(JSON.stringify(users, null, 2));

    console.log("\n🔗 Accounts:");
    const accounts = await db.query("SELECT * FROM account");
    console.log(JSON.stringify(accounts, null, 2));

    console.log("\n📅 Sessions:");
    const sessions = await db.query("SELECT * FROM session");
    console.log(JSON.stringify(sessions, null, 2));

    await db.close();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkUsers();
