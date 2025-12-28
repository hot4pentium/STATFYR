import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { useTheme } from "next-themes";
import { usePWA } from "@/lib/pwaContext";
import { useNotifications } from "@/lib/notificationContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isSameDay, startOfMonth } from "date-fns";

import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { VideoUploader } from "@/components/VideoUploader";
import { PlaybookCanvas } from "@/components/PlaybookCanvas";
import { TeamBadge } from "@/components/TeamBadge";

import {
  Users, CalendarClock, ChevronRight, BarChart3, ClipboardList, MessageSquare, 
  Trophy, Shield, X, Copy, Check, Plus, Pencil, Trash2, Video, Loader2, BookOpen, 
  Activity, Radio, Settings, LogOut, Moon, Sun, AlertCircle, Star, Share2, Bell,
  ArrowLeft, MapPin, Clock, Utensils, Coffee, MoreVertical, UserCog, UserMinus, 
  Hash, Award, Flame, TrendingUp, Home, Heart, Zap, ChevronDown, Smartphone
} from "lucide-react";

import {
  getTeamMembers, getCoachTeams, getTeamEvents, createEvent, updateEvent, deleteEvent,
  getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, createPlay, updatePlay, deletePlay,
  updateTeamMember, removeTeamMember, getStartingLineup, saveStartingLineup,
  getTeamAggregateStats, getAdvancedTeamStats, getLiveSessionByEvent, createLiveSessionForEvent,
  startLiveSession, endLiveSession, getAthleteStats, getAthleteShoutouts, getAthleteShoutoutCount,
  getManagedAthletes, getSupporterBadges, getAllBadges, getSupporterTapTotal, getActiveLiveSessions,
  type TeamMember, type Event, type HighlightVideo, type Play, type StartingLineup,
  type TeamAggregateStats, type AdvancedTeamStats, type LiveEngagementSession
} from "@/lib/api";
import { SPORT_POSITIONS } from "@/lib/sportConstants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, Legend } from "recharts";

type UserRole = "coach" | "athlete" | "supporter";

interface QuickAccessCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  roles: UserRole[];
}

const quickAccessCards: QuickAccessCard[] = [
  { id: "roster", name: "Roster", description: "Access and view player roster.", icon: Users, color: "text-orange-500", roles: ["coach", "athlete", "supporter"] },
  { id: "schedule", name: "Calendar", description: "View and manage team schedule.", icon: CalendarClock, color: "text-orange-500", roles: ["coach", "athlete", "supporter"] },
  { id: "playmaker", name: "Playmaker", description: "Design and manage team plays.", icon: ClipboardList, color: "text-orange-500", roles: ["coach"] },
  { id: "playbook", name: "Playbook", description: "View team plays and formations.", icon: BookOpen, color: "text-orange-500", roles: ["athlete", "supporter"] },
  { id: "stats", name: "Stats", description: "Track team and player statistics.", icon: BarChart3, color: "text-orange-500", roles: ["coach", "athlete"] },
  { id: "stattracker", name: "StatTracker", description: "Live game stat tracking.", icon: Activity, color: "text-orange-500", roles: ["coach"] },
  { id: "highlights", name: "Highlights", description: "Team video highlights.", icon: Video, color: "text-orange-500", roles: ["coach", "athlete", "supporter"] },
  { id: "gamedaylive", name: "Game Day Live", description: "Live engagement sessions.", icon: Radio, color: "text-orange-500", roles: ["supporter"] },
  { id: "chat", name: "Team Chat", description: "Message your team.", icon: MessageSquare, color: "text-orange-500", roles: ["coach", "athlete"] },
];

const roleConfig: Record<UserRole, { title: string; tagline: string }> = {
  coach: { title: "Coach Dashboard", tagline: "Full team access made quick and easy." },
  athlete: { title: "Athlete Dashboard", tagline: "View HYPE Card" },
  supporter: { title: "Supporter Dashboard", tagline: "Cheer on your favorite athletes." },
};

