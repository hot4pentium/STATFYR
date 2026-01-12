import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, BarChart3, Settings, LogOut, Moon, Sun, Users, Video, BookOpen, Trophy, AlertCircle, ArrowLeft, MapPin, Clock, Trash2, Play as PlayIcon, Loader2, Bell, Share2, Flame, ExternalLink, Copy, MessageSquare, Lock, Plus, Upload, Info, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, getTeamAggregateStats, getAdvancedTeamStats, getAthleteStats, getAthleteShoutouts, getAthleteShoutoutCount, joinTeamByCode, getUnreadMessageCount, type TeamMember, type Event, type HighlightVideo, type Play, type Shoutout } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePWA } from "@/lib/pwaContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { useAppBadge } from "@/hooks/useAppBadge";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoUploader } from "@/components/VideoUploader";
import logoImage from "@assets/red_logo-removebg-preview_1766973716904.png";

// Helper to parse text date - supports both "2026-01-02 05:00 PM" and "2026-01-02 17:00:00" formats
const parseTextDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(" ");
  if (parts.length < 2) return null;
  const datePart = parts[0];
  const timePart = parts[1];
  const ampm = parts[2];
  const dateParts = datePart.split("-").map(Number);
  if (dateParts.length < 3) return null;
  const [year, month, day] = dateParts;
  const timeParts = timePart.split(":").map(Number);
  let hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return new Date(year, month - 1, day, hour, minute);
};

// Helper to format text date for display
const formatTextDate = (dateStr: string, formatType: "date" | "time" | "full" = "full"): string => {
  const parsed = parseTextDate(dateStr);
  if (!parsed) return dateStr;
  if (formatType === "date") return format(parsed, "EEEE, MMM d, yyyy");
  if (formatType === "time") {
    const parts = dateStr.split(" ");
    return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : "";
  }
  return format(parsed, "EEEE, MMM d, yyyy") + " at " + (dateStr.split(" ").slice(1).join(" "));
};

type SectionType = "schedule" | "roster" | "stats" | "highlights" | "playbook" | "hype-card" | null;

type HypeCardTab = "events" | "stats" | "highlights" | "shoutouts";

