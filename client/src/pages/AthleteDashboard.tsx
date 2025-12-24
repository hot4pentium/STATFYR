import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, BarChart3, Settings, LogOut, Moon, Sun, Users, Video, BookOpen, Trophy, AlertCircle, ArrowLeft, MapPin, Clock, Trash2, Play as PlayIcon, Loader2 } from "lucide-react";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, getTeamAggregateStats, getAdvancedTeamStats, getAthleteStats, getAthleteShoutouts, getAthleteShoutoutCount, type TeamMember, type Event, type HighlightVideo, type Play, type Shoutout } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePWA } from "@/lib/pwaContext";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoUploader } from "@/components/VideoUploader";

type SectionType = "schedule" | "roster" | "stats" | "highlights" | "playbook" | "hype-card" | null;

type HypeCardTab = "events" | "stats" | "highlights" | "shoutouts";

export default function AthleteDashboard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, currentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>("schedule");
  const [hypeCardFlipped, setHypeCardFlipped] = useState(false);
  const [hypeCardTab, setHypeCardTab] = useState<HypeCardTab>("events");
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

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && (activeSection === "schedule" || activeSection === "hype-card" || activeSection === null),
  });

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return teamEvents.filter((e: Event) => new Date(e.date) >= now);
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
  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach" || m.role === "staff"), [teamMembers]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !currentTeam) {
      setLocation("/athlete/onboarding");
    }
  }, [user, currentTeam, setLocation]);

  const handleLogout = () => {
    logout();
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
    },
    {
      id: "hype-card",
      name: "Hype Card",
      icon: Trophy,
      description: "View your personalized player card."
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
      target: '[data-testid="card-nav-hype-card"]',
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

  return (
    <>
      <OnboardingTour 
        steps={athleteTourSteps} 
        storageKey="athlete-onboarding-completed"
        welcomeModal={athleteWelcomeModal}
      />
      <DashboardBackground />
      <div className="min-h-screen relative z-10">
        {/* Header Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="STATFyR" className="h-8 w-8" />
              <h1 className="text-lg font-display font-bold text-orange-500 tracking-wide">STATFyR</h1>
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
                <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                  Athlete Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1 truncate">Welcome back, {user?.name?.split(' ')[0] || user?.username}!</p>
                <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-foreground font-semibold truncate">{user?.name || user?.username}</p>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{currentMembership?.position || "Athlete"} - {currentTeam?.name}</p>
                  {currentMembership?.jerseyNumber && (
                    <Badge variant="outline" className="text-xs sm:text-sm px-1.5 sm:px-2 py-0 sm:py-0.5 border-accent/50 text-accent">
                      #{currentMembership.jerseyNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
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
                                    <span>{format(new Date(event.date), "EEE, MMM d")}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span>{format(new Date(event.date), "h:mm a")}</span>
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
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
