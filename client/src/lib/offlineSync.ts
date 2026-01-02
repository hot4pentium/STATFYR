import { 
  getPendingActions, 
  updateActionStatus, 
  removeAction, 
  isOnline,
  type PendingAction,
  type ActionType
} from './offlineQueue';
import { 
  sendSessionTaps, 
  sendSessionShoutout,
  updateGameRoster,
  recordGameStat
} from './api';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
let isSyncing = false;
let syncListeners: ((status: SyncStatus) => void)[] = [];

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  error: string | null;
}

let currentStatus: SyncStatus = {
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: null,
  error: null,
};

function notifyListeners() {
  syncListeners.forEach(listener => listener({ ...currentStatus }));
}

export function subscribeSyncStatus(callback: (status: SyncStatus) => void): () => void {
  syncListeners.push(callback);
  callback({ ...currentStatus });
  return () => {
    syncListeners = syncListeners.filter(l => l !== callback);
  };
}

async function processAction(action: PendingAction): Promise<boolean> {
  try {
    await updateActionStatus(action.id, 'syncing');

    switch (action.type) {
      case 'tap':
        if (action.sessionId) {
          await sendSessionTaps(
            action.sessionId,
            action.userId,
            action.payload.tapCount
          );
        }
        break;

      case 'shoutout':
        if (action.sessionId) {
          await sendSessionShoutout(
            action.sessionId,
            action.userId,
            action.payload.athleteId,
            action.payload.message
          );
        }
        break;

      case 'lineup_change':
        if (action.gameId && action.payload.rosterId) {
          await updateGameRoster(
            action.payload.rosterId,
            action.userId,
            { isInGame: action.payload.isInGame }
          );
        }
        break;

      case 'stat_entry':
        if (action.gameId) {
          await recordGameStat(action.gameId, action.userId, action.payload);
        }
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }

    await removeAction(action.id);
    return true;
  } catch (error: any) {
    console.error(`Failed to sync action ${action.id}:`, error);
    
    action.retryCount += 1;
    
    if (action.retryCount >= MAX_RETRIES) {
      await updateActionStatus(action.id, 'failed', error.message, true);
    } else {
      await updateActionStatus(action.id, 'pending', error.message, true);
    }
    
    return false;
  }
}

export async function syncPendingActions(): Promise<{ synced: number; failed: number }> {
  if (isSyncing || !isOnline()) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  currentStatus.isSyncing = true;
  currentStatus.error = null;
  notifyListeners();

  let synced = 0;
  let failed = 0;

  try {
    const actions = await getPendingActions({ status: 'pending' });
    currentStatus.pendingCount = actions.length;
    notifyListeners();

    for (const action of actions) {
      if (!isOnline()) break;
      
      const success = await processAction(action);
      if (success) {
        synced++;
      } else {
        failed++;
      }
      
      currentStatus.pendingCount = actions.length - synced - failed;
      notifyListeners();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    currentStatus.lastSyncAt = Date.now();
  } catch (error: any) {
    currentStatus.error = error.message;
  } finally {
    isSyncing = false;
    currentStatus.isSyncing = false;
    const remaining = await getPendingActions({ status: 'pending' });
    currentStatus.pendingCount = remaining.length;
    notifyListeners();
  }

  return { synced, failed };
}

export async function retryFailedActions(): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) return { synced: 0, failed: 0 };

  const failedActions = await getPendingActions({ status: 'failed' });
  
  for (const action of failedActions) {
    action.retryCount = 0;
    await updateActionStatus(action.id, 'pending');
  }

  return syncPendingActions();
}

export function startAutoSync(intervalMs = 10000): () => void {
  const intervalId = setInterval(async () => {
    if (isOnline()) {
      await syncPendingActions();
    }
  }, intervalMs);

  const handleOnline = () => {
    setTimeout(() => syncPendingActions(), 1000);
  };

  window.addEventListener('online', handleOnline);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('online', handleOnline);
  };
}

export async function getPendingActionCount(): Promise<number> {
  const actions = await getPendingActions({ status: 'pending' });
  return actions.length;
}
