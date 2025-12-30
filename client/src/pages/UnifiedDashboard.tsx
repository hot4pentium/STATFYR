import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { useTheme } from "next-themes";
import { usePWA } from "@/lib/pwaContext";
import { useNotifications } from "@/lib/notificationContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { OnboardingTour, type TourStep, type WelcomeModal } from "@/components/OnboardingTour";
import { VideoUploader } from "@/components/VideoUploader";
import { PlaybookCanvas } from "@/components/PlaybookCanvas";
import { TeamBadge } from "@/components/TeamBadge";
import logoImage from "@assets/red_logo-removebg-preview_1766973716904.png";

import {
  Users, CalendarClock, ChevronRight, BarChart3, ClipboardList, MessageSquare, 
  Trophy, Shield, X, Copy, Check, Plus, Pencil, Trash2, Video, Loader2, BookOpen, 
  Activity, Radio, Settings, LogOut, Moon, Sun, AlertCircle, Star, Share2, Bell,
  ArrowLeft, MapPin, Clock, Utensils, Coffee, MoreVertical, UserCog, UserMinus, 
  Hash, Award, Flame, TrendingUp, Home, Heart, Zap, ChevronDown, Smartphone, ExternalLink, User
} from "lucide-react";

import {
  getTeamMembers, getCoachTeams, getTeamEvents, createEvent, updateEvent, deleteEvent,
  getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, createPlay, updatePlay, deletePlay,
  updateTeamMember, removeTeamMember, getStartingLineup, saveStartingLineup,
  getTeamAggregateStats, getAdvancedTeamStats, getLiveSessionByEvent, createLiveSessionForEvent,
  startLiveSession, endLiveSession, getAthleteStats, getAthleteShoutouts, getAthleteShoutoutCount,
  getManagedAthletes, getSupporterBadges, getAllBadges, getSupporterTapTotal, getActiveLiveSessions,
  type Team, type TeamMember, type Event, type HighlightVideo, type Play, type StartingLineup,
  type TeamAggregateStats, type AdvancedTeamStats, type LiveEngagementSession, type ManagedAthlete
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
  { id: "chat", name: "Team Chat", description: "Message your team.", icon: MessageSquare, color: "text-orange-500", roles: ["coach", "athlete", "supporter"] },
];

