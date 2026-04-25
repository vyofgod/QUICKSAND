/**
 * IndexedDB wrapper for offline storage
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { type Task } from "@/lib/db-schema";

/**
 * IndexedDB schema
 */
interface DevFocusDB extends DBSchema {
  tasks: {
    key: string;
    value: Task & { pendingSync?: boolean };
    indexes: { "by-status": string; "by-sync": string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: "task";
      action: "create" | "update" | "delete";
      data: unknown;
      timestamp: number;
      retries: number;
    };
    indexes: { "by-timestamp": number };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: number;
    };
  };
}

const DB_NAME = "devfocus-offline";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<DevFocusDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<DevFocusDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DevFocusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tasks")) {
        const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
        taskStore.createIndex("by-status", "status");
        taskStore.createIndex("by-sync", "syncStatus");
      }

      if (!db.objectStoreNames.contains("syncQueue")) {
        const queueStore = db.createObjectStore("syncQueue", { keyPath: "id" });
        queueStore.createIndex("by-timestamp", "timestamp");
      }

      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    },
  });

  return dbInstance;
}

export const offlineTaskDB = {
  async getAll(): Promise<Task[]> {
    const db = await initDB();
    return db.getAll("tasks");
  },

  async getById(id: string): Promise<Task | undefined> {
    const db = await initDB();
    return db.get("tasks", id);
  },

  async save(task: Task): Promise<void> {
    const db = await initDB();
    await db.put("tasks", { ...task, pendingSync: false });
  },

  async saveMany(tasks: Task[]): Promise<void> {
    const db = await initDB();
    const tx = db.transaction("tasks", "readwrite");
    await Promise.all([
      ...tasks.map((task) => tx.store.put({ ...task, pendingSync: false })),
      tx.done,
    ]);
  },

  async delete(id: string): Promise<void> {
    const db = await initDB();
    await db.delete("tasks", id);
  },

  async getPending(): Promise<Task[]> {
    const db = await initDB();
    return db.getAllFromIndex("tasks", "by-sync", "PENDING");
  },
};

export const syncQueue = {
  async add(
    type: "task",
    action: "create" | "update" | "delete",
    data: unknown
  ): Promise<void> {
    const db = await initDB();
    const id = `${type}-${action}-${Date.now()}-${Math.random()}`;
    await db.add("syncQueue", { id, type, action, data, timestamp: Date.now(), retries: 0 });
  },

  async getAll() {
    const db = await initDB();
    return db.getAllFromIndex("syncQueue", "by-timestamp");
  },

  async remove(id: string): Promise<void> {
    const db = await initDB();
    await db.delete("syncQueue", id);
  },

  async incrementRetry(id: string): Promise<void> {
    const db = await initDB();
    const item = await db.get("syncQueue", id);
    if (item) {
      item.retries += 1;
      await db.put("syncQueue", item);
    }
  },

  async clear(): Promise<void> {
    const db = await initDB();
    await db.clear("syncQueue");
  },
};

export const metadata = {
  async get<T>(key: string): Promise<T | undefined> {
    const db = await initDB();
    const item = await db.get("metadata", key);
    return item?.value as T | undefined;
  },

  async set(key: string, value: unknown): Promise<void> {
    const db = await initDB();
    await db.put("metadata", { key, value, updatedAt: Date.now() });
  },

  async delete(key: string): Promise<void> {
    const db = await initDB();
    await db.delete("metadata", key);
  },
};
