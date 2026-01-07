import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, BarChart3, Settings, LogOut, Moon, Sun, Users, Video, BookOpen, Trophy, AlertCircle, ArrowLeft, MapPin, Clock, Star, Flame, Zap, Share2, MessageCircle, Bell, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from "recharts";
import { Link, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, getAthleteStats, getAthleteShoutoutCount, getTeamPlays, type TeamMember, type Event, type HighlightVideo, type Play } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { usePWA } from "@/lib/pwaContext";
import { useNotifications } from "@/lib/notificationContext";
import { format } from "date-fns";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";

type SectionType = "schedule" | "roster" | "stats" | "highlights" | "playbook" | "chat" | null;

export default function AthleteProfileNew() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, currentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { notificationsEnabled, hasUnread, enableNotifications, clearUnread } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const section = params.get("section") as SectionType;
    
    if (section === "chat") {
      setLocation("/chat");
      return;
    }
    
    setActiveSection(section);
    
    if (section) {
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [searchString, setLocation]);

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
  });

  const { data: shoutoutCount = 0 } = useQuery({
    queryKey: ["/api/athletes", user?.id, "shoutouts", "count"],
    queryFn: () => user ? getAthleteShoutoutCount(user.id) : Promise.resolve(0),
    enabled: !!user,
  });

  const { data: myStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", user?.id, "stats"],
    queryFn: () => currentTeam && user ? getAthleteStats(currentTeam.id, user.id) : Promise.resolve({ gamesPlayed: 0, stats: {}, gameHistory: [], hotStreak: false, streakLength: 0 }),
    enabled: !!currentTeam && !!user,
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && activeSection === "playbook",
  });

  const currentMembership = teamMembers.find((m: TeamMember) => m.userId === user?.id);
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return teamEvents.filter((e: Event) => new Date(e.date) >= now).slice(0, 3);
  }, [teamEvents]);

  const myHighlights = useMemo(() => {
    return teamHighlights.filter((h: HighlightVideo) => h.uploaderId === user?.id);
  }, [teamHighlights, user?.id]);

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

  const handleCardClick = (cardId: string) => {
    if (cardId === "chat") {
      setLocation("/chat");
      return;
    }
    if (activeSection === cardId) {
      setLocation("/athlete/dashboard");
    } else {
      setLocation(`/athlete/dashboard?section=${cardId}`);
    }
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/athlete/${user?.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.name || user?.username}'s Profile`,
          text: `Check out my athlete profile on STATFYR!`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    
    const copied = await copyToClipboard(shareUrl);
    if (copied) {
      toast.success("Profile link copied to clipboard!");
    } else {
      toast.error("Could not copy link. Try copying manually.");
    }
  };

  const navCards = [
    { id: "roster", name: "Team", icon: Users, color: "from-blue-500 to-cyan-500" },
    { id: "stats", name: "Stats", icon: BarChart3, color: "from-purple-500 to-pink-500" },
    { id: "playbook", name: "Plays", icon: BookOpen, color: "from-amber-500 to-orange-500" },
    { id: "chat", name: "Chat", icon: MessageCircle, color: "from-green-500 to-emerald-500" },
    { id: "schedule", name: "Schedule", icon: CalendarIcon, color: "from-indigo-500 to-blue-500" },
    { id: "highlights", name: "Highlights", icon: Video, color: "from-rose-500 to-red-500" },
  ];

  const calculateRating = () => {
    const gamesPlayed = myStats?.gamesPlayed || 0;
    const baseRating = 3.0;
    const gameBonus = Math.min(gamesPlayed * 0.1, 1.5);
    const shoutoutBonus = Math.min(shoutoutCount * 0.05, 0.5);
    return Math.min(baseRating + gameBonus + shoutoutBonus, 5.0).toFixed(1);
  };

  const getBadgeLevel = () => {
    const totalShoutouts = shoutoutCount;
    if (totalShoutouts >= 100) return { name: "Legend", color: "bg-gradient-to-r from-yellow-400 to-amber-500", icon: Trophy };
    if (totalShoutouts >= 50) return { name: "Gold", color: "bg-gradient-to-r from-yellow-300 to-yellow-500", icon: Star };
    if (totalShoutouts >= 20) return { name: "Silver", color: "bg-gradient-to-r from-gray-300 to-gray-400", icon: Star };
    if (totalShoutouts >= 5) return { name: "Bronze", color: "bg-gradient-to-r from-amber-600 to-amber-700", icon: Zap };
    return { name: "Rookie", color: "bg-gradient-to-r from-slate-500 to-slate-600", icon: Flame };
  };

  const badge = getBadgeLevel();
  const rating = calculateRating();

  const athleteWelcomeModal: WelcomeModal = {
    title: "Welcome, Athlete!",
    subtitle: `You're part of ${currentTeam?.name || "the team"}`,
    description: "You're all set up and ready to go! Let us show you around so you can make the most of your dashboard.",
    buttonText: "Let's Go!"
  };

  const athleteTourSteps: TourStep[] = [
    {
      target: '[data-testid="card-nav-roster"]',
      title: "Your Teammates",
      description: "See everyone on your team including coaches, athletes, and supporters.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-nav-stats"]',
      title: "Track Your Progress",
      description: "View your performance statistics and watch your improvement over time.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-nav-playbook"]',
      title: "Study the Playbook",
      description: "Your coaches design plays here. Check back often to review strategies!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-nav-chat"]',
      title: "Team Chat",
      description: "Stay connected with your team through real-time messaging.",
      position: "bottom"
    },
    {
      target: '[data-testid="button-share-profile"]',
      title: "Share Your Profile",
      description: "Share your athlete profile with family and friends to show off your achievements!",
      position: "top"
    },
    {
      target: '[data-testid="button-settings"]',
      title: "Personalize Your Profile",
      description: "Update your avatar and name in Settings to make your profile stand out!",
      position: "bottom"
    }
  ];

  return (
    <>
      {user?.id && (
        <OnboardingTour 
          steps={athleteTourSteps} 
          storageKey={`athlete-profile-onboarding-${user.id}`}
          welcomeModal={athleteWelcomeModal}
        />
      )}
      <DashboardBackground />
      <div className="min-h-screen relative z-10">
        {/* Header Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="STATFYR" className="h-8 w-8" />
              <h1 className="text-lg font-display font-bold tracking-wide">STATF<span className="text-orange-500">Y</span>R</h1>
            </div>
            <div className="flex items-center gap-2">
              {updateAvailable && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={applyUpdate}
                  className="text-amber-500 hover:text-amber-400 animate-pulse"
                  title="Update available"
                  data-testid="button-update-available"
                >
                  <AlertCircle className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  if (notificationsEnabled) {
                    clearUnread();
                    setLocation("/chat");
                  } else {
                    const success = await enableNotifications();
                    if (success) {
                      toast.success("Notifications enabled!");
                    } else {
                      toast.error("Could not enable notifications");
                    }
                  }
                }}
                className={hasUnread ? "text-green-500 hover:text-green-400" : ""}
                title={notificationsEnabled ? (hasUnread ? "New messages" : "Notifications enabled") : "Enable notifications"}
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
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
        <main className="max-w-lg mx-auto px-4 py-4">
          {/* Modern Profile Card */}
          <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl" style={{ aspectRatio: "3/4" }}>
            {/* Background Gradient - Teal/Green like the reference */}
            <div className="absolute inset-0 bg-gradient-to-b from-teal-600 via-teal-500 to-teal-400" />
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            {/* Profile Image - Large, covering upper portion */}
            <div className="absolute inset-0 flex flex-col">
              {/* Image Area */}
              <div className="relative flex-1 flex items-end justify-center overflow-hidden">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user?.name || ""} 
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[120px] font-display font-bold text-white/30">
                      {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Gradient overlay for text readability at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Bottom gradient for the card effect */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-rose-200/50 via-rose-100/30 to-transparent" />
              </div>
            </div>

            {/* Badge Ribbon - Top Left */}
            <div className="absolute top-4 left-4">
              <div className={`${badge.color} px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5`}>
                <badge.icon className="h-4 w-4 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">{badge.name}</span>
              </div>
            </div>

            {/* Rating - Top Right */}
            <div className="absolute top-4 right-4">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <span className="text-lg font-bold text-slate-800">{rating}</span>
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
            </div>

            {/* Info Section at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-3xl font-display font-bold mb-1 drop-shadow-lg">
                {user?.name || user?.username}
              </h2>
              <p className="text-white/80 text-sm mb-4 drop-shadow">
                {currentMembership?.position || "Athlete"} • {currentTeam?.name}
              </p>

              {/* Quick Stats Row */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 text-center border-r border-white/20">
                  <div className="text-2xl font-bold">{myStats?.gamesPlayed || 0}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wider">Games</div>
                </div>
                <div className="flex-1 text-center border-r border-white/20">
                  <div className="text-2xl font-bold">
                    {currentMembership?.jerseyNumber || "—"}
                  </div>
                  <div className="text-xs text-white/70 uppercase tracking-wider">Jersey</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold">{shoutoutCount}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wider">Cheers</div>
                </div>
              </div>

              {/* Share Button */}
              <Button 
                onClick={handleShare}
                className="w-full bg-white text-slate-800 hover:bg-white/90 rounded-full font-bold py-3"
                data-testid="button-share-profile"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
            </div>
          </div>

          {/* Navigation Cards Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {navCards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`relative p-4 rounded-2xl transition-all duration-200 group ${
                  activeSection === card.id
                    ? "ring-2 ring-primary shadow-lg scale-105"
                    : "hover:scale-105 hover:shadow-lg"
                }`}
                data-testid={`card-nav-${card.id}`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-90`} />
                
                {/* Content */}
                <div className="relative flex flex-col items-center gap-2 text-white">
                  <card.icon className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">{card.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Upcoming Events Preview (when no section active) */}
          {!activeSection && upcomingEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-display font-bold mb-3 text-primary">Upcoming</h3>
              <div className="space-y-2">
                {upcomingEvents.map((event: Event) => (
                  <Card key={event.id} className="bg-card/80 backdrop-blur-sm border-white/10">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-primary/10">
                        <span className="text-xs font-bold text-primary uppercase">
                          {format(new Date(event.date), "MMM")}
                        </span>
                        <span className="text-xl font-display font-bold">
                          {format(new Date(event.date), "d")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.date), "h:mm a")}
                          {event.location && (
                            <>
                              <span className="mx-1">•</span>
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={event.type === "Game" ? "default" : "secondary"} className="text-xs">
                        {event.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* My Highlights Preview (when no section active) */}
          {!activeSection && myHighlights.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-display font-bold mb-3 text-primary">My Highlights</h3>
              <div className="grid grid-cols-2 gap-2">
                {myHighlights.slice(0, 4).map((highlight: HighlightVideo) => {
                  const thumbnailSrc = highlight.thumbnailKey ?? undefined;
                  return (
                    <div key={highlight.id} className="relative aspect-video rounded-xl overflow-hidden bg-black/20">
                      {thumbnailSrc ? (
                        <img src={thumbnailSrc} alt={highlight.title ?? "Highlight"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white font-medium truncate">{highlight.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Content */}
          {activeSection && (
            <div ref={contentRef} className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation("/athlete/dashboard")}
                  className="gap-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">
                  {navCards.find(c => c.id === activeSection)?.name}
                </h2>
              </div>

              {/* Roster Section */}
              {activeSection === "roster" && (
                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No team members yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamMembers.map((member: TeamMember) => (
                      <Card key={member.id} className="bg-card/80 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-bold">
                            {member.user?.name?.charAt(0) || member.user?.firstName?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{member.user?.name || `${member.user?.firstName} ${member.user?.lastName}`}</p>
                            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                          </div>
                          {member.jerseyNumber && (
                            <Badge className="bg-primary/20 text-primary">#{member.jerseyNumber}</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Schedule Section */}
              {activeSection === "schedule" && (
                <div className="space-y-3">
                  {teamEvents.length === 0 ? (
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No upcoming events</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamEvents.map((event: Event) => (
                      <Card key={event.id} className="bg-card/80 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground uppercase">
                              {format(new Date(event.date), "MMM")}
                            </span>
                            <span className="text-xl font-display font-bold">
                              {format(new Date(event.date), "d")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{event.title}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.date), "h:mm a")}
                              {event.location && (
                                <>
                                  <span className="mx-1">•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{event.location}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <Badge variant={event.type === "Game" ? "default" : "secondary"} className="text-xs">
                            {event.type}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Stats Section */}
              {activeSection === "stats" && (
                <div className="space-y-4">
                  <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-around mb-4">
                        <div className="text-center">
                          <p className="text-4xl font-display font-bold text-primary">{myStats?.gamesPlayed || 0}</p>
                          <p className="text-sm text-muted-foreground">Games</p>
                        </div>
                        {myStats?.hotStreak && (
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-orange-500">
                              <Flame className="h-6 w-6" />
                              <span className="text-2xl font-bold">{myStats.streakLength}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Hot Streak</p>
                          </div>
                        )}
                      </div>
                      
                      {myStats?.stats && Object.keys(myStats.stats).length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(myStats.stats).map(([key, value]) => {
                            const statData = typeof value === "object" && value !== null ? value as { total: number; perGame: number; name: string } : { total: value as number, perGame: 0, name: key };
                            return (
                              <div key={key} className="text-center p-3 rounded-lg bg-white/5">
                                <p className="text-2xl font-bold text-primary">{statData.total}</p>
                                <p className="text-xs font-semibold uppercase">{key}</p>
                                <p className="text-xs text-muted-foreground">{statData.perGame}/game</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground">No stats recorded yet. Play some games!</p>
                      )}
                    </CardContent>
                  </Card>

                  {myStats?.gameHistory && myStats.gameHistory.length > 1 && (
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          My Progression
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const chartData = myStats.gameHistory.map((game: any, idx: number) => {
                            const stats = game.stats || {};
                            const total = Object.values(stats).reduce((a: number, b: any) => a + (b as number), 0);
                            return { 
                              game: `G${idx + 1}`, 
                              total,
                              ...stats 
                            };
                          }).reverse();
                          
                          const statKeys = Object.keys(myStats.stats || {}).slice(0, 3);
                          const colors = ['#3b82f6', '#22c55e', '#f59e0b'];
                          
                          return (
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                  <XAxis dataKey="game" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '12px' }}
                                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                                  {statKeys.map((key, idx) => (
                                    <Line key={key} type="monotone" dataKey={key} name={key} stroke={colors[idx]} strokeWidth={2} dot={{ r: 4, fill: colors[idx] }} />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {myStats?.gameHistory && myStats.gameHistory.length > 0 && (
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-500" />
                          Game History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-white/10">
                          {myStats.gameHistory.slice(0, 5).map((game: any, idx: number) => (
                            <div key={game.gameId || idx} className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                  game.result === 'W' ? 'bg-green-500/20 text-green-400' :
                                  game.result === 'L' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {game.result}
                                </div>
                                <div>
                                  <p className="font-medium">vs {game.opponent}</p>
                                  <p className="text-xs text-muted-foreground">{game.date}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {Object.entries(game.stats || {}).slice(0, 3).map(([key, val]) => (
                                  <div key={key} className="text-center px-2">
                                    <div className="text-sm font-bold text-primary">{String(val)}</div>
                                    <div className="text-xs text-muted-foreground uppercase">{key}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Playbook Section */}
              {activeSection === "playbook" && (
                <div className="space-y-3">
                  {teamPlays.length === 0 ? (
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No plays in the playbook yet</p>
                        <p className="text-sm mt-1">Your coach will add plays here</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamPlays.map((play: Play) => (
                      <Card key={play.id} className="bg-card/80 backdrop-blur-sm border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold">{play.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{play.category || "Uncategorized"}</p>
                            </div>
                          </div>
                          {play.description && (
                            <p className="text-sm text-muted-foreground">{play.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Highlights Section */}
              {activeSection === "highlights" && (
                <div className="space-y-4">
                  {teamHighlights.length === 0 ? (
                    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No highlights yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {teamHighlights.map((highlight: HighlightVideo) => {
                        const thumbnailSrc = highlight.thumbnailKey ?? undefined;
                        return (
                          <div key={highlight.id} className="relative aspect-video rounded-xl overflow-hidden bg-black/20">
                            {thumbnailSrc ? (
                              <img src={thumbnailSrc} alt={highlight.title ?? "Highlight"} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs text-white font-medium truncate">{highlight.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
