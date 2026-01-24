import { useEntitlements, type EntitlementKey } from "@/lib/entitlementsContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Lock, Smartphone } from "lucide-react";
import { isNative } from "@/lib/capacitor";

interface FeatureGateProps {
  feature: EntitlementKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true,
  upgradeMessage
}: FeatureGateProps) {
  const { entitlements, tier, isLoading } = useEntitlements();
  const [, navigate] = useLocation();

  if (isLoading) {
    return null;
  }

  const hasAccess = entitlements[feature];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const featureDescriptions: Partial<Record<EntitlementKey, string>> = {
    canUseStatTracker: "Live game stat tracking",
    canEditPlayMaker: "Play design and editing",
    canUploadHighlights: "Team highlight uploads",
    canViewIndividualStats: "Individual player statistics",
    canViewHighlights: "Team video highlights",
    canViewRoster: "Team roster access",
    canViewPlaybook: "Team playbook access",
    canUseChat: "Team chat messaging",
    canUseGameDayLive: "Game Day Live engagement",
    canEditEvents: "Event management",
    canEditRoster: "Roster editing",
    canPromoteMembers: "Promote team members to staff",
    canFollowCrossTeam: "Follow athletes across teams",
    canTrackOwnStats: "Track your own stats during games",
    canEditExtendedProfile: "Extended athlete profile editing",
    maxManagedAthletes: "Managed athlete limit"
  };

  const tierRequired = feature === 'canUseStatTracker' || 
                       feature === 'canEditPlayMaker' || 
                       feature === 'canPromoteMembers' ||
                       feature === 'canEditEvents' ||
                       feature === 'canEditRoster'
                       ? 'Coach Pro' 
                       : 'Supporter Pro';

  return (
    <Card className="border-dashed border-2 border-muted" data-testid={`feature-locked-${feature}`}>
      <CardHeader className="text-center pb-2">
        {isNative ? (
          <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        ) : (
          <Smartphone className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        )}
        <CardTitle className="text-lg">Premium Feature</CardTitle>
        <CardDescription>
          {upgradeMessage || featureDescriptions[feature]}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {isNative ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to {tierRequired} to unlock this feature.
            </p>
            <Button 
              onClick={() => navigate("/subscription")}
              className="gap-2"
              data-testid="button-upgrade"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              To upgrade to {tierRequired}, open the STATFYR app on your phone and go to Settings.
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate("/subscription")}
              className="gap-2"
              data-testid="button-upgrade"
            >
              <Smartphone className="w-4 h-4" />
              Learn More
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface UpgradeButtonProps {
  feature?: EntitlementKey;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function UpgradeButton({ 
  feature, 
  variant = "default", 
  size = "default",
  className 
}: UpgradeButtonProps) {
  const { entitlements } = useEntitlements();
  const [, navigate] = useLocation();

  if (feature && entitlements[feature]) {
    return null;
  }

  return (
    <Button 
      variant={isNative ? variant : "outline"}
      size={size}
      onClick={() => navigate("/subscription")}
      className={className}
      data-testid="button-upgrade-inline"
    >
      {isNative ? (
        <>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade
        </>
      ) : (
        <>
          <Smartphone className="w-4 h-4 mr-2" />
          Upgrade in App
        </>
      )}
    </Button>
  );
}

export function useFeatureAccess(feature: EntitlementKey): boolean {
  const { entitlements, isLoading } = useEntitlements();
  
  if (isLoading) return false;
  const value = entitlements[feature];
  return typeof value === 'boolean' ? value : Boolean(value);
}
