"use client";

import { useOffline } from "@/hooks/use-offline";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { online, syncing, pendingItems, manualSync } = useOffline();

  const handleSync = async () => {
    const result = await manualSync();
    if (result.success) {
      toast.success(`Synced ${result.synced} items`);
    } else {
      toast.error("Sync failed");
    }
  };

  if (online && pendingItems === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wifi className="h-4 w-4 text-green-600" />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!online ? (
        <>
          <WifiOff className="h-4 w-4 text-orange-600" />
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Offline
          </span>
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw
              className={cn("h-4 w-4", syncing && "animate-spin")}
            />
            <span className="hidden sm:inline">
              {syncing ? "Syncing..." : `Sync (${pendingItems})`}
            </span>
          </Button>
        </>
      )}
    </div>
  );
}
