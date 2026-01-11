import { useOfflineCache } from "./useOfflineCache";
import { getManagedAthletes, type ManagedAthlete } from "@/lib/api";

const CACHE_TTL = 1000 * 60 * 60 * 24;

export function useManagedAthletesCache(userId: string | undefined) {
  return useOfflineCache<ManagedAthlete[]>({
    queryKey: ["/api/users", userId || "", "managed-athletes"],
    queryFn: () => userId ? getManagedAthletes(userId) : Promise.resolve([]),
    cacheKey: `managed_athletes_${userId}`,
    ttl: CACHE_TTL,
    enabled: !!userId,
  });
}
