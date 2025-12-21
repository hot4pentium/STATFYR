import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, MapPin, Users, BarChart3, MessageSquare, X, Settings, LogOut, Clock, Utensils, Coffee, Shield, ClipboardList, Video, Play, Trophy } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, type TeamMember, type Event, type HighlightVideo } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth } from "date-fns";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-bold ${className}`}>{children}</span>;
}

export default function SupporterDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout } = useUser();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<TeamMember | null>(null);
  const [isAthleteCardFlipped, setIsAthleteCardFlipped] = useState(false);

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
    enabled: !!currentTeam,
    refetchInterval: 10000,
  });

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
                          ) : member.role === "supporter" ? (
                            <div className="font-bold text-foreground uppercase text-[10px] md:text-xs bg-accent/20 text-accent px-2 py-1 rounded mb-1">Fan</div>
                          ) : (
                            <div className="font-bold text-foreground text-sm md:text-base">#{member.user.number || "00"}</div>
                          )}
                          <div className="text-xs md:text-sm font-bold text-primary truncate max-w-[80px] md:max-w-none">{member.user.name || member.user.username}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">{member.role === "coach" ? "Head Coach" : member.role === "supporter" ? "Supporter" : (member.user.position || "Player")}</div>
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
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Win Rate</p>
                <p className="text-3xl font-display font-bold">78%</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Team Members</p>
                <p className="text-3xl font-display font-bold">{teamMembers.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Athletes</p>
                <p className="text-3xl font-display font-bold">{athletes.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Position</p>
                <p className="text-3xl font-display font-bold text-accent">1st</p>
              </CardContent>
            </Card>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamHighlights.map((video: HighlightVideo) => (
                  <Card key={video.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all overflow-hidden">
                    <div className="relative aspect-video bg-black">
                      {video.thumbnailKey ? (
                        <img src={video.publicUrl || undefined} alt={video.title || "Video"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full">
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
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
      default:
        return null;
    }
  };

  if (!currentTeam) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <DashboardBackground />
      <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between gap-4">
        <h2 className="text-sm md:text-lg font-medium text-muted-foreground">
          {currentTeam?.name || "TeamPulse"} - {currentTeam?.season || "Season 2024-2025"}
        </h2>
        <div className="flex items-center gap-3">
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
        <div ref={heroBannerRef} className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
          <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-start gap-4 md:gap-6 flex-1 min-w-0">
                <div className="h-12 w-12 md:h-28 md:w-28 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                  <Shield className="h-6 w-6 md:h-16 md:w-16 text-white" />
                </div>
                
                <div className="space-y-1 md:space-y-3 flex-1 min-w-0">
                  <div className="space-y-0 md:space-y-1">
                    <h1 className="text-xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-tight truncate">
                      {currentTeam?.name || "Team"}
                    </h1>
                    <h2 className="text-xs md:text-2xl text-white/80 font-bold uppercase tracking-wide">
                      {currentTeam?.sport || "Sport"} <span className="text-white/60">•</span> {currentTeam?.season || "Season 2024-2025"}
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-1 md:pt-2">
                    <span className="px-2 md:px-3 py-0.5 md:py-1 bg-accent/20 backdrop-blur-sm rounded-lg border border-accent/30 text-[10px] md:text-sm font-bold text-accent uppercase tracking-wider">
                      Supporter
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2 md:gap-3 flex-shrink-0">
                <div className="h-16 w-16 md:h-32 md:w-32 bg-white/10 backdrop-blur-md rounded-full border-2 md:border-4 border-accent/50 flex items-center justify-center shadow-xl overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name || "Supporter"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl md:text-4xl font-display font-bold text-white/60">
                      {user?.name?.split(' ').map(n => n[0]).join('') || "?"}
                    </span>
                  )}
                </div>
                <p className="text-[10px] md:text-sm text-white/80 font-bold uppercase tracking-wider text-center max-w-[80px] md:max-w-none truncate">{user?.name || "Supporter"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
              className={`h-full p-4 rounded-lg border transition-all duration-200 backdrop-blur-sm group text-left ${
                selectedCard === action.id
                  ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/20"
                  : `border-white/5 bg-gradient-to-br ${action.color} hover:border-white/20 hover:bg-white/5`
              }`}
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
                        <p className="text-lg font-bold text-accent uppercase tracking-wider drop-shadow-lg">{selectedAthlete.user.position || "Player"}</p>
                      </div>

                      <div className="absolute bottom-0 right-0 p-6">
                        <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-4 shadow-lg">
                          <span className="text-white font-display font-bold text-4xl drop-shadow">#{selectedAthlete.user.number || "00"}</span>
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
    </div>
  );
}