export default function UnifiedDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, setCurrentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  const { notificationsEnabled, hasUnread, enableNotifications, clearUnread } = useNotifications();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [rosterTab, setRosterTab] = useState<"all" | "athletes" | "coach" | "supporters">("all");
  const [playbookTab, setPlaybookTab] = useState<"Offense" | "Defense" | "Special">("Offense");
  const [expandedPlay, setExpandedPlay] = useState<Play | null>(null);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    type: "Practice", date: "", hour: "09", minute: "00", ampm: "AM",
    location: "", details: "", opponent: "", drinksAthleteId: "", snacksAthleteId: ""
  });
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberEditForm, setMemberEditForm] = useState({ jerseyNumber: "", position: "" });
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const userRole: UserRole = useMemo(() => {
    if (!user) return "supporter";
    if (user.role === "coach") return "coach";
    if (user.role === "athlete") return "athlete";
    return "supporter";
  }, [user]);

  const visibleCards = useMemo(() => 
    quickAccessCards.filter(card => card.roles.includes(userRole)),
    [userRole]
  );

  const { data: coachTeams } = useQuery({
    queryKey: ["/api/coach", user?.id, "teams"],
    queryFn: () => user ? getCoachTeams(user.id) : Promise.resolve([]),
    enabled: !!user && !currentTeam && userRole === "coach",
  });

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

  const { data: teamHighlights = [], refetch: refetchHighlights } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
    refetchInterval: 5000,
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && (selectedCard === "playmaker" || selectedCard === "playbook"),
  });

  const { data: aggregateStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "aggregate"],
    queryFn: () => currentTeam ? getTeamAggregateStats(currentTeam.id) : Promise.resolve({ games: 0, wins: 0, losses: 0, statTotals: {} }),
    enabled: !!currentTeam && selectedCard === "stats",
  });

  const { data: advancedStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "advanced"],
    queryFn: () => currentTeam ? getAdvancedTeamStats(currentTeam.id) : Promise.resolve({ gameHistory: [], athletePerformance: [], ratios: {} }),
    enabled: !!currentTeam && selectedCard === "stats" && userRole === "coach",
  });

  const { data: myStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", user?.id, "stats"],
    queryFn: () => currentTeam && user ? getAthleteStats(currentTeam.id, user.id) : Promise.resolve({ gamesPlayed: 0, stats: {}, gameHistory: [], hotStreak: false, streakLength: 0 }),
    enabled: !!currentTeam && !!user && selectedCard === "stats" && userRole === "athlete",
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "live-sessions", "active"],
    queryFn: () => currentTeam ? getActiveLiveSessions(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && selectedCard === "gamedaylive",
    refetchInterval: 5000,
  });

  const { data: athleteStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", user?.id, "stats", "hype"],
    queryFn: () => currentTeam && user ? getAthleteStats(currentTeam.id, user.id) : Promise.resolve(null),
    enabled: !!currentTeam && !!user && userRole === "athlete",
  });

  const { data: athleteShoutoutCount = 0 } = useQuery({
    queryKey: ["/api/athletes", user?.id, "shoutouts", "count"],
    queryFn: () => user ? getAthleteShoutoutCount(user.id) : Promise.resolve(0),
    enabled: !!user && userRole === "athlete",
  });

  const { data: managedAthletes = [] } = useQuery({
    queryKey: ["/api/supporters", user?.id, "managed-athletes"],
    queryFn: () => user ? getManagedAthletes(user.id) : Promise.resolve([]),
    enabled: !!user && userRole === "supporter",
  });

  const userMembership = useMemo(() => {
    if (!user || !teamMembers) return null;
    return teamMembers.find((m: TeamMember) => m.userId === user.id) || null;
  }, [user, teamMembers]);

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach"), [teamMembers]);
  const supporters = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "supporter"), [teamMembers]);

  const offensePlays = useMemo(() => teamPlays.filter((p: Play) => p.category === "Offense"), [teamPlays]);
  const defensePlays = useMemo(() => teamPlays.filter((p: Play) => p.category === "Defense"), [teamPlays]);
  const specialPlays = useMemo(() => teamPlays.filter((p: Play) => p.category === "Special"), [teamPlays]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return teamEvents.filter((e: Event) => new Date(e.date) >= now).slice(0, 5);
  }, [teamEvents]);

  const eventsOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return teamEvents.filter((e: Event) => isSameDay(new Date(e.date), selectedDate));
  }, [teamEvents, selectedDate]);

  const createEventMutation = useMutation({
    mutationFn: (data: { type: string; date: string; location?: string; details?: string; opponent?: string }) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      return createEvent(currentTeam.id, { ...data, title: data.type, createdBy: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "events"] });
      toast.success("Event created!");
      setIsEventModalOpen(false);
      resetEventForm();
    },
    onError: () => toast.error("Failed to create event"),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "events"] });
      toast.success("Event updated!");
      setEditingEvent(null);
      setIsEventModalOpen(false);
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

  const createPlayMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; canvasData: string; thumbnailData?: string; category: string }) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      return createPlay(currentTeam.id, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "plays"] });
      toast.success("Play saved!");
    },
    onError: () => toast.error("Failed to save play"),
  });

  const deletePlayMutation = useMutation({
    mutationFn: (playId: string) => deletePlay(playId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "plays"] });
      toast.success("Play deleted!");
    },
    onError: () => toast.error("Failed to delete play"),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: { jerseyNumber?: string; position?: string } }) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      const member = teamMembers.find((m: TeamMember) => m.id === memberId);
      if (!member?.userId) throw new Error("Member not found");
      return updateTeamMember(currentTeam.id, member.userId, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "members"] });
      toast.success("Member updated!");
      setEditingMember(null);
    },
    onError: () => toast.error("Failed to update member"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => {
      if (!currentTeam || !user) throw new Error("No team selected");
      const member = teamMembers.find((m: TeamMember) => m.id === memberId);
      if (!member?.userId) throw new Error("Member not found");
      return removeTeamMember(currentTeam.id, member.userId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam?.id, "members"] });
      toast.success("Member removed!");
      setDeletingMember(null);
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const resetEventForm = () => {
    setEventForm({ type: "Practice", date: "", hour: "09", minute: "00", ampm: "AM", location: "", details: "", opponent: "", drinksAthleteId: "", snacksAthleteId: "" });
    setEditingEvent(null);
  };

  const handleCopyCode = () => {
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCodeCopied(true);
      toast.success("Team code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (cardId === "chat") {
      setLocation("/chat");
      return;
    }
    if (cardId === "stattracker") {
      setLocation("/stat-tracker");
      return;
    }
    setSelectedCard(selectedCard === cardId ? null : cardId);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getUserDisplayName = () => {
    if (!user) return "User";
    if (user.name) return user.name;
    if (user.firstName) return `${user.firstName} ${user.lastName || ""}`.trim();
    return user.email?.split("@")[0] || "User";
  };

  const getRoleLabel = () => {
    if (userRole === "coach") return `Head Coach${currentTeam ? ` - ${currentTeam.name}` : ""}`;
    if (userRole === "athlete") return currentTeam ? currentTeam.name : "Athlete";
    return currentTeam ? `Supporting ${currentTeam.name}` : "Supporter";
  };

  const renderMemberCard = (member: TeamMember) => (
    <Card key={member.id} className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all">
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={member.user?.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-lg font-bold">
            {member.user?.name?.charAt(0) || member.user?.firstName?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{member.user?.name || `${member.user?.firstName} ${member.user?.lastName}`}</p>
          <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
            {member.role}
            {member.position && <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{member.position}</span>}
          </p>
        </div>
        {member.jerseyNumber && (
          <Badge className="bg-primary/20 text-primary">#{member.jerseyNumber}</Badge>
        )}
        {userRole === "coach" && member.role !== "coach" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingMember(member);
                setMemberEditForm({ jerseyNumber: member.jerseyNumber || "", position: member.position || "" });
              }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingMember(member)}>
                <UserMinus className="h-4 w-4 mr-2" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );

  const renderEventCard = (event: Event) => (
    <Card key={event.id} className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center shrink-0">
          <span className="text-xs text-muted-foreground uppercase">{format(new Date(event.date), "MMM")}</span>
          <span className="text-xl font-display font-bold">{format(new Date(event.date), "d")}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{event.title}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
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
        <Badge variant={event.type === "Game" ? "default" : "secondary"} className="shrink-0">
          {event.type}
        </Badge>
        {userRole === "coach" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingEvent(event);
                const d = new Date(event.date);
                const hrs = d.getHours();
                setEventForm({
                  type: event.type || "Practice",
                  date: format(d, "yyyy-MM-dd"),
                  hour: String(hrs % 12 || 12).padStart(2, "0"),
                  minute: String(d.getMinutes()).padStart(2, "0"),
                  ampm: hrs >= 12 ? "PM" : "AM",
                  location: event.location || "",
                  details: event.details || "",
                  opponent: event.opponent || "",
                  drinksAthleteId: "",
                  snacksAthleteId: ""
                });
                setIsEventModalOpen(true);
              }}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmEvent(event)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );

  const renderPlayCard = (play: Play) => (
    <Card 
      key={play.id} 
      className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all cursor-pointer"
      onClick={() => setExpandedPlay(play)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {play.thumbnailData ? (
            <div className="h-16 w-24 rounded-lg overflow-hidden bg-black/20 shrink-0">
              <img src={play.thumbnailData} alt={play.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-16 w-24 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-orange-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{play.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{play.category}</Badge>
              {play.status && (
                <Badge className={play.status === "Successful" ? "bg-green-600" : play.status === "Not Successful" ? "bg-red-600" : "bg-yellow-600"}>
                  {play.status}
                </Badge>
              )}
            </div>
            {play.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{play.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderHighlightCard = (highlight: HighlightVideo) => (
    <div key={highlight.id} className="relative aspect-video rounded-xl overflow-hidden bg-black/20 group">
      {highlight.thumbnailKey ? (
        <img src={highlight.thumbnailKey} alt={highlight.title ?? "Highlight"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-xs text-white font-medium truncate">{highlight.title}</p>
      </div>
      {userRole === "coach" && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            if (user) {
              deleteHighlightVideo(highlight.id, user.id).then(() => {
                refetchHighlights();
                toast.success("Highlight deleted");
              });
            }
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  const renderContent = () => {
    if (!selectedCard) return null;

    return (
      <div ref={contentRef} className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCard(null)} className="gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-xl font-display font-bold uppercase tracking-wide text-primary">
            {visibleCards.find(c => c.id === selectedCard)?.name}
          </h2>
        </div>

        {selectedCard === "roster" && (
          <div className="space-y-4">
            <Tabs value={rosterTab} onValueChange={(v) => setRosterTab(v as typeof rosterTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-background/40">
                <TabsTrigger value="all">All ({teamMembers.length})</TabsTrigger>
                <TabsTrigger value="athletes">Athletes ({athletes.length})</TabsTrigger>
                <TabsTrigger value="coach">Coaches ({coaches.length})</TabsTrigger>
                <TabsTrigger value="supporters">Supporters ({supporters.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-3">
              {(rosterTab === "all" ? teamMembers : rosterTab === "athletes" ? athletes : rosterTab === "coach" ? coaches : supporters).map(renderMemberCard)}
              {teamMembers.length === 0 && (
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No team members yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {selectedCard === "schedule" && (
          <div className="space-y-4">
            {userRole === "coach" && (
              <Button onClick={() => { resetEventForm(); setIsEventModalOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Add Event
              </Button>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    modifiers={{
                      hasEvent: teamEvents.map((e: Event) => new Date(e.date))
                    }}
                    modifiersClassNames={{
                      hasEvent: "bg-primary/30 text-primary font-bold"
                    }}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Upcoming Events"}
                </h3>
                {(selectedDate ? eventsOnDate : upcomingEvents).map(renderEventCard)}
                {(selectedDate ? eventsOnDate : upcomingEvents).length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {selectedDate ? "No events on this date" : "No upcoming events"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(selectedCard === "playmaker" || selectedCard === "playbook") && (
          <div className="space-y-4">
            {userRole === "coach" && selectedCard === "playmaker" && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg">Create New Play</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlaybookCanvas onSave={async (data) => { createPlayMutation.mutate(data); }} />
                </CardContent>
              </Card>
            )}
            <Tabs value={playbookTab} onValueChange={(v) => setPlaybookTab(v as typeof playbookTab)}>
              <TabsList className="bg-background/40">
                <TabsTrigger value="Offense">Offense ({offensePlays.length})</TabsTrigger>
                <TabsTrigger value="Defense">Defense ({defensePlays.length})</TabsTrigger>
                <TabsTrigger value="Special">Special ({specialPlays.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid md:grid-cols-2 gap-4">
              {(playbookTab === "Offense" ? offensePlays : playbookTab === "Defense" ? defensePlays : specialPlays).map(renderPlayCard)}
            </div>
            {teamPlays.length === 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No plays in the playbook yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedCard === "stats" && (
          <div className="space-y-4">
            {userRole === "athlete" && myStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-primary">{myStats.gamesPlayed}</p>
                    <p className="text-xs text-muted-foreground">Games Played</p>
                  </CardContent>
                </Card>
                {myStats.stats && Object.entries(myStats.stats).slice(0, 3).map(([key, value]) => {
                  const statValue = typeof value === "object" && value !== null && "total" in value 
                    ? (value as { total: number }).total : value;
                  return (
                    <Card key={key} className="bg-card/80 backdrop-blur-sm border-white/10">
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-display font-bold">{String(statValue)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            {(userRole === "coach" || userRole === "supporter") && aggregateStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-primary">{aggregateStats.games}</p>
                    <p className="text-xs text-muted-foreground">Games</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-green-500">{aggregateStats.wins}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold text-red-500">{aggregateStats.losses}</p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-display font-bold">
                      {aggregateStats.games > 0 ? Math.round((aggregateStats.wins / aggregateStats.games) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {selectedCard === "highlights" && (
          <div className="space-y-4">
            {userRole === "coach" && currentTeam && user && (
              <VideoUploader teamId={currentTeam.id} userId={user.id} onUploadComplete={() => refetchHighlights()} />
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {teamHighlights.map(renderHighlightCard)}
            </div>
            {teamHighlights.length === 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No highlights yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedCard === "gamedaylive" && (
          <div className="space-y-4">
            {activeSessions.length > 0 ? (
              activeSessions.map((session: LiveEngagementSession) => (
                <Card key={session.id} className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                        <Radio className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Live Session Active</p>
                        <p className="text-sm text-muted-foreground">Tap to send cheers to your team!</p>
                      </div>
                      <Button onClick={() => setLocation(`/game-day-live/${session.id}`)}>
                        Join <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No live sessions right now</p>
                  <p className="text-sm mt-1">Check back during game time!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentTeam && userRole === "coach" && coachTeams && coachTeams.length > 0) {
    return (
      <>
        <DashboardBackground />
        <div className="relative z-10 min-h-screen p-4 flex items-center justify-center">
          <Card className="max-w-md w-full bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Select a Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {coachTeams.map((team: any) => (
                <Button
                  key={team.id}
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => setCurrentTeam(team)}
                >
                  <TeamBadge badgeId={team.badgeId} size="sm" fallbackInitials={team.name?.substring(0, 2)} />
                  {team.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
          <div className="absolute inset-0 bg-[url('/field-bg.jpg')] bg-cover bg-center opacity-30" />
          
          <div className="relative z-10 px-4 pt-6 pb-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TeamBadge badgeId={currentTeam?.badgeId} size="sm" fallbackInitials={currentTeam?.name?.substring(0, 2)} />
                <span className="font-display font-bold text-lg tracking-wide text-white">
                  STATF<span className="text-primary">Y</span>R
                </span>
              </div>
              <div className="flex items-center gap-2">
                {updateAvailable && (
                  <Button size="sm" variant="outline" onClick={applyUpdate} className="gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" /> Update
                  </Button>
                )}
                
                {/* Theme Toggle */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  data-testid="button-theme-toggle"
                >
                  {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                
                {/* Notifications Bell */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="relative"
                  onClick={() => {
                    if (!notificationsEnabled) {
                      enableNotifications();
                    } else {
                      clearUnread();
                    }
                  }}
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {hasUnread && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                  )}
                </Button>
                
                {/* Settings Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-settings-menu">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      const settingsPath = userRole === "coach" ? "/settings" : 
                                           userRole === "athlete" ? "/athlete/settings" : 
                                           "/supporter/settings";
                      setLocation(settingsPath);
                    }}>
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/50">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white">
                  {getUserDisplayName().charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-display font-bold text-primary uppercase tracking-wide">
                  {roleConfig[userRole].title}
                </h1>
                <p className="text-white/80 text-sm">Welcome, {userRole === "coach" ? "Coach" : getUserDisplayName()}!</p>
                <p className="text-lg text-white/90 mt-2 font-light">
                  {roleConfig[userRole].tagline}
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="mt-4">
              <p className="text-primary font-semibold">{userRole === "coach" ? `Coach ${getUserDisplayName()}` : getUserDisplayName()}</p>
              <p className="text-white/60 text-sm">{getRoleLabel()}</p>
            </div>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="px-4 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">Quick Access</h2>
            {currentTeam?.code && userRole === "coach" && (
              <Badge 
                variant="outline" 
                className="gap-1 cursor-pointer hover:bg-primary/10 font-mono"
                onClick={handleCopyCode}
                data-testid="badge-team-code"
              >
                Team Code: {currentTeam.code}
                {codeCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Badge>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {visibleCards.map((card) => (
              <Card
                key={card.id}
                className={`bg-card/80 backdrop-blur-sm border-white/10 cursor-pointer transition-all hover:border-primary/50 hover:scale-[1.02] ${selectedCard === card.id ? "border-primary ring-1 ring-primary" : ""}`}
                onClick={() => handleCardClick(card.id)}
                data-testid={`card-${card.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <card.icon className={`h-6 w-6 ${card.color} shrink-0`} />
                    <div className="min-w-0">
                      <p className="font-semibold">{card.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Area */}
          {renderContent()}
        </div>

        {/* Event Modal */}
        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Create Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Event Type</Label>
                <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Practice">Practice</SelectItem>
                    <SelectItem value="Game">Game</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Hour</Label>
                  <Select value={eventForm.hour} onValueChange={(v) => setEventForm({ ...eventForm, hour: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min</Label>
                  <Select value={eventForm.minute} onValueChange={(v) => setEventForm({ ...eventForm, minute: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["00", "15", "30", "45"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>AM/PM</Label>
                  <Select value={eventForm.ampm} onValueChange={(v) => setEventForm({ ...eventForm, ampm: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Event location" />
              </div>
              {eventForm.type === "Game" && (
                <div>
                  <Label>Opponent</Label>
                  <Input value={eventForm.opponent} onChange={(e) => setEventForm({ ...eventForm, opponent: e.target.value })} placeholder="Opponent team" />
                </div>
              )}
              <div>
                <Label>Details</Label>
                <Textarea value={eventForm.details} onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })} placeholder="Additional details" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEventModalOpen(false); resetEventForm(); }}>Cancel</Button>
              <Button onClick={() => {
                const hrs = parseInt(eventForm.hour) + (eventForm.ampm === "PM" && eventForm.hour !== "12" ? 12 : 0) - (eventForm.ampm === "AM" && eventForm.hour === "12" ? 12 : 0);
                const dateStr = `${eventForm.date}T${String(hrs).padStart(2, "0")}:${eventForm.minute}:00`;
                if (editingEvent) {
                  updateEventMutation.mutate({ id: editingEvent.id, data: { type: eventForm.type, date: dateStr, location: eventForm.location || undefined, details: eventForm.details || undefined, opponent: eventForm.opponent || undefined } });
                } else {
                  createEventMutation.mutate({ type: eventForm.type, date: dateStr, location: eventForm.location || undefined, details: eventForm.details || undefined, opponent: eventForm.opponent || undefined });
                }
              }}>
                {editingEvent ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Event Confirm */}
        <AlertDialog open={!!deleteConfirmEvent} onOpenChange={(open) => !open && setDeleteConfirmEvent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete "{deleteConfirmEvent?.title}". This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteConfirmEvent && deleteEventMutation.mutate(deleteConfirmEvent.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Jersey Number</Label>
                <Input value={memberEditForm.jerseyNumber} onChange={(e) => setMemberEditForm({ ...memberEditForm, jerseyNumber: e.target.value })} placeholder="e.g., 23" />
              </div>
              <div>
                <Label>Position</Label>
                <Select value={memberEditForm.position} onValueChange={(v) => setMemberEditForm({ ...memberEditForm, position: v })}>
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {(SPORT_POSITIONS[currentTeam?.sport as keyof typeof SPORT_POSITIONS] || SPORT_POSITIONS.Soccer).map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={() => editingMember && updateMemberMutation.mutate({ memberId: editingMember.id, data: memberEditForm })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirm */}
        <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
              <AlertDialogDescription>This will remove {deletingMember?.user?.name || "this member"} from the team.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingMember && removeMemberMutation.mutate(deletingMember.id)}>Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Play Detail Dialog */}
        <Dialog open={!!expandedPlay} onOpenChange={(open) => !open && setExpandedPlay(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {expandedPlay?.name}
                {expandedPlay?.category && <Badge variant="outline">{expandedPlay.category}</Badge>}
              </DialogTitle>
            </DialogHeader>
            {expandedPlay?.description && <p className="text-muted-foreground">{expandedPlay.description}</p>}
            {expandedPlay?.thumbnailData && (
              <div className="rounded-lg overflow-hidden border">
                <img src={expandedPlay.thumbnailData} alt={expandedPlay.name} className="w-full h-auto" />
              </div>
            )}
            {userRole === "coach" && (
              <DialogFooter>
                <Button variant="destructive" onClick={() => { deletePlayMutation.mutate(expandedPlay!.id); setExpandedPlay(null); }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Play
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