const roleConfig: Record<UserRole, { title: string; tagline: string }> = {
  coach: { title: "Coach Dashboard", tagline: "Full team access made quick and easy." },
  athlete: { title: "Athlete Dashboard", tagline: "Track your performance and shine." },
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

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberEditForm, setMemberEditForm] = useState({ jerseyNumber: "", position: "", role: "" });
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [selectedManagedAthleteId, setSelectedManagedAthleteId] = useState<string | null>(null);
  const [supporterViewMode, setSupporterViewMode] = useState<"supporter" | "athlete">("supporter");
  const [supporterOriginalTeam, setSupporterOriginalTeam] = useState<Team | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const userRole: UserRole = useMemo(() => {
    if (!user) return "supporter";
    if (user.role === "coach") return "coach";
    if (user.role === "athlete") return "athlete";
    return "supporter";
  }, [user]);

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

  // Get the user's membership on the current team
  const currentMembership = useMemo(() => {
    if (!user || !currentTeam) return null;
    return teamMembers.find((m: TeamMember) => m.userId === user.id);
  }, [user, currentTeam, teamMembers]);

  // Check if user is staff on the current team (gets coach-level access except settings)
  const isStaff = currentMembership?.role === "staff";

  // Effective role for feature access - staff get coach-level access
  const effectiveRole: UserRole = useMemo(() => {
    if (isStaff) return "coach"; // Staff get coach-level feature access
    return userRole;
  }, [isStaff, userRole]);

  const visibleCards = useMemo(() => {
    // When supporter is viewing a managed athlete's profile, show athlete-appropriate cards
    // but exclude coach-only tools like playmaker and stattracker
    if (userRole === "supporter" && supporterViewMode === "athlete") {
      const allowedCardIds = ["roster", "schedule", "playbook", "stats", "highlights", "chat"];
      return quickAccessCards.filter(card => allowedCardIds.includes(card.id));
    }
    return quickAccessCards.filter(card => card.roles.includes(effectiveRole));
  }, [effectiveRole, userRole, supporterViewMode]);

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
    enabled: !!currentTeam && selectedCard === "stats" && (userRole === "coach" || isStaff),
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

  // Get the currently selected managed athlete
  const selectedManagedAthlete = useMemo(() => {
    if (!selectedManagedAthleteId) return null;
    return managedAthletes.find((ma: ManagedAthlete) => ma.id === selectedManagedAthleteId) || null;
  }, [managedAthletes, selectedManagedAthleteId]);

  // Initialize supporter's team context from first managed athlete
  useEffect(() => {
    if (userRole === "supporter" && managedAthletes.length > 0 && !currentTeam && !supporterOriginalTeam) {
      const firstAthleteWithTeam = managedAthletes.find((ma: ManagedAthlete) => ma.team);
      if (firstAthleteWithTeam?.team) {
        setCurrentTeam(firstAthleteWithTeam.team);
        setSupporterOriginalTeam(firstAthleteWithTeam.team);
      }
    }
  }, [userRole, managedAthletes, currentTeam, supporterOriginalTeam, setCurrentTeam]);

  // Handle view selection change for supporters
  const handleSupporterViewChange = (value: string) => {
    // Clear selected card when switching views to prevent accessing restricted content
    setSelectedCard(null);
    
    if (value === "my-dashboard") {
      setSupporterViewMode("supporter");
      setSelectedManagedAthleteId(null);
      // Restore original team context if we had one
      if (supporterOriginalTeam) {
        setCurrentTeam(supporterOriginalTeam);
      }
    } else {
      // Save current team before switching to athlete view
      if (supporterViewMode === "supporter" && currentTeam) {
        setSupporterOriginalTeam(currentTeam);
      }
      setSupporterViewMode("athlete");
      setSelectedManagedAthleteId(value);
      const athlete = managedAthletes.find((ma: ManagedAthlete) => ma.id === value);
      if (athlete?.team) {
        setCurrentTeam(athlete.team);
      }
    }
  };

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
    mutationFn: ({ memberId, data }: { memberId: string; data: { jerseyNumber?: string; position?: string; role?: string } }) => {
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

  const populateEventForm = (event: Event) => {
    const d = new Date(event.date);
    const h = d.getHours();
    const hour = String(h % 12 || 12).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    setEventForm({
      type: event.type,
      date: format(d, "yyyy-MM-dd"),
      hour,
      minute: String(d.getMinutes()).padStart(2, "0"),
      ampm,
      location: event.location || "",
      details: event.details || "",
      opponent: event.opponent || "",
      drinksAthleteId: "",
      snacksAthleteId: ""
    });
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
    if (isStaff) return `Staff${currentTeam ? ` - ${currentTeam.name}` : ""}`;
    if (userRole === "athlete") return currentTeam ? currentTeam.name : "Athlete";
    return currentTeam ? `Supporting ${currentTeam.name}` : "Supporter";
  };

  const renderMemberCard = (member: TeamMember) => (
    <Card key={member.id} className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all overflow-hidden relative">
      {currentTeam?.badgeId && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-45 pointer-events-none">
          <TeamBadge badgeId={currentTeam.badgeId} size="lg" />
        </div>
      )}
      <CardContent className="p-4 flex items-center gap-3 relative z-10">
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
        {(userRole === "coach" || isStaff) && member.role !== "coach" && member.role !== "staff" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditingMember(member);
                setMemberEditForm({ 
                  jerseyNumber: member.jerseyNumber || "", 
                  position: member.position || "",
                  role: member.role || "athlete"
                });
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
        {(userRole === "coach" || isStaff) && (
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
      {(userRole === "coach" || isStaff) && (
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
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming Events
              </h3>
              {(userRole === "coach" || isStaff) && (
                <Button onClick={() => { resetEventForm(); setIsEventModalOpen(true); }} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Event
                </Button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {[...upcomingEvents].sort((a, b) => {
                if (a.type === "Game" && b.type !== "Game") return -1;
                if (a.type !== "Game" && b.type === "Game") return 1;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
              }).map((event) => (
                <Card 
                  key={event.id} 
                  className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all min-w-[200px] max-w-[220px] flex-shrink-0 snap-start"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={event.type === "Game" ? "default" : "outline"} className="text-xs">
                        {event.type}
                      </Badge>
                      {event.type === "Game" && <Trophy className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="font-semibold text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(event.date), "MMM d, h:mm a")}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </p>
                    )}
                    {(userRole === "coach" || isStaff) && (
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => { setEditingEvent(event); populateEventForm(event); setIsEventModalOpen(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-destructive" onClick={() => setDeleteConfirmEvent(event)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming events
              </p>
            )}
          </div>
        )}
        {(selectedCard === "playmaker" || selectedCard === "playbook") && (
          <div className="space-y-4">
            {(userRole === "coach" || isStaff) && selectedCard === "playmaker" && (
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
            {(userRole === "coach" || userRole === "supporter" || isStaff) && aggregateStats && (
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
            {currentTeam && user && (
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
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/70 to-background dark:from-black/40 dark:via-black/60 dark:to-background" />
          <div className="absolute inset-0 bg-[url('/field-bg.jpg')] bg-cover bg-center opacity-30" />
          
          {/* Team Badge Watermark */}
          {currentTeam?.badgeId && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-35 pointer-events-none z-[5]">
              <TeamBadge badgeId={currentTeam.badgeId} size="xl" />
            </div>
          )}
          
          <div className="relative z-10 px-4 pt-6 pb-8">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="STATFYR" className="h-8 w-8" />
                <span className="font-display font-bold text-lg tracking-wide text-slate-900 dark:text-white">
                  STATF<span className="text-orange-500">Y</span>R
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
                
                {/* Super Admin Button - only visible for super admins */}
                {user?.isSuperAdmin && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setLocation("/super-admin")}
                    title="Super Admin Panel"
                    data-testid="button-super-admin"
                  >
                    <Shield className="h-5 w-5 text-amber-500" />
                  </Button>
                )}
                
                {/* Settings Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid="button-settings-menu">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user?.isSuperAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => setLocation("/super-admin")}>
                          <Shield className="h-4 w-4 mr-2 text-amber-500" /> Super Admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
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
                <p className="text-slate-600 dark:text-white/80 text-sm">Welcome, {userRole === "coach" ? "Coach" : isStaff ? "Staff" : getUserDisplayName()}!</p>
              </div>
            </div>

            {/* View Selector - Supporters Only */}
            {userRole === "supporter" && managedAthletes.length > 0 && (
              <div className="mt-4 bg-[#5e5a5a00]">
                <Label className="text-slate-500 dark:text-white/60 text-xs uppercase tracking-wide mb-2 block">
                  {supporterViewMode === "supporter" ? "My Dashboard" : "Viewing Athlete Profile"}
                </Label>
                <Select 
                  value={supporterViewMode === "supporter" ? "my-dashboard" : (selectedManagedAthleteId || "")} 
                  onValueChange={handleSupporterViewChange}
                >
                  <SelectTrigger className="w-full bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white" data-testid="select-supporter-view">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="my-dashboard" data-testid="option-my-dashboard">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>My Dashboard</span>
                      </div>
                    </SelectItem>
                    <div className="h-px bg-border my-1" />
                    {managedAthletes.map((ma: ManagedAthlete) => (
                      <SelectItem key={ma.id} value={ma.id} data-testid={`athlete-option-${ma.id}`}>
                        {ma.athlete.firstName} {ma.athlete.lastName}
                        {ma.team && <span className="text-muted-foreground ml-2">({ma.team.name})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - switches based on supporter view mode */}
        {userRole === "supporter" && supporterViewMode === "athlete" && selectedManagedAthlete ? (
          /* Athlete Profile View for Supporters */
          (<div className="px-4 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-display font-bold uppercase tracking-wide">
                {selectedManagedAthlete.athlete.firstName}'s Profile
              </h2>
              <Badge variant="outline" className="text-xs">
                {selectedManagedAthlete.team?.name || "Team"}
              </Badge>
            </div>
            {/* Athlete HYPE Card Preview */}
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/40 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl font-bold text-white">
                    {selectedManagedAthlete.athlete.firstName?.[0]}{selectedManagedAthlete.athlete.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {selectedManagedAthlete.athlete.firstName} {selectedManagedAthlete.athlete.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">Athlete</p>
                    {selectedManagedAthlete.team && (
                      <p className="text-sm text-primary">{selectedManagedAthlete.team.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => setLocation(`/share/athlete/${selectedManagedAthlete.athleteId}`)}
                    data-testid="button-view-hype-card"
                  >
                    <Flame className="h-4 w-4 text-orange-500" />
                    View HYPE Card
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Quick Stats for Managed Athlete */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm text-muted-foreground">Stats</p>
                  <p className="text-lg font-bold">View</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                <CardContent className="p-4 text-center">
                  <Video className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm text-muted-foreground">Highlights</p>
                  <p className="text-lg font-bold">{teamHighlights.filter(h => h.uploaderId === selectedManagedAthlete.athleteId).length}</p>
                </CardContent>
              </Card>
            </div>
            {/* Quick Access Cards Grid for Managed Athlete */}
            <div className="mb-6">
              <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-4">Quick Access</h3>
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
            </div>

            {/* Content Area */}
            {renderContent()}

            {/* Athlete's Highlights */}
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {selectedManagedAthlete.athlete.firstName}'s Highlights
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {teamHighlights
                  .filter(h => h.uploaderId === selectedManagedAthlete.athleteId)
                  .slice(0, 6)
                  .map((highlight) => (
                    <div
                      key={highlight.id}
                      className="aspect-video rounded-lg overflow-hidden bg-muted/30 relative group"
                    >
                      {highlight.thumbnailKey ? (
                        <img src={highlight.publicUrl || ""} alt={highlight.title || ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white font-medium truncate">{highlight.title}</p>
                      </div>
                    </div>
                  ))}
              </div>
              {teamHighlights.filter(h => h.uploaderId === selectedManagedAthlete.athleteId).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No highlights yet</p>
              )}
            </div>
          </div>)
        ) : (
          /* Normal Dashboard View - Quick Access Section */
          (<div className="px-4 pb-8">
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
            {/* HYPE Portal Card - Athletes Only */}
            {userRole === "athlete" && (
              <Card 
                onClick={() => setLocation("/athlete/hype-portal")}
                className="mt-4 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-orange-500/40 hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group overflow-hidden"
                data-testid="card-hype-portal"
              >
                <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg uppercase tracking-wide text-orange-500 group-hover:text-orange-400 transition-colors">
                      HYPE Portal
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Share your HYPE card, post updates, and fire up your followers
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-orange-500/70 group-hover:text-orange-500 transition-colors">
                    <span className="text-sm font-medium">Enter</span>
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Content Area */}
            {renderContent()}
          </div>)
        )}

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
              {/* Role selection - coaches can promote/demote to staff */}
              <div>
                <Label>Role</Label>
                <Select value={memberEditForm.role} onValueChange={(v) => setMemberEditForm({ ...memberEditForm, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="supporter">Supporter</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Staff members have access to all coach features except team settings.
                </p>
              </div>

              {/* Only show jersey/position for athletes - not for supporters */}
              {memberEditForm.role !== "supporter" && (
                <>
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
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={() => {
                if (!editingMember) return;
                const updateData: { jerseyNumber?: string; position?: string; role?: string } = {
                  role: memberEditForm.role
                };
                // Only include jersey/position for non-supporters
                if (memberEditForm.role !== "supporter") {
                  updateData.jerseyNumber = memberEditForm.jerseyNumber;
                  updateData.position = memberEditForm.position;
                } else {
                  // Clear jersey/position for supporters
                  updateData.jerseyNumber = "";
                  updateData.position = "";
                }
                updateMemberMutation.mutate({ memberId: editingMember.id, data: updateData });
              }}>Save</Button>
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
            {(userRole === "coach" || isStaff) && (
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
