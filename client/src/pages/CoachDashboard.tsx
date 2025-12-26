import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, CalendarClock, ChevronRight, BarChart3, ClipboardList, MessageSquare, Trophy, Shield, X, Copy, Check, Plus, Pencil, Trash2, Video, Loader2, BookOpen, Activity, Radio } from "lucide-react";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getCoachTeams, getTeamEvents, createEvent, updateEvent, deleteEvent, getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, createPlay, updatePlay, deletePlay, updateTeamMember, removeTeamMember, getStartingLineup, saveStartingLineup, getTeamAggregateStats, getAdvancedTeamStats, getLiveSessionByEvent, createLiveSessionForEvent, startLiveSession, endLiveSession, type TeamMember, type Event, type HighlightVideo, type Play, type StartingLineup, type TeamAggregateStats, type AdvancedTeamStats, type LiveEngagementSession } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, Legend } from "recharts";
import { Flame, TrendingUp } from "lucide-react";
import { TeamBadge } from "@/components/TeamBadge";
import { TeamHeroCard } from "@/components/dashboard/TeamHeroCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, UserCog, UserMinus, Hash, Award } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { VideoUploader } from "@/components/VideoUploader";
import { PlaybookCanvas } from "@/components/PlaybookCanvas";
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
import { SPORT_POSITIONS } from "@/lib/sportConstants";

