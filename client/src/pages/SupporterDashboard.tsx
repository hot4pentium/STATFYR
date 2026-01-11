import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, MapPin, Users, BarChart3, MessageSquare, Settings, LogOut, Clock, Video, Trophy, BookOpen, AlertCircle, Sun, Moon, Bell, Lock, ArrowLeft, Flame, Star, Heart, Share2, X } from "lucide-react";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, getTeamPlays, type TeamMember, type Event, type HighlightVideo, type Play } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { usePWA } from "@/lib/pwaContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { format } from "date-fns";

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

type SectionType = "schedule" | "roster" | "stats" | "highlights" | "playbook" | "chat" | null;

export default function SupporterDashboard() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, currentTeam, logout, isLoading } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { entitlements } = useEntitlements();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const [demoModal, setDemoModal] = useState<"hype-hub" | "hype-card" | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    enabled: !!currentTeam,
  });

  const { data: teamHighlights = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && activeSection === "highlights",
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && activeSection === "playbook",
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

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach" || m.role === "staff"), [teamMembers]);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (!isLoading && user && !currentTeam) {
      setLocation("/supporter/onboarding");
    }
  }, [user, currentTeam, isLoading, setLocation]);

  const handleLogout = () => {
    logout();
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
    setLocation(`/supporter/dashboard?section=${cardId}`);
  };

  const navCards = [
    { id: "roster", name: "Roster", icon: Users, description: "Access and view player roster.", locked: false },
    { id: "schedule", name: "Calendar", icon: CalendarIcon, description: "View and manage team schedule.", locked: false },
    { id: "playbook", name: "Playbook", icon: BookOpen, description: "View team plays and formations.", locked: false },
    { id: "stats", name: "Stats", icon: BarChart3, description: "View statistics recorded with StatTracker.", locked: false },
    { id: "highlights", name: "Highlights", icon: Video, description: "Team video highlights.", locked: !entitlements?.canViewHighlights },
    { id: "chat", name: "Team Chat", icon: MessageSquare, description: "Message your team.", locked: false },
  ];

  const welcomeModal: WelcomeModal = {
    title: "Welcome, Supporter!",
    subtitle: `Cheering for ${currentTeam?.name || "the team"}`,
    description: "You're all set to support your athletes! Let us show you around so you can stay connected.",
    buttonText: "Let's Go!"
  };

  const tourSteps: TourStep[] = [
    { target: '[data-testid="card-nav-schedule"]', title: "Team Calendar", description: "View upcoming games and practices.", position: "bottom" },
    { target: '[data-testid="card-nav-roster"]', title: "Team Roster", description: "See all team members.", position: "bottom" },
    { target: '[data-testid="card-nav-stats"]', title: "Team Stats", description: "View team performance.", position: "bottom" },
  ];

  if (isLoading || !user || !currentTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
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
          <div ref={heroRef} className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-orange-200 dark:border-orange-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
            <div className="relative p-4 md:p-8 flex flex-row gap-4 md:gap-6 items-center">
              <Avatar className="h-16 w-16 sm:h-24 sm:w-24 rounded-xl border-2 border-primary/50 shadow-lg">
                <AvatarImage src={user?.avatar || ""} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-primary/20 rounded-xl">
                  {(user?.name || user?.username || "S").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-orange-500 font-bold uppercase tracking-wider">{currentTeam?.name}</p>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                  Supporter Dashboard
                </h1>
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
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card 
              onClick={() => {
                if (!entitlements?.canUploadHighlights) {
                  setDemoModal("hype-hub");
                  return;
                }
                setLocation("/supporter/hype-portal");
              }}
              className={`relative bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-orange-500/40 hover:border-orange-500/60 transition-all cursor-pointer group ${!entitlements?.canUploadHighlights ? "opacity-75" : ""}`}
              data-testid="card-hype-hub"
            >
              {!entitlements?.canUploadHighlights && (
                <div className="absolute top-2 right-2 z-10">
                  <Lock className="h-4 w-4 text-orange-500" />
                </div>
              )}
              <CardContent className="p-3 sm:p-5 flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg group-hover:scale-110 transition-transform">
                  <Flame className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-sm sm:text-lg uppercase text-orange-500">HYPE Hub</h3>
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

          <div>
            <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {navCards.map((card) => (
                <Card 
                  key={card.id}
                  onClick={() => handleCardClick(card.id, card.locked)}
                  className={`relative bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20 hover:border-orange-400 dark:hover:border-orange-500/50 transition-all cursor-pointer group ${
                    activeSection === card.id ? "border-orange-500 ring-2 ring-orange-500/20" : ""
                  } ${card.locked ? "opacity-75" : ""}`}
                  data-testid={`card-nav-${card.id}`}
                >
                  {card.locked && (
                    <div className="absolute top-2 right-2 z-10">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                    <div className={`p-2 rounded-lg border transition-colors ${
                      activeSection === card.id ? "bg-orange-500/20 border-orange-500/40" : "bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500/20"
                    }`}>
                      <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-bold text-sm sm:text-base">{card.name}</h3>
                      <p className="hidden sm:block text-xs text-muted-foreground">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {activeSection && (
            <div ref={contentRef} className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setLocation("/supporter/dashboard")} className="gap-2" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">
                  {navCards.find(c => c.id === activeSection)?.name}
                </h2>
              </div>

              {activeSection === "schedule" && (
                <div className="space-y-4">
                  {teamEvents.length === 0 ? (
                    <Card className="p-8 text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-bold">No events scheduled</p>
                    </Card>
                  ) : (
                    teamEvents.map((event: Event) => (
                      <Card key={event.id} className="bg-white/80 dark:bg-slate-900/80 border-orange-200 dark:border-orange-500/20" data-testid={`event-${event.id}`}>
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

              {activeSection === "roster" && (
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

              {activeSection === "playbook" && (
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

              {activeSection === "stats" && (
                <Card className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-bold">Team Stats</p>
                  <p className="text-sm text-muted-foreground">Stats will appear here when the coach records them during games.</p>
                </Card>
              )}

              {activeSection === "highlights" && (
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
            </div>
          )}
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
              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 p-6 text-white">
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
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Heart className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Post HYPE Updates</p>
                      <p className="text-xs text-muted-foreground">Share photos, stats, and achievements with fans</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Star className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Celebrate Moments</p>
                      <p className="text-xs text-muted-foreground">Highlight game-winning plays and milestones</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Share2 className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Share with Family</p>
                      <p className="text-xs text-muted-foreground">Let grandparents and friends follow along</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mb-2">
                    <p className="text-center text-sm font-medium text-orange-700 dark:text-orange-300">
                      One subscription unlocks everything!
                    </p>
                    <p className="text-center text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                      HYPE Hub + HYPE Card + Highlights included
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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
    </>
  );
}
