import { useState, useRef, useCallback, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/userContext";
import { 
  getLiveSession, 
  getSessionTapCount, 
  sendSessionTaps, 
  getSessionRoster,
  sendSessionShoutout,
  getSupporterTapTotal,
  checkBadges,
  extendLiveSession,
  type TeamMember, 
  type LiveEngagementSession,
  type BadgeDefinition
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Hand, Sparkles, ThumbsUp, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHOUTOUT_OPTIONS = ["🔥", "💪", "⭐", "❤️", "⚡", "🏆"];

export default function SupporterSessionLive() {
  const [, params] = useRoute("/supporter/live/:sessionId");
  const [, setLocation] = useLocation();
  const { user, currentTeam } = useUser();
  const queryClient = useQueryClient();
  
  const [localTapCount, setLocalTapCount] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [seasonTotal, setSeasonTotal] = useState(0);
  const [sessionTapCount, setSessionTapCount] = useState(0);
  const [selectedAthlete, setSelectedAthlete] = useState<TeamMember | null>(null);
  const [newBadge, setNewBadge] = useState<BadgeDefinition | null>(null);
  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef<number>(0);
  const badgeCheckRef = useRef<NodeJS.Timeout | null>(null);

  const sessionId = params?.sessionId;

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/live-sessions", sessionId],
    queryFn: () => sessionId ? getLiveSession(sessionId) : Promise.resolve(null),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  const { data: roster = [] } = useQuery({
    queryKey: ["/api/live-sessions", sessionId, "roster"],
    queryFn: () => sessionId ? getSessionRoster(sessionId) : Promise.resolve([]),
    enabled: !!sessionId && !!session,
  });

  const { data: tapCountData } = useQuery({
    queryKey: ["/api/live-sessions", sessionId, "taps"],
    queryFn: () => sessionId ? getSessionTapCount(sessionId) : Promise.resolve({ count: 0 }),
    enabled: !!sessionId && !!session,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (tapCountData) {
      setSessionTapCount(tapCountData.count);
    }
  }, [tapCountData]);

  useEffect(() => {
    async function loadSeasonTotal() {
      if (user && currentTeam) {
        try {
          const data = await getSupporterTapTotal(user.id, currentTeam.id);
          setSeasonTotal(data.totalTaps);
        } catch (error) {
          console.error("Failed to load season total:", error);
        }
      }
    }
    loadSeasonTotal();
  }, [user, currentTeam]);

  useEffect(() => {
    if (session && session.status === "live") {
      const now = new Date();
      const endTime = session.extendedUntil 
        ? new Date(session.extendedUntil) 
        : session.scheduledEnd 
          ? new Date(session.scheduledEnd) 
          : null;
      
      if (endTime && now >= endTime && !showExtendPrompt) {
        setShowExtendPrompt(true);
      }
    }
  }, [session, showExtendPrompt]);

  const checkForBadges = useCallback(async () => {
    if (!user || !currentTeam) return;
    
    try {
      const result = await checkBadges(user.id, currentTeam.id);
      if (result.newBadges && result.newBadges.length > 0) {
        setNewBadge(result.newBadges[0].badge);
      }
    } catch (error) {
      console.error("Failed to check badges:", error);
    }
  }, [user, currentTeam]);

  const flushTaps = useCallback(async () => {
    const currentCount = tapCountRef.current;
    if (currentCount > 0 && user && sessionId) {
      const tapsToSend = Math.floor(currentCount / 3);
      if (tapsToSend > 0) {
        try {
          const response = await sendSessionTaps(sessionId, user.id, tapsToSend);
          setSeasonTotal(response.seasonTotal);
          setSessionTapCount(response.sessionTapCount);
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
  }, [user, sessionId, checkForBadges]);

  const handleTap = () => {
    if (session?.status !== "live") {
      toast.error("Session is not active");
      return;
    }
    
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
    if (!user || !sessionId) return;
    
    if (session?.status !== "live") {
      toast.error("Session is not active");
      return;
    }

    try {
      await sendSessionShoutout(sessionId, user.id, athleteId, message);
      toast.success(`Shoutout sent! ${message}`);
      setSelectedAthlete(null);
    } catch (error) {
      toast.error("Failed to send shoutout");
    }
  };

  const handleExtend = async () => {
    if (!sessionId) return;
    try {
      await extendLiveSession(sessionId);
      setShowExtendPrompt(false);
      toast.success("Session extended for 30 more minutes!");
      queryClient.invalidateQueries({ queryKey: ["/api/live-sessions", sessionId] });
    } catch (error) {
      toast.error("Failed to extend session");
    }
  };

  if (!user || !currentTeam) {
    return null;
  }

  if (sessionLoading) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen p-4 relative z-10">
          <Card className="max-w-lg mx-auto mt-10">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Session not found</p>
              <Button onClick={() => setLocation("/supporter/hub")} data-testid="button-back-dashboard">
                Back to Hub
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const isActive = session.status === "live";

  if (!hasConfirmedStart && isActive) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen p-4 flex items-center justify-center relative z-10">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Game Day Live!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-lg font-semibold">{currentTeam?.name}</p>
                <p className="text-muted-foreground">vs {session.event?.opponent || "Opponent"}</p>
              </div>
              
              <Button 
                onClick={() => setHasConfirmedStart(true)}
                className="w-full h-16 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                data-testid="button-confirm-start"
              >
                <CheckCircle className="h-6 w-6 mr-2" />
                Game Started? Let's Go!
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/supporter/hub")}
                className="w-full"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Hub
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBackground />
      <div className="min-h-screen p-4 pb-48 relative z-10">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/supporter/hub")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Game Day Live</h1>
              <p className="text-sm text-muted-foreground">
                {currentTeam.name} vs {session.event?.opponent || "Opponent"}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isActive ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
            }`}>
              {session.status.toUpperCase()}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Live Taps
                </CardTitle>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">{sessionTapCount}</div>
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
              
              <p className="text-center text-lg font-bold text-primary mt-2">
                {localTapCount} tap{localTapCount !== 1 ? "s" : ""}
              </p>
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
                  {roster.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedAthlete(member)}
                      disabled={!isActive}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all
                        ${isActive 
                          ? "hover:bg-muted/50 active:scale-95" 
                          : "opacity-50 cursor-not-allowed"
                        }`}
                      data-testid={`button-athlete-${member.user.id}`}
                    >
                      <Avatar className="h-12 w-12 mb-1 ring-2 ring-orange-500/20">
                        <AvatarImage src={member.user.avatar || undefined} />
                        <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                          {member.jerseyNumber || member.user.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate max-w-full">
                        {member.user.firstName || member.user.username}
                      </span>
                    </button>
                  ))}
                  {roster.length === 0 && (
                    <p className="col-span-4 text-center text-sm text-muted-foreground py-4">
                      No athletes on team
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedAthlete.user.avatar || undefined} />
                        <AvatarFallback>
                          {selectedAthlete.jerseyNumber || selectedAthlete.user.firstName?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedAthlete.user.firstName} {selectedAthlete.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">Select a shoutout</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedAthlete(null)}>
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {SHOUTOUT_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleShoutout(selectedAthlete.user.id, emoji)}
                        className="text-3xl p-4 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all"
                        data-testid={`button-shoutout-${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showExtendPrompt} onOpenChange={setShowExtendPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Game Running Long?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              The scheduled game time has passed. Want to keep cheering?
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setLocation("/supporter/hub")}
              >
                I'm Done
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600"
                onClick={handleExtend}
                data-testid="button-extend"
              >
                Continue Cheering!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newBadge} onOpenChange={() => setNewBadge(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">New Badge Earned!</DialogTitle>
          </DialogHeader>
          {newBadge && (
            <div className="py-6 space-y-4">
              <div className="text-6xl">{newBadge.iconEmoji}</div>
              <div>
                <p className="text-2xl font-bold" style={{ color: newBadge.color }}>
                  {newBadge.name}
                </p>
                <p className="text-muted-foreground">{newBadge.description}</p>
              </div>
            </div>
          )}
          <Button onClick={() => setNewBadge(null)}>Awesome!</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
