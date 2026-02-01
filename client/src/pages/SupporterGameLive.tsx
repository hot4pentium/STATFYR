import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useUser } from "@/lib/userContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Flame, Heart, Star, Zap, Trophy, ThumbsUp, Sparkles, Hand, WifiOff, Square, Users, QrCode } from "lucide-react";
import { GuestInviteQR } from "@/components/gameday";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  getGame,
  getGameByEvent,
  getEvent,
  getGameRoster,
  getTeamMembers,
  sendShoutout,
  sendTapBurst,
  getGameTapCount,
  getSupporterTapTotal,
  checkBadges,
  getEventLiveSession,
  sendSessionTaps,
  getSessionTapCount,
  endLiveSession,
  type Game, 
  type GameRoster,
  type BadgeDefinition,
  type Event,
  type LiveEngagementSession,
  type TeamMember
} from "@/lib/api";
import { enableKeepAwake, disableKeepAwake, getNetworkStatus, addNetworkListener } from "@/lib/capacitor";

const SHOUTOUT_OPTIONS = [
  { emoji: "🔥", label: "On Fire!", icon: Flame, color: "bg-orange-500" },
  { emoji: "💪", label: "Keep Going!", icon: Hand, color: "bg-blue-500" },
  { emoji: "⭐", label: "MVP!", icon: Star, color: "bg-yellow-500" },
  { emoji: "❤️", label: "Love It!", icon: Heart, color: "bg-pink-500" },
  { emoji: "⚡", label: "Electric!", icon: Zap, color: "bg-purple-500" },
  { emoji: "🏆", label: "Champion!", icon: Trophy, color: "bg-amber-500" },
];

