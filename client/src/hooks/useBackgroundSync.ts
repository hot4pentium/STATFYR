import { useEffect, useRef, useCallback } from "react";
import { syncPendingStats, getPendingStats, isNative } from "@/lib/capacitor";

interface UseBackgroundSyncOptions {
  syncFn: (stats: Array<{
    id: string;
    athleteId: string;
    teamId: string;
    statName: string;
    statValue: number;
    timestamp: number;
    synced: boolean;
  }>) => Promise<string[]>;
  intervalMs?: number;
  enabled?: boolean;
}

export function useBackgroundSync(options: UseBackgroundSyncOptions) {
  const { syncFn, intervalMs = 30000, enabled = true } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncing = useRef(false);
  const abortRef = useRef(false);

  const performSync = useCallback(async () => {
    if (!isNative || isSyncing.current || abortRef.current) return;
    
    isSyncing.current = true;
    try {
      await syncPendingStats(syncFn);
    } catch (error) {
      console.error("Background sync error:", error);
    } finally {
      isSyncing.current = false;
    }
  }, [syncFn]);

  useEffect(() => {
    if (!enabled || !isNative) return;

    abortRef.current = false;
    performSync();

    intervalRef.current = setInterval(() => {
      if (!abortRef.current) {
        performSync();
      }
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !abortRef.current) {
        performSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleOnline = () => {
      if (!abortRef.current) {
        performSync();
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      abortRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, intervalMs, performSync]);

  return { performSync };
}

export async function hasPendingData(): Promise<boolean> {
  const pending = await getPendingStats();
  return pending.length > 0;
}
