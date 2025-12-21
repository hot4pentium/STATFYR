import { EVENTS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Ticket, MapPin, ArrowLeft, Users, BarChart3, MessageSquare, X, Settings, LogOut, Clock, Utensils, Coffee } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, type TeamMember, type Event } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth } from "date-fns";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-bold ${className}`}>{children}</span>;
}

export default function SupporterDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout } = useUser();
  const nextMatch = EVENTS.find(e => e.type === 'Match') || EVENTS[0];
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);

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
            
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              <Card className="bg-background/40 border-white/10 h-fit" data-testid="calendar-month">
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    modifiers={{
                      hasEvent: eventDates
                    }}
                    modifiersStyles={{
                      hasEvent: {
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        textDecorationColor: 'hsl(var(--primary))',
                        textUnderlineOffset: '4px'
                      }
                    }}
                    className="w-full"
                  />
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-muted-foreground text-center">
                    <span className="underline decoration-primary underline-offset-4 font-bold">Underlined</span> dates have events
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-bold">{selectedDate ? "No events on this date" : "No events scheduled"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
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
                  <Card key={member.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all">
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-full px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
              {currentTeam.name}
            </span>
            <Link href="/supporter/settings">
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 hover:bg-white/10"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-logout"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full px-4 md:px-8 py-8">
        <div className="relative rounded-2xl overflow-hidden bg-primary/10 border border-white/5 p-8 md:p-12 text-center md:text-left">
           <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-primary/20" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                 <Badge className="mb-4 bg-accent text-accent-foreground border-none">Next Match</Badge>
                 <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter text-foreground mb-2">
                    {currentTeam.name} <span className="text-muted-foreground">vs</span> Eagles
                 </h1>
                 <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Tomorrow, 2:00 PM</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> City Stadium</div>
                 </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                 <Button size="lg" className="w-full font-bold text-lg h-14 shadow-lg shadow-primary/25">
                    <Ticket className="mr-2 h-5 w-5" /> Get Tickets
                 </Button>
                 <Button variant="outline" size="lg" className="w-full">
                    Match Preview
                 </Button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
    </div>
  );
}
