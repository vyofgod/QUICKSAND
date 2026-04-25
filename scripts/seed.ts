/**
 * Database seeding script for SurrealDB
 * Run with: npx tsx scripts/seed.ts
 */
import Surreal from "surrealdb.js";
import {
  TaskStatus,
  TaskPriority,
  FocusSessionType,
  ActivitySource,
  ActivityType,
  SyncStatus,
  type Task,
  type FocusSession,
  type ActivityLog
} from "../src/lib/db-schema.js";

const SURREALDB_URL = process.env.SURREALDB_URL || "http://localhost:8000";
const SURREALDB_NAMESPACE = process.env.SURREALDB_NAMESPACE || "devfocus";
const SURREALDB_DATABASE = process.env.SURREALDB_DATABASE || "main";
const SURREALDB_USER = process.env.SURREALDB_USER || "root";
const SURREALDB_PASSWORD = process.env.SURREALDB_PASSWORD || "root";

async function main() {
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

    console.log("✅ Connected to SurrealDB");
    console.log("");

    // Get the first user (you need to sign in first)
    const users = await db.query<[Array<{ id: string }>>]("SELECT * FROM user LIMIT 1");
    const user = users[0]?.[0];

    if (!user) {
      console.log("⚠️  No users found in database.");
      console.log("   Please sign in to the app first, then run this script again.");
      process.exit(0);
    }

    const userId = user.id;
    console.log(`👤 Using user: ${userId}`);
    console.log("");

    // Seed tasks
    console.log("📝 Creating sample tasks...");
    const tasks = [
      {
        userId,
        title: "Set up development environment",
        description: "Install Node.js, SurrealDB, and configure environment variables",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        labels: ["setup", "backend"],
        position: 0,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        title: "Design database schema",
        description: "Create SurrealDB schema for tasks, users, and activities",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        labels: ["design", "database"],
        position: 1,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        title: "Implement authentication",
        description: "Set up NextAuth with GitHub and GitLab providers",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        labels: ["auth", "security"],
        position: 2,
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId,
        title: "Build task board UI",
        description: "Create drag-and-drop task board with columns",
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        labels: ["frontend", "ui"],
        position: 3,
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        userId,
        title: "Add Pomodoro timer",
        description: "Implement focus timer with work/break sessions",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        labels: ["feature", "productivity"],
        position: 4,
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId,
        title: "Integrate GitHub API",
        description: "Sync repositories and commits from GitHub",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        labels: ["integration", "github"],
        position: 5,
        syncStatus: SyncStatus.SYNCED,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const task of tasks) {
      await db.create("task", task);
    }
    console.log(`✅ Created ${tasks.length} sample tasks`);

    // Seed focus sessions
    console.log("⏱️  Creating sample focus sessions...");
    const sessions = [
      {
        userId,
        type: FocusSessionType.WORK,
        duration: 25 * 60, // 25 minutes
        completed: true,
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        endedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        syncStatus: SyncStatus.SYNCED,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        userId,
        type: FocusSessionType.SHORT_BREAK,
        duration: 5 * 60, // 5 minutes
        completed: true,
        startedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 2.4 * 60 * 60 * 1000),
        syncStatus: SyncStatus.SYNCED,
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2.4 * 60 * 60 * 1000),
      },
      {
        userId,
        type: FocusSessionType.WORK,
        duration: 25 * 60,
        completed: true,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        syncStatus: SyncStatus.SYNCED,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      },
    ];

    for (const session of sessions) {
      await db.create("focusSession", session);
    }
    console.log(`✅ Created ${sessions.length} sample focus sessions`);

    // Seed activity logs
    console.log("📊 Creating sample activity logs...");
    const activities = [
      {
        userId,
        source: ActivitySource.LOCAL,
        type: ActivityType.TASK_COMPLETED,
        title: "Completed: Set up development environment",
        description: "Task marked as done",
        occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        source: ActivitySource.LOCAL,
        type: ActivityType.FOCUS_SESSION,
        title: "Completed 25-minute focus session",
        description: "Work session completed successfully",
        occurredAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        userId,
        source: ActivitySource.LOCAL,
        type: ActivityType.TASK_COMPLETED,
        title: "Completed: Design database schema",
        description: "Task marked as done",
        occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const activity of activities) {
      await db.create("activityLog", activity);
    }
    console.log(`✅ Created ${activities.length} sample activity logs`);

    console.log("");
    console.log("🎉 Database seeding completed successfully!");

    await db.close();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
