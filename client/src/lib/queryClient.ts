import { QueryClient, QueryFunction, hashKey } from "@tanstack/react-query";

const CACHE_KEY = 'statfyr-query-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    try {
      const json = JSON.parse(text);
      if (json.error) {
        const errorMsg = typeof json.error === 'string' ? json.error : JSON.stringify(json.error);
        throw new Error(errorMsg);
      }
    } catch (parseError) {
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

interface CacheEntry {
  queryKey: readonly unknown[];
  data: unknown;
  timestamp: number;
}

function loadCachedQueries(): CacheEntry[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CacheEntry[] = JSON.parse(cached);
      const now = Date.now();
      return parsed.filter(entry => now - entry.timestamp < CACHE_TTL);
    }
  } catch (e) {
    console.warn('[QueryCache] Failed to load cache:', e);
  }
  return [];
}

function saveCachedQueries(entries: CacheEntry[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('[QueryCache] Failed to save cache:', e);
  }
}

const PERSIST_QUERY_PATTERNS = [
  '/api/auth/user',
  '/api/teams',
  '/api/user/memberships',
];

function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const keyStr = queryKey.join('/');
  return PERSIST_QUERY_PATTERNS.some(pattern => keyStr.includes(pattern));
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const cachedEntries = loadCachedQueries();
for (const entry of cachedEntries) {
  queryClient.setQueryData(entry.queryKey, entry.data);
}

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'success') {
    const queryKey = event.query.queryKey;
    if (shouldPersistQuery(queryKey)) {
      const entries = loadCachedQueries();
      const keyHash = hashKey(queryKey);
      const existingIndex = entries.findIndex(e => hashKey(e.queryKey) === keyHash);
      
      const newEntry: CacheEntry = {
        queryKey: [...queryKey],
        data: event.query.state.data,
        timestamp: Date.now(),
      };
      
      if (existingIndex >= 0) {
        entries[existingIndex] = newEntry;
      } else {
        entries.push(newEntry);
      }
      
      saveCachedQueries(entries);
    }
  }
});
