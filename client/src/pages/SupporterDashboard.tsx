import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MapPin, Users, BarChart3, MessageSquare, X, Settings, LogOut, Clock, Utensils, Coffee, Shield, ClipboardList, Video, Play as PlayIcon, Trophy, BookOpen, ChevronDown, User, Camera, Maximize2, AlertCircle, Zap } from "lucide-react";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, getTeamPlays, getManagedAthletes, getTeamAggregateStats, getAdvancedTeamStats, getAthleteStats, getSupporterBadges, getAllBadges, getSupporterThemes, getActiveTheme, activateTheme, getSupporterTapTotal, getActiveLiveSessions, checkSessionLifecycle, type TeamMember, type Event, type HighlightVideo, type Play, type ManagedAthlete, type TeamAggregateStats, type AdvancedTeamStats, type AthleteStats, type SupporterBadge, type BadgeDefinition, type ThemeUnlock, type LiveEngagementSession } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth } from "date-fns";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePWA } from "@/lib/pwaContext";
import { TeamBadge } from "@/components/TeamBadge";
import { TeamHeroCard } from "@/components/dashboard/TeamHeroCard";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-bold ${className}`}>{children}</span>;
}

export default function SupporterDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const [selectedCard, setSelectedCard] = useState<string | null>("schedule");
  const contentRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<TeamMember | null>(null);
  const [isAthleteCardFlipped, setIsAthleteCardFlipped] = useState(false);
  const [expandedPlay, setExpandedPlay] = useState<Play | null>(null);
  const [playbookTab, setPlaybookTab] = useState<"Offense" | "Defense" | "Special">("Offense");
  const [viewingAsAthlete, setViewingAsAthlete] = useState<ManagedAthlete | null>(null);
  const [isManagedAthleteCardFlipped, setIsManagedAthleteCardFlipped] = useState(false);
  const [isHypeCardEnlarged, setIsHypeCardEnlarged] = useState(false);
  const [isUploadingAthleteAvatar, setIsUploadingAthleteAvatar] = useState(false);
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: managedAthletes = [], refetch: refetchManagedAthletes } = useQuery({
    queryKey: ["/api/users", user?.id, "managed-athletes"],
    queryFn: () => user ? getManagedAthletes(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 5000,
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamHighlights = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 3000,
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: aggregateStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "aggregate"],
    queryFn: () => currentTeam ? getTeamAggregateStats(currentTeam.id) : Promise.resolve({ games: 0, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, statTotals: {} }),
    enabled: !!currentTeam,
  });

  const { data: advancedStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "advanced"],
    queryFn: () => currentTeam ? getAdvancedTeamStats(currentTeam.id) : Promise.resolve({ gameHistory: [], athletePerformance: [], ratios: {} }),
    enabled: !!currentTeam,
  });

  const { data: managedAthleteStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", viewingAsAthlete?.athlete.id, "stats"],
    queryFn: () => currentTeam && viewingAsAthlete ? getAthleteStats(currentTeam.id, viewingAsAthlete.athlete.id) : Promise.resolve({ gamesPlayed: 0, stats: {}, gameHistory: [], hotStreak: false, streakLength: 0 }),
    enabled: !!currentTeam && !!viewingAsAthlete,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["/api/badges"],
    queryFn: () => getAllBadges(),
  });

  const { data: supporterBadges = [] } = useQuery({
    queryKey: ["/api/supporters", user?.id, "badges", currentTeam?.id],
    queryFn: () => user && currentTeam ? getSupporterBadges(user.id, currentTeam.id) : Promise.resolve([]),
    enabled: !!user && !!currentTeam,
  });

  const { data: supporterTapTotal } = useQuery({
    queryKey: ["/api/supporters", user?.id, "taps", currentTeam?.id],
    queryFn: () => user && currentTeam ? getSupporterTapTotal(user.id, currentTeam.id) : Promise.resolve({ totalTaps: 0 }),
    enabled: !!user && !!currentTeam,
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "live-sessions", "active"],
    queryFn: () => currentTeam ? getActiveLiveSessions(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 3000,
  });

  // Check and auto-start/end sessions on load
  useEffect(() => {
    if (currentTeam) {
      checkSessionLifecycle(currentTeam.id).catch(console.error);
    }
  }, [currentTeam]);

  const { data: supporterThemes = [], refetch: refetchThemes } = useQuery({
    queryKey: ["/api/supporters", user?.id, "themes"],
    queryFn: () => user ? getSupporterThemes(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const { data: activeTheme, refetch: refetchActiveTheme } = useQuery({
    queryKey: ["/api/supporters", user?.id, "themes", "active"],
    queryFn: () => user ? getActiveTheme(user.id) : Promise.resolve(null),
    enabled: !!user,
  });

  const handleActivateTheme = async (themeId: string) => {
    if (!user) return;
    try {
      await activateTheme(user.id, themeId);
      refetchThemes();
      refetchActiveTheme();
      toast.success("Theme activated!");
    } catch (error) {
      toast.error("Failed to activate theme");
    }
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach"), [teamMembers]);
  const supporters = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "supporter"), [teamMembers]);
  
  const [rosterTab, setRosterTab] = useState<"all" | "athletes" | "coach" | "supporters">("all");
  const filteredRosterMembers = useMemo(() => {
    switch (rosterTab) {
      case "athletes": return athletes;
      case "coach": return coaches;
      case "supporters": return supporters;
      default: return teamMembers;
    }
  }, [rosterTab, teamMembers, athletes, coaches, supporters]);

  useEffect(() => {
    if (!user || !currentTeam) {
      setLocation("/supporter/onboarding");
    }
  }, [user, currentTeam, setLocation]);

  useEffect(() => {
    if (selectedCard && contentRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    }
  }, [selectedCard]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleAthleteAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingAsAthlete) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingAthleteAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const avatarData = event.target?.result as string;
        
        const response = await fetch(`/api/users/${viewingAsAthlete.athlete.id}?requesterId=${user?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarData }),
        });

        if (!response.ok) {
          throw new Error("Failed to update avatar");
        }

        setViewingAsAthlete({
          ...viewingAsAthlete,
          athlete: { ...viewingAsAthlete.athlete, avatar: avatarData }
        });
        refetchManagedAthletes();
        toast.success("Athlete photo updated!");
        setIsUploadingAthleteAvatar(false);
      };
      reader.onerror = () => {
        setIsUploadingAthleteAvatar(false);
        toast.error("Failed to load image");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error("Failed to update athlete photo");
      setIsUploadingAthleteAvatar(false);
    }
  };

  const quickActions = [
    { 
      name: "Schedule", 
      id: "schedule",
      icon: CalendarIcon, 
      color: "from-blue-500/20 to-blue-600/20",
      description: "Match dates"
    },
    { 
      name: "Roster", 
      id: "roster",
      icon: Users, 
      color: "from-purple-500/20 to-purple-600/20",
      description: "Team squad"
    },
    { 
      name: "Highlights", 
      id: "highlights",
      icon: Video, 
      color: "from-red-500/20 to-red-600/20",
      description: "Team videos"
    },
    { 
      name: "Stats", 
      id: "stats",
      icon: BarChart3, 
      color: "from-orange-500/20 to-orange-600/20",
      description: "Team stats"
    },
    { 
      name: "Chat", 
      id: "chat",
      icon: MessageSquare, 
      color: "from-pink-500/20 to-pink-600/20",
      description: "Updates"
    },
    { 
      name: "Playbook", 
      id: "playbook",
      icon: BookOpen, 
      color: "from-green-500/20 to-green-600/20",
      description: "Team plays"
    },
    { 
      name: "Badges", 
      id: "badges",
      icon: Trophy, 
      color: "from-amber-500/20 to-amber-600/20",
      description: "Your rewards"
    },
  ];

  const supporterWelcomeModal: WelcomeModal = {
    title: "Welcome, Supporter!",
    subtitle: `Cheering for ${currentTeam?.name || "the team"}`,
    description: "You're all set to support your athletes! Let us show you around so you can stay connected and cheer them on.",
    buttonText: "Let's Go!"
  };

  const supporterTourSteps: TourStep[] = [
    {
      target: '[data-testid="card-schedule"]',
      title: "Team Schedule",
      description: "View upcoming games and practices. When a game is live, you'll see a banner to join and cheer!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-roster"]',
      title: "Team Roster",
      description: "See all team members including athletes, coaches, and fellow supporters.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-badges"]',
      title: "Earn Badges",
      description: "Cheer at games to earn badges! Tap the button during live games to boost your tap count and unlock special themes.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-highlights"]',
      title: "Team Highlights",
      description: "Watch video highlights from games and practices.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-stats"]',
      title: "Team Stats",
      description: "View team performance statistics and see how your athletes are doing.",
      position: "bottom"
    }
  ];

  const renderContent = () => {
    switch(selectedCard) {
      case "schedule":
        const eventsWithDates = teamEvents.filter((e: Event) => e.date);
        const eventDates = eventsWithDates.map((e: Event) => new Date(e.date));
        const filteredEvents = selectedDate 
          ? eventsWithDates.filter((e: Event) => isSameDay(new Date(e.date), selectedDate))
          : [...eventsWithDates].sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const getAthleteName = (athleteId: string | null | undefined) => {
          if (!athleteId) return null;
          const member = teamMembers.find((m: TeamMember) => String(m.userId) === athleteId);
          return member?.user.name || member?.user.username || null;
        };

        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedDate ? (
                  <span>Showing events for {format(selectedDate, "MMMM d, yyyy")}</span>
                ) : (
                  <span>{teamEvents.length} total events</span>
                )}
              </div>
              {selectedDate && (
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} data-testid="button-clear-date">
                  Clear Filter
                </Button>
              )}
            </div>
            
            {/* Next Game Card */}
            {(() => {
              const upcomingEvents = eventsWithDates.filter((e: Event) => new Date(e.date) >= new Date()).sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const nextGame = upcomingEvents[0];
              return nextGame ? (
                <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 mb-6" data-testid="next-game-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-1">Next Game</p>
                        <h3 className="text-2xl font-bold mb-2">{nextGame.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span>{format(new Date(nextGame.date), "EEEE, MMM d")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{format(new Date(nextGame.date), "h:mm a")}</span>
                          </div>
                          {nextGame.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>{nextGame.location}</span>
                            </div>
                          )}
                        </div>
                        {nextGame.opponent && (
                          <div className="mt-3">
                            <span className="px-3 py-1 rounded-full text-sm font-bold bg-accent/20 text-accent border border-accent/30">
                              vs {nextGame.opponent}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30">
                        <Trophy className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">{selectedDate ? "No events on this date" : "No events scheduled"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    {filteredEvents.map((event: Event) => (
                      <Card key={event.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all" data-testid={`event-card-${event.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary border border-primary/30">{event.type}</span>
                                {event.opponent && (
                                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-accent/20 text-accent border border-accent/30">
                                    vs {event.opponent}
                                  </span>
                                )}
                              </div>
                              
                              <h3 className="font-bold text-lg">{event.title}</h3>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarIcon className="h-4 w-4 text-primary" />
                                  <span>{format(new Date(event.date), "EEEE, MMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span>{format(new Date(event.date), "h:mm a")}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>

                              {event.details && (
                                <p className="text-sm text-muted-foreground/80 bg-white/5 rounded-lg p-3">
                                  {event.details}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                                <div className="flex items-center gap-2 text-sm">
                                  <Utensils className="h-4 w-4 text-green-400" />
                                  <span className="text-muted-foreground">Drinks:</span>
                                  <span className={getAthleteName(event.drinksAthleteId) ? "text-foreground font-medium" : "text-muted-foreground/50 italic"}>
                                    {getAthleteName(event.drinksAthleteId) || "Unassigned"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Coffee className="h-4 w-4 text-orange-400" />
                                  <span className="text-muted-foreground">Snacks:</span>
                                  <span className={getAthleteName(event.snacksAthleteId) ? "text-foreground font-medium" : "text-muted-foreground/50 italic"}>
                                    {getAthleteName(event.snacksAthleteId) || "Unassigned"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
          </div>
        );
      case "roster":
        return (
          <div className="space-y-4">
            <Tabs value={rosterTab} onValueChange={(v) => setRosterTab(v as typeof rosterTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-background/40">
                <TabsTrigger value="all" data-testid="tab-all">All ({teamMembers.length})</TabsTrigger>
                <TabsTrigger value="athletes" data-testid="tab-athletes">Athletes ({athletes.length})</TabsTrigger>
                <TabsTrigger value="coach" data-testid="tab-coach">Coach ({coaches.length})</TabsTrigger>
                <TabsTrigger value="supporters" data-testid="tab-supporters">Supporters ({supporters.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {filteredRosterMembers.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">No {rosterTab === "all" ? "team members" : rosterTab} yet</p>
                  <p className="text-sm">Team members will appear here once they join.</p>
                </div>
              ) : (
                filteredRosterMembers.map((member: TeamMember) => (
                  <Card 
                    key={member.id} 
                    className={`bg-background/40 border-white/10 hover:border-primary/50 transition-all ${member.role === "athlete" ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (member.role === "athlete") {
                        setSelectedAthlete(member);
                        setIsAthleteCardFlipped(false);
                      }
                    }}
                    data-testid={`roster-card-${member.id}`}
                  >
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col items-center text-center gap-2 md:gap-3">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-white/20">
                          <AvatarImage src={member.user.avatar || undefined} />
                          <AvatarFallback>{member.user.name?.[0] || "A"}</AvatarFallback>
                        </Avatar>
                        <div>
                          {member.role === "coach" ? (
                            <div className="font-bold text-foreground uppercase text-[10px] md:text-xs bg-primary/20 text-primary px-2 py-1 rounded mb-1">Coach</div>
                          ) : member.role === "staff" ? (
                            <div className="font-bold text-foreground uppercase text-[10px] md:text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded mb-1">Staff</div>
                          ) : member.role === "supporter" ? (
                            <div className="font-bold text-foreground uppercase text-[10px] md:text-xs bg-accent/20 text-accent px-2 py-1 rounded mb-1">Fan</div>
                          ) : (
                            <div className="font-bold text-foreground text-sm md:text-base">#{member.jerseyNumber || "00"}</div>
                          )}
                          <div className="text-xs md:text-sm font-bold text-primary truncate max-w-[80px] md:max-w-none">{member.user.name || member.user.username}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">{member.role === "coach" ? "Head Coach" : member.role === "staff" ? "Staff" : member.role === "supporter" ? "Supporter" : (member.position || "Player")}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      case "stats":
        if (!aggregateStats || aggregateStats.games === 0) {
          return (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold">No stats yet</p>
              <p className="text-sm">Statistics will appear here after games are completed.</p>
            </div>
          );
        }

        const managedTotalStats = managedAthleteStats ? Object.values(managedAthleteStats.stats).reduce((sum, s) => sum + s.total, 0) : 0;

        return (
          <div className="space-y-6">
            {viewingAsAthlete && managedAthleteStats && managedAthleteStats.gamesPlayed > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                  <Trophy className="h-5 w-5" />
                  {viewingAsAthlete.athlete.firstName}'s Stats
                  {managedAthleteStats.hotStreak && (
                    <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                      {managedAthleteStats.streakLength} game streak
                    </Badge>
                  )}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-background/50 border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{managedAthleteStats.gamesPlayed}</p>
                    <p className="text-xs text-muted-foreground">Games Played</p>
                  </div>
                  <div className="bg-background/50 border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{managedTotalStats}</p>
                    <p className="text-xs text-muted-foreground">Total Stats</p>
                  </div>
                  <div className="bg-background/50 border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{managedAthleteStats.gamesPlayed > 0 ? Math.round(managedTotalStats / managedAthleteStats.gamesPlayed * 10) / 10 : 0}</p>
                    <p className="text-xs text-muted-foreground">Per Game Avg</p>
                  </div>
                  <div className="bg-background/50 border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{Object.keys(managedAthleteStats.stats).length}</p>
                    <p className="text-xs text-muted-foreground">Stat Types</p>
                  </div>
                </div>
                {Object.keys(managedAthleteStats.stats).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {Object.entries(managedAthleteStats.stats).map(([key, stat]) => (
                      <div key={key} className="bg-background/50 border rounded-lg p-2 text-center">
                        <p className="text-lg font-bold">{stat.total}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.name}</p>
                        <p className="text-[10px] text-primary">{stat.perGame}/game</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">Team Record</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background/50 border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold">{aggregateStats.games}</p>
                  <p className="text-sm text-muted-foreground">Games</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-500">{aggregateStats.wins}</p>
                  <p className="text-sm text-muted-foreground">Wins</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-500">{aggregateStats.losses}</p>
                  <p className="text-sm text-muted-foreground">Losses</p>
                </div>
              </div>
            </div>

            {advancedStats?.ratios && Object.keys(advancedStats.ratios).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Team Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(advancedStats.ratios).map(([key, ratio]) => (
                    <div key={key} className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center" title={ratio.description}>
                      <p className="text-2xl font-bold text-primary">{ratio.value}{key.includes('pct') || key === 'win_pct' ? '%' : ''}</p>
                      <p className="text-xs text-muted-foreground">{ratio.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(aggregateStats.statTotals).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Team Season Totals</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(Object.entries(aggregateStats.statTotals) as [string, { name: string; total: number }][]).map(([key, stat]) => (
                    <div key={key} className="bg-background/50 border rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{stat.total}</p>
                      <p className="text-xs text-muted-foreground">{stat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "highlights":
        return (
          <div className="space-y-4">
            {teamHighlights.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">No highlights yet</p>
                <p className="text-sm">Team videos will appear here once uploaded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {teamHighlights.map((video: HighlightVideo) => (
                  <Card key={video.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all overflow-hidden">
                    <div className="relative aspect-video bg-black">
                      {video.status === "ready" && video.publicUrl ? (
                        <video
                          src={video.publicUrl}
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain"
                          poster={video.thumbnailKey || undefined}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-bold truncate">{video.title || "Untitled"}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {video.uploader?.name || video.uploader?.username || "Unknown"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case "chat":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-background/40 border border-white/10 rounded-lg">
              <p className="text-sm font-bold">Team News</p>
              <p className="text-xs text-muted-foreground">Team training went great! Ready for the derby.</p>
            </div>
            <div className="p-3 bg-background/40 border border-white/10 rounded-lg">
              <p className="text-sm font-bold">Coach Update</p>
              <p className="text-xs text-muted-foreground">Squad is in excellent form heading into the weekend.</p>
            </div>
          </div>
        );
      case "playbook":
        const offensePlays = teamPlays.filter(p => p.category === "Offense");
        const defensePlays = teamPlays.filter(p => p.category === "Defense");
        const specialPlays = teamPlays.filter(p => p.category === "Special");
        
        const renderPlayCard = (play: Play) => (
          <Card key={play.id} className="group cursor-pointer hover:shadow-lg transition-shadow" data-testid={`play-card-${play.id}`} onClick={() => setExpandedPlay(play)}>
            {play.thumbnailData && (
              <div className="w-full h-32 overflow-hidden rounded-t-lg border-b">
                <img 
                  src={play.thumbnailData} 
                  alt={play.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{play.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {play.createdBy.firstName} {play.createdBy.lastName}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {play.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{play.description}</p>
              )}
              {play.status && (
                <Badge className={play.status === "Successful" ? "bg-green-600 text-white" : play.status === "Not Successful" ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}>
                  {play.status}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold">Playbook</h3>
              <p className="text-sm text-muted-foreground">View team plays ({teamPlays.length} plays)</p>
            </div>
            <Tabs value={playbookTab} onValueChange={(v) => setPlaybookTab(v as "Offense" | "Defense" | "Special")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="Offense" className="gap-2" data-testid="playbook-tab-offense">
                  <span>Offense</span>
                  <Badge className="bg-blue-600 text-white text-xs">{offensePlays.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="Defense" className="gap-2" data-testid="playbook-tab-defense">
                  <span>Defense</span>
                  <Badge className="bg-orange-600 text-white text-xs">{defensePlays.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="Special" className="gap-2" data-testid="playbook-tab-special">
                  <span>Special</span>
                  <Badge className="bg-purple-600 text-white text-xs">{specialPlays.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              {teamPlays.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">No plays yet</p>
                  <p className="text-sm">The coach will add plays here.</p>
                </div>
              ) : (
                <>
                  {playbookTab === "Offense" && (
                    offensePlays.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {offensePlays.map(renderPlayCard)}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">No offense plays yet.</p>
                      </div>
                    )
                  )}
                  
                  {playbookTab === "Defense" && (
                    defensePlays.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {defensePlays.map(renderPlayCard)}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">No defense plays yet.</p>
                      </div>
                    )
                  )}
                  
                  {playbookTab === "Special" && (
                    specialPlays.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {specialPlays.map(renderPlayCard)}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">No special plays yet.</p>
                      </div>
                    )
                  )}
                </>
              )}
            </Tabs>
            
            <Dialog open={!!expandedPlay} onOpenChange={(open) => !open && setExpandedPlay(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {expandedPlay?.name}
                    {expandedPlay?.category && (
                      <Badge className={expandedPlay.category === "Offense" ? "bg-blue-600 text-white" : expandedPlay.category === "Defense" ? "bg-orange-600 text-white" : "bg-purple-600 text-white"}>
                        {expandedPlay.category}
                      </Badge>
                    )}
                    {expandedPlay?.status && (
                      <Badge className={expandedPlay.status === "Successful" ? "bg-green-600 text-white" : expandedPlay.status === "Not Successful" ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}>
                        {expandedPlay.status}
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>
                {expandedPlay?.description && (
                  <p className="text-sm text-muted-foreground">{expandedPlay.description}</p>
                )}
                {expandedPlay?.thumbnailData && (
                  <div className="w-full rounded-lg overflow-hidden border">
                    <img 
                      src={expandedPlay.thumbnailData} 
                      alt={expandedPlay.name} 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Created by {expandedPlay?.createdBy.firstName} {expandedPlay?.createdBy.lastName}
                </p>
              </DialogContent>
            </Dialog>
          </div>
        );
      case "badges":
        const earnedBadgeIds = new Set(supporterBadges.map(b => b.badgeId));
        const sortedBadges = [...allBadges].sort((a, b) => a.tier - b.tier);
        const currentTaps = supporterTapTotal?.totalTaps || 0;
        const nextBadge = sortedBadges.find(b => !earnedBadgeIds.has(b.id) && b.tapThreshold > currentTaps);
        const progress = nextBadge ? Math.min((currentTaps / nextBadge.tapThreshold) * 100, 100) : 100;
        
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-orange-400">Your Tap Total</h4>
                  <p className="text-4xl font-bold text-white">{currentTaps.toLocaleString()}</p>
                </div>
                {nextBadge && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Next Badge</p>
                    <p className="text-lg font-bold">{nextBadge.iconEmoji} {nextBadge.name}</p>
                    <p className="text-xs text-muted-foreground">{nextBadge.tapThreshold - currentTaps} taps to go</p>
                  </div>
                )}
              </div>
              {nextBadge && (
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            
            <h4 className="text-lg font-bold">Your Badges</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortedBadges.map(badge => {
                const isEarned = earnedBadgeIds.has(badge.id);
                return (
                  <div 
                    key={badge.id}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isEarned 
                        ? "bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500/50" 
                        : "bg-white/5 border-white/10 opacity-50"
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.iconEmoji}</div>
                    <p className={`font-bold ${isEarned ? "text-white" : "text-muted-foreground"}`}>{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.tapThreshold.toLocaleString()} taps</p>
                    {isEarned && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Earned!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {supporterThemes.length > 0 && (
              <>
                <h4 className="text-lg font-bold mt-8">Unlocked Themes</h4>
                <p className="text-sm text-muted-foreground mb-4">Each badge unlocks a special dashboard theme!</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {supporterThemes.map(theme => {
                    const badge = sortedBadges.find(b => b.themeId === theme.themeId);
                    const isActive = activeTheme?.themeId === theme.themeId;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleActivateTheme(theme.themeId)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          isActive 
                            ? "bg-gradient-to-br from-green-500/30 to-emerald-600/30 border-green-500/50 ring-2 ring-green-500" 
                            : "bg-white/5 border-white/20 hover:bg-white/10"
                        }`}
                        data-testid={`button-theme-${theme.themeId}`}
                      >
                        <div className="text-3xl mb-2">{badge?.iconEmoji || "🎨"}</div>
                        <p className="font-bold capitalize">{theme.themeId}</p>
                        {isActive ? (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/30 text-green-400 text-xs rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 text-muted-foreground text-xs rounded-full">
                            Tap to use
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (!currentTeam) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <OnboardingTour 
        steps={supporterTourSteps} 
        storageKey={`supporter-onboarding-completed-${user?.id}`}
        welcomeModal={supporterWelcomeModal}
      />
      <DashboardBackground />
      <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between gap-4">
        <h2 className="text-sm md:text-lg font-medium text-muted-foreground">
          {currentTeam?.name || "STATFyR"} - {currentTeam?.season || "Season 2024-2025"}
        </h2>
        <div className="flex items-center gap-3">
          {managedAthletes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 gap-2"
                  data-testid="button-profile-switcher"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {viewingAsAthlete ? (
                      viewingAsAthlete.athlete.avatar ? (
                        <img src={viewingAsAthlete.athlete.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-3 w-3 text-primary" />
                      )
                    ) : (
                      user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-3 w-3 text-primary" />
                      )
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                    {viewingAsAthlete ? viewingAsAthlete.athlete.name : user?.name || "Profile"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => setViewingAsAthlete(null)}
                  className={!viewingAsAthlete ? "bg-primary/10" : ""}
                  data-testid="dropdown-item-my-profile"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user?.name || "My Profile"}</p>
                      <p className="text-xs text-muted-foreground">Supporter</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Managed Athletes</p>
                {managedAthletes.map((managed) => (
                  <DropdownMenuItem 
                    key={managed.id}
                    onClick={() => setViewingAsAthlete(managed)}
                    className={viewingAsAthlete?.id === managed.id ? "bg-primary/10" : ""}
                    data-testid={`dropdown-item-athlete-${managed.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                        {managed.athlete.avatar ? (
                          <img src={managed.athlete.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{managed.athlete.name}</p>
                        <p className="text-xs text-muted-foreground">Athlete</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {updateAvailable && (
            <Button
              variant="outline"
              size="icon"
              className="border-amber-500 dark:border-amber-400 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 animate-pulse"
              onClick={applyUpdate}
              data-testid="button-pwa-update"
              title="Update available - click to refresh"
            >
              <AlertCircle className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
          <Link href="/supporter/settings">
            <Button 
              variant="outline" 
              size="icon"
              className="border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="icon"
            className="border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full px-4 md:px-8 py-8">
        {viewingAsAthlete && (
          <div className="flex items-center justify-between gap-4 p-3 bg-accent/20 border border-accent/30 rounded-lg" data-testid="viewing-as-athlete-banner">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">
                Viewing as <span className="font-bold">{viewingAsAthlete.athlete.name}</span>
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewingAsAthlete(null)}
              className="text-accent hover:text-accent hover:bg-accent/20"
              data-testid="button-stop-viewing-as"
            >
              <X className="h-4 w-4 mr-1" />
              Exit View
            </Button>
          </div>
        )}
        
        {viewingAsAthlete ? (
          <div ref={heroBannerRef} className="grid grid-cols-[1fr_auto] gap-4 md:gap-8" data-testid="managed-athlete-hype-section">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
              <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 p-6 md:p-12">
                <div className="flex items-start gap-4 md:gap-8">
                  <div className="h-14 w-14 md:h-32 md:w-32 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                    {currentTeam?.badgeId ? (
                      <TeamBadge badgeId={currentTeam.badgeId} size="xl" className="text-white" />
                    ) : (
                      <Shield className="h-7 w-7 md:h-20 md:w-20 text-white" />
                    )}
                  </div>
                  
                  <div className="space-y-2 md:space-y-4 flex-1 min-w-0">
                    <div className="space-y-1 md:space-y-2">
                      <h1 className="text-2xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-tight">
                        {viewingAsAthlete.athlete.name}
                      </h1>
                      <h2 className="text-sm md:text-2xl text-white/80 font-bold uppercase tracking-wide">
                        {currentTeam?.name || "Team"} <span className="text-white/60">•</span> {currentTeam?.sport || "Sport"}
                      </h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 pt-2 md:pt-3">
                      <span className="px-3 md:px-5 py-1 md:py-2 backdrop-blur-sm rounded-lg border bg-green-500/20 border-green-500/30 text-green-400 text-xs md:text-base font-bold uppercase tracking-wider">
                        Athlete
                      </span>
                      {viewingAsAthlete.athlete.position && (
                        <span className="px-3 md:px-5 py-1 md:py-2 backdrop-blur-sm rounded-lg border bg-white/10 border-white/20 text-white text-xs md:text-base font-bold uppercase tracking-wider">
                          {viewingAsAthlete.athlete.position}
                        </span>
                      )}
                      {viewingAsAthlete.athlete.number && (
                        <span className="px-3 md:px-5 py-1 md:py-2 backdrop-blur-sm rounded-lg border bg-accent/20 border-accent/30 text-accent text-xs md:text-base font-bold uppercase tracking-wider">
                          #{viewingAsAthlete.athlete.number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-36 md:w-72 space-y-1 md:space-y-2 flex-shrink-0">
              <input
                type="file"
                ref={avatarInputRef}
                accept="image/*"
                onChange={handleAthleteAvatarChange}
                className="hidden"
                data-testid="input-athlete-avatar"
              />
              <div className="relative group cursor-pointer" style={{ perspective: '1000px' }}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                <div 
                  className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isManagedAthleteCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.6s ease-in-out'
                  }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                  
                  {!isManagedAthleteCardFlipped ? (
                    <div className="relative w-full h-44 md:h-96 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                      {viewingAsAthlete.athlete.avatar ? (
                        <img src={viewingAsAthlete.athlete.avatar} alt={viewingAsAthlete.athlete.name || ""} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <User className="h-12 md:h-24 w-12 md:w-24 text-white/40" />
                        </div>
                      )}
                      
                      <div className="absolute top-1.5 md:top-3 right-1.5 md:right-3 flex gap-1 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsHypeCardEnlarged(true);
                          }}
                          className="p-1 md:p-2 bg-black/50 hover:bg-black/70 rounded-full border border-white/20 transition"
                          data-testid="button-enlarge-hype-card"
                        >
                          <Maximize2 className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            avatarInputRef.current?.click();
                          }}
                          disabled={isUploadingAthleteAvatar}
                          className="p-1 md:p-2 bg-black/50 hover:bg-black/70 rounded-full border border-white/20 transition"
                          data-testid="button-upload-athlete-avatar"
                        >
                          <Camera className={`h-3 w-3 md:h-4 md:w-4 text-white ${isUploadingAthleteAvatar ? 'animate-pulse' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                      
                      <div className="absolute top-0 left-0 p-1.5 md:p-3 text-left">
                        <h3 className="text-[10px] md:text-lg font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{viewingAsAthlete.athlete.name}</h3>
                        <p className="text-[7px] md:text-[9px] text-white/90 uppercase mt-0.5 tracking-wider drop-shadow-md font-semibold hidden md:block">{currentTeam?.name || "Team"}</p>
                      </div>

                      <div className="absolute bottom-0 left-0 p-1.5 md:p-4">
                        <p className="text-[8px] md:text-sm font-bold text-accent uppercase tracking-wider drop-shadow-lg">{viewingAsAthlete.athlete.position || "Player"}</p>
                      </div>

                      <div className="absolute bottom-0 right-0 p-1.5 md:p-4">
                        <div className="bg-gradient-to-r from-accent to-primary rounded md:rounded-lg p-1 md:p-3 shadow-lg">
                          <span className="text-white font-display font-bold text-xs md:text-2xl drop-shadow">#{viewingAsAthlete.athlete.number || "00"}</span>
                        </div>
                      </div>

                      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 hidden md:block">
                        <div className="flex flex-row items-center gap-1 -rotate-90 whitespace-nowrap origin-center">
                          <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                          <div className="w-0.5 h-2 bg-white/60"></div>
                          <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-44 md:h-96 overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                      <div className="relative w-full h-full p-1.5 md:p-3 grid grid-cols-2 gap-1 md:gap-2">
                        <div className="bg-white/5 border border-white/10 rounded p-1.5 md:p-3 overflow-hidden flex flex-col">
                          <p className="text-[6px] md:text-[8px] text-accent font-bold uppercase tracking-widest mb-0.5 md:mb-2">Events</p>
                          <div className="space-y-0.5 text-[7px] md:text-[9px] text-white/70 flex-1 overflow-y-auto">
                            {teamEvents.length === 0 ? (
                              <div className="text-[6px] md:text-[8px]">No events</div>
                            ) : (
                              teamEvents.slice(0, 2).map((event: Event) => (
                                <div key={event.id} className="line-clamp-1 md:line-clamp-2">
                                  <span className="font-semibold text-white">{event.type}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded p-1.5 md:p-3 overflow-hidden flex flex-col">
                          <p className="text-[6px] md:text-[8px] text-primary font-bold uppercase tracking-widest mb-0.5 md:mb-2">Stats</p>
                          <div className="space-y-1 flex-1">
                            <div>
                              <div className="flex justify-between items-end gap-1">
                                <span className="text-[6px] md:text-[8px] text-white/70">Goals</span>
                                <span className="text-[7px] md:text-[9px] font-bold text-primary">0</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-end gap-1">
                                <span className="text-[6px] md:text-[8px] text-white/70">Assists</span>
                                <span className="text-[7px] md:text-[9px] font-bold text-accent">0</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded p-1.5 md:p-3 overflow-hidden flex flex-col">
                          <p className="text-[6px] md:text-[8px] text-green-400 font-bold uppercase tracking-widest mb-0.5 md:mb-2">Highlights</p>
                          <div className="text-[6px] md:text-[9px] text-white/70 flex-1">
                            <div>No highlights</div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded p-1.5 md:p-3 overflow-hidden flex flex-col">
                          <p className="text-[6px] md:text-[8px] text-orange-400 font-bold uppercase tracking-widest mb-0.5 md:mb-2">Shoutouts</p>
                          <div className="text-[6px] md:text-[8px] text-white/70 italic flex-1">
                            <p className="line-clamp-2">No shoutouts</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setIsManagedAthleteCardFlipped(!isManagedAthleteCardFlipped)}
                className="w-full bg-white/5 border border-white/10 rounded py-1 md:py-2 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
                data-testid="button-flip-managed-athlete-card"
              >
                <p className="text-[8px] md:text-xs text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
              </button>
            </div>
          </div>
        ) : (
          <div ref={heroBannerRef}>
            {currentTeam && (
              <TeamHeroCard
                team={currentTeam}
                wins={currentTeam.wins || 0}
                losses={currentTeam.losses || 0}
                ties={currentTeam.ties || 0}
                rightSlot={
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 md:h-20 md:w-20 bg-white/10 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center shadow-xl overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name || "Supporter"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl md:text-2xl font-display font-bold text-white/60">
                          {user?.name?.split(' ').map(n => n[0]).join('') || "?"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 font-medium text-center max-w-[80px] truncate">{user?.name || "Supporter"}</p>
                  </div>
                }
                bottomSlot={
                  <span className="px-3 py-1.5 backdrop-blur-sm rounded-lg border bg-white/20 border-white/30 text-white text-xs font-bold uppercase tracking-wider">
                    Supporter
                  </span>
                }
              />
            )}
          </div>
        )}

        {activeSessions.length > 0 && (
          <button
            onClick={() => setLocation(`/supporter/live/${activeSessions[0].id}`)}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500/30 to-emerald-600/30 border border-green-500/50 
                       animate-pulse hover:animate-none hover:from-green-500/40 hover:to-emerald-600/40 transition-all 
                       flex items-center justify-between group"
            data-testid="button-join-live-session"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/30 rounded-xl">
                <Zap className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-green-400">LIVE GAME NOW!</p>
                <p className="text-sm text-white/80">
                  {currentTeam?.name} vs {activeSessions[0].event?.opponent || "Opponent"} • Tap to cheer!
                </p>
              </div>
            </div>
            <div className="text-green-400 font-bold text-xl group-hover:scale-110 transition-transform">
              JOIN →
            </div>
          </button>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
              className={`h-full p-4 rounded-lg border transition-all duration-200 backdrop-blur-sm group text-left ${
                selectedCard === action.id
                  ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/20"
                  : `border-white/5 bg-gradient-to-br ${action.color} hover:border-white/20 hover:bg-white/5`
              }`}
              data-testid={`card-${action.id}`}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                  <action.icon className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="font-bold text-sm md:text-base">{action.name}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">{action.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedCard && (
          <div ref={contentRef} className="relative rounded-xl overflow-hidden bg-card/50 border border-white/10 backdrop-blur-sm p-6 animate-in slide-in-from-top duration-300">
            <button
              onClick={() => {
                setSelectedCard(null);
                setTimeout(() => {
                  if (heroBannerRef.current) {
                    heroBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 50);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-display font-bold uppercase tracking-wide mb-6">
              {quickActions.find(a => a.id === selectedCard)?.name}
            </h3>
            <div className="overflow-x-auto">
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* Selected Athlete HYPE Card Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-24" onClick={() => setSelectedAthlete(null)}>
          <div className="relative w-80" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedAthlete(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-white/70 transition"
              data-testid="button-close-hype-modal"
            >
              <X className="h-8 w-8" />
            </button>

            <div className="w-full space-y-4">
              <div className="relative group" style={{ perspective: '1000px' }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                <div 
                  className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isAthleteCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.6s ease-in-out',
                    aspectRatio: '9/16'
                  }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                  
                  {!isAthleteCardFlipped ? (
                    <div className="relative w-full h-full overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                      {selectedAthlete.user.avatar ? (
                        <img src={selectedAthlete.user.avatar} alt={selectedAthlete.user.name || ""} className="absolute inset-0 w-full h-full object-contain" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <span className="text-8xl font-display font-bold text-white/30">
                            {selectedAthlete.user.name?.split(' ').map(n => n[0]).join('') || "?"}
                          </span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                      
                      <div className="absolute top-0 left-0 p-6 text-left">
                        <h3 className="text-4xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{selectedAthlete.user.name || selectedAthlete.user.username}</h3>
                        <p className="text-sm text-white/90 uppercase mt-2 tracking-wider drop-shadow-md font-semibold">{currentTeam?.name || "Team"}</p>
                      </div>

                      <div className="absolute bottom-0 left-0 p-6">
                        <p className="text-lg font-bold text-accent uppercase tracking-wider drop-shadow-lg">{selectedAthlete.position || selectedAthlete.user.position || "Player"}</p>
                      </div>

                      <div className="absolute bottom-0 right-0 p-6">
                        <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-4 shadow-lg">
                          <span className="text-white font-display font-bold text-4xl drop-shadow">#{selectedAthlete.jerseyNumber || selectedAthlete.user.number || "00"}</span>
                        </div>
                      </div>

                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                        <div className="flex flex-row items-center gap-2 -rotate-90 whitespace-nowrap origin-center">
                          <span className="text-sm text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                          <div className="w-1 h-3 bg-white/60"></div>
                          <span className="text-sm text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                      
                      <div className="relative w-full h-full p-6 grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                          <p className="text-sm text-accent font-bold uppercase tracking-widest mb-3">Events</p>
                          <div className="space-y-2 text-sm text-white/70 flex-1 overflow-y-auto">
                            {teamEvents.length === 0 ? (
                              <div className="text-sm">No events</div>
                            ) : (
                              teamEvents.slice(0, 2).map((event: Event) => (
                                <div key={event.id}>
                                  <span className="font-semibold text-white">{event.type}</span>
                                  <div className="text-xs">{new Date(event.date).toLocaleDateString()}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                          <p className="text-sm text-primary font-bold uppercase tracking-widest mb-3">Stats</p>
                          <div className="space-y-3 flex-1">
                            <div>
                              <div className="flex justify-between items-end gap-2 mb-1">
                                <span className="text-xs text-white/70">Goals</span>
                                <span className="text-sm font-bold text-primary">0</span>
                              </div>
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{width: "0%"}}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-end gap-2 mb-1">
                                <span className="text-xs text-white/70">Assists</span>
                                <span className="text-sm font-bold text-accent">0</span>
                              </div>
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent" style={{width: "0%"}}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                          <p className="text-sm text-green-400 font-bold uppercase tracking-widest mb-3">Highlights</p>
                          <div className="space-y-2 text-sm text-white/70 flex-1">
                            <div>Coming soon...</div>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                          <p className="text-sm text-orange-400 font-bold uppercase tracking-widest mb-3">Shoutouts</p>
                          <div className="text-sm text-white/70 italic flex-1">
                            <p className="line-clamp-4">"Excellent form lately!"</p>
                            <p className="text-xs mt-2 text-white/50">— Coach</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsAthleteCardFlipped(!isAthleteCardFlipped)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
                data-testid="button-hype-tap-to-flip"
              >
                <p className="text-sm text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged HYPE Card Modal */}
      {isHypeCardEnlarged && viewingAsAthlete && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsHypeCardEnlarged(false)}
          data-testid="modal-enlarged-hype-card"
        >
          <div 
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsHypeCardEnlarged(false)}
              className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white transition"
              data-testid="button-close-enlarged-hype"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div 
              className="relative rounded-xl overflow-hidden border-2 border-accent/50 shadow-2xl cursor-pointer bg-gradient-to-br from-slate-900 via-slate-800 to-black"
              onClick={() => setIsManagedAthleteCardFlipped(!isManagedAthleteCardFlipped)}
            >
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
              
              {!isManagedAthleteCardFlipped ? (
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  {viewingAsAthlete.athlete.avatar ? (
                    <img src={viewingAsAthlete.athlete.avatar} alt={viewingAsAthlete.athlete.name || ""} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                      <User className="h-32 w-32 text-white/40" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                  
                  <div className="absolute top-0 left-0 p-4 text-left">
                    <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{viewingAsAthlete.athlete.name}</h3>
                    <p className="text-sm text-white/90 uppercase mt-1 tracking-wider drop-shadow-md font-semibold">{currentTeam?.name || "Team"}</p>
                  </div>

                  <div className="absolute bottom-0 left-0 p-5">
                    <p className="text-lg font-bold text-accent uppercase tracking-wider drop-shadow-lg">{viewingAsAthlete.athlete.position || "Player"}</p>
                  </div>

                  <div className="absolute bottom-0 right-0 p-5">
                    <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-4 shadow-lg">
                      <span className="text-white font-display font-bold text-3xl drop-shadow">#{viewingAsAthlete.athlete.number || "00"}</span>
                    </div>
                  </div>

                  <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <div className="flex flex-row items-center gap-1 -rotate-90 whitespace-nowrap origin-center">
                      <span className="text-xs text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                      <div className="w-0.5 h-3 bg-white/60"></div>
                      <span className="text-xs text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                  <div className="relative w-full h-full p-4 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                      <p className="text-sm text-accent font-bold uppercase tracking-widest mb-3">Events</p>
                      <div className="space-y-2 text-sm text-white/70 flex-1 overflow-y-auto">
                        {teamEvents.length === 0 ? (
                          <div className="text-xs">No events</div>
                        ) : (
                          teamEvents.slice(0, 3).map((event: Event) => (
                            <div key={event.id} className="line-clamp-2">
                              <span className="font-semibold text-white">{event.type}</span>
                              <div className="text-xs">{new Date(event.date).toLocaleDateString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                      <p className="text-sm text-primary font-bold uppercase tracking-widest mb-3">Stats</p>
                      <div className="space-y-3 flex-1">
                        <div>
                          <div className="flex justify-between items-end gap-2 mb-1">
                            <span className="text-xs text-white/70">Goals</span>
                            <span className="text-sm font-bold text-primary">0</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{width: "0%"}}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-end gap-2 mb-1">
                            <span className="text-xs text-white/70">Assists</span>
                            <span className="text-sm font-bold text-accent">0</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{width: "0%"}}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                      <p className="text-sm text-green-400 font-bold uppercase tracking-widest mb-3">Highlights</p>
                      <div className="space-y-2 text-sm text-white/70 flex-1">
                        <div>No highlights yet</div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                      <p className="text-sm text-orange-400 font-bold uppercase tracking-widest mb-3">Shoutouts</p>
                      <div className="text-sm text-white/70 italic flex-1">
                        <p className="line-clamp-4">No shoutouts yet</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-center text-white/50 text-sm mt-4">Tap card to flip</p>
          </div>
        </div>
      )}
    </div>
  );
}
