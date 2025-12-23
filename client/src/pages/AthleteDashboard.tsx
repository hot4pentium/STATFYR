import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, BarChart3, Settings, LogOut, Moon, Sun, Users, Video, BookOpen, Trophy, AlertCircle, Copy, Check, ArrowLeft, MapPin, Clock, Trash2, Play as PlayIcon, Loader2 } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, getTeamAggregateStats, getAdvancedTeamStats, getAthleteStats, type TeamMember, type Event, type HighlightVideo, type Play } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePWA } from "@/lib/pwaContext";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoUploader } from "@/components/VideoUploader";

type SectionType = "schedule" | "roster" | "stats" | "highlights" | "playbook" | "hype-card" | null;

export default function AthleteDashboard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, currentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const section = params.get("section") as SectionType;
    setActiveSection(section);
  }, [searchString]);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && (activeSection === "schedule" || activeSection === null),
  });

  const { data: teamHighlights = [], refetch: refetchHighlights } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && activeSection === "highlights",
    refetchInterval: activeSection === "highlights" ? 5000 : false,
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
    enabled: !!currentTeam && !!user && activeSection === "stats",
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

  const copyTeamCode = () => {
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Team code copied!");
    }
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

  return (
    <>
      <DashboardBackground />
      <div className="min-h-screen relative z-10">
        {/* Header Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-display font-bold text-primary uppercase tracking-wide">TeamPulse</h1>
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
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-orange-200 dark:border-orange-500/20">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
            
            <div className="relative p-6 md:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
              {/* Profile Avatar */}
              <Avatar className="h-24 w-24 md:h-28 md:w-28 rounded-xl border-2 border-primary/50 shadow-lg flex-shrink-0">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || user?.username || ""} className="object-cover" />
                <AvatarFallback className="text-2xl font-bold bg-primary/20 rounded-xl">
                  {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Dashboard Title & Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                  Athlete Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Welcome back, {user?.name?.split(' ')[0] || user?.username}!</p>
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <p className="text-sm text-foreground font-semibold">{user?.name || user?.username}</p>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground">{currentMembership?.position || "Athlete"} - {currentTeam?.name}</p>
                  {currentMembership?.jerseyNumber && (
                    <Badge variant="outline" className="text-sm px-2 py-0.5 border-accent/50 text-accent">
                      #{currentMembership.jerseyNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Section */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">Quick Access</h2>
              {currentTeam?.code && (
                <button
                  onClick={copyTeamCode}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/10 border border-orange-300 dark:border-orange-500/30 hover:bg-orange-200 dark:hover:bg-orange-500/20 transition text-sm font-mono"
                  data-testid="button-copy-team-code"
                >
                  <span className="text-orange-600 dark:text-orange-400">Team Code:</span>
                  <span className="text-foreground font-bold">{currentTeam.code}</span>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-orange-500" />}
                </button>
              )}
            </div>

            {/* Navigation Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {navCards.map((card) => (
                <Card 
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-200 cursor-pointer group ${
                    activeSection === card.id ? "border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-500/50 dark:ring-orange-500/20" : ""
                  }`}
                  data-testid={`card-nav-${card.id}`}
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg border transition-colors ${
                      activeSection === card.id 
                        ? "bg-orange-500/20 border-orange-500/40" 
                        : "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20"
                    }`}>
                      <card.icon className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-lg">{card.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Section Content */}
          {activeSection && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                  <div className="w-72">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur opacity-75" />
                      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                        <div className="relative p-6">
                          <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden mb-4">
                            <img 
                              src={user?.avatar || ""} 
                              alt={user?.name || ""} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">
                              {user?.name || user?.username}
                            </h3>
                            <p className="text-sm text-primary font-semibold mt-1">
                              {currentMembership?.position || "Athlete"}
                            </p>
                            <p className="text-xs text-muted-foreground">{currentTeam?.name}</p>
                            {currentMembership?.jerseyNumber && (
                              <div className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-accent to-primary">
                                <span className="text-white font-display font-bold text-2xl">#{currentMembership.jerseyNumber}</span>
                              </div>
                            )}
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
