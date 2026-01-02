const DB_NAME = 'statfyr-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pendingActions';

export type ActionType = 'tap' | 'shoutout' | 'lineup_change' | 'stat_entry';
export type ActionStatus = 'pending' | 'syncing' | 'failed' | 'conflict';

export interface PendingAction {
  id: string;
  type: ActionType;
  payload: Record<string, any>;
  sessionId?: string;
  gameId?: string;
  teamId: string;
  userId: string;
  createdAt: number;
  retryCount: number;
  status: ActionStatus;
  errorMessage?: string;
}

let db: IDBDatabase | null = null;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('teamId', 'teamId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

export async function queueAction(
  type: ActionType,
  payload: Record<string, any>,
  options: {
    sessionId?: string;
    gameId?: string;
    teamId: string;
    userId: string;
  }
): Promise<PendingAction> {
  const database = await initDB();
  
  const action: PendingAction = {
    id: generateId(),
    type,
    payload,
    sessionId: options.sessionId,
    gameId: options.gameId,
    teamId: options.teamId,
    userId: options.userId,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(action);

    request.onsuccess = () => resolve(action);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingActions(filter?: {
  type?: ActionType;
  status?: ActionStatus;
  teamId?: string;
}): Promise<PendingAction[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let results = request.result as PendingAction[];
      
      if (filter?.type) {
        results = results.filter(a => a.type === filter.type);
      }
      if (filter?.status) {
        results = results.filter(a => a.status === filter.status);
      }
      if (filter?.teamId) {
        results = results.filter(a => a.teamId === filter.teamId);
      }
      
      results.sort((a, b) => a.createdAt - b.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingCount(teamId?: string): Promise<number> {
  const actions = await getPendingActions({ 
    status: 'pending',
    teamId 
  });
  return actions.length;
}

export async function updateActionStatus(
  id: string, 
  status: ActionStatus, 
  errorMessage?: string,
  incrementRetry: boolean = false
): Promise<number> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const action = getRequest.result as PendingAction;
      if (!action) {
        reject(new Error('Action not found'));
        return;
      }

      action.status = status;
      if (errorMessage) action.errorMessage = errorMessage;
      if (incrementRetry) action.retryCount += 1;

      const putRequest = store.put(action);
      putRequest.onsuccess = () => resolve(action.retryCount);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function removeAction(id: string): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearFailedActions(): Promise<void> {
  const database = await initDB();
  const actions = await getPendingActions();
  const failedIds = actions
    .filter(a => a.status === 'failed')
    .map(a => a.id);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let completed = 0;
    if (failedIds.length === 0) {
      resolve();
      return;
    }

    failedIds.forEach(id => {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === failedIds.length) resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

export async function getAggregatedTaps(sessionId: string): Promise<number> {
  const actions = await getPendingActions({ type: 'tap', status: 'pending' });
  return actions
    .filter(a => a.sessionId === sessionId)
    .reduce((sum, a) => sum + (a.payload.tapCount || 0), 0);
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