export default function SupporterGameLive() {
  const [, params] = useRoute("/supporter/game/:gameId");
  const [, setLocation] = useLocation();
  const { user, currentTeam } = useUser();
  const queryClient = useQueryClient();
  
  const [localTapCount, setLocalTapCount] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [seasonTotal, setSeasonTotal] = useState(0);
  const [gameTapCount, setGameTapCount] = useState(0);
  const [selectedAthlete, setSelectedAthlete] = useState<GameRoster | null>(null);
  const [newBadge, setNewBadge] = useState<BadgeDefinition | null>(null);
  const [showHypeCheck, setShowHypeCheck] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [queryFailed, setQueryFailed] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showGuestInvite, setShowGuestInvite] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [recapData, setRecapData] = useState<{
    totalTaps: number;
    myTaps: number;
    duration: string;
  } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef<number>(0);
  const badgeCheckRef = useRef<NodeJS.Timeout | null>(null);
  const previousTapCountRef = useRef<number | null>(null);

  // Use Capacitor Network plugin for native apps, browser events for web
  useEffect(() => {
    getNetworkStatus().then(status => {
      setIsOnline(status.connected);
    });
    
    const removeListener = addNetworkListener((status) => {
      setIsOnline(status.connected);
    });
    
    return removeListener;
  }, []);

  const eventId = params?.gameId; // This is actually the event ID from the URL

  // Fetch the event first
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["/api/events", eventId],
    queryFn: () => eventId ? getEvent(eventId) : Promise.resolve(null),
    enabled: !!eventId,
    refetchInterval: 20000,
  });

  // Then try to get the game associated with this event
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["/api/events", eventId, "game"],
    queryFn: () => eventId ? getGameByEvent(eventId) : Promise.resolve(null),
    enabled: !!eventId,
    refetchInterval: 20000,
  });

  // Get the live session for this event
  const { data: liveSession } = useQuery({
    queryKey: ["/api/events", eventId, "live-session"],
    queryFn: () => eventId ? getEventLiveSession(eventId) : Promise.resolve(null),
    enabled: !!eventId,
    refetchInterval: 20000,
  });

  // Use game ID if we have one, otherwise use event ID for tap/roster APIs
  const gameId = game?.id;
  const sessionId = liveSession?.id;

  const { data: roster = [] } = useQuery({
    queryKey: ["/api/games", gameId, "roster"],
    queryFn: () => gameId ? getGameRoster(gameId) : Promise.resolve([]),
    enabled: !!gameId,
  });

  // Fallback: fetch team members when no game roster exists
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam?.id ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam?.id && !gameId,
  });

  // Use session-based tap count when we have a live session
  const { data: tapCountData, isError: tapQueryError, isSuccess: tapQuerySuccess } = useQuery({
    queryKey: ["/api/live-sessions", sessionId, "taps"],
    queryFn: () => sessionId ? getSessionTapCount(sessionId) : Promise.resolve({ count: 0 }),
    enabled: !!sessionId,
    refetchInterval: 20000,
    retry: 1,
  });

  // Track query failures for connectivity detection
  useEffect(() => {
    if (tapQueryError) {
      setQueryFailed(true);
    } else if (tapQuerySuccess) {
      setQueryFailed(false);
    }
  }, [tapQueryError, tapQuerySuccess]);

  // Computed connectivity status
  const hasConnectivityIssue = !isOnline || queryFailed;

  useEffect(() => {
    if (tapCountData) {
      const newCount = tapCountData.count;
      const prevCount = previousTapCountRef.current;
      if (prevCount !== null && newCount > prevCount && !hasConnectivityIssue) {
        setShowHypeCheck(true);
        setTimeout(() => setShowHypeCheck(false), 2500);
      }
      previousTapCountRef.current = newCount;
      setGameTapCount(newCount);
    }
  }, [tapCountData, hasConnectivityIssue]);

  useEffect(() => {
    if (user && currentTeam) {
      getSupporterTapTotal(user.id, currentTeam.id).then(data => {
        setSeasonTotal(data.totalTaps);
      }).catch(() => {});
    }
  }, [user, currentTeam]);

  useEffect(() => {
    const isLive = liveSession?.status === "live" || !!event;
    
    if (isLive) {
      enableKeepAwake();
    } else {
      disableKeepAwake();
    }

    return () => {
      disableKeepAwake();
    };
  }, [liveSession?.status, event]);

  // Use game roster if available, otherwise fall back to team athletes
  const inGamePlayers: GameRoster[] = roster.length > 0 
    ? roster.filter(r => r.isInGame)
    : teamMembers
        .filter((m: TeamMember) => m.role === "athlete")
        .map((m: TeamMember) => ({
          id: m.id,
          gameId: "",
          athleteId: m.userId,
          isInGame: true,
          jerseyNumber: m.user?.number ? String(m.user.number) : null,
          position: m.user?.position || null,
          createdAt: new Date().toISOString(),
          athlete: {
            id: m.userId,
            username: m.user?.username || "",
            email: m.user?.email || "",
            role: "athlete" as const,
            firstName: m.user?.firstName || "",
            lastName: m.user?.lastName || "",
            name: m.user?.name || `${m.user?.firstName || ""} ${m.user?.lastName || ""}`.trim(),
            number: m.user?.number || null,
            position: m.user?.position || null,
            avatar: m.user?.avatar || null,
            createdAt: m.user?.createdAt || new Date().toISOString(),
          }
        }));

  const checkForBadges = useCallback(async () => {
    if (user && currentTeam) {
      try {
        const result = await checkBadges(user.id, currentTeam.id);
        if (result.newBadges.length > 0) {
          const badge = result.newBadges[0].badge;
          setNewBadge(badge);
          toast.success(`${badge.iconEmoji} You earned the ${badge.name} badge!`, {
            duration: 5000,
          });
          setTimeout(() => setNewBadge(null), 5000);
        }
      } catch (error) {
        console.error("Failed to check badges:", error);
      }
    }
  }, [user, currentTeam]);

  const flushTaps = useCallback(async () => {
    const currentCount = tapCountRef.current;
    // Use session ID for taps (preferred) or game ID as fallback
    if (currentCount > 0 && user && (sessionId || gameId)) {
      const tapsToSend = Math.floor(currentCount / 3);
      if (tapsToSend > 0) {
        try {
          if (sessionId) {
            // Use session-based taps
            const response = await sendSessionTaps(sessionId, user.id, tapsToSend);
            setSeasonTotal(response.seasonTotal);
            setGameTapCount(response.sessionTapCount);
          } else if (gameId) {
            // Fallback to game-based taps
            const response = await sendTapBurst(gameId, user.id, tapsToSend);
            setSeasonTotal(response.seasonTotal);
            setGameTapCount(response.gameTapCount);
          }
          const remainder = currentCount % 3;
          tapCountRef.current = remainder;
          setLocalTapCount(remainder);
          
          if (badgeCheckRef.current) {
            clearTimeout(badgeCheckRef.current);
          }
          badgeCheckRef.current = setTimeout(() => {
            checkForBadges();
          }, 2000);
        } catch (error: any) {
          if (error?.message?.includes("429")) {
            toast.error("Slow down! You're tapping too fast.");
          }
        }
      }
    }
  }, [user, sessionId, gameId, checkForBadges]);

  const handleTap = () => {
    // Allow tapping if we have an event (live session is active) or game is active
    setIsTapping(true);
    tapCountRef.current += 1;
    const newCount = tapCountRef.current;
    setLocalTapCount(newCount);
    
    setTimeout(() => setIsTapping(false), 100);

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      flushTaps();
    }, 5000);

    if (newCount % 3 === 0) {
      flushTaps();
    }
  };

  const handleShoutout = async (athleteId: string, message: string) => {
    if (!user) return;
    
    // Always close the shoutout options first
    setSelectedAthlete(null);

    try {
      if (gameId) {
        await sendShoutout(gameId, user.id, athleteId, message);
      }
      toast.success(`Shoutout sent! ${message}`);
    } catch (error) {
      toast.error("Failed to send shoutout");
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    
    setIsEndingSession(true);
    try {
      // Calculate session duration
      const startTime = liveSession?.startedAt ? new Date(liveSession.startedAt) : new Date();
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const minutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      const duration = hours > 0 ? `${hours}h ${remainingMins}m` : `${minutes}m`;
      
      // Set recap data before ending
      setRecapData({
        totalTaps: sessionTapCount || 0,
        myTaps: localTapCount + gameTapCount,
        duration
      });
      
      await endLiveSession(sessionId, user?.id);
      setShowEndConfirm(false);
      setShowRecap(true);
    } catch (error) {
      toast.error("Failed to end session");
    } finally {
      setIsEndingSession(false);
    }
  };

  if (!user || !currentTeam) {
    return null;
  }

  if (eventLoading || gameLoading) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Event not found</p>
              <Button onClick={() => setLocation("/supporter/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Use game status if available, otherwise check if we have a live session
  const isActive = game?.status === "active" || true; // For now, allow tapping if they got to this page

  // Session tap count from live session
  const sessionTapCount = tapCountData?.count || gameTapCount;

  return (
    <>
      <DashboardBackground />
      <div className="min-h-screen relative z-10 pb-32">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-white/10"
                onClick={() => setLocation("/supporter/dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold truncate">Game Day Live</h1>
                  <div className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isActive 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isActive ? "Live" : "Ended"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTeam.name} {event.opponent ? `vs ${event.opponent}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {liveSession?.status === "live" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    onClick={() => setShowGuestInvite(true)}
                    data-testid="button-invite-guest"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
                {liveSession?.status === "live" && (liveSession?.startedBy === user?.id || user?.role === "coach" || user?.role === "staff") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => setShowEndConfirm(true)}
                    data-testid="button-end-session"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
          {/* Score Card or Team Banner */}
          {game ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 shadow-xl shadow-orange-500/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
              <div className="relative text-center text-white">
                <div className="text-5xl font-black tracking-tight mb-1">
                  {game.teamScore} - {game.opponentScore}
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {game.periodType} {game.currentPeriod} of {game.totalPeriods}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500 p-6 shadow-xl shadow-green-500/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
              <div className="relative text-center text-white">
                <Sparkles className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <div className="text-2xl font-bold mb-1">Cheer on your team!</div>
                <p className="text-white/80 text-sm">Tap to show your support</p>
              </div>
            </div>
          )}

          {/* Giant TAP Button Section */}
          <div className="relative">
            {/* Tap stats bar */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Live Taps</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black text-orange-500 tabular-nums">{sessionTapCount.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">this game</div>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums">{seasonTotal.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">season</div>
                </div>
              </div>
            </div>

            {/* Big TAP Button */}
            <div className="relative">
              {/* Pulse rings */}
              {isTapping && (
                <>
                  <div className="absolute inset-0 rounded-3xl bg-orange-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-3xl bg-orange-500/20 animate-ping" style={{ animationDelay: '0.1s' }} />
                </>
              )}
              
              <button
                onClick={handleTap}
                disabled={!isActive}
                className={`relative w-full aspect-[2/1] rounded-3xl font-black text-3xl transition-all duration-100 overflow-hidden
                  ${isActive 
                    ? `bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white 
                       shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/50
                       ${isTapping ? "scale-[0.97] brightness-110" : "scale-100 hover:scale-[1.01]"}` 
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                data-testid="button-tap"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                
                {/* Tap ripple effect */}
                {isTapping && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-white/30 animate-ping" />
                  </div>
                )}
                
                <div className="relative flex items-center justify-center h-full gap-4">
                  <Hand className={`h-16 w-16 transition-transform duration-75 ${isTapping ? "scale-125 rotate-12" : ""}`} />
                  <span className="text-4xl tracking-tight">TAP!</span>
                </div>
              </button>
            </div>
            
            {/* Pending taps indicator */}
            {localTapCount > 0 && (
              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  +{localTapCount} tap{localTapCount !== 1 ? "s" : ""} pending
                </span>
              </div>
            )}
          </div>

          {/* Shoutouts Section */}
          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Send Shoutouts</span>
            </div>
            
            <div className="p-4">
              {!selectedAthlete ? (
                <div className="grid grid-cols-4 gap-3">
                  {inGamePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedAthlete(player)}
                      disabled={!isActive}
                      className={`group flex flex-col items-center p-2 rounded-xl transition-all
                        ${isActive 
                          ? "hover:bg-white/5 active:scale-95" 
                          : "opacity-50 cursor-not-allowed"
                        }`}
                      data-testid={`button-athlete-${player.athlete.id}`}
                    >
                      <div className="relative mb-1.5">
                        <Avatar className="h-14 w-14 ring-2 ring-transparent group-hover:ring-orange-500/50 transition-all">
                          <AvatarImage src={player.athlete.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm font-bold">
                            {player.jerseyNumber || player.athlete.firstName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {player.jerseyNumber && (
                          <span className="absolute -bottom-1 -right-1 bg-background border border-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            #{player.jerseyNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full text-center">
                        {player.athlete.firstName || player.athlete.username}
                      </span>
                    </button>
                  ))}
                  {inGamePlayers.length === 0 && (
                    <div className="col-span-4 text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No players in game yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-orange-500/50">
                        <AvatarImage src={selectedAthlete.athlete.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold">
                          {selectedAthlete.jerseyNumber || selectedAthlete.athlete.firstName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedAthlete.athlete.firstName} {selectedAthlete.athlete.lastName}</p>
                        <p className="text-xs text-muted-foreground">#{selectedAthlete.jerseyNumber}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedAthlete(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {SHOUTOUT_OPTIONS.map((option) => (
                      <button
                        key={option.emoji}
                        onClick={() => handleShoutout(selectedAthlete.athlete.id, option.emoji)}
                        className={`${option.color} text-white p-4 rounded-xl flex flex-col items-center gap-1.5 
                          shadow-lg hover:brightness-110 active:scale-95 transition-all`}
                        data-testid={`button-shoutout-${option.label}`}
                      >
                        <option.icon className="h-7 w-7" />
                        <span className="text-xs font-bold">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasConnectivityIssue && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 px-6 py-4 rounded-2xl text-center shadow-2xl border-2 border-white/20">
            <div className="flex items-center gap-3">
              <WifiOff className="h-6 w-6 text-white" />
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Low Connectivity</p>
                <p className="text-white/90 text-xs">Taps are being stored</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHypeCheck && !hasConnectivityIssue && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 px-6 py-4 rounded-2xl text-center shadow-2xl border-2 border-white/30">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
              <div>
                <p className="text-white font-bold text-lg tracking-wide">HYPE CHECK!</p>
                <p className="text-white/90 text-2xl font-bold">{gameTapCount.toLocaleString()} taps</p>
              </div>
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {newBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-8 rounded-3xl text-center animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="text-6xl mb-4">{newBadge.iconEmoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2">Badge Earned!</h2>
            <p className="text-white/90 text-lg font-semibold mb-1">{newBadge.name}</p>
            <p className="text-white/70 text-sm mb-4">{newBadge.description}</p>
            <div className="bg-white/20 rounded-lg px-4 py-2 inline-block">
              <p className="text-white text-sm">New theme unlocked!</p>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Square className="h-5 w-5 text-red-500" />
              End Game Day Live?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will end the Game Day Live session. You can always start a new one later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-end-session-cancel">Keep Going</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndSession}
              className="bg-red-500 hover:bg-red-600"
              disabled={isEndingSession}
              data-testid="button-end-session-confirm"
            >
              {isEndingSession ? "Ending..." : "Yes, End Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Session Recap Modal */}
      {showRecap && recapData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 p-8 rounded-3xl text-center animate-in zoom-in-95 duration-300 shadow-2xl max-w-sm mx-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Game Day Recap</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {currentTeam?.name} {event?.opponent ? `vs ${event.opponent}` : event?.title}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-bold text-orange-400">{recapData.totalTaps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total HYPE</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-400">{recapData.myTaps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Your Taps</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-400">{recapData.duration}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Thanks for bringing the energy! 🔥
            </p>
            
            <Button 
              onClick={() => setLocation("/supporter/dashboard")}
              className="w-full bg-orange-500 hover:bg-orange-600"
              data-testid="button-recap-done"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {sessionId && (
        <GuestInviteQR
          sessionId={sessionId}
          open={showGuestInvite}
          onOpenChange={setShowGuestInvite}
        />
      )}
    </>
  );
}