export default function CoachDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, setCurrentTeam, logout } = useUser();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<string | null>("events");
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
    hour: "09",
    minute: "00",
    ampm: "AM",
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
  const [expandedPlay, setExpandedPlay] = useState<Play | null>(null);
  const [playbookTab, setPlaybookTab] = useState<"Offense" | "Defense" | "Special">("Offense");
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberEditForm, setMemberEditForm] = useState({ jerseyNumber: "", position: "" });
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [lineupEvent, setLineupEvent] = useState<Event | null>(null);
  const [lineupStarters, setLineupStarters] = useState<string[]>([]);
  const [lineupBench, setLineupBench] = useState<string[]>([]);
  const [eventSessions, setEventSessions] = useState<Record<string, LiveEngagementSession | null>>({});
  const [loadingSessionForEvent, setLoadingSessionForEvent] = useState<string | null>(null);

  const { data: coachTeams } = useQuery({
    queryKey: ["/api/coach", user?.id, "teams"],
    queryFn: () => user ? getCoachTeams(user.id) : Promise.resolve([]),
    enabled: !!user && !currentTeam,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 2000,
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

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: aggregateStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "aggregate"],
    queryFn: () => currentTeam ? getTeamAggregateStats(currentTeam.id) : Promise.resolve({ games: 0, wins: 0, losses: 0, statTotals: {} }),
    enabled: !!currentTeam,
  });

  const { data: advancedStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "advanced"],
    queryFn: () => currentTeam ? getAdvancedTeamStats(currentTeam.id) : Promise.resolve({ gameHistory: [], athletePerformance: [], ratios: {} }),
    enabled: !!currentTeam,
  });

  const createPlayMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; canvasData: string; thumbnailData?: string; category: string }) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      return createPlay(currentTeam.id, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "plays"] });
      toast.success("Play saved! View it in your Playbook.");
    },
    onError: (error) => toast.error(error.message === "No team selected" ? "Please select a team first" : "Failed to save play"),
  });

  const updatePlayMutation = useMutation({
    mutationFn: ({ playId, data }: { playId: string; data: { name?: string; description?: string; canvasData?: string; status?: string } }) =>
      updatePlay(playId, user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "plays"] });
      toast.success("Play updated!");
    },
    onError: () => toast.error("Failed to update play"),
  });

  const deletePlayMutation = useMutation({
    mutationFn: (playId: string) => deletePlay(playId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "plays"] });
      toast.success("Play deleted!");
    },
    onError: () => toast.error("Failed to delete play"),
  });

  const createEventMutation = useMutation({
    mutationFn: (data: { type: string; date: string; location?: string; details?: string; opponent?: string; drinksAthleteId?: string; snacksAthleteId?: string }) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      return createEvent(currentTeam.id, { ...data, title: data.type, createdBy: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "events"] });
      toast.success("Event created!");
      setIsEventModalOpen(false);
      resetEventForm();
    },
    onError: (error) => toast.error(error.message === "No team selected" ? "Please select a team first" : "Failed to create event"),
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

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: { role?: string; jerseyNumber?: string | null; position?: string | null } }) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      return updateTeamMember(currentTeam.id, memberId, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "members"] });
      toast.success("Team member updated!");
      setEditingMember(null);
    },
    onError: () => toast.error("Failed to update team member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      return removeTeamMember(currentTeam.id, memberId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "members"] });
      toast.success("Team member removed!");
      setDeletingMember(null);
    },
    onError: () => toast.error("Failed to remove team member"),
  });

  const saveLineupMutation = useMutation({
    mutationFn: async () => {
      if (!lineupEvent || !user) throw new Error("No event selected");
      const players = [
        ...lineupStarters.map((id, idx) => ({ teamMemberId: id, isStarter: true, orderIndex: idx })),
        ...lineupBench.map((id, idx) => ({ teamMemberId: id, isStarter: false, orderIndex: idx }))
      ];
      return saveStartingLineup(lineupEvent.id, user.id, { players });
    },
    onSuccess: () => {
      toast.success("Starting lineup saved!");
      setLineupEvent(null);
    },
    onError: () => toast.error("Failed to save lineup"),
  });

  const openLineupDialog = async (event: Event) => {
    setLineupEvent(event);
    try {
      const lineup = await getStartingLineup(event.id);
      if (lineup && lineup.players) {
        setLineupStarters(lineup.players.filter(p => p.isStarter).sort((a, b) => a.orderIndex - b.orderIndex).map(p => p.teamMemberId));
        setLineupBench(lineup.players.filter(p => !p.isStarter).sort((a, b) => a.orderIndex - b.orderIndex).map(p => p.teamMemberId));
      } else {
        setLineupStarters([]);
        setLineupBench([]);
      }
    } catch {
      setLineupStarters([]);
      setLineupBench([]);
    }
  };

  const handleToggleGameDayLive = async (event: Event) => {
    if (!currentTeam) return;
    setLoadingSessionForEvent(event.id);
    try {
      let session = eventSessions[event.id];
      if (session === undefined) {
        session = await getLiveSessionByEvent(event.id);
        setEventSessions(prev => ({ ...prev, [event.id]: session }));
      }
      
      if (!session) {
        const newSession = await createLiveSessionForEvent(
          event.id,
          currentTeam.id,
          new Date(event.date),
          event.endDate ? new Date(event.endDate) : undefined
        );
        const startedSession = await startLiveSession(newSession.id);
        setEventSessions(prev => ({ ...prev, [event.id]: startedSession }));
        toast.success("Game Day Live started!");
      } else if (session.status === "scheduled") {
        const startedSession = await startLiveSession(session.id);
        setEventSessions(prev => ({ ...prev, [event.id]: startedSession }));
        toast.success("Game Day Live started!");
      } else if (session.status === "live") {
        const endedSession = await endLiveSession(session.id);
        setEventSessions(prev => ({ ...prev, [event.id]: endedSession }));
        toast.success("Game Day Live ended");
      } else {
        const newSession = await createLiveSessionForEvent(
          event.id,
          currentTeam.id,
          new Date(event.date),
          event.endDate ? new Date(event.endDate) : undefined
        );
        const startedSession = await startLiveSession(newSession.id);
        setEventSessions(prev => ({ ...prev, [event.id]: startedSession }));
        toast.success("Game Day Live restarted!");
      }
    } catch (error) {
      console.error("Error toggling Game Day Live:", error);
      toast.error("Failed to toggle Game Day Live");
    } finally {
      setLoadingSessionForEvent(null);
    }
  };

  const openEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberEditForm({
      jerseyNumber: member.jerseyNumber || "",
      position: member.position || "",
    });
  };

  const handleSaveMemberEdit = () => {
    if (!editingMember) return;
    updateMemberMutation.mutate({
      memberId: editingMember.userId,
      data: {
        jerseyNumber: memberEditForm.jerseyNumber || null,
        position: memberEditForm.position || null,
      },
    });
  };

  const handlePromoteDemote = (member: TeamMember) => {
    const newRole = member.role === "staff" ? "athlete" : "staff";
    updateMemberMutation.mutate({
      memberId: member.userId,
      data: { role: newRole },
    });
  };

  const resetEventForm = () => {
    setEventForm({ type: "Practice", date: "", hour: "09", minute: "00", ampm: "AM", location: "", details: "", opponent: "", drinksAthleteId: "", snacksAthleteId: "" });
  };

  const openAddEvent = () => {
    setEditingEvent(null);
    resetEventForm();
    setIsEventModalOpen(true);
  };

  const openEditEvent = (event: Event) => {
    setEditingEvent(event);
    const eventDate = new Date(event.date);
    let hours = eventDate.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedHour = hours.toString().padStart(2, "0");
    const formattedMinute = eventDate.getMinutes().toString().padStart(2, "0");
    
    const year = eventDate.getFullYear();
    const month = (eventDate.getMonth() + 1).toString().padStart(2, "0");
    const day = eventDate.getDate().toString().padStart(2, "0");
    const localDateString = `${year}-${month}-${day}`;
    
    setEventForm({
      type: event.type,
      date: localDateString,
      hour: formattedHour,
      minute: formattedMinute,
      ampm: ampm,
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
    
    // Convert 12-hour time to 24-hour format and create full datetime with local timezone
    let hour24 = parseInt(eventForm.hour, 10);
    if (eventForm.ampm === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (eventForm.ampm === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    // Create a local date and convert to ISO string to preserve timezone
    const localDate = new Date(eventForm.date + "T" + `${hour24.toString().padStart(2, "0")}:${eventForm.minute}:00`);
    const fullDateTime = localDate.toISOString();
    
    const data = {
      type: eventForm.type,
      date: fullDateTime,
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
        // Coach has no teams, redirect to onboarding to create one
        setLocation("/coach/onboarding");
      }
    }
  }, [user, currentTeam, coachTeams, setCurrentTeam, setLocation]);

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

  const nextGame = useMemo(() => {
    const now = new Date();
    const upcomingGames = teamEvents
      .filter((e: Event) => e.type?.toLowerCase() === "game" && new Date(e.date) >= now)
      .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcomingGames[0] || null;
  }, [teamEvents]);

  useEffect(() => {
    if (nextGame && eventSessions[nextGame.id] === undefined) {
      getLiveSessionByEvent(nextGame.id).then(session => {
        setEventSessions(prev => ({ ...prev, [nextGame.id]: session }));
      }).catch(() => {
        setEventSessions(prev => ({ ...prev, [nextGame.id]: null }));
      });
    }
  }, [nextGame]);
  
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
      color: "from-blue-500 to-cyan-500"
    },
    { 
      name: "Events", 
      id: "events",
      icon: CalendarClock, 
      color: "from-purple-500 to-pink-500"
    },
    { 
      name: "PlayMaker", 
      id: "playmaker",
      icon: ClipboardList, 
      color: "from-green-500 to-emerald-500"
    },
    { 
      name: "Playbook", 
      id: "playbook",
      icon: BookOpen, 
      color: "from-amber-500 to-orange-500"
    },
    { 
      name: "StatTracker", 
      id: "stattracker",
      icon: Activity, 
      color: "from-indigo-500 to-blue-500"
    },
    { 
      name: "Stats", 
      id: "stats",
      icon: BarChart3, 
      color: "from-rose-500 to-red-500"
    },
  ];

  const coachWelcomeModal: WelcomeModal = {
    title: "Welcome, Coach!",
    subtitle: `Ready to lead ${currentTeam?.name || "your team"}`,
    description: "Your command center is all set up! Let us give you a quick tour so you can start managing your team like a pro.",
    buttonText: "Show Me Around"
  };

  const coachTourSteps: TourStep[] = [
    {
      target: '[data-testid="card-roster"]',
      title: "Team Roster",
      description: "Manage your team members, assign jersey numbers, and set positions. Athletes and supporters can join using your team code.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-schedule"]',
      title: "Schedule & Events",
      description: "Create and manage practices, games, and team events. Set locations, times, and assign snack duties.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-stattracker"]',
      title: "StatTracker",
      description: "Track live game statistics for your athletes. Record plays, manage lineups, and monitor performance in real-time.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-playmaker"]',
      title: "PlayMaker",
      description: "Design custom plays with our canvas tool. Draw formations, add player icons, and save plays to your playbook.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-highlights"]',
      title: "Team Highlights",
      description: "Upload and share video highlights of great plays and memorable moments with your team.",
      position: "bottom"
    }
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
                filteredRosterMembers.map((member: TeamMember) => {
                  const isCoachMember = member.userId === currentTeam?.coachId;
                  const canManage = !isCoachMember && (member.role === "athlete" || member.role === "staff" || member.role === "supporter");
                  
                  return (
                    <Card 
                      key={member.id} 
                      className={`bg-background/40 border-white/10 hover:border-primary/50 transition-all relative group ${member.role === "athlete" || member.role === "staff" ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (member.role === "athlete" || member.role === "staff") {
                          setSelectedAthlete(member);
                          setIsAthleteCardFlipped(false);
                        }
                      }}
                      data-testid={`roster-card-${member.id}`}
                    >
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`roster-menu-${member.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            {(member.role === "athlete" || member.role === "staff") && (
                              <DropdownMenuItem onClick={() => openEditMember(member)} data-testid={`edit-member-${member.id}`}>
                                <Hash className="h-4 w-4 mr-2" />
                                Edit Jersey/Position
                              </DropdownMenuItem>
                            )}
                            {(member.role === "athlete" || member.role === "staff" || member.role === "supporter") && (
                              <DropdownMenuItem onClick={() => handlePromoteDemote(member)} data-testid={`promote-demote-${member.id}`}>
                                <Award className="h-4 w-4 mr-2" />
                                {member.role === "staff" ? "Remove Staff" : "Make Staff"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingMember(member)} 
                              className="text-destructive focus:text-destructive"
                              data-testid={`remove-member-${member.id}`}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
                            <div className="text-[10px] md:text-xs text-muted-foreground">
                              {member.role === "coach" ? "Head Coach" : member.role === "staff" ? "Staff" : member.role === "supporter" ? "Supporter" : (member.position || "Player")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
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
                            <CalendarClock className="h-4 w-4 text-primary" />
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
                  <CalendarClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">{selectedDate ? "No events on this date" : "No events scheduled"}</p>
                  <p className="text-sm">Click "Add Event" to create your first event!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
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
                                <div className="flex gap-1 items-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" data-testid={`button-event-menu-${event.id}`}>
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {event.type?.toLowerCase() === "game" && (
                                        <DropdownMenuItem onClick={() => openLineupDialog(event)} data-testid={`button-set-lineup-${event.id}`}>
                                          <Users className="h-4 w-4 mr-2" />
                                          Set Lineup
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => openEditEvent(event)} data-testid={`button-edit-event-${event.id}`}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmEvent(event)} data-testid={`button-delete-event-${event.id}`}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
        );
      case "playmaker":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Play Designer</h3>
                <p className="text-sm text-muted-foreground">Draw and design your team's plays</p>
              </div>
            </div>
            <PlaybookCanvas 
              athletes={athletes.map(a => ({ id: a.user.id, firstName: a.user.firstName || "", lastName: a.user.lastName || "" }))} 
              sport={currentTeam?.sport}
              onSave={async (data) => {
                await createPlayMutation.mutateAsync(data);
              }}
              isSaving={createPlayMutation.isPending}
            />
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
              <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={play.status || ""}
                  onValueChange={(value) => updatePlayMutation.mutate({ playId: play.id, data: { status: value } })}
                >
                  <SelectTrigger className="h-8 text-xs flex-1" data-testid={`play-status-${play.id}`}>
                    <SelectValue placeholder="Set status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Successful">Successful</SelectItem>
                    <SelectItem value="Not Successful">Not Successful</SelectItem>
                    <SelectItem value="Needs Work">Needs Work</SelectItem>
                  </SelectContent>
                </Select>
                {play.status && (
                  <Badge 
                    variant={play.status === "Successful" ? "default" : play.status === "Not Successful" ? "destructive" : "secondary"}
                    className={play.status === "Successful" ? "bg-green-600" : ""}
                  >
                    {play.status}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this play?")) {
                      deletePlayMutation.mutate(play.id);
                    }
                  }}
                  data-testid={`delete-play-${play.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Playbook</h3>
                <p className="text-sm text-muted-foreground">View and manage your saved plays ({teamPlays.length} plays)</p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setSelectedCard("playmaker")}>
                <Plus className="h-4 w-4" />
                New Play
              </Button>
            </div>
            <Tabs value={playbookTab} onValueChange={(v) => setPlaybookTab(v as "Offense" | "Defense" | "Special")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="Offense" className="gap-2" data-testid="playbook-tab-offense">
                  <span>Offense</span>
                  <Badge variant="secondary" className="bg-blue-600 text-white text-xs">{offensePlays.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="Defense" className="gap-2" data-testid="playbook-tab-defense">
                  <span>Defense</span>
                  <Badge variant="secondary" className="bg-orange-600 text-white text-xs">{defensePlays.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="Special" className="gap-2" data-testid="playbook-tab-special">
                  <span>Special</span>
                  <Badge variant="secondary" className="bg-purple-600 text-white text-xs">{specialPlays.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              {teamPlays.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">No saved plays yet</p>
                  <p className="text-sm">Create plays in PlayMaker and save them here.</p>
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
                      <Badge 
                        variant={expandedPlay.category === "Offense" ? "default" : expandedPlay.category === "Defense" ? "secondary" : "outline"}
                        className={expandedPlay.category === "Offense" ? "bg-blue-600" : expandedPlay.category === "Defense" ? "bg-orange-600" : "bg-purple-600"}
                      >
                        {expandedPlay.category}
                      </Badge>
                    )}
                    {expandedPlay?.status && (
                      <Badge 
                        variant={expandedPlay.status === "Successful" ? "default" : expandedPlay.status === "Not Successful" ? "destructive" : "secondary"}
                        className={expandedPlay.status === "Successful" ? "bg-green-600" : ""}
                      >
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
      case "stattracker":
        return (
          <div className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold">Track live game stats</p>
              <p className="text-sm mb-4">Record stats for individual players or the whole team during games.</p>
              <Link href="/stattracker">
                <Button size="lg" className="gap-2" data-testid="button-open-stattracker">
                  <Activity className="h-5 w-5" />
                  Open StatTracker
                </Button>
              </Link>
            </div>
          </div>
        );
      case "stats":
        if (!aggregateStats || aggregateStats.games === 0) {
          return (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold">No stats yet</p>
              <p className="text-sm">Statistics will appear here after you complete games in StatTracker.</p>
              <Link href="/stattracker">
                <Button className="mt-4 gap-2" data-testid="button-go-to-stattracker">
                  <Activity className="h-4 w-4" />
                  Open StatTracker
                </Button>
              </Link>
            </div>
          );
        }

        const gameChartData = (advancedStats?.gameHistory?.slice(0, 10) || []).reverse().map((game, idx) => ({
          name: `G${idx + 1}`,
          team: game.teamScore,
          opponent: game.opponentScore,
          result: game.result
        }));

        const hotAthletes = advancedStats?.athletePerformance?.filter(a => a.hotStreak) || [];
        const topPerformers = advancedStats?.athletePerformance?.slice(0, 5) || [];

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background/50 border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{aggregateStats.games}</p>
                <p className="text-sm text-muted-foreground">Games Played</p>
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

            {advancedStats?.ratios && Object.keys(advancedStats.ratios).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Key Metrics
                </h3>
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

            {hotAthletes.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-500">
                  <Flame className="h-5 w-5" />
                  Hot Streaks
                </h3>
                <div className="flex flex-wrap gap-3">
                  {hotAthletes.map((athlete) => (
                    <div key={athlete.athleteId} className="bg-orange-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{athlete.athleteName}</span>
                      <Badge variant="outline" className="border-orange-500/50 text-orange-500 text-xs">
                        {athlete.streakLength} game streak
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gameChartData.length >= 2 && (
              <div>
                <h3 className="font-semibold mb-3">Game-by-Game Scores</h3>
                <div className="bg-background/50 border rounded-lg p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={gameChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Bar dataKey="team" name="Your Team" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="opponent" name="Opponent" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {topPerformers.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Top Performers</h3>
                <div className="space-y-2">
                  {topPerformers.map((athlete, idx) => {
                    const totalStats = Object.values(athlete.stats).reduce((a, b) => a + b, 0);
                    return (
                      <div key={athlete.athleteId} className="bg-background/50 border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                            idx === 1 ? 'bg-gray-400/20 text-gray-400' : 
                            idx === 2 ? 'bg-orange-700/20 text-orange-700' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {athlete.athleteName}
                              {athlete.hotStreak && <Flame className="h-4 w-4 text-orange-500" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{athlete.gamesPlayed} games played</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{totalStats}</p>
                          <p className="text-xs text-muted-foreground">total stats</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(aggregateStats.statTotals).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Season Totals</h3>
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
            
            <div className="text-center pt-4">
              <Link href="/stattracker">
                <Button variant="outline" className="gap-2" data-testid="button-view-stattracker">
                  <Activity className="h-4 w-4" />
                  Track New Game
                </Button>
              </Link>
            </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {teamHighlights.map((video: HighlightVideo) => (
                  <div key={video.id} className="bg-background/50 border border-white/5 rounded-lg overflow-hidden" data-testid={`highlight-video-${video.id}`}>
                    <div className="aspect-video bg-black relative">
                      {video.status === "ready" && video.publicUrl ? (
                        <video
                          src={video.publicUrl}
                          controls
                          preload="metadata"
                          className="absolute inset-0 w-full h-full object-contain"
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
      <OnboardingTour 
        steps={coachTourSteps} 
        storageKey={`coach-onboarding-completed-${user?.id}`}
        welcomeModal={coachWelcomeModal}
      />
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="space-y-6">
          {/* Hero Section - Card + Grid Layout */}
          <div ref={heroBannerRef} className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Team Hype Card */}
            {currentTeam && (
              <div className="lg:w-72 lg:flex-shrink-0">
                <TeamHeroCard
                  team={currentTeam}
                  wins={currentTeam.wins || 0}
                  losses={currentTeam.losses || 0}
                  ties={currentTeam.ties || 0}
                  showCode={true}
                />
              </div>
            )}

            {/* Right Side - Grid + Content */}
            <div className="flex-1 space-y-6">
              {/* Quick Navigation - Colorful Grid Cards */}
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
                    className={`relative p-3 rounded-xl transition-all duration-200 group ${
                      selectedCard === action.id
                        ? "ring-2 ring-white shadow-lg scale-105"
                        : "hover:scale-105 hover:shadow-lg"
                    }`}
                    data-testid={`card-${action.id}`}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${action.color} opacity-90`} />
                    
                    {/* Content */}
                    <div className="relative flex flex-col items-center gap-1.5 text-white">
                      <action.icon className="h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{action.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Expanded Content Container - Under the grid */}
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

          {/* Next Game Card - Prominent Game Day Live Controls */}
          {nextGame && (
            <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" data-testid="hero-next-game-card">
              <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <CardContent className="relative z-10 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-xs uppercase tracking-wider text-primary font-bold">Next Game</span>
                      {eventSessions[nextGame.id]?.status === "live" && (
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                      )}
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2">
                      {nextGame.opponent ? `vs ${nextGame.opponent}` : nextGame.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-primary" />
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
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="lg"
                      className={`min-w-[180px] h-14 text-lg font-bold gap-3 transition-all ${
                        eventSessions[nextGame.id]?.status === "live"
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30"
                          : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                      }`}
                      onClick={() => handleToggleGameDayLive(nextGame)}
                      disabled={loadingSessionForEvent === nextGame.id}
                      data-testid="button-hero-game-day-live"
                    >
                      {loadingSessionForEvent === nextGame.id ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : eventSessions[nextGame.id]?.status === "live" ? (
                        <>
                          <Radio className="h-6 w-6" />
                          STOP LIVE
                        </>
                      ) : (
                        <>
                          <Radio className="h-6 w-6" />
                          START LIVE
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {eventSessions[nextGame.id]?.status === "live" 
                        ? "Supporters are cheering!" 
                        : "Enable supporter engagement"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          {!selectedCard && (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-200 dark:bg-card/80 backdrop-blur-sm border-slate-300 dark:border-white/5 hover:border-primary/50 transition-colors shadow-lg shadow-black/10 dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{teamMembers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {athletes.length} athletes, {coaches.length} coaches
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-200 dark:bg-card/80 backdrop-blur-sm border-slate-300 dark:border-white/5 hover:border-primary/50 transition-colors shadow-lg shadow-black/10 dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Events</CardTitle>
                  <CalendarClock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{teamEvents.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {teamEvents.length === 0 ? "No events scheduled" : "Scheduled events"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-200 dark:bg-card/80 backdrop-blur-sm border-slate-300 dark:border-white/5 hover:border-primary/50 transition-colors shadow-lg shadow-black/10 dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Highlights</CardTitle>
                  <Video className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{teamHighlights.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {teamHighlights.length === 0 ? "No videos uploaded" : "Team videos"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-200 dark:bg-card/80 backdrop-blur-sm border-slate-300 dark:border-white/5 hover:border-primary/50 transition-colors shadow-lg shadow-black/10 dark:shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Supporters</CardTitle>
                  <Trophy className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{supporters.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {supporters.length === 0 ? "No supporters yet" : "Following the team"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content (Hidden when card selected) */}
          {!selectedCard && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Roster Preview */}
              <Card className="col-span-2 border-slate-300 dark:border-white/5 bg-slate-200 dark:bg-card/80 backdrop-blur-sm shadow-lg shadow-black/10 dark:shadow-none">
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
              <Card className="border-slate-300 dark:border-white/5 bg-slate-200 dark:bg-card/80 backdrop-blur-sm shadow-lg shadow-black/10 dark:shadow-none">
                <CardHeader>
                  <CardTitle className="font-display uppercase tracking-wide">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-6">
                     <div className="text-center py-4 text-muted-foreground">
                       <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                       <p className="text-sm">No recent activity</p>
                     </div>
                     
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
                  <SelectItem value="Game">Game</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Tournament">Tournament</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Date *</Label>
              <Input
                id="event-date"
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                data-testid="input-event-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <div className="flex gap-2">
                <Select value={eventForm.hour} onValueChange={(value) => setEventForm({ ...eventForm, hour: value })}>
                  <SelectTrigger className="w-[80px]" data-testid="select-event-hour">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={eventForm.minute} onValueChange={(value) => setEventForm({ ...eventForm, minute: value })}>
                  <SelectTrigger className="w-[80px]" data-testid="select-event-minute">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={eventForm.ampm} onValueChange={(value) => setEventForm({ ...eventForm, ampm: value })}>
                  <SelectTrigger className="w-[80px]" data-testid="select-event-ampm">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          <div className="flex flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmEvent(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmEvent && deleteEventMutation.mutate(deleteConfirmEvent.id)}
              disabled={deleteEventMutation.isPending}
              className="min-w-[90px]"
              data-testid="button-confirm-delete"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
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

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Update jersey number and position for {editingMember?.user.name || editingMember?.user.username}
            </p>
            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Jersey Number</Label>
              <Input
                id="jerseyNumber"
                placeholder="e.g., 23"
                value={memberEditForm.jerseyNumber}
                onChange={(e) => setMemberEditForm({ ...memberEditForm, jerseyNumber: e.target.value })}
                data-testid="input-jersey-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={memberEditForm.position}
                onValueChange={(value) => setMemberEditForm({ ...memberEditForm, position: value })}
              >
                <SelectTrigger data-testid="select-position">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {(SPORT_POSITIONS[currentTeam?.sport || ""] || []).map((pos) => (
                    <SelectItem key={pos} value={pos} data-testid={`position-option-${pos}`}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingMember(null)} data-testid="button-cancel-edit-member">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveMemberEdit}
              disabled={updateMemberMutation.isPending}
              data-testid="button-save-member"
            >
              {updateMemberMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingMember?.user.name || deletingMember?.user.username} from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-member">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMember && removeMemberMutation.mutate(deletingMember.userId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-remove-member"
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Starting Lineup Dialog */}
      <Dialog open={!!lineupEvent} onOpenChange={() => setLineupEvent(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Starting Lineup</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {lineupEvent?.title} - {lineupEvent?.date ? format(new Date(lineupEvent.date), "MMM d, yyyy") : ""}
          </p>
          
          {(() => {
            const athleteMembers = teamMembers.filter(m => m.role === "athlete");
            const availableAthletes = athleteMembers.filter(m => 
              !lineupStarters.includes(m.id) && !lineupBench.includes(m.id)
            );
            
            const getMemberById = (id: string) => teamMembers.find(m => m.id === id);
            
            return (
              <div className="space-y-4 py-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold">Starters ({lineupStarters.length})</Label>
                  </div>
                  <div className="min-h-[60px] border border-dashed border-green-500/30 rounded-lg p-2 bg-green-500/5">
                    {lineupStarters.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Click athletes below to add starters</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lineupStarters.map(id => {
                          const member = getMemberById(id);
                          if (!member) return null;
                          return (
                            <Button 
                              key={id} 
                              variant="secondary" 
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => setLineupStarters(lineupStarters.filter(s => s !== id))}
                              data-testid={`lineup-starter-${id}`}
                            >
                              <span className="font-mono text-xs">#{member.jerseyNumber || "--"}</span>
                              {member.user.firstName}
                              <X className="h-3 w-3 ml-1" />
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold">Bench ({lineupBench.length})</Label>
                  </div>
                  <div className="min-h-[60px] border border-dashed border-orange-500/30 rounded-lg p-2 bg-orange-500/5">
                    {lineupBench.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Click athletes below to add to bench</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {lineupBench.map(id => {
                          const member = getMemberById(id);
                          if (!member) return null;
                          return (
                            <Button 
                              key={id} 
                              variant="outline" 
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => setLineupBench(lineupBench.filter(b => b !== id))}
                              data-testid={`lineup-bench-${id}`}
                            >
                              <span className="font-mono text-xs">#{member.jerseyNumber || "--"}</span>
                              {member.user.firstName}
                              <X className="h-3 w-3 ml-1" />
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">Available Athletes ({availableAthletes.length})</Label>
                  <div className="border rounded-lg p-2 max-h-[200px] overflow-y-auto">
                    {availableAthletes.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">All athletes assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableAthletes.map(member => (
                          <div key={member.id} className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="h-8 gap-1 border-green-500/50 hover:bg-green-500/20"
                              onClick={() => setLineupStarters([...lineupStarters, member.id])}
                              data-testid={`add-starter-${member.id}`}
                            >
                              <span className="font-mono text-xs">#{member.jerseyNumber || "--"}</span>
                              {member.user.firstName}
                              <Check className="h-3 w-3 ml-1 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 hover:bg-orange-500/20"
                              onClick={() => setLineupBench([...lineupBench, member.id])}
                              title="Add to bench"
                              data-testid={`add-bench-${member.id}`}
                            >
                              <ChevronRight className="h-3 w-3 text-orange-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLineupEvent(null)} data-testid="button-cancel-lineup">
              Cancel
            </Button>
            <Button 
              onClick={() => saveLineupMutation.mutate()}
              disabled={saveLineupMutation.isPending}
              data-testid="button-save-lineup"
            >
              {saveLineupMutation.isPending ? "Saving..." : "Save Lineup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
