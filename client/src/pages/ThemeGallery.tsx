import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Check, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { getSupporterBadges, getSupporterTapTotal, getActiveTheme, getAllBadges, type SupporterBadge, type BadgeDefinition, type ThemeUnlock } from "@/lib/api";

const THEME_STYLES: Record<string, { 
  gradient: string; 
  accent: string; 
  cardBg: string;
  textColor: string;
  borderColor: string;
  bgImage?: string;
}> = {
  bronze: {
    gradient: "from-amber-700 via-orange-600 to-yellow-700",
    accent: "#cd7f32",
    cardBg: "bg-gradient-to-br from-amber-900/40 to-orange-800/30",
    textColor: "text-amber-200",
    borderColor: "border-amber-500/50",
    bgImage: "/themes/bronze-bg.png",
  },
  silver: {
    gradient: "from-slate-400 via-gray-300 to-slate-500",
    accent: "#c0c0c0",
    cardBg: "bg-gradient-to-br from-slate-700/40 to-gray-600/30",
    textColor: "text-slate-200",
    borderColor: "border-slate-400/50",
  },
  gold: {
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    accent: "#ffd700",
    cardBg: "bg-gradient-to-br from-yellow-900/40 to-amber-800/30",
    textColor: "text-yellow-200",
    borderColor: "border-yellow-500/50",
  },
  legend: {
    gradient: "from-purple-600 via-violet-500 to-fuchsia-600",
    accent: "#9333ea",
    cardBg: "bg-gradient-to-br from-purple-900/40 to-violet-800/30",
    textColor: "text-purple-200",
    borderColor: "border-purple-500/50",
  },
};

export default function ThemeGallery() {
  const [, setLocation] = useLocation();
  const { user, currentTeam } = useUser();
  const queryClient = useQueryClient();
  const teamId = currentTeam?.id;
  const season = "2024-2025";

  const { data: badges = [] } = useQuery<BadgeDefinition[]>({
    queryKey: ["/api/badges"],
    queryFn: getAllBadges,
  });

  const { data: earnedBadges = [] } = useQuery<SupporterBadge[]>({
    queryKey: ["supporter-badges", user?.id, teamId, season],
    queryFn: () => getSupporterBadges(user!.id, teamId!, season),
    enabled: !!user?.id && !!teamId,
  });

  const { data: tapData } = useQuery<{ totalTaps: number }>({
    queryKey: ["supporter-taps", user?.id, teamId, season],
    queryFn: () => getSupporterTapTotal(user!.id, teamId!, season),
    enabled: !!user?.id && !!teamId,
  });

  const { data: activeTheme } = useQuery<{ themeId: string } | null>({
    queryKey: ["supporter-theme", user?.id],
    queryFn: () => getActiveTheme(user!.id),
    enabled: !!user?.id,
  });

  const applyThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const res = await fetch(`/api/supporters/${user?.id}/themes/${themeId}/activate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to apply theme");
      return res.json();
    },
    onSuccess: (_, themeId) => {
      queryClient.invalidateQueries({ queryKey: ["supporter-theme", user?.id] });
      toast.success(`${themeId.charAt(0).toUpperCase() + themeId.slice(1)} theme applied!`);
    },
    onError: () => {
      toast.error("Failed to apply theme");
    },
  });

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId));
  const totalTaps = tapData?.totalTaps || 0;
  const currentThemeId = activeTheme?.themeId;

  const sortedBadges = [...badges].sort((a, b) => a.tier - b.tier);

  const getNextBadge = () => {
    for (const badge of sortedBadges) {
      if (!earnedBadgeIds.has(badge.id)) {
        return badge;
      }
    }
    return null;
  };

  const nextBadge = getNextBadge();
  const progressPercent = nextBadge 
    ? Math.min(100, (totalTaps / nextBadge.tapThreshold) * 100)
    : 100;

  const isThemeUnlocked = (themeId: string) => {
    const badge = badges.find(b => b.themeId === themeId);
    return badge ? earnedBadgeIds.has(badge.id) : false;
  };

  return (
    <>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-display font-bold uppercase tracking-wide">
              Theme Gallery
            </h1>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-5 w-5 text-orange-500" />
                <h2 className="font-semibold">Your Progress</h2>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Taps</span>
                <span className="font-bold text-lg">{totalTaps.toLocaleString()}</span>
              </div>
              {nextBadge ? (
                <>
                  <Progress value={progressPercent} className="h-3 mb-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {nextBadge.tapThreshold - totalTaps} taps to {nextBadge.name}
                    </span>
                    <span className="text-lg">{nextBadge.iconEmoji}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">All badges earned!</span>
                </div>
              )}
            </CardContent>
          </Card>

          <h2 className="text-lg font-semibold mb-4">Available Themes</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedBadges.map((badge) => {
              const styles = THEME_STYLES[badge.themeId] || THEME_STYLES.bronze;
              const unlocked = isThemeUnlocked(badge.themeId);
              const isActive = currentThemeId === badge.themeId;

              return (
                <Card 
                  key={badge.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    unlocked 
                      ? `${styles.borderColor} border-2 hover:scale-[1.02]` 
                      : "border-white/10 opacity-60"
                  } ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  data-testid={`theme-card-${badge.themeId}`}
                >
                  <div 
                    className={`h-24 relative ${!styles.bgImage ? `bg-gradient-to-r ${styles.gradient}` : ''}`}
                    style={styles.bgImage ? {
                      backgroundImage: `url(${styles.bgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    } : undefined}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl drop-shadow-lg">{badge.iconEmoji}</span>
                    </div>
                    {!unlocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-white/60" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">Active</Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className={`p-4 ${styles.cardBg}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">
                          {badge.tapThreshold.toLocaleString()} taps
                        </span>
                      </div>
                      
                      {unlocked ? (
                        <Button
                          size="sm"
                          variant={isActive ? "outline" : "default"}
                          onClick={() => applyThemeMutation.mutate(badge.themeId)}
                          disabled={isActive || applyThemeMutation.isPending}
                          data-testid={`apply-theme-${badge.themeId}`}
                        >
                          {isActive ? "Applied" : "Apply Theme"}
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {badges.length === 0 && (
            <Card className="bg-card/80 backdrop-blur-sm border-white/10">
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No themes available yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start tapping during games to earn badges and unlock themes!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
