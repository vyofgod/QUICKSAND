/**
 * Offline sync manager with conflict resolution
 */
import { syncQueue, metadata } from "./db";
import { type Task } from "@/lib/db-schema";

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30000;

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

export class SyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  start() {
    if (this.syncInterval) return;
    this.sync();
    this.syncInterval = setInterval(() => {
      if (isOnline() && !this.isSyncing) this.sync();
    }, SYNC_INTERVAL);
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.sync());
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<{ success: boolean; synced: number; errors: number }> {
    if (this.isSyncing || !isOnline()) return { success: false, synced: 0, errors: 0 };

    this.isSyncing = true;
    let synced = 0;
    let errors = 0;

    try {
      const queue = await syncQueue.getAll();
      for (const item of queue) {
        try {
          if (item.retries >= MAX_RETRIES) {
            await syncQueue.remove(item.id);
            errors++;
            continue;
          }
          if (item.type === "task") {
            await this.syncTask(item.action, item.data as Task);
          }
          await syncQueue.remove(item.id);
          synced++;
        } catch {
          await syncQueue.incrementRetry(item.id);
          errors++;
        }
      }
      await metadata.set("lastSyncTime", Date.now());
      return { success: true, synced, errors };
    } catch {
      return { success: false, synced, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncTask(
    action: "create" | "update" | "delete",
    task: Task
  ): Promise<void> {
    console.log(`Syncing task ${action}:`, task.id);
  }

  async resolveConflict(
    localData: Task,
    serverData: Task,
    strategy: "local" | "server" | "merge" = "server"
  ): Promise<Task> {
    switch (strategy) {
      case "local":
        return localData;
      case "server":
        return serverData;
      case "merge":
        return localData.updatedAt > serverData.updatedAt ? localData : serverData;
      default:
        return serverData;
    }
  }

  async getStatus(): Promise<{
    isOnline: boolean;
    lastSyncTime: number | null;
    pendingItems: number;
  }> {
    const queue = await syncQueue.getAll();
    const lastSyncTime = await metadata.get<number>("lastSyncTime");
    return {
      isOnline: isOnline(),
      lastSyncTime: lastSyncTime ?? null,
      pendingItems: queue.length,
    };
  }
}

export const syncManager = new SyncManager();
