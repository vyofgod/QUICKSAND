/**
 * React hook for offline status and sync management
 */
"use client";

import { useState, useEffect } from "react";
import { syncManager, isOnline } from "@/lib/offline/sync";

export function useOffline() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    lastSyncTime: number | null;
    pendingItems: number;
  }>({
    lastSyncTime: null,
    pendingItems: 0,
  });

  useEffect(() => {
    // Initialize online status
    setOnline(isOnline());

    // Set up event listeners
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Start sync manager
    syncManager.start();

    // Update sync status periodically
    const updateStatus = async () => {
      const status = await syncManager.getStatus();
      setSyncStatus({
        lastSyncTime: status.lastSyncTime,
        pendingItems: status.pendingItems,
      });
    };

    updateStatus();
    const statusInterval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      syncManager.stop();
      clearInterval(statusInterval);
    };
  }, []);

  const manualSync = async () => {
    setSyncing(true);
    try {
      const result = await syncManager.sync();
      const status = await syncManager.getStatus();
      setSyncStatus({
        lastSyncTime: status.lastSyncTime,
        pendingItems: status.pendingItems,
      });
      return result;
    } finally {
      setSyncing(false);
    }
  };

  return {
    online,
    syncing,
    lastSyncTime: syncStatus.lastSyncTime,
    pendingItems: syncStatus.pendingItems,
    manualSync,
  };
}
