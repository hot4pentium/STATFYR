import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLAYS, RECENT_CHATS } from "@/lib/mockData";
import { Activity, TrendingUp, Users, CalendarClock, ChevronRight, PlayCircle, BarChart3, ClipboardList, MessageSquare, Trophy, Shield, X, Copy, Check, Plus, Pencil, Trash2, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { createTeam, getTeamMembers, getCoachTeams, getTeamEvents, createEvent, updateEvent, deleteEvent, getAllTeamHighlights, deleteHighlightVideo, type TeamMember, type Event, type HighlightVideo } from "@/lib/api";
import { VideoUploader } from "@/components/VideoUploader";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth } from "date-fns";
import { MapPin, Clock, Utensils, Coffee } from "lucide-react";

export default function CoachDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, setCurrentTeam, logout } = useUser();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [rosterTab, setRosterTab] = useState<"all" | "athletes" | "coach" | "supporters">("all");
  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    type: "Practice",
    date: "",
    location: "",
    details: "",
    opponent: "",
    drinksAthleteId: "",
    snacksAthleteId: ""
  });
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<TeamMember | null>(null);
  const [isAthleteCardFlipped, setIsAthleteCardFlipped] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  const { data: coachTeams } = useQuery({
    queryKey: ["/api/coach", user?.id, "teams"],
    queryFn: () => user ? getCoachTeams(user.id) : Promise.resolve([]),
    enabled: !!user && !currentTeam,
  });

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

  const { data: teamHighlights = [], refetch: refetchHighlights } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 5000,
  });

  const createEventMutation = useMutation({
    mutationFn: (data: { type: string; date: string; location?: string; details?: string; opponent?: string; drinksAthleteId?: string; snacksAthleteId?: string }) => 
      createEvent(currentTeam!.id, { ...data, title: data.type, createdBy: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "events"] });
      toast.success("Event created!");
      setIsEventModalOpen(false);
      resetEventForm();
    },
    onError: () => toast.error("Failed to create event"),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title?: string; type: string; date: string; location?: string; details?: string; opponent?: string; drinksAthleteId?: string; snacksAthleteId?: string }> }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "events"] });
      toast.success("Event updated!");
      setIsEventModalOpen(false);
      setEditingEvent(null);
      resetEventForm();
    },
    onError: () => toast.error("Failed to update event"),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "events"] });
      toast.success("Event deleted!");
      setDeleteConfirmEvent(null);
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const resetEventForm = () => {
    setEventForm({ type: "Practice", date: "", location: "", details: "", opponent: "", drinksAthleteId: "", snacksAthleteId: "" });
  };

  const openAddEvent = () => {
    setEditingEvent(null);
    resetEventForm();
    setIsEventModalOpen(true);
  };

  const openEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      type: event.type,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location || "",
      details: event.details || "",
      opponent: (event as any).opponent || "",
      drinksAthleteId: (event as any).drinksAthleteId || "",
      snacksAthleteId: (event as any).snacksAthleteId || ""
    });
    setIsEventModalOpen(true);
  };

  const handleEventSubmit = () => {
    if (!eventForm.date) {
      toast.error("Date is required");
      return;
    }
    
    const data = {
      type: eventForm.type,
      date: eventForm.date,
      location: eventForm.location || undefined,
      details: eventForm.details || undefined,
      opponent: eventForm.opponent || undefined,
      drinksAthleteId: eventForm.drinksAthleteId || undefined,
      snacksAthleteId: eventForm.snacksAthleteId || undefined
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: { ...data, title: data.type } });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const createTeamMutation = useMutation({
    mutationFn: () => createTeam({
      name: "Thunderbolts FC",
      sport: "Football",
      division: "Premier Division",
      season: "2024-2025",
      coachId: user!.id
    }),
    onSuccess: (team) => {
      setCurrentTeam(team);
      toast.success(`Team created! Share code: ${team.code}`);
      queryClient.invalidateQueries({ queryKey: ["/api/coach"] });
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation("/auth/coach");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (user && !currentTeam && coachTeams) {
      if (coachTeams.length > 0) {
        setCurrentTeam(coachTeams[0]);
      } else {
        createTeamMutation.mutate();
      }
    }
  }, [user, currentTeam, coachTeams]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const copyTeamCode = () => {
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCodeCopied(true);
      toast.success("Team code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach"), [teamMembers]);
  const supporters = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "supporter"), [teamMembers]);
  
  const filteredRosterMembers = useMemo(() => {
    switch (rosterTab) {
      case "athletes": return athletes;
      case "coach": return coaches;
      case "supporters": return supporters;
      default: return teamMembers;
    }
  }, [rosterTab, teamMembers, athletes, coaches, supporters]);

  useEffect(() => {
    if (selectedCard && contentRef.current) {
      // Scroll to content area when card is selected
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    }
  }, [selectedCard]);

  const quickActions = [
    { 
      name: "Roster", 
      id: "roster",
      icon: Users, 
      color: "from-blue-500/20 to-blue-600/20",
      description: "Manage squad"
    },
    { 
      name: "Events", 
      id: "events",
      icon: CalendarClock, 
      color: "from-purple-500/20 to-purple-600/20",
      description: "Schedule"
    },
    { 
      name: "Playbook", 
      id: "playbook",
      icon: ClipboardList, 
      color: "from-green-500/20 to-green-600/20",
      description: "Tactics"
    },
    { 
      name: "Stats", 
      id: "stats",
      icon: BarChart3, 
      color: "from-orange-500/20 to-orange-600/20",
      description: "Analytics"
    },
    { 
      name: "Highlights", 
      id: "highlights",
      icon: Video, 
      color: "from-yellow-500/20 to-yellow-600/20",
      description: "Team videos"
    },
    { 
      name: "Chat", 
      id: "chat",
      icon: MessageSquare, 
      color: "from-pink-500/20 to-pink-600/20",
      description: "Messages"
    },
  ];

  const renderContent = () => {
    switch(selectedCard) {
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
                  <p className="text-sm">Share your team code to invite members!</p>
                  {currentTeam?.code && (
                    <p className="mt-2 font-mono text-primary text-lg">{currentTeam.code}</p>
                  )}
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
      case "events":
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
              <div className="flex gap-2">
                {selectedDate && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} data-testid="button-clear-date">
                    Clear Filter
                  </Button>
                )}
                <Button onClick={openAddEvent} className="gap-2" data-testid="button-add-event">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              <Card className="bg-background/40 border-white/10 h-fit overflow-hidden" data-testid="calendar-month">
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
                    className=""
                  />
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-muted-foreground text-center">
                    <span className="underline decoration-primary underline-offset-4 font-bold">Underlined</span> dates have events
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-bold">{selectedDate ? "No events on this date" : "No events scheduled"}</p>
                    <p className="text-sm">Click "Add Event" to create your first event!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredEvents.map((event: Event) => (
                      <Card key={event.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all" data-testid={`event-card-${event.id}`}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-primary/20 text-primary border border-primary/30">{event.type}</span>
                                  {event.opponent && (
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-accent/20 text-accent border border-accent/30" data-testid={`event-opponent-${event.id}`}>
                                      vs {event.opponent}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEvent(event)} data-testid={`button-edit-event-${event.id}`}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirmEvent(event)} data-testid={`button-delete-event-${event.id}`}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <h3 className="font-bold text-lg">{event.title}</h3>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarClock className="h-4 w-4 text-primary" />
                                  <span>{format(new Date(event.date), "EEEE, MMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4 text-primary" />
                                  <span>{format(new Date(event.date), "h:mm a")}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span data-testid={`event-location-${event.id}`}>{event.location}</span>
                                  </div>
                                )}
                              </div>

                              {event.details && (
                                <p className="text-sm text-muted-foreground/80 bg-white/5 rounded-lg p-3" data-testid={`event-details-${event.id}`}>
                                  {event.details}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
                                <div className="flex items-center gap-2 text-sm">
                                  <Utensils className="h-4 w-4 text-green-400" />
                                  <span className="text-muted-foreground">Drinks:</span>
                                  <span className={getAthleteName(event.drinksAthleteId) ? "text-foreground font-medium" : "text-muted-foreground/50 italic"} data-testid={`event-drinks-${event.id}`}>
                                    {getAthleteName(event.drinksAthleteId) || "Unassigned"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Coffee className="h-4 w-4 text-orange-400" />
                                  <span className="text-muted-foreground">Snacks:</span>
                                  <span className={getAthleteName(event.snacksAthleteId) ? "text-foreground font-medium" : "text-muted-foreground/50 italic"} data-testid={`event-snacks-${event.id}`}>
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
      case "playbook":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAYS.map((play) => (
              <Card key={play.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all">
                <div className="h-24 bg-[#1a3c28]/50 relative overflow-hidden border-b border-white/5">
                  <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
                    <circle cx="50" cy="50" r="8" strokeDasharray="3 3" />
                    <line x1="20" y1="20" x2="35" y2="35" />
                    <path d="M 50 50 Q 65 35 80 50" strokeDasharray="2 2" />
                  </svg>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground">{play.name}</h3>
                    <div className="text-xs text-muted-foreground mb-2">{play.type}</div>
                    <div className="flex flex-wrap gap-1">
                      {play.tags.map(tag => (
                        <span key={tag} className="text-[9px] uppercase font-bold bg-white/10 px-2 py-1 rounded text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "stats":
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg Possession", value: "52%", subtext: "Season" },
              { label: "Goals / Game", value: "1.8", subtext: "Average" },
              { label: "Pass Accuracy", value: "84%", subtext: "Season" },
              { label: "xG Differential", value: "+3.2", subtext: "Advantage" },
              { label: "Clean Sheets", value: "6", subtext: "Games" },
              { label: "Yellow Cards", value: "18", subtext: "Total" },
              { label: "Red Cards", value: "1", subtext: "Total" },
              { label: "Win Rate", value: "78%", subtext: "Conversion" },
            ].map((stat, i) => (
              <Card key={i} className="bg-background/40 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-3xl font-display font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.subtext}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "highlights":
        const handleDeleteVideo = async (videoId: string) => {
          if (!user) return;
          try {
            await deleteHighlightVideo(videoId, user.id);
            toast.success("Video deleted");
            refetchHighlights();
          } catch (error) {
            toast.error("Failed to delete video");
          }
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Upload and manage team highlight videos</p>
              {currentTeam && user && (
                <VideoUploader 
                  teamId={currentTeam.id} 
                  userId={user.id} 
                  onUploadComplete={() => refetchHighlights()}
                  compact
                />
              )}
            </div>

            {teamHighlights.length === 0 ? (
              <div className="bg-background/50 border border-white/5 rounded-lg aspect-video flex items-center justify-center max-w-md mx-auto">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No highlights yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Upload a video to get started</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {teamHighlights.map((video: HighlightVideo) => (
                  <div key={video.id} className="bg-background/50 border border-white/5 rounded-lg overflow-hidden" data-testid={`highlight-video-${video.id}`}>
                    <div className="aspect-video bg-black relative">
                      {video.status === "ready" && video.publicUrl ? (
                        <video
                          src={video.publicUrl}
                          controls
                          className="w-full h-full object-contain"
                          poster={video.thumbnailKey || undefined}
                          data-testid={`video-player-${video.id}`}
                        />
                      ) : video.status === "failed" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                          <div className="text-center">
                            <X className="h-8 w-8 mx-auto mb-2 text-destructive" />
                            <p className="text-sm font-medium text-destructive">Processing failed</p>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/5 to-primary/10">
                          <div className="text-center">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                            <p className="text-sm font-medium mt-2">
                              {video.status === "queued" ? "Queued..." : "Converting..."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{video.title || "Untitled"}</p>
                          {video.status !== "ready" && (
                            <Badge variant={video.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                              {video.status === "queued" && "Queued"}
                              {video.status === "processing" && "Processing"}
                              {video.status === "failed" && "Failed"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {video.uploader?.name || video.uploader?.username}
                          {video.createdAt && ` • ${format(new Date(video.createdAt), "MMM d, yyyy")}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-video-${video.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "chat":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-background/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Team Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 rounded bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition">
                  <div className="font-bold text-sm text-primary"># general</div>
                  <div className="text-xs text-muted-foreground">12 new messages</div>
                </div>
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer transition">
                  <div className="font-bold text-sm"># announcements</div>
                  <div className="text-xs text-muted-foreground">3 new messages</div>
                </div>
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer transition">
                  <div className="font-bold text-sm"># tactics</div>
                  <div className="text-xs text-muted-foreground">5 new messages</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Direct Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {athletes.slice(0, 3).map((member: TeamMember) => (
                  <div key={member.id} className="p-3 rounded hover:bg-white/5 cursor-pointer transition flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback>{member.user.name?.[0] || "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{member.user.name || member.user.username}</div>
                      <div className="text-xs text-muted-foreground truncate">Online now</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div 
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 space-y-6">
          {/* Hero Banner */}
          <div ref={heroBannerRef} className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-6 flex-1">
                  <div className="h-20 w-20 md:h-28 md:w-28 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                    <Shield className="h-10 w-10 md:h-16 md:w-16 text-white" />
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-tight">
                        {currentTeam?.name || "Thunderbolts FC"}
                      </h1>
                      <h2 className="text-lg md:text-2xl text-white/80 font-bold uppercase tracking-wide">
                        {currentTeam?.sport || "Football"} <span className="text-white/60">•</span> {currentTeam?.season || "Season 2024-2025"}
                      </h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {currentTeam?.code && (
                        <button
                          onClick={copyTeamCode}
                          className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30 flex items-center gap-2 hover:bg-green-500/30 transition-colors"
                          data-testid="button-copy-team-code"
                        >
                          <span className="text-sm font-bold text-green-300 uppercase tracking-wider font-mono">Code: {currentTeam.code}</span>
                          {codeCopied ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4 text-green-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-[#7d5e5e00]">
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

          {/* Expanded Content Container */}
          {selectedCard && (
            <div ref={contentRef} className="relative rounded-xl overflow-hidden bg-card/50 border border-white/10 backdrop-blur-sm p-6 animate-in slide-in-from-top duration-300">
              <button
                onClick={() => {
                  setSelectedCard(null);
                  // Immediately scroll to hero banner when close button is clicked
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

          {/* Stats Grid */}
          {!selectedCard && (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Win Rate</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">78%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> 
                    <span className="text-green-500 font-medium">+12%</span> from last season
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Roster</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{athletes.length} / {teamMembers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-primary font-medium">{teamMembers.length} total members</span>
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Next Event</CardTitle>
                  <CalendarClock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-display font-bold truncate">Match vs. Eagles</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tomorrow at 2:00 PM
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plays Ready</CardTitle>
                  <Clipboard className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{PLAYS.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 new added this week
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content (Hidden when card selected) */}
          {!selectedCard && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Roster Preview */}
              <Card className="col-span-2 border-white/5 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-display uppercase tracking-wide">Top Performers</CardTitle>
                  <Link href="/roster">
                    <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {athletes.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">No athletes yet. Share your team code to invite athletes!</p>
                        {currentTeam?.code && (
                          <p className="mt-2 font-mono text-primary">{currentTeam.code}</p>
                        )}
                      </div>
                    ) : (
                      athletes.slice(0, 3).map((member: TeamMember) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors border border-transparent hover:border-white/5 group">
                          <div className="flex items-center gap-4">
                            <div className="font-display text-xl font-bold text-muted-foreground w-8 text-center group-hover:text-primary transition-colors">
                              #{member.user.number || "00"}
                            </div>
                            <Avatar className="h-10 w-10 border border-white/10">
                              <AvatarImage src={member.user.avatar || undefined} />
                              <AvatarFallback>{member.user.name?.[0] || "A"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-foreground">{member.user.name || member.user.username}</div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">{member.user.position || "Player"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                             <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity / Chat */}
              <Card className="border-white/5 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-display uppercase tracking-wide">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-6">
                     {RECENT_CHATS.map(chat => (
                       <div key={chat.id} className="flex gap-3">
                         <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-bold text-foreground">{chat.user}</span>
                             <span className="text-xs text-muted-foreground">{chat.time}</span>
                           </div>
                           <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-br-lg rounded-bl-lg rounded-tr-lg border border-white/5">
                             {chat.message}
                           </p>
                         </div>
                       </div>
                     ))}
                     
                     <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Upcoming Events</h4>
                        {teamEvents.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No events scheduled</p>
                        ) : (
                          teamEvents.slice(0, 2).map((event: Event) => (
                            <div key={event.id} className="mb-3 p-3 rounded bg-accent/5 border border-accent/10 flex gap-3">
                              <div className="flex flex-col items-center justify-center px-2 border-r border-accent/10">
                                 <span className="text-xs font-bold text-accent uppercase">{new Date(event.date).toLocaleString('default', {month: 'short'})}</span>
                                 <span className="text-lg font-display font-bold text-foreground">{new Date(event.date).getDate()}</span>
                              </div>
                              <div>
                                 <div className="font-bold text-sm text-foreground">{event.title}</div>
                                 <div className="text-xs text-muted-foreground">{event.location || "TBD"}</div>
                              </div>
                            </div>
                          ))
                        )}
                     </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Event Add/Edit Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-type">Type *</Label>
              <Select value={eventForm.type} onValueChange={(value) => setEventForm({ ...eventForm, type: value })}>
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Practice">Practice</SelectItem>
                  <SelectItem value="Match">Match</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Tournament">Tournament</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Date & Time *</Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                data-testid="input-event-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-opponent">Opponent</Label>
              <Input
                id="event-opponent"
                value={eventForm.opponent}
                onChange={(e) => setEventForm({ ...eventForm, opponent: e.target.value })}
                placeholder="e.g., City Rovers FC"
                data-testid="input-event-opponent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input
                id="event-location"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="e.g., Training Ground A"
                data-testid="input-event-location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-drinks">Bringing Drinks?</Label>
              <Select value={eventForm.drinksAthleteId || "none"} onValueChange={(value) => setEventForm({ ...eventForm, drinksAthleteId: value === "none" ? "" : value })}>
                <SelectTrigger data-testid="select-event-drinks">
                  <SelectValue placeholder="Select athlete..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {athletes.map((athlete: TeamMember) => (
                    <SelectItem key={athlete.id} value={athlete.user.id}>
                      {athlete.user.name || athlete.user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-snacks">Bringing Snacks?</Label>
              <Select value={eventForm.snacksAthleteId || "none"} onValueChange={(value) => setEventForm({ ...eventForm, snacksAthleteId: value === "none" ? "" : value })}>
                <SelectTrigger data-testid="select-event-snacks">
                  <SelectValue placeholder="Select athlete..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {athletes.map((athlete: TeamMember) => (
                    <SelectItem key={athlete.id} value={athlete.user.id}>
                      {athlete.user.name || athlete.user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-details">Details</Label>
              <Textarea
                id="event-details"
                value={eventForm.details}
                onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })}
                placeholder="Additional details..."
                rows={3}
                data-testid="input-event-details"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)} data-testid="button-cancel-event">
              Cancel
            </Button>
            <Button 
              onClick={handleEventSubmit} 
              disabled={createEventMutation.isPending || updateEventMutation.isPending}
              data-testid="button-save-event"
            >
              {createEventMutation.isPending || updateEventMutation.isPending ? "Saving..." : (editingEvent ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmEvent} onOpenChange={() => setDeleteConfirmEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{deleteConfirmEvent?.title}"? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmEvent(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmEvent && deleteEventMutation.mutate(deleteConfirmEvent.id)}
              disabled={deleteEventMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                            <div>⚡ Crucial goal</div>
                            <div>✨ MVP award</div>
                            <div>🎯 Key assist</div>
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
    </Layout>
  );
}

// Helper icon component since Clipboard is imported above
function Clipboard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
