import { Surreal } from "surrealdb";
import { env } from "@/env";

/**
 * SurrealDB client singleton
 * Prevents multiple instances in development due to hot reloading
 */
const globalForSurreal = globalThis as unknown as {
  surreal: Surreal | undefined;
};

let surrealInstance: Surreal | undefined = globalForSurreal.surreal;

async function initSurreal() {
  if (surrealInstance) {
    return surrealInstance;
  }

  const surreal = new Surreal();

  try {
    // Connect to SurrealDB
    await surreal.connect(env.SURREALDB_URL, {
      namespace: env.SURREALDB_NAMESPACE,
      database: env.SURREALDB_DATABASE,
    });

    // Authenticate
    await surreal.signin({
      username: env.SURREALDB_USER,
      password: env.SURREALDB_PASSWORD,
    });

    // Use namespace and database
    await surreal.use({
      namespace: env.SURREALDB_NAMESPACE,
      database: env.SURREALDB_DATABASE,
    });

    surrealInstance = surreal;
    if (env.NODE_ENV !== "production") {
      globalForSurreal.surreal = surreal;
    }

    console.log("✅ SurrealDB connected successfully");
    return surreal;
  } catch (error) {
    console.error("❌ SurrealDB connection error:", error);
    throw error;
  }
}

// Initialize database connection
export const db = await initSurreal();

// Helper types for SurrealDB
export type RecordId<T extends string = string> = `${T}:${string}`;

// Helper functions
export const helpers = {
  /**
   * Generate a record ID
   */
  recordId: <T extends string>(table: T, id: string): RecordId<T> => {
    if (id.startsWith(`${table}:`)) {
      return id as RecordId<T>;
    }
    return `${table}:${id}` as RecordId<T>;
  },

  /**
   * Extract ID from record ID
   */
  extractId: (recordId: string | RecordId | any): string => {
    // Handle case where recordId might not be a string
    if (!recordId) {
      return String(recordId);
    }

    // Convert to string first (handles SurrealDB RecordId objects)
    const str = String(recordId);

    // If it contains a colon, split and get the ID part
    if (str.includes(":")) {
      const parts = str.split(":");
      // Return everything after the first colon
      return parts.slice(1).join(":");
    }

    return str;
  },

  /**
   * Extract table from record ID
   */
  extractTable: (recordId: string): string => {
    return recordId.split(":")[0] ?? "";
  },
};
