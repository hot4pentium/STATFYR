import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useUser } from "@/lib/userContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Flame, Heart, Star, Zap, Trophy, ThumbsUp, Sparkles, Hand } from "lucide-react";
import { toast } from "sonner";
import { 
  getGame,
  getGameByEvent,
  getEvent,
  getGameRoster,
  sendShoutout,
  sendTapBurst,
  getGameTapCount,
  getSupporterTapTotal,
  checkBadges,
  getEventLiveSession,
  sendSessionTaps,
  getSessionTapCount,
  type Game, 
  type GameRoster,
  type BadgeDefinition,
  type Event,
  type LiveEngagementSession
} from "@/lib/api";

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
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef<number>(0);
  const badgeCheckRef = useRef<NodeJS.Timeout | null>(null);

  const eventId = params?.gameId; // This is actually the event ID from the URL

  // Fetch the event first
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["/api/events", eventId],
    queryFn: () => eventId ? getEvent(eventId) : Promise.resolve(null),
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  // Then try to get the game associated with this event
  const { data: game, isLoading: gameLoading } = useQuery({
    queryKey: ["/api/events", eventId, "game"],
    queryFn: () => eventId ? getGameByEvent(eventId) : Promise.resolve(null),
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  // Get the live session for this event
  const { data: liveSession } = useQuery({
    queryKey: ["/api/events", eventId, "live-session"],
    queryFn: () => eventId ? getEventLiveSession(eventId) : Promise.resolve(null),
    enabled: !!eventId,
    refetchInterval: 5000,
  });

  // Use game ID if we have one, otherwise use event ID for tap/roster APIs
  const gameId = game?.id;
  const sessionId = liveSession?.id;

  const { data: roster = [] } = useQuery({
    queryKey: ["/api/games", gameId, "roster"],
    queryFn: () => gameId ? getGameRoster(gameId) : Promise.resolve([]),
    enabled: !!gameId,
  });

  // Use session-based tap count when we have a live session
  const { data: tapCountData } = useQuery({
    queryKey: ["/api/live-sessions", sessionId, "taps"],
    queryFn: () => sessionId ? getSessionTapCount(sessionId) : Promise.resolve({ count: 0 }),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (tapCountData) {
      setGameTapCount(tapCountData.count);
    }
  }, [tapCountData]);

  useEffect(() => {
    if (user && currentTeam) {
      getSupporterTapTotal(user.id, currentTeam.id).then(data => {
        setSeasonTotal(data.totalTaps);
      }).catch(() => {});
    }
  }, [user, currentTeam]);

  const inGamePlayers = roster.filter(r => r.isInGame);

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
    if (!user || !gameId) return;

    try {
      await sendShoutout(gameId, user.id, athleteId, message);
      toast.success(`Shoutout sent! ${message}`);
      setSelectedAthlete(null);
    } catch (error) {
      toast.error("Failed to send shoutout");
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

  return (
    <>
      <DashboardBackground />
      <div className="min-h-screen p-4 pb-48 relative z-10">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/supporter/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Game Day Live</h1>
              <p className="text-sm text-muted-foreground">
                {currentTeam.name} {event.opponent ? `vs ${event.opponent}` : event.title}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isActive ? "bg-green-500/20 text-green-500 animate-pulse" : "bg-muted text-muted-foreground"
            }`}>
              {isActive ? "LIVE" : "ENDED"}
            </div>
          </div>

          {game ? (
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold mb-2">
                  {game.teamScore} - {game.opponentScore}
                </div>
                <p className="text-sm text-muted-foreground">
                  {game.periodType} {game.currentPeriod} of {game.totalPeriods}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold mb-2 text-green-500">
                  Cheer on your team!
                </div>
                <p className="text-sm text-muted-foreground">
                  Tap below to show your support
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Live Taps
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">{gameTapCount}</div>
                  <div className="text-xs text-muted-foreground">this game</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">Your season total</p>
                <p className="text-lg font-bold">{seasonTotal} taps</p>
              </div>
              
              <div className="relative h-32">
                <button
                  onClick={handleTap}
                  disabled={!isActive}
                  className={`absolute inset-0 rounded-2xl font-bold text-2xl transition-transform duration-75 origin-center
                    ${isActive 
                      ? `bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg 
                         ${isTapping ? "scale-[0.97]" : "scale-100"}` 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  data-testid="button-tap"
                >
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Hand className={`h-12 w-12 ${isTapping ? "scale-110" : ""} transition-transform`} />
                    <span>TAP!</span>
                  </div>
                </button>
              </div>
              
              {localTapCount > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  +{localTapCount} tap{localTapCount !== 1 ? "s" : ""} (sends every 3)
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-orange-500" />
                Send Shoutouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAthlete ? (
                <div className="grid grid-cols-4 gap-2">
                  {inGamePlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedAthlete(player)}
                      disabled={!isActive}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all
                        ${isActive 
                          ? "hover:bg-muted/50 active:scale-95" 
                          : "opacity-50 cursor-not-allowed"
                        }`}
                      data-testid={`button-athlete-${player.athlete.id}`}
                    >
                      <Avatar className="h-12 w-12 mb-1 ring-2 ring-orange-500/20">
                        <AvatarImage src={player.athlete.avatar || undefined} />
                        <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                          {player.jerseyNumber || player.athlete.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-full">
                        {player.athlete.firstName || player.athlete.username}
                      </span>
                    </button>
                  ))}
                  {inGamePlayers.length === 0 && (
                    <p className="col-span-4 text-center text-sm text-muted-foreground py-4">
                      No players in game yet
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedAthlete.athlete.avatar || undefined} />
                        <AvatarFallback className="bg-orange-500/20 text-orange-500">
                          {selectedAthlete.jerseyNumber || selectedAthlete.athlete.firstName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedAthlete.athlete.firstName} {selectedAthlete.athlete.lastName}</p>
                        <p className="text-xs text-muted-foreground">#{selectedAthlete.jerseyNumber}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAthlete(null)}>
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {SHOUTOUT_OPTIONS.map((option) => (
                      <button
                        key={option.emoji}
                        onClick={() => handleShoutout(selectedAthlete.athlete.id, option.emoji)}
                        className={`${option.color} text-white p-3 rounded-xl flex flex-col items-center gap-1 
                          hover:opacity-90 active:scale-95 transition-all`}
                        data-testid={`button-shoutout-${option.label}`}
                      >
                        <option.icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </>
  );
}