export default function AthleteDashboard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, currentTeam, logout, setCurrentTeam, isLoading } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { entitlements, tier } = useEntitlements();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>("schedule");
  const [hypeCardFlipped, setHypeCardFlipped] = useState(false);
  const [hypeCardTab, setHypeCardTab] = useState<HypeCardTab>("events");
  const [isFyring, setIsFyring] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copiedAthleteCode, setCopiedAthleteCode] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const queryClient = useQueryClient();
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const section = params.get("section") as SectionType;
    const prevSection = activeSection;
    setActiveSection(section);
    
    // Scroll to content when opening a section
    if (section && !prevSection) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
    // Scroll to hero when closing a section (slower scroll)
    if (!section && prevSection) {
      setTimeout(() => {
        const heroElement = heroRef.current;
        if (heroElement) {
          const targetPosition = heroElement.getBoundingClientRect().top + window.scrollY - 80;
          const startPosition = window.scrollY;
          const distance = targetPosition - startPosition;
          const duration = 1500; // slower scroll duration in ms
          let startTime: number | null = null;
          
          const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          
          const animateScroll = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));
            if (timeElapsed < duration) {
              requestAnimationFrame(animateScroll);
            }
          };
          
          requestAnimationFrame(animateScroll);
        }
      }, 100);
    }
  }, [searchString]);

  const { updateUser } = useUser();

  useEffect(() => {
    if (user?.id && !user.athleteCode) {
      fetch(`/api/users/${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(freshUser => {
          if (freshUser?.athleteCode) {
            updateUser({ ...user, athleteCode: freshUser.athleteCode });
          }
        })
        .catch(console.error);
    }
  }, [user?.id, user?.athleteCode]);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 5000,
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && (activeSection === "schedule" || activeSection === "hype-card" || activeSection === null),
  });

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return teamEvents.filter((e: Event) => { const d = parseTextDate(e.date); return d && d >= now; });
  }, [teamEvents]);

  const { data: teamHighlights = [], refetch: refetchHighlights } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && (activeSection === "highlights" || activeSection === "hype-card"),
    refetchInterval: activeSection === "highlights" ? 5000 : false,
  });

  const { data: athleteShoutouts = [] } = useQuery({
    queryKey: ["/api/athletes", user?.id, "shoutouts"],
    queryFn: () => user ? getAthleteShoutouts(user.id, 20) : Promise.resolve([]),
    enabled: !!user && (activeSection === "hype-card" || hypeCardTab === "shoutouts"),
    refetchInterval: 3000,
  });

  const { data: shoutoutCount = 0 } = useQuery({
    queryKey: ["/api/athletes", user?.id, "shoutouts", "count"],
    queryFn: () => user ? getAthleteShoutoutCount(user.id) : Promise.resolve(0),
    enabled: !!user && activeSection === "hype-card",
    refetchInterval: 30000,
  });

  const { data: followerData } = useQuery({
    queryKey: ["/api/athletes", user?.id, "followers", "count"],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const res = await fetch(`/api/athletes/${user.id}/followers/count`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user && activeSection === "hype-card",
    refetchInterval: 30000,
  });

  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch conversations to get unread count
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

  // Update unread count when conversations data changes
  useEffect(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
      const total = conversationsData.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(total);
    }
  }, [conversationsData]);

  // Sync unread count to app badge on native platforms
  useAppBadge(unreadCount);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/athlete/${user?.id}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleFYR = async () => {
    if (!user?.id) {
      console.log("[FYR] No user ID");
      toast.error("Please log in first");
      return;
    }
    
    console.log("[FYR] Starting FYR request for user:", user.id);
    setIsFyring(true);
    try {
      const res = await fetch(`/api/athletes/${user.id}/fyr?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${user.name || user.username} just sent a FYR!`,
          body: "Check out their HYPE card now!",
        }),
      });
      
      console.log("[FYR] Response status:", res.status);
      const data = await res.json();
      console.log("[FYR] Response data:", JSON.stringify(data));
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send FYR");
      }
      
      // Refresh follower count after sending FYR
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", user.id, "followers", "count"] });
      
      if (data.successCount > 0) {
        console.log("[FYR] Success! Sent to", data.successCount, "followers");
        toast.success(`FYR sent to ${data.successCount} follower${data.successCount > 1 ? 's' : ''}!`);
      } else if (data.failureCount > 0) {
        console.log("[FYR] Failure count:", data.failureCount);
        toast.error(`Failed to send notifications. ${data.failureCount} failed.`);
      } else {
        console.log("[FYR] No followers found");
        toast.info("No followers to notify yet. Share your HYPE card link!");
      }
    } catch (error: any) {
      console.error("[FYR] Error:", error);
      toast.error(error.message || "Failed to send FYR");
    } finally {
      setIsFyring(false);
    }
  };

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && activeSection === "playbook",
  });

  const { data: aggregateStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "aggregate"],
    queryFn: () => currentTeam ? getTeamAggregateStats(currentTeam.id) : Promise.resolve({ games: 0, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, statTotals: {} }),
    enabled: !!currentTeam && activeSection === "stats",
  });

  const { data: myStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", user?.id, "stats"],
    queryFn: () => currentTeam && user ? getAthleteStats(currentTeam.id, user.id) : Promise.resolve({ gamesPlayed: 0, stats: {}, gameHistory: [], hotStreak: false, streakLength: 0 }),
    enabled: !!currentTeam && !!user && (activeSection === "stats" || activeSection === "hype-card"),
  });

  const currentMembership = teamMembers.find((m: TeamMember) => m.userId === user?.id);
  
  const athleteCode = user?.athleteCode || (currentMembership?.user as any)?.athleteCode;
  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach" || m.role === "staff"), [teamMembers]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoinTeamWithCode = async () => {
    if (!joinTeamCode.trim() || !user) return;
    setIsJoiningTeam(true);
    try {
      const result = await joinTeamByCode(joinTeamCode.trim(), user.id, "athlete");
      setCurrentTeam(result.team);
      toast.success(`Joined ${result.team.name}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join team");
    } finally {
      setIsJoiningTeam(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };


  const navCards = [
    {
      id: "schedule",
      name: "Schedule",
      icon: CalendarIcon,
      description: "View upcoming games and practices."
    },
    {
      id: "roster",
      name: "Roster",
      icon: Users,
      description: "View your teammates and coaches."
    },
    {
      id: "stats",
      name: "Stats",
      icon: BarChart3,
      description: "Track your performance statistics."
    },
    {
      id: "highlights",
      name: "Highlights",
      icon: Video,
      description: "Watch team highlight videos."
    },
    {
      id: "playbook",
      name: "Playbook",
      icon: BookOpen,
      description: "Review team plays and strategies."
    }
  ];

  const handleCardClick = (cardId: string) => {
    if (activeSection === cardId) {
      setLocation("/athlete/dashboard");
    } else {
      setLocation(`/athlete/dashboard?section=${cardId}`);
    }
  };

  const athleteWelcomeModal: WelcomeModal = {
    title: "Welcome, Athlete!",
    subtitle: `You're part of ${currentTeam?.name || "the team"}`,
    description: "You're all set up and ready to go! Let us show you around so you can make the most of your dashboard.",
    buttonText: "Let's Go!"
  };

  const athleteTourSteps: TourStep[] = [
    {
      target: '[data-testid="card-nav-schedule"]',
      title: "Stay Up to Date",
      description: "Check the schedule regularly to stay informed about upcoming practices, games, and team events. Never miss an important moment!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-nav-playbook"]',
      title: "Study the Playbook",
      description: "Your coaches design plays here. Check back often to review new strategies and make sure you know your assignments!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-hype-card"]',
      title: "Your Hype Card",
      description: "This is YOUR spotlight! Return often to see your latest accomplishments, stats, and shoutouts from supporters.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-nav-stats"]',
      title: "Track Your Progress",
      description: "View your performance statistics and watch your improvement over time. Every game counts!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-nav-highlights"]',
      title: "Team Highlights",
      description: "Watch video highlights from games and practices. You can even upload your own best moments!",
      position: "bottom"
    },
    {
      target: '[data-testid="button-settings"]',
      title: "Personalize Your Profile",
      description: "Head to Settings to update your avatar and name. Make your profile stand out!",
      position: "bottom"
    }
  ];

  if (!currentTeam) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen relative z-10 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-white/10 bg-card/50 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-wide">Join a Team</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Enter a team code to join as an athlete
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter team code"
                  value={joinTeamCode}
                  onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center font-mono text-lg uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={6}
                  data-testid="input-join-team-code"
                />
              </div>
              <Button
                onClick={handleJoinTeamWithCode}
                disabled={!joinTeamCode.trim() || isJoiningTeam}
                className="w-full"
                size="lg"
                data-testid="button-join-team-submit"
              >
                {isJoiningTeam ? "Joining..." : "Join Team"}
              </Button>
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-2">Or scan a QR code from your team</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/join/scan")}
                  data-testid="button-scan-qr"
                >
                  Scan QR Code
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
      {user?.id && (
        <OnboardingTour 
          steps={athleteTourSteps} 
          storageKey={`athlete-onboarding-completed-${user.id}`}
          welcomeModal={athleteWelcomeModal}
        />
      )}
      <DashboardBackground />
      <div className="min-h-screen relative z-10">
        {/* Header Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="STATFYR" className="h-8 w-8" />
              <h1 className="text-lg font-display font-bold tracking-wide">STATF<span className="text-orange-500">Y</span>R</h1>
            </div>
            <div className="flex items-center gap-2">
              {updateAvailable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={applyUpdate}
                  className="text-amber-500 hover:text-amber-400 animate-pulse"
                  title="Update available - click to refresh"
                  data-testid="button-update-available"
                >
                  <AlertCircle className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setLocation("/athlete/dashboard?section=messages");
                }}
                className={unreadCount > 0 ? "text-green-500 hover:text-green-400 relative" : "relative"}
                title={unreadCount > 0 ? `${unreadCount} unread messages` : "Messages"}
                data-testid="button-messages"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold pointer-events-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  data-testid="button-theme-toggle"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              )}
              <Link href="/athlete/settings">
                <Button variant="ghost" size="icon" data-testid="button-settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          {/* Hero Section */}
          <div ref={heroRef} className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-orange-200 dark:border-orange-500/20">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
            
            <div className="relative p-4 md:p-8 flex flex-row gap-4 md:gap-6 items-center">
              {/* Profile Avatar */}
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-xl border-2 border-primary/50 shadow-lg flex-shrink-0">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || user?.username || ""} className="object-cover" />
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/20 rounded-xl">
                  {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Dashboard Title & Info */}
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs sm:text-sm font-display font-bold text-orange-500 uppercase tracking-wider mb-0.5">
                  {currentTeam?.name || "No Team"}
                </p>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                  Athlete Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1 truncate">Welcome back, {user?.name?.split(' ')[0] || user?.username}!</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Code:</span>
                  <span className="text-sm font-mono font-bold text-primary">{athleteCode || "Loading..."}</span>
                  {athleteCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(athleteCode);
                        setCopiedAthleteCode(true);
                        toast.success("Code copied!");
                        setTimeout(() => setCopiedAthleteCode(false), 2000);
                      }}
                      className="p-0.5 hover:bg-muted rounded"
                      data-testid="button-copy-athlete-code-hero"
                    >
                      {copiedAthleteCode ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  )}
                </div>
                <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-foreground font-semibold truncate">{user?.name || user?.username}</p>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{currentMembership?.position || "Athlete"} - {currentTeam?.name}</p>
                  {currentMembership?.jerseyNumber && (
                    <Badge variant="outline" className="text-xs sm:text-sm px-1.5 sm:px-2 py-0 sm:py-0.5 border-accent/50 text-accent">
                      #{currentMembership.jerseyNumber}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0 sm:py-0.5 bg-muted/50 rounded border border-muted-foreground/20">
                    <span className="text-[10px] sm:text-xs font-bold text-green-500">{currentTeam?.wins || 0}W</span>
                    <span className="text-muted-foreground/50">-</span>
                    <span className="text-[10px] sm:text-xs font-bold text-red-500">{currentTeam?.losses || 0}L</span>
                    <span className="text-muted-foreground/50">-</span>
                    <span className="text-[10px] sm:text-xs font-bold text-yellow-500">{currentTeam?.ties || 0}T</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HYPE Cards - Above Quick Access */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            {/* HYPE Hub Card */}
            <Card 
              onClick={() => setLocation("/athlete/hype-portal")}
              className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-orange-500/40 hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group overflow-hidden"
              data-testid="card-hype-portal"
            >
              <CardContent className="p-3 sm:p-5 flex flex-col items-center gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Flame className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-sm sm:text-lg uppercase tracking-wide text-orange-500 group-hover:text-orange-400 transition-colors">
                    HYPE Hub
                  </h3>
                  <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
                    Post updates & fire up followers
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* HYPE Card */}
            <Card 
              onClick={() => setLocation("/athlete/hype-card")}
              className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-cyan-500/40 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group overflow-hidden"
              data-testid="card-hype-card"
            >
              <CardContent className="p-3 sm:p-5 flex flex-col items-center gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-display font-bold text-sm sm:text-lg uppercase tracking-wide text-cyan-500 group-hover:text-cyan-400 transition-colors">
                    HYPE Card
                  </h3>
                  <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">
                    View & share your player card
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">Quick Access</h2>
            </div>

            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {navCards.map((card) => (
                <Card 
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer group ${
                    activeSection === card.id ? "border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-500/50 dark:ring-orange-500/20" : ""
                  }`}
                  data-testid={`card-nav-${card.id}`}
                >
                  <CardContent className="p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                    <div className={`p-2 sm:p-2.5 rounded-lg border transition-colors ${
                      activeSection === card.id 
                        ? "bg-orange-500/20 border-orange-500/40" 
                        : "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20"
                    }`}>
                      <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="font-bold text-foreground text-sm sm:text-lg">{card.name}</h3>
                      <p className="hidden sm:block text-sm text-muted-foreground mt-0.5">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Section Content */}
          {activeSection && (
            <div ref={contentRef} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/athlete/dashboard")}
                  className="gap-2"
                  data-testid="button-back-to-dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">
                  {navCards.find(c => c.id === activeSection)?.name}
                </h2>
              </div>

              {/* Schedule Section */}
              {activeSection === "schedule" && (
                <div className="space-y-4">
                  {teamEvents.length === 0 ? (
                    <Card className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 p-8 text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-bold">No events scheduled</p>
                      <p className="text-sm text-muted-foreground mt-1">Check back soon for upcoming games and practices.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {teamEvents.map((event: Event) => (
                        <Card key={event.id} className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20" data-testid={`event-card-${event.id}`}>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <Badge variant="outline" className="mb-2">{event.type}</Badge>
                                <h3 className="font-bold text-lg">{event.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
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
                              </div>
                              {event.opponent && (
                                <Badge className="bg-accent/20 text-accent border-accent/30">
                                  vs {event.opponent}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Roster Section */}
              {activeSection === "roster" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Coaches & Staff</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {coaches.map((member: TeamMember) => (
                        <Card key={member.id} className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20" data-testid={`roster-member-${member.id}`}>
                          <CardContent className="p-4 text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-2">
                              <AvatarImage src={member.user.avatar || ""} />
                              <AvatarFallback>{(member.user.name || member.user.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm">{member.user.name || member.user.username}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Athletes ({athletes.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {athletes.map((member: TeamMember) => (
                        <Card key={member.id} className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20" data-testid={`roster-member-${member.id}`}>
                          <CardContent className="p-4 text-center">
                            <Avatar className="h-16 w-16 mx-auto mb-2">
                              <AvatarImage src={member.user.avatar || ""} />
                              <AvatarFallback>{(member.user.name || member.user.username || "?").charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <p className="font-semibold text-sm">{member.user.name || member.user.username}</p>
                            {member.jerseyNumber && <p className="text-xs text-primary font-bold">#{member.jerseyNumber}</p>}
                            {member.position && <p className="text-xs text-muted-foreground">{member.position}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Section */}
              {activeSection === "stats" && (
                <div className="space-y-6">
                  {myStats && (
                    <Card className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20">
                      <CardHeader>
                        <CardTitle className="text-primary">My Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-background/50 border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{myStats.gamesPlayed}</p>
                            <p className="text-xs text-muted-foreground">Games</p>
                          </div>
                          {Object.entries(myStats.stats).slice(0, 3).map(([key, stat]: [string, any]) => (
                            <div key={key} className="bg-background/50 border rounded-lg p-3 text-center">
                              <p className="text-2xl font-bold">{stat.total}</p>
                              <p className="text-xs text-muted-foreground">{stat.name}</p>
                            </div>
                          ))}
                        </div>
                        {Object.keys(myStats.stats).length > 3 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Object.entries(myStats.stats).slice(3).map(([key, stat]: [string, any]) => (
                              <div key={key} className="bg-background/30 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold">{stat.total}</p>
                                <p className="text-[10px] text-muted-foreground">{stat.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {aggregateStats && (
                    <Card className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20">
                      <CardHeader>
                        <CardTitle className="text-primary">Team Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-background/50 border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{aggregateStats.games}</p>
                            <p className="text-xs text-muted-foreground">Games</p>
                          </div>
                          <div className="bg-green-500/10 border-green-500/30 border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-500">{aggregateStats.wins}</p>
                            <p className="text-xs text-muted-foreground">Wins</p>
                          </div>
                          <div className="bg-red-500/10 border-red-500/30 border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-red-500">{aggregateStats.losses}</p>
                            <p className="text-xs text-muted-foreground">Losses</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Highlights Section */}
              {activeSection === "highlights" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Team Highlights</h3>
                    {entitlements.canUploadHighlights ? (
                      <Button
                        onClick={() => setShowUploadDialog(true)}
                        className="gap-2"
                        data-testid="button-upload-highlight"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Highlight
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast.info("Upgrade to Athlete Pro to upload your own highlights!", {
                            action: {
                              label: "Upgrade",
                              onClick: () => setLocation("/athlete/settings")
                            }
                          });
                        }}
                        className="gap-2 text-muted-foreground"
                        data-testid="button-upload-locked"
                      >
                        <Lock className="h-4 w-4" />
                        Upload (Pro)
                      </Button>
                    )}
                  </div>
                  {teamHighlights.length === 0 ? (
                    <Card className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 p-8 text-center">
                      <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-bold">No highlights yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Team highlights will appear here.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teamHighlights.map((video: HighlightVideo) => (
                        <Card key={video.id} className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 overflow-hidden" data-testid={`highlight-${video.id}`}>
                          <div className="aspect-video bg-black relative">
                            {video.status === "ready" && video.publicUrl ? (
                              <video 
                                src={video.publicUrl} 
                                controls
                                playsInline
                                className="w-full h-full object-contain"
                              />
                            ) : video.status === "processing" ? (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2 text-sm">Processing...</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <PlayIcon className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <p className="font-semibold truncate">{video.title}</p>
                            {video.createdAt && <p className="text-xs text-muted-foreground">{format(new Date(video.createdAt), "MMM d, yyyy")}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {entitlements.canUploadHighlights && (
                    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Upload Highlight Video</DialogTitle>
                        </DialogHeader>
                        <VideoUploader
                          teamId={currentTeam?.id || ""}
                          userId={user?.id || ""}
                          onUploadComplete={() => {
                            setShowUploadDialog(false);
                            refetchHighlights();
                            toast.success("Highlight uploaded successfully!");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}

              {/* Playbook Section */}
              {activeSection === "playbook" && (
                <div className="space-y-4">
                  {teamPlays.length === 0 ? (
                    <Card className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-bold">No plays yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Your coach will add plays here.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {teamPlays.map((play: Play) => (
                        <Card key={play.id} className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 overflow-hidden" data-testid={`play-${play.id}`}>
                          {play.thumbnailData && (
                            <div className="aspect-video bg-green-900/20">
                              <img src={play.thumbnailData} alt={play.name} className="w-full h-full object-contain" />
                            </div>
                          )}
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{play.category}</Badge>
                              {play.status && (
                                <Badge variant={play.status === "Successful" ? "default" : "secondary"} className="text-xs">
                                  {play.status}
                                </Badge>
                              )}
                            </div>
                            <p className="font-semibold">{play.name}</p>
                            {play.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{play.description}</p>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Hype Card Section */}
              {activeSection === "hype-card" && (
                <div className="flex justify-center">
                  <div className="w-80 perspective-1000">
                    <div 
                      className={`flip-card-inner cursor-pointer ${hypeCardFlipped ? "flipped" : ""}`}
                      onClick={() => setHypeCardFlipped(!hypeCardFlipped)}
                      data-testid="hype-card-flip"
                      style={{ height: "426px" }}
                    >
                      {/* Front of Card */}
                      <div className="flip-card-front">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 rounded-3xl blur opacity-75" />
                        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl overflow-hidden border border-orange-500/30 shadow-2xl h-full">
                          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                          
                          {/* Top Left - Name */}
                          <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight drop-shadow-lg">
                              {user?.name || user?.username}
                            </h3>
                          </div>
                          
                          {/* Top Right - Jersey Number */}
                          {currentMembership?.jerseyNumber && (
                            <div className="absolute top-4 right-4 z-10">
                              <span className="text-3xl font-display font-bold text-orange-500 drop-shadow-lg">
                                #{currentMembership.jerseyNumber}
                              </span>
                            </div>
                          )}
                          
                          {/* Full Length Avatar */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <img 
                              src={user?.avatar || ""} 
                              alt={user?.name || ""} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Bottom Left - Team & Position */}
                          <div className="absolute bottom-4 left-4 z-10">
                            <p className="text-sm font-semibold text-orange-400 drop-shadow-lg">
                              {currentMembership?.position || "Athlete"}
                            </p>
                            <p className="text-xs text-white/80 drop-shadow-lg">{currentTeam?.name}</p>
                          </div>
                          
                          {/* Tap hint */}
                          <div className="absolute bottom-4 right-4 z-10">
                            <p className="text-xs text-white/50">Tap to flip</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Back of Card */}
                      <div className="flip-card-back">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 rounded-3xl blur opacity-75" />
                        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl overflow-hidden border border-orange-500/30 shadow-2xl h-full p-4">
                          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                          
                          {/* 2x2 Grid */}
                          <div className="relative h-full grid grid-cols-2 grid-rows-2 gap-2">
                            {/* Events Quadrant */}
                            <div 
                              className={`rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${hypeCardTab === "events" ? "bg-orange-500/30 border border-orange-500/50" : "bg-white/5 hover:bg-white/10"}`}
                              onClick={(e) => { e.stopPropagation(); setHypeCardTab("events"); }}
                              data-testid="hype-quadrant-events"
                            >
                              <CalendarIcon className="h-8 w-8 text-orange-400 mb-2" />
                              <span className="text-sm font-semibold text-white">Events</span>
                              <span className="text-2xl font-bold text-orange-400 mt-1">{upcomingEvents.length}</span>
                            </div>
                            
                            {/* Stats Quadrant */}
                            <div 
                              className={`rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${hypeCardTab === "stats" ? "bg-orange-500/30 border border-orange-500/50" : "bg-white/5 hover:bg-white/10"}`}
                              onClick={(e) => { e.stopPropagation(); setHypeCardTab("stats"); }}
                              data-testid="hype-quadrant-stats"
                            >
                              <BarChart3 className="h-8 w-8 text-orange-400 mb-2" />
                              <span className="text-sm font-semibold text-white">Stats</span>
                              <span className="text-2xl font-bold text-orange-400 mt-1">{myStats?.gamesPlayed || 0}</span>
                            </div>
                            
                            {/* Highlights Quadrant */}
                            <div 
                              className={`rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${hypeCardTab === "highlights" ? "bg-orange-500/30 border border-orange-500/50" : "bg-white/5 hover:bg-white/10"}`}
                              onClick={(e) => { e.stopPropagation(); setHypeCardTab("highlights"); }}
                              data-testid="hype-quadrant-highlights"
                            >
                              <Video className="h-8 w-8 text-orange-400 mb-2" />
                              <span className="text-sm font-semibold text-white">Highlights</span>
                              <span className="text-2xl font-bold text-orange-400 mt-1">{teamHighlights.filter((h: HighlightVideo) => h.uploaderId === user?.id).length}</span>
                            </div>
                            
                            {/* Shoutouts Quadrant */}
                            <div 
                              className={`rounded-xl p-3 flex flex-col items-center justify-center transition-colors ${hypeCardTab === "shoutouts" ? "bg-orange-500/30 border border-orange-500/50" : "bg-white/5 hover:bg-white/10"}`}
                              onClick={(e) => { e.stopPropagation(); setHypeCardTab("shoutouts"); }}
                              data-testid="hype-quadrant-shoutouts"
                            >
                              <Trophy className="h-8 w-8 text-orange-400 mb-2" />
                              <span className="text-sm font-semibold text-white">Shoutouts</span>
                              <span className="text-2xl font-bold text-orange-400 mt-1">{shoutoutCount}</span>
                            </div>
                          </div>
                          
                          {/* Tap hint */}
                          <div className="absolute bottom-2 right-4 z-10">
                            <p className="text-xs text-white/50">Tap to flip back</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* FYR Actions */}
                  <div className="mt-6 w-full max-w-md space-y-4">
                    {/* Followers Count */}
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-primary">{followerData?.count || 0}</span>
                      <span className="text-muted-foreground">follower{(followerData?.count || 0) !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Share Link */}
                    <div className="flex gap-2">
                      <Button
                        onClick={copyShareLink}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-copy-hype-link"
                      >
                        {linkCopied ? (
                          <>
                            <Copy className="h-4 w-4 mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share HYPE Card
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(shareUrl, '_blank')}
                        data-testid="button-view-hype-card"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* FYR Button */}
                    <Button
                      onClick={handleFYR}
                      disabled={isFyring || (followerData?.count || 0) === 0}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg py-6"
                      data-testid="button-fyr"
                    >
                      {isFyring ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Flame className="h-5 w-5 mr-2" />
                          FYR! Notify Followers
                        </>
                      )}
                    </Button>
                    
                    {(followerData?.count || 0) === 0 && (
                      <p className="text-xs text-muted-foreground text-center">
                        Share your HYPE card to get followers!
                      </p>
                    )}
                    
                    {/* HYPE Hub Link */}
                    <Link href="/athlete/hype-portal">
                      <Button
                        variant="outline"
                        className="w-full border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                        data-testid="button-hype-portal"
                      >
                        <Flame className="h-4 w-4 mr-2" />
                        Open HYPE Hub
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Floating Chat Button */}
      <Link href="/chat">
        <button
          className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-transform hover:scale-105 z-50 ${unreadCount > 0 ? 'animate-pulse ring-4 ring-green-500/50 shadow-green-500/50 shadow-xl' : ''}`}
          data-testid="button-floating-chat"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold pointer-events-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Link>
    </>
  );
}
