import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "./userContext";
import { getEntitlements, type Entitlements, type Subscription } from "./api";

export type EntitlementKey = keyof Entitlements;

interface EntitlementsContextType {
  entitlements: Entitlements;
  tier: string;
  subscription: Subscription | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const defaultEntitlements: Entitlements = {
  canUseStatTracker: false,
  canEditPlayMaker: false,
  canUploadHighlights: false,
  canViewIndividualStats: false,
  canViewHighlights: true,
  canViewRoster: true,
  canViewPlaybook: true,
  canUseChat: true,
  canUseGameDayLive: true,
  canEditEvents: false,
  canEditRoster: false,
  canPromoteMembers: false,
  canFollowCrossTeam: false,
  canTrackOwnStats: false,
};

const EntitlementsContext = createContext<EntitlementsContextType | undefined>(undefined);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [entitlements, setEntitlements] = useState<Entitlements>(defaultEntitlements);
  const [tier, setTier] = useState<string>("free");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEntitlements = async () => {
    if (!user?.id) {
      setEntitlements(defaultEntitlements);
      setTier("free");
      setSubscription(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getEntitlements(user.id);
      setEntitlements(result.entitlements);
      setTier(result.tier);
      setSubscription(result.subscription);
    } catch (error) {
      console.error("Failed to fetch entitlements:", error);
      setEntitlements(defaultEntitlements);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitlements();
  }, [user?.id]);

  return (
    <EntitlementsContext.Provider value={{ 
      entitlements, 
      tier, 
      subscription, 
      isLoading, 
      refetch: fetchEntitlements 
    }}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementsContext);
  if (context === undefined) {
    throw new Error("useEntitlements must be used within an EntitlementsProvider");
  }
  return context;
}
