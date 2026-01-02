import { useState, useEffect, useCallback } from 'react';
import { 
  initDB, 
  queueAction, 
  getPendingCount, 
  getAggregatedTaps,
  isOnline as checkOnline,
  onConnectivityChange,
  type ActionType 
} from './offlineQueue';
import { 
  subscribeSyncStatus, 
  syncPendingActions,
  startAutoSync,
  type SyncStatus 
} from './offlineSync';

export function useConnectivity() {
  const [online, setOnline] = useState(checkOnline());

  useEffect(() => {
    const unsubscribe = onConnectivityChange(setOnline);
    return unsubscribe;
  }, []);

  return online;
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    error: null,
  });

  useEffect(() => {
    initDB().catch(console.error);
    
    const unsubscribe = subscribeSyncStatus(setStatus);
    const stopAutoSync = startAutoSync(15000);

    return () => {
      unsubscribe();
      stopAutoSync();
    };
  }, []);

  const triggerSync = useCallback(async () => {
    return syncPendingActions();
  }, []);

  return { ...status, triggerSync };
}

export function useOfflineQueue(options: {
  teamId: string;
  userId: string;
  sessionId?: string;
  gameId?: string;
}) {
  const { teamId, userId, sessionId, gameId } = options;
  const online = useConnectivity();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingTaps, setPendingTaps] = useState(0);

  const refreshCounts = useCallback(async () => {
    const count = await getPendingCount(teamId);
    setPendingCount(count);
    
    if (sessionId) {
      const taps = await getAggregatedTaps(sessionId);
      setPendingTaps(taps);
    }
  }, [teamId, sessionId]);

  useEffect(() => {
    initDB().then(() => refreshCounts());
  }, [refreshCounts]);

  useEffect(() => {
    const interval = setInterval(refreshCounts, 5000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  const queueTap = useCallback(async (tapCount: number) => {
    await queueAction('tap', { tapCount }, {
      sessionId,
      teamId,
      userId,
    });
    await refreshCounts();
  }, [sessionId, teamId, userId, refreshCounts]);

  const queueShoutout = useCallback(async (athleteId: string, message: string) => {
    await queueAction('shoutout', { athleteId, message }, {
      sessionId,
      teamId,
      userId,
    });
    await refreshCounts();
  }, [sessionId, teamId, userId, refreshCounts]);

  const queueLineupChange = useCallback(async (rosterId: string, athleteId: string, isInGame: boolean) => {
    await queueAction('lineup_change', { rosterId, athleteId, isInGame }, {
      gameId,
      teamId,
      userId,
    });
    await refreshCounts();
  }, [gameId, teamId, userId, refreshCounts]);

  const queueStatEntry = useCallback(async (statData: Record<string, any>) => {
    await queueAction('stat_entry', statData, {
      gameId,
      teamId,
      userId,
    });
    await refreshCounts();
  }, [gameId, teamId, userId, refreshCounts]);

  return {
    online,
    pendingCount,
    pendingTaps,
    queueTap,
    queueShoutout,
    queueLineupChange,
    queueStatEntry,
    refreshCounts,
  };
}
