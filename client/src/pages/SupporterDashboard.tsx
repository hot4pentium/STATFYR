import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, MapPin, Users, BarChart3, MessageSquare, Settings, LogOut, Clock, Video, Trophy, BookOpen, AlertCircle, Sun, Moon, Bell, Lock, ArrowLeft, Flame, Star, Heart, Share2, X, ChevronDown, Info, Copy, Check, History, Play as PlayIcon, StopCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, getTeamPlays, getSupporterBadges, getAllBadges, getActiveTheme, type TeamMember, type Event, type HighlightVideo, type Play, type SupporterBadge, type BadgeDefinition } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePWA } from "@/lib/pwaContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { useAppBadge } from "@/hooks/useAppBadge";
import { parseTextDate, formatTextDate } from "@/lib/dateUtils";

type SectionType = "schedule" | "roster" | "stats" | "highlights" | "playbook" | "chat" | "athlete-profile" | "game-day-live" | null;

export default function SupporterDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout, isLoading } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { entitlements } = useEntitlements();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SectionType>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [demoModal, setDemoModal] = useState<"hype-hub" | "hype-card" | null>(null);
  const [selectedAthleteIndex, setSelectedAthleteIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [themeDialogBadge, setThemeDialogBadge] = useState<{ themeId: string; name: string; emoji: string } | null>(null);
  const [showStartSeasonDialog, setShowStartSeasonDialog] = useState(false);
  const [showEndSeasonDialog, setShowEndSeasonDialog] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkLandscape = () => {
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches && window.innerWidth > 600);
    };
    checkLandscape();
    window.addEventListener("resize", checkLandscape);
    window.addEventListener("orientationchange", checkLandscape);
    return () => {
      window.removeEventListener("resize", checkLandscape);
      window.removeEventListener("orientationchange", checkLandscape);
    };
  }, []);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamHighlights = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && selectedCard === "highlights",
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && selectedCard === "playbook",
  });

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations-unread", currentTeam?.id, user?.id],
    queryFn: async () => {
      if (!currentTeam?.id || !user?.id) return [];
      const res = await fetch(`/api/teams/${currentTeam.id}/conversations?userId=${user.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentTeam?.id && !!user?.id,
    refetchInterval: 10000,
  });

  const unreadCount = useMemo(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
      return conversationsData.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
    }
    return 0;
  }, [conversationsData]);

  // Sync unread count to app badge on native platforms
  useAppBadge(unreadCount);

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach" || m.role === "staff"), [teamMembers]);

  // Check if this supporter has been promoted to staff on this team
  const currentMembership = useMemo(() => {
    if (!user || !currentTeam || !teamMembers.length) return null;
    return teamMembers.find((m: TeamMember) => m.userId === user.id);
  }, [user, currentTeam, teamMembers]);

  const isStaff = currentMembership?.role === "staff";

  // Redirect staff members to UnifiedDashboard for full access
  useEffect(() => {
    if (isStaff && currentTeam) {
      toast.success("You've been promoted to Staff! Redirecting to your new dashboard...", {
        duration: 3000,
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    }
  }, [isStaff, currentTeam, setLocation]);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  // Allow independent mode - don't redirect if no team
  const isIndependentMode = !currentTeam;

  // Fetch managed athletes
  const { data: managedAthletes = [] } = useQuery({
    queryKey: ["/api/supporter/managed-athletes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/supporter/managed-athletes`, {
        headers: { "x-user-id": user.id },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.managedAthletes || [];
    },
    enabled: !!user?.id,
  });

  // Get the currently selected athlete (for profile switching)
  const selectedAthlete = managedAthletes[selectedAthleteIndex] || managedAthletes[0];

  // Badge/Theme queries
  const { data: earnedBadges = [] } = useQuery({
    queryKey: ["supporter-badges", user?.id, currentTeam?.id, "2024-2025"],
    queryFn: () => getSupporterBadges(user!.id, currentTeam!.id, "2024-2025"),
    enabled: !!user?.id && !!currentTeam?.id,
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["all-badges"],
    queryFn: getAllBadges,
    enabled: !!user?.id,
  });

  const { data: activeTheme } = useQuery({
    queryKey: ["active-theme", user?.id],
    queryFn: () => getActiveTheme(user!.id),
    enabled: !!user?.id,
  });

  // Apply theme to HTML element when active theme changes
  useEffect(() => {
    if (activeTheme?.themeId && activeTheme.themeId !== "basic") {
      document.documentElement.setAttribute("data-badge-theme", activeTheme.themeId);
    } else {
      document.documentElement.removeAttribute("data-badge-theme");
    }
    return () => {
      document.documentElement.removeAttribute("data-badge-theme");
    };
  }, [activeTheme?.themeId]);

  // Compute which badges have been earned and have themes
  const earnedBadgeThemes = useMemo(() => {
    if (!allBadges.length || !earnedBadges.length) return [];
    const earnedBadgeIds = earnedBadges.map((eb: SupporterBadge) => eb.badgeId);
    return allBadges.filter((b: BadgeDefinition) => 
      earnedBadgeIds.includes(b.id) && b.themeId
    );
  }, [allBadges, earnedBadges]);

  // Theme activation mutation
  const activateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const res = await fetch(`/api/supporters/${user!.id}/themes/${themeId}/activate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to activate theme");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-theme"] });
      toast.success("Theme applied!");
      setThemeDialogBadge(null);
    },
    onError: () => {
      toast.error("Failed to apply theme");
    },
  });

  // Supporter Season Management Mutations
  const startSeasonMutation = useMutation({
    mutationFn: async ({ athleteId, seasonName }: { athleteId: number; seasonName: string }) => {
      const res = await fetch(`/api/supporter/managed-athletes/${athleteId}/start-season`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ season: seasonName }),
      });
      if (!res.ok) throw new Error("Failed to start season");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supporter/managed-athletes"] });
      toast.success("Season started!");
      setShowStartSeasonDialog(false);
      setNewSeasonName("");
    },
    onError: () => {
      toast.error("Failed to start season");
    },
  });

  const endSeasonMutation = useMutation({
    mutationFn: async (athleteId: number) => {
      const res = await fetch(`/api/supporter/managed-athletes/${athleteId}/end-season`, {
        method: "POST",
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) throw new Error("Failed to end season");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supporter/managed-athletes"] });
      queryClient.invalidateQueries({ queryKey: ["supporter-season-archives"] });
      toast.success("Season ended and archived!");
      setShowEndSeasonDialog(false);
    },
    onError: () => {
      toast.error("Failed to end season");
    },
  });

  // Fetch season archives for the selected athlete
  const { data: seasonArchives = [] } = useQuery({
    queryKey: ["supporter-season-archives", selectedAthlete?.id],
    queryFn: async () => {
      if (!selectedAthlete?.id) return [];
      const res = await fetch(`/api/supporter/managed-athletes/${selectedAthlete.id}/season-archives`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.archives || [];
    },
    enabled: !!selectedAthlete?.id && isIndependentMode,
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleCardClick = (cardId: string, isLocked: boolean = false) => {
    if (isLocked) {
      toast.error("Upgrade to Supporter Pro to unlock this feature!", {
        action: {
          label: "Upgrade",
          onClick: () => setLocation("/supporter/settings?tab=subscription"),
        },
      });
      return;
    }
    if (cardId === "chat") {
      setLocation("/chat");
      return;
    }
    setSelectedCard(selectedCard === cardId ? null : cardId as SectionType);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  // Different nav cards for independent vs team mode
  const navCards = isIndependentMode ? [
    { id: "athlete-profile", name: "My Athlete", icon: Users, description: "Edit athlete profile & photo.", locked: false },
    { id: "schedule", name: "Calendar", icon: CalendarIcon, description: "Track games & practices.", locked: false },
    { id: "stats", name: "Stats", icon: BarChart3, description: "Track your athlete's stats.", locked: false },
    { id: "highlights", name: "Highlights", icon: Video, description: "Upload video highlights.", locked: !entitlements?.canViewHighlights },
  ] : [
    { id: "roster", name: "Roster", icon: Users, description: "Access and view player roster.", locked: false },
    { id: "schedule", name: "Calendar", icon: CalendarIcon, description: "View and manage team schedule.", locked: false },
    { id: "playbook", name: "Playbook", icon: BookOpen, description: "View team plays and formations.", locked: false },
    { id: "stats", name: "Stats", icon: BarChart3, description: "View statistics recorded with StatTracker.", locked: false },
    { id: "highlights", name: "Highlights", icon: Video, description: "Team video highlights.", locked: !entitlements?.canViewHighlights },
    { id: "game-day-live", name: "Game Day Live", icon: Flame, description: "Cheer during live games!", locked: false },
  ];

  const welcomeModal: WelcomeModal = isIndependentMode ? {
    title: "Welcome, Supporter!",
    subtitle: `Managing ${selectedAthlete?.athleteName || "your athlete"}`,
    description: "Track stats, share HYPE posts, and create a digital trading card for your athlete!",
    buttonText: "Let's Go!"
  } : {
    title: "Welcome, Supporter!",
    subtitle: `Cheering for ${currentTeam?.name || "the team"}`,
    description: "You're all set to support your athletes! Let us show you around so you can stay connected.",
    buttonText: "Let's Go!"
  };

  const tourSteps: TourStep[] = isIndependentMode ? [
    { target: '[data-testid="card-hype-hub"]', title: "HYPE Hub", description: "Post updates about your athlete.", position: "bottom" },
    { target: '[data-testid="card-hype-card"]', title: "HYPE Card", description: "Create a shareable trading card.", position: "bottom" },
    { target: '[data-testid="card-nav-stats"]', title: "Stats", description: "Track your athlete's performance.", position: "bottom" },
  ] : [
    { target: '[data-testid="card-nav-schedule"]', title: "Team Calendar", description: "View upcoming games and practices.", position: "bottom" },
    { target: '[data-testid="card-nav-roster"]', title: "Team Roster", description: "See all team members.", position: "bottom" },
    { target: '[data-testid="card-nav-stats"]', title: "Team Stats", description: "View team performance.", position: "bottom" },
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Check if independent supporter has no managed athletes yet
  if (isIndependentMode && managedAthletes.length === 0) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold uppercase">Get Started</h2>
              <p className="text-sm text-muted-foreground">
                Add your athlete to start tracking their stats, creating HYPE posts, and more!
              </p>
              <div className="space-y-3 pt-2">
                <Button 
                  className="w-full" 
                  onClick={() => setLocation("/supporter/onboarding")}
                  data-testid="button-add-athlete"
                >
                  Add Your Athlete
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/supporter/onboarding?step=team-code")}
                  data-testid="button-join-team"
                >
                  I Have a Team Code
                </Button>
              </div>
              <div className="pt-4 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                  data-testid="button-get-started-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBackground />
      <div className="min-h-screen relative z-10">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="STATFYR" className="h-8 w-8" />
              <h1 className="text-lg font-display font-bold tracking-wide">STATF<span className="text-orange-500">Y</span>R</h1>
            </div>
            <div className="flex items-center gap-2">
              {updateAvailable && (
                <Button variant="ghost" size="icon" onClick={applyUpdate} className="text-amber-500 animate-pulse" data-testid="button-update">
                  <AlertCircle className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setLocation("/chat")} className={unreadCount > 0 ? "text-green-500 relative" : "relative"} data-testid="button-messages">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              {mounted && (
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-white/10" data-testid="button-theme">
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              )}
              <Link href="/supporter/settings">
                <Button variant="ghost" size="icon" data-testid="button-settings"><Settings className="h-5 w-5" /></Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout"><LogOut className="h-5 w-5" /></Button>
            </div>
          </div>
        </header>

        {user?.id && (
          <OnboardingTour steps={tourSteps} storageKey={`supporter-onboarding-${user.id}`} welcomeModal={welcomeModal} />
        )}

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Hero Section - Different for Independent vs Team mode */}
          <div ref={heroRef} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-primary/20 dark:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
            <div className="relative p-4 md:p-8 flex flex-row gap-4 md:gap-6 items-center">
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 rounded-xl border-2 border-primary/50 shadow-lg">
                <AvatarImage src={isIndependentMode ? (selectedAthlete?.profileImageUrl || "") : (user?.avatar || "")} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-primary/20 rounded-xl">
                  {isIndependentMode 
                    ? (selectedAthlete?.athleteName || "A").charAt(0).toUpperCase()
                    : (user?.name || user?.username || "S").charAt(0).toUpperCase()
                  }
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                {isIndependentMode ? (
                  <>
                    <p className="text-xs text-primary font-bold uppercase tracking-wider">Independent Mode</p>
                    {managedAthletes.length > 1 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide hover:opacity-80 transition-opacity" data-testid="button-switch-athlete">
                            {selectedAthlete?.athleteName || "My Athlete"}
                            <ChevronDown className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {managedAthletes.map((athlete: any, index: number) => (
                            <DropdownMenuItem 
                              key={athlete.id}
                              onClick={() => setSelectedAthleteIndex(index)}
                              className={selectedAthleteIndex === index ? "bg-primary/10" : ""}
                              data-testid={`athlete-option-${athlete.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={athlete.profileImageUrl || ""} />
                                  <AvatarFallback className="text-xs">{(athlete.athleteName || "A").charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{athlete.athleteName}</span>
                                {athlete.teamId && <Badge variant="outline" className="text-[10px] ml-1">Team</Badge>}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                        {selectedAthlete?.athleteName || "My Athlete"}
                      </h1>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedAthlete?.sport} {selectedAthlete?.position ? `• ${selectedAthlete.position}` : ""} {selectedAthlete?.number ? `• #${selectedAthlete.number}` : ""}
                    </p>
                    {selectedAthlete?.shareCode && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded border border-muted-foreground/20">
                          <span className="text-xs text-muted-foreground">Athlete Code:</span>
                          <span className="text-sm font-mono font-bold tracking-wider">{selectedAthlete.shareCode}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedAthlete.shareCode);
                              setCopiedCode(true);
                              toast.success("Code copied!");
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="ml-1 p-0.5 hover:bg-muted rounded"
                            data-testid="button-copy-athlete-code"
                          >
                            {copiedCode ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded" data-testid="button-athlete-code-info">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 text-sm">
                            <p className="font-medium mb-1">Share this code!</p>
                            <p className="text-muted-foreground text-xs">
                              Other supporters can use this code to follow {selectedAthlete?.athleteName}'s stats, highlights, and HYPE posts.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setLocation("/supporter/onboarding?step=team-code")}
                      data-testid="button-join-team-hero"
                    >
                      Join a Team
                    </Button>
                    
                    {/* Season Management for Independent Mode */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {selectedAthlete?.seasonStatus === "active" ? (
                        <>
                          <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs">
                            <PlayIcon className="h-3 w-3 mr-1" />
                            {selectedAthlete.season || "Active Season"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-500 border-red-500/50 hover:bg-red-500/10"
                            onClick={() => setShowEndSeasonDialog(true)}
                            data-testid="button-end-season"
                          >
                            <StopCircle className="h-3 w-3 mr-1" />
                            End Season
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-green-500 border-green-500/50 hover:bg-green-500/10"
                          onClick={() => setShowStartSeasonDialog(true)}
                          data-testid="button-start-season"
                        >
                          <PlayIcon className="h-3 w-3 mr-1" />
                          Start New Season
                        </Button>
                      )}
                      {seasonArchives.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          onClick={() => setLocation(`/supporter/season-history/${selectedAthlete?.id}`)}
                          data-testid="button-view-season-history"
                        >
                          <History className="h-3 w-3 mr-1" />
                          View History ({seasonArchives.length})
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {currentTeam?.badgeId && (
                        <img 
                          src={currentTeam.badgeId} 
                          alt={`${currentTeam.name} badge`} 
                          className="h-8 w-8 object-contain"
                        />
                      )}
                      <p className="text-xs text-primary font-bold uppercase tracking-wider">{currentTeam?.name}</p>
                    </div>
                    {managedAthletes.length > 1 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide hover:opacity-80 transition-opacity" data-testid="button-switch-athlete-team">
                            {selectedAthlete?.athlete?.name || selectedAthlete?.athleteName || "Supporter Dashboard"}
                            <ChevronDown className="h-5 w-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {managedAthletes.map((athlete: any, index: number) => (
                            <DropdownMenuItem 
                              key={athlete.id}
                              onClick={() => setSelectedAthleteIndex(index)}
                              className={selectedAthleteIndex === index ? "bg-primary/10" : ""}
                              data-testid={`athlete-option-team-${athlete.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={athlete.athlete?.avatar || athlete.profileImageUrl || ""} />
                                  <AvatarFallback className="text-xs">{(athlete.athlete?.name || athlete.athleteName || "A").charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{athlete.athlete?.name || athlete.athleteName}</span>
                                {athlete.team && <Badge variant="outline" className="text-[10px] ml-1">{athlete.team.name}</Badge>}
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                        Supporter Dashboard
                      </h1>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">Welcome, {user?.name?.split(' ')[0] || user?.username}!</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-muted/50 rounded border border-muted-foreground/20">
                        <span className="text-xs font-bold text-green-500">{currentTeam?.wins || 0}W</span>
                        <span className="text-muted-foreground/50">-</span>
                        <span className="text-xs font-bold text-red-500">{currentTeam?.losses || 0}L</span>
                        <span className="text-muted-foreground/50">-</span>
                        <span className="text-xs font-bold text-yellow-500">{currentTeam?.ties || 0}T</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Earned Badges - Bottom Right of Hero */}
              {earnedBadgeThemes.length > 0 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {earnedBadgeThemes.map((badge: BadgeDefinition) => (
                    <button
                      key={badge.id}
                      onClick={() => setThemeDialogBadge({ themeId: badge.themeId!, name: badge.name, emoji: badge.iconEmoji })}
                      className={`text-3xl hover:scale-110 transition-transform cursor-pointer ${
                        activeTheme?.themeId === badge.themeId ? 'ring-2 ring-primary rounded-full p-1' : ''
                      }`}
                      title={`${badge.name} Badge - Tap to apply theme`}
                      data-testid={`badge-${badge.id}`}
                    >
                      {badge.iconEmoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {managedAthletes.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card 
                onClick={() => {
                  if (!entitlements?.canUploadHighlights) {
                    setDemoModal("hype-hub");
                    return;
                  }
                  setLocation("/supporter/hype-portal");
                }}
                className={`relative bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 border-primary/40 hover:border-primary/60 transition-all cursor-pointer group ${!entitlements?.canUploadHighlights ? "opacity-75" : ""}`}
                data-testid="card-hype-hub"
              >
                {!entitlements?.canUploadHighlights && (
                  <div className="absolute top-2 right-2 z-10">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                )}
                <CardContent className="p-3 sm:p-5 flex flex-col items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg group-hover:scale-110 transition-transform">
                    <Flame className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-lg uppercase text-primary">HYPE Hub</h3>
                  <p className="hidden sm:block text-xs text-muted-foreground">Post updates & fire up followers</p>
                </CardContent>
              </Card>

              <Card 
                onClick={() => {
                  if (!entitlements?.canViewHighlights) {
                    setDemoModal("hype-card");
                    return;
                  }
                  setLocation("/supporter/hype-card");
                }}
                className={`relative bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-cyan-500/40 hover:border-cyan-500/60 transition-all cursor-pointer group ${!entitlements?.canViewHighlights ? "opacity-75" : ""}`}
                data-testid="card-hype-card"
              >
                {!entitlements?.canViewHighlights && (
                  <div className="absolute top-2 right-2 z-10">
                    <Lock className="h-4 w-4 text-cyan-500" />
                  </div>
                )}
                <CardContent className="p-3 sm:p-5 flex flex-col items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg group-hover:scale-110 transition-transform">
                    <Trophy className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-lg uppercase text-cyan-500">HYPE Card</h3>
                  <p className="hidden sm:block text-xs text-muted-foreground">View & share player card</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Two-column layout on landscape, sliding panels on portrait */}
          <div className="flex flex-col landscape:flex-row landscape:gap-6 relative">
            {/* Left Column - Cards (slides left when content selected on mobile) */}
            <div 
              className={`landscape:w-1/3 landscape:shrink-0 transition-all duration-500 ease-out ${
                selectedCard ? 'portrait:-translate-x-full portrait:absolute portrait:opacity-0' : 'portrait:translate-x-0'
              }`}
            >
              <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary mb-4">Quick Access</h2>
              <div className="grid grid-cols-2 gap-3 landscape:gap-4">
                {navCards.map((card) => (
                  <Card 
                    key={card.id}
                    onClick={() => handleCardClick(card.id, card.locked)}
                    className={`relative bg-slate-200 dark:bg-card/80 backdrop-blur-sm border-slate-300 dark:border-white/5 hover:border-primary/50 transition-all cursor-pointer group shadow-lg shadow-black/10 dark:shadow-none hover:scale-[1.02] ${
                      selectedCard === card.id ? "border-primary ring-2 ring-primary/20" : ""
                    } ${card.locked ? "opacity-75" : ""}`}
                    data-testid={`card-nav-${card.id}`}
                  >
                    {card.locked && (
                      <div className="absolute top-2 right-2 z-10">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <CardContent className="p-3 landscape:p-5 flex flex-col landscape:flex-row items-center landscape:items-start gap-2 landscape:gap-4">
                      <div className={`p-2 rounded-lg border transition-colors ${
                        selectedCard === card.id ? "bg-primary/20 border-primary/40" : "bg-primary/10 border-primary/20 group-hover:bg-primary/20"
                      }`}>
                        <card.icon className="h-5 w-5 landscape:h-6 landscape:w-6 text-primary" />
                      </div>
                      <div className="text-center landscape:text-left">
                        <h3 className="font-bold text-sm landscape:text-base">{card.name}</h3>
                        <p className="hidden landscape:block text-xs text-muted-foreground">{card.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column - Content Area (slides up on mobile) */}
            <div 
              ref={contentRef}
              className={`landscape:flex-1 landscape:mt-0 landscape:min-h-[400px] transition-all duration-300 ease-out ${
                selectedCard 
                  ? 'portrait:mt-4 portrait:animate-in portrait:fade-in portrait:slide-in-from-bottom-4' 
                  : 'portrait:hidden landscape:opacity-50'
              }`}
            >
              {selectedCard ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCard(null)} className="gap-2" data-testid="button-back">
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">
                      {navCards.find(c => c.id === selectedCard)?.name}
                    </h2>
                  </div>

              {/* Athlete Profile Section - Independent Mode Only */}
              {selectedCard === "athlete-profile" && isIndependentMode && selectedAthlete && (
                <Card className="bg-white/80 dark:bg-slate-900/80">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 rounded-xl">
                        <AvatarImage src={selectedAthlete.profileImageUrl || ""} />
                        <AvatarFallback className="text-2xl rounded-xl">
                          {(selectedAthlete.athleteName || "A").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{selectedAthlete.athleteName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedAthlete.sport} {selectedAthlete.position ? `• ${selectedAthlete.position}` : ""} {selectedAthlete.number ? `• #${selectedAthlete.number}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation("/supporter/onboarding?edit=true")}
                        data-testid="button-edit-athlete"
                      >
                        Edit Profile
                      </Button>
                      {managedAthletes.length < entitlements.maxManagedAthletes ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation("/supporter/onboarding")}
                        data-testid="button-add-another-athlete"
                      >
                        Add Another Athlete
                      </Button>
                      ) : (
                      <Button 
                        variant="outline" 
                        className="w-full opacity-75"
                        onClick={() => setLocation("/subscription")}
                        data-testid="button-upgrade-for-athletes"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Upgrade for More Athletes
                      </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedCard === "schedule" && (
                <div className="space-y-4">
                  {(isIndependentMode ? [] : teamEvents).length === 0 ? (
                    <Card className="p-8 text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-bold">{isIndependentMode ? "No events yet" : "No events scheduled"}</p>
                      {isIndependentMode && (
                        <p className="text-sm text-muted-foreground mt-2">Join a team to see their schedule, or track your own games.</p>
                      )}
                    </Card>
                  ) : (
                    teamEvents.map((event: Event) => (
                      <Card key={event.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all" data-testid={`event-${event.id}`}>
                        <CardContent className="p-4">
                          <Badge variant="outline" className="mb-2">{event.type}</Badge>
                          <h3 className="font-bold text-lg">{event.title}</h3>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-primary" />
                              <span>{formatTextDate(event.date, "date")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span>{formatTextDate(event.date, "time")}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          {event.opponent && (
                            <Badge className="mt-3 bg-accent/20 text-accent">vs {event.opponent}</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {selectedCard === "roster" && (
                <div className="space-y-6">
                  {coaches.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Coaches & Staff</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {coaches.map((member: TeamMember) => (
                          <Card key={member.id} className="bg-white/80 dark:bg-slate-900/80" data-testid={`member-${member.id}`}>
                            <CardContent className="p-4 text-center">
                              <Avatar className="h-16 w-16 mx-auto mb-2">
                                <AvatarImage src={member.user.avatar || ""} />
                                <AvatarFallback>{(member.user.name || "?").charAt(0)}</AvatarFallback>
                              </Avatar>
                              <p className="font-semibold text-sm">{member.user.name || member.user.username}</p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Athletes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {athletes.map((member: TeamMember) => (
                        <Card key={member.id} className="bg-white/80 dark:bg-slate-900/80" data-testid={`member-${member.id}`}>
                          <CardContent className="p-4 text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-2">
                              <AvatarImage src={member.user.avatar || ""} />
                              <AvatarFallback>{(member.user.name || "?").charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm">{member.user.name || member.user.username}</p>
                            <p className="text-xs text-muted-foreground">{member.position || "Athlete"}</p>
                            {member.jerseyNumber && <Badge variant="outline" className="mt-1">#{member.jerseyNumber}</Badge>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedCard === "playbook" && (
                <div className="space-y-4">
                  {teamPlays.length === 0 ? (
                    <Card className="p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-bold">No plays yet</p>
                      <p className="text-sm text-muted-foreground">Your coach will add plays soon.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {teamPlays.map((play: Play) => (
                        <Card key={play.id} className="bg-white/80 dark:bg-slate-900/80 overflow-hidden" data-testid={`play-${play.id}`}>
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {play.thumbnailData ? (
                              <img src={play.thumbnailData} alt={play.name} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="font-semibold text-sm truncate">{play.name}</p>
                            {play.category && <Badge variant="outline" className="mt-1 text-xs">{play.category}</Badge>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedCard === "stats" && (
                <Card className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-bold">Team Stats</p>
                  <p className="text-sm text-muted-foreground">Stats will appear here when the coach records them during games.</p>
                </Card>
              )}

              {selectedCard === "highlights" && (
                <div className="space-y-4">
                  {teamHighlights.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-bold">No highlights yet</p>
                      <p className="text-sm text-muted-foreground">Video highlights will appear here.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {teamHighlights.map((highlight: HighlightVideo) => (
                        <Card key={highlight.id} className="overflow-hidden" data-testid={`highlight-${highlight.id}`}>
                          <div className="aspect-video bg-muted">
                            {highlight.thumbnailKey ? (
                              <img src={`/api/highlights/${highlight.id}/thumbnail`} alt={highlight.title || ""} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="font-semibold text-sm truncate">{highlight.title || "Untitled"}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedCard === "game-day-live" && (
                <div className="space-y-4">
                  <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-primary/30">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                        <Flame className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Game Day Live</h3>
                      <p className="text-muted-foreground">
                        Send shoutouts and cheers to athletes during live games! When a game is in progress, you'll be able to tap to send real-time encouragement.
                      </p>
                      <div className="pt-4 border-t border-primary/20">
                        <p className="text-sm text-muted-foreground">
                          Check the <span className="font-semibold text-primary">Calendar</span> for upcoming games.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
                </>
              ) : (
                <div className="hidden landscape:flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a card to view details</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <Link href="/chat">
          <button
            className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center z-50 ${unreadCount > 0 ? 'animate-pulse ring-4 ring-green-500/50' : ''}`}
            data-testid="button-floating-chat"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </Link>
      </div>

      {/* Demo Modal for Locked Features */}
      <Dialog open={demoModal !== null} onOpenChange={() => setDemoModal(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {demoModal === "hype-hub" && (
            <div className="relative">
              <div className="bg-gradient-to-br from-primary via-accent to-primary p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <Flame className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold uppercase">HYPE Hub</h2>
                    <p className="text-white/80 text-sm">Fire up your athlete's fans!</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                      <Heart className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Post HYPE Updates</p>
                      <p className="text-xs text-muted-foreground">Share photos, stats, and achievements with fans</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Celebrate Moments</p>
                      <p className="text-xs text-muted-foreground">Highlight game-winning plays and milestones</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                      <Share2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Share with Family</p>
                      <p className="text-xs text-muted-foreground">Let grandparents and friends follow along</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-3 mb-2">
                    <p className="text-center text-sm font-medium text-primary dark:text-primary">
                      One subscription unlocks everything!
                    </p>
                    <p className="text-center text-xs text-primary/80 dark:text-primary/80 mt-1">
                      HYPE Hub + HYPE Card + Highlights included
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    onClick={() => {
                      setDemoModal(null);
                      setLocation("/supporter/settings?tab=subscription");
                    }}
                    data-testid="button-upgrade-hype-hub"
                  >
                    Unlock All for $5.99/month
                  </Button>
                </div>
              </div>
            </div>
          )}

          {demoModal === "hype-card" && (
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-cyan-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/20">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold uppercase">HYPE Card</h2>
                    <p className="text-white/80 text-sm">Your athlete's digital trading card!</p>
                  </div>
                </div>
              </div>

              {/* Demo Card Preview */}
              <div className="p-6 space-y-4">
                <div className="relative mx-auto w-48 aspect-[3/4] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-3 shadow-xl">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20" />
                  <div className="relative h-full flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-2">
                      <Trophy className="h-8 w-8" />
                    </div>
                    <p className="font-display font-bold text-sm uppercase">Player Name</p>
                    <p className="text-xs text-cyan-300">#00 • Position</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">--</p>
                        <p className="text-[10px] text-slate-400">PTS</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">--</p>
                        <p className="text-[10px] text-slate-400">AST</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">--</p>
                        <p className="text-[10px] text-slate-400">REB</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-xl border border-white/10" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                      <Share2 className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Share Anywhere</p>
                      <p className="text-xs text-muted-foreground">Download and share on social media</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 mb-2">
                    <p className="text-center text-sm font-medium text-cyan-700 dark:text-cyan-300">
                      One subscription unlocks everything!
                    </p>
                    <p className="text-center text-xs text-cyan-600/80 dark:text-cyan-400/80 mt-1">
                      HYPE Card + HYPE Hub + Highlights included
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    onClick={() => {
                      setDemoModal(null);
                      setLocation("/supporter/settings?tab=subscription");
                    }}
                    data-testid="button-upgrade-hype-card"
                  >
                    Unlock All for $5.99/month
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Theme Switch Dialog */}
      <Dialog open={themeDialogBadge !== null} onOpenChange={(open) => !open && setThemeDialogBadge(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{themeDialogBadge?.emoji}</span>
              {themeDialogBadge?.themeId === "basic" ? "Basic Theme" : `${themeDialogBadge?.name} Badge`}
            </DialogTitle>
            <DialogDescription>
              {themeDialogBadge?.themeId === "basic"
                ? "Switch to the default look with no custom background."
                : activeTheme?.themeId === themeDialogBadge?.themeId 
                  ? "This theme is currently active."
                  : "Would you like to apply this badge's custom theme to your dashboard?"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            {activeTheme?.themeId !== themeDialogBadge?.themeId && (
              <Button 
                onClick={() => themeDialogBadge && activateThemeMutation.mutate(themeDialogBadge.themeId)}
                disabled={activateThemeMutation.isPending}
              >
                Apply {themeDialogBadge?.name} Theme
              </Button>
            )}
            {themeDialogBadge?.themeId !== "basic" && activeTheme?.themeId && activeTheme.themeId !== "basic" && (
              <Button 
                variant="secondary"
                onClick={() => activateThemeMutation.mutate("basic")}
                disabled={activateThemeMutation.isPending}
              >
                Switch to Basic Theme
              </Button>
            )}
            <Button variant="outline" onClick={() => setThemeDialogBadge(null)}>
              {activeTheme?.themeId === themeDialogBadge?.themeId ? "Close" : "Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Season Dialog */}
      <Dialog open={showStartSeasonDialog} onOpenChange={setShowStartSeasonDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayIcon className="h-5 w-5 text-green-500" />
              Start New Season
            </DialogTitle>
            <DialogDescription>
              Start tracking a new season for {selectedAthlete?.athleteName}. All stats and events will be associated with this season.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="season-name">Season Name</Label>
              <Input
                id="season-name"
                placeholder="e.g., Spring 2026, Fall League"
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                data-testid="input-season-name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowStartSeasonDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedAthlete && startSeasonMutation.mutate({ 
                athleteId: selectedAthlete.id, 
                seasonName: newSeasonName || `Season ${new Date().getFullYear()}` 
              })}
              disabled={startSeasonMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
              data-testid="button-confirm-start-season"
            >
              {startSeasonMutation.isPending ? "Starting..." : "Start Season"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Season Dialog */}
      <Dialog open={showEndSeasonDialog} onOpenChange={setShowEndSeasonDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StopCircle className="h-5 w-5 text-red-500" />
              End Season
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to end the current season? All stats and events will be archived and you can view them in Season History.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mt-2">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>What gets archived:</strong>
            </p>
            <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 space-y-0.5 list-disc pl-4">
              <li>All game statistics</li>
              <li>Events and practices</li>
              <li>Performance records</li>
            </ul>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEndSeasonDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAthlete && endSeasonMutation.mutate(selectedAthlete.id)}
              disabled={endSeasonMutation.isPending}
              data-testid="button-confirm-end-season"
            >
              {endSeasonMutation.isPending ? "Ending..." : "End Season"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
