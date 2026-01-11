import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cacheData, getCachedData, isNative } from "@/lib/capacitor";

interface UseOfflineCacheOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  cacheKey: string;
  ttl?: number;
  enabled?: boolean;
}

export function useOfflineCache<T>(options: UseOfflineCacheOptions<T>) {
  const { queryKey, queryFn, cacheKey, ttl, enabled = true } = options;
  const queryClient = useQueryClient();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!enabled || initialLoadDone.current || !isNative) return;

    const loadCached = async () => {
      try {
        const cached = await getCachedData<T>(cacheKey);
        if (cached !== null) {
          queryClient.setQueryData(queryKey, cached);
        }
      } catch (error) {
        console.error("Failed to load cached data:", error);
      } finally {
        initialLoadDone.current = true;
      }
    };

    loadCached();
  }, [queryKey, cacheKey, queryClient, enabled]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      if (isNative) {
        try {
          await cacheData(cacheKey, data, ttl);
        } catch (error) {
          console.error("Failed to cache data:", error);
        }
      }
      return data;
    },
    enabled,
  });

  return query;
}

interface CacheEntry<T> {
  key: string;
  data: T;
  ttl?: number;
}

export async function prefetchAndCache<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string[],
  queryFn: () => Promise<T>,
  cacheKey: string,
  ttl?: number
): Promise<T> {
  const data = await queryFn();
  queryClient.setQueryData(queryKey, data);
  await cacheData(cacheKey, data, ttl);
  return data;
}

export async function loadFromCacheOrFetch<T>(
  queryFn: () => Promise<T>,
  cacheKey: string,
  ttl?: number
): Promise<T> {
  const cached = await getCachedData<T>(cacheKey);
  if (cached) return cached;

  const data = await queryFn();
  await cacheData(cacheKey, data, ttl);
  return data;
}
