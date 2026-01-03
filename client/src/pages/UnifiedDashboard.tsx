import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { useTheme } from "next-themes";
import { usePWA } from "@/lib/pwaContext";
import { useNotifications } from "@/lib/notificationContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

// Helper to parse text date - supports both "2026-01-02 05:00 PM" and "2026-01-02 17:00:00" formats
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
  
  // Handle AM/PM format
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  
  return new Date(year, month - 1, day, hour, minute);
};

// Helper to format text date for display
const formatTextDate = (dateStr: string, formatType: "date" | "time" | "month" | "day" | "full" = "full"): string => {
  const parsed = parseTextDate(dateStr);
  if (!parsed) return dateStr;
  if (formatType === "date") return format(parsed, "EEEE, MMM d, yyyy");
  if (formatType === "month") return format(parsed, "MMM");
  if (formatType === "day") return format(parsed, "d");
  if (formatType === "time") {
    const parts = dateStr.split(" ");
    return parts.length >= 3 ? `${parts[1]} ${parts[2]}` : "";
  }
  return format(parsed, "MMM d, h:mm a");
};

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
import { QRCodeSVG } from "qrcode.react";
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
  getUserTeams, joinTeamByCode, getTeamEngagementStats, getTopTappers,
  type Team, type TeamMember, type Event, type HighlightVideo, type Play, type StartingLineup,
  type TeamAggregateStats, type AdvancedTeamStats, type LiveEngagementSession, type ManagedAthlete,
  type TopTapper
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
  { id: "teamengagement", name: "Team Engagement", description: "See team's total taps & shoutouts.", icon: Heart, color: "text-orange-500", roles: ["supporter"] },
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
  const { setTheme, resolvedTheme } = useTheme();
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
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
  const [activeHypeTab, setActiveHypeTab] = useState<"events" | "highlights" | "stats" | "hypes">("events");
  const [isLandscape, setIsLandscape] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  const [playingHighlight, setPlayingHighlight] = useState<HighlightVideo | null>(null);
  const [eventSessions, setEventSessions] = useState<Record<string, LiveEngagementSession | null>>({});
  const [loadingSessionForEvent, setLoadingSessionForEvent] = useState<string | null>(null);
  const [confirmStartEvent, setConfirmStartEvent] = useState<Event | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const checkLandscape = () => {
      setIsLandscape(window.matchMedia("(orientation: landscape)").matches && window.innerWidth > 600);
    };
    checkLandscape();
    window.addEventListener("resize", checkLandscape);
    window.addEventListener("orientationchange", checkLandscape);
    return () => {
      window.removeEventListener("resize", checkLandscape);
      window.removeEventListener("orientationchange", checkLandscape);
    };
  }, []);

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
    enabled: !!currentTeam && (selectedCard === "stats" || selectedCard === "stattracker"),
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
    enabled: !!currentTeam,
    refetchInterval: 5000,
  });

  const { data: teamEngagementStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "engagement-stats"],
    queryFn: () => currentTeam ? getTeamEngagementStats(currentTeam.id) : Promise.resolve({ totalTaps: 0, totalShoutouts: 0 }),
    enabled: !!currentTeam && selectedCard === "teamengagement",
  });

  const { data: topTappers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "top-tappers"],
    queryFn: () => currentTeam ? getTopTappers(currentTeam.id, 5) : Promise.resolve([]),
    enabled: !!currentTeam && selectedCard === "teamengagement",
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

  // Fetch user's teams for athletes and supporters
  const { data: userTeams = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "teams"],
    queryFn: () => user ? getUserTeams(user.id) : Promise.resolve([]),
    enabled: !!user && (userRole === "athlete" || userRole === "supporter") && !currentTeam,
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
    return teamEvents.filter((e: Event) => {
      const d = parseTextDate(e.date);
      return d && d >= now;
    }).slice(0, 5);
  }, [teamEvents]);

  // Get the next upcoming game for Game Day Live
  const nextGame = useMemo(() => {
    const now = new Date();
    const games = teamEvents.filter((e: Event) => {
      const d = parseTextDate(e.date);
      return d && d >= now && e.type === "Game";
    });
    games.sort((a: Event, b: Event) => {
      const da = parseTextDate(a.date);
      const db = parseTextDate(b.date);
      return (da?.getTime() || 0) - (db?.getTime() || 0);
    });
    return games[0] || null;
  }, [teamEvents]);

  // Fetch session status for next game
  useEffect(() => {
    if (!nextGame || !currentTeam) return;
    const fetchSession = async () => {
      try {
        const session = await getLiveSessionByEvent(nextGame.id);
        setEventSessions(prev => ({ ...prev, [nextGame.id]: session }));
      } catch {
        setEventSessions(prev => ({ ...prev, [nextGame.id]: null }));
      }
    };
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [nextGame?.id, currentTeam?.id]);

  // Handler for toggling Game Day Live session
  const handleToggleGameDayLive = async (event: Event) => {
    if (!currentTeam) return;
    const existingSession = eventSessions[event.id];
    
    // If session is live, stop it directly
    if (existingSession?.status === "live") {
      setLoadingSessionForEvent(event.id);
      try {
        await endLiveSession(existingSession.id!);
        setEventSessions(prev => ({ ...prev, [event.id]: { ...existingSession, status: "ended" } }));
        toast.success("Game Day Live session ended");
      } catch (err) {
        toast.error("Failed to end live session");
      } finally {
        setLoadingSessionForEvent(null);
      }
    } else {
      // Show confirmation dialog before starting
      setConfirmStartEvent(event);
    }
  };

  // Confirm starting Game Day Live session
  const handleConfirmStartGameDayLive = async () => {
    if (!confirmStartEvent || !currentTeam) return;
    const event = confirmStartEvent;
    setConfirmStartEvent(null);
    setLoadingSessionForEvent(event.id);
    try {
      const existingSession = eventSessions[event.id];
      if (existingSession) {
        await startLiveSession(existingSession.id!);
        setEventSessions(prev => ({ ...prev, [event.id]: { ...existingSession, status: "live" } }));
        toast.success("Game Day Live session started!");
      } else {
        const eventDate = parseTextDate(event.date) || new Date();
        const newSession = await createLiveSessionForEvent(event.id, currentTeam.id, eventDate);
        await startLiveSession(newSession.id!);
        setEventSessions(prev => ({ ...prev, [event.id]: { ...newSession, status: "live" } }));
        toast.success("Game Day Live session created and started!");
      }
    } catch (err) {
      toast.error("Failed to start live session");
    } finally {
      setLoadingSessionForEvent(null);
    }
  };

  // Get the currently selected managed athlete
  const selectedManagedAthlete = useMemo(() => {
    if (!selectedManagedAthleteId) return null;
    return managedAthletes.find((ma: ManagedAthlete) => ma.id === selectedManagedAthleteId) || null;
  }, [managedAthletes, selectedManagedAthleteId]);

  // Initialize athlete's team context from their teams
  useEffect(() => {
    if (userRole === "athlete" && userTeams.length > 0 && !currentTeam) {
      setCurrentTeam(userTeams[0]);
    }
  }, [userRole, userTeams, currentTeam, setCurrentTeam]);

  // Initialize supporter's team context from first managed athlete or their own teams
  useEffect(() => {
    if (userRole === "supporter" && !currentTeam && !supporterOriginalTeam) {
      if (managedAthletes.length > 0) {
        const firstAthleteWithTeam = managedAthletes.find((ma: ManagedAthlete) => ma.team);
        if (firstAthleteWithTeam?.team) {
          setCurrentTeam(firstAthleteWithTeam.team);
          setSupporterOriginalTeam(firstAthleteWithTeam.team);
          return;
        }
      }
      // Fall back to user's own teams if no managed athletes
      if (userTeams.length > 0) {
        setCurrentTeam(userTeams[0]);
        setSupporterOriginalTeam(userTeams[0]);
      }
    }
  }, [userRole, managedAthletes, userTeams, currentTeam, supporterOriginalTeam, setCurrentTeam]);

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
    // Parse text date format: "2026-01-02 05:00 PM"
    const dateStr = event.date || "";
    const parts = dateStr.split(" ");
    const datePart = parts[0] || "";
    const timePart = parts[1] || "09:00";
    const ampmPart = parts[2] || "AM";
    const [hour, minute] = timePart.split(":");
    
    setEventForm({
      type: event.type,
      date: datePart,
      hour: hour || "09",
      minute: minute || "00",
      ampm: ampmPart,
      location: event.location || "",
      details: event.details || "",
      opponent: event.opponent || "",
      drinksAthleteId: (event as any).drinksAthleteId || "",
      snacksAthleteId: (event as any).snacksAthleteId || ""
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
      if (isLandscape) {
        setSelectedCard(selectedCard === cardId ? null : cardId);
      } else {
        setLocation("/stat-tracker");
      }
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
          <TeamBadge badgeId={currentTeam.badgeId} size="lg" teamColor={currentTeam.teamColor} />
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
          <span className="text-xs text-muted-foreground uppercase">{formatTextDate(event.date, "month")}</span>
          <span className="text-xl font-display font-bold">{formatTextDate(event.date, "day")}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{event.title}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
            <Clock className="h-3 w-3" />
            {formatTextDate(event.date, "time")}
            {event.location && (
              <>
                <span className="mx-1">•</span>
                <MapPin className="h-3 w-3" />
                <span className="truncate">{event.location}</span>
              </>
            )}
          </p>
          {((event as any).drinksAthleteId || (event as any).snacksAthleteId) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {(event as any).drinksAthleteId && (() => {
                const athlete = teamMembers.find((m: TeamMember) => m.userId === (event as any).drinksAthleteId);
                return athlete ? (
                  <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                    🥤 {athlete.user.name || athlete.user.username}
                  </span>
                ) : null;
              })()}
              {(event as any).snacksAthleteId && (() => {
                const athlete = teamMembers.find((m: TeamMember) => m.userId === (event as any).snacksAthleteId);
                return athlete ? (
                  <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                    🍿 {athlete.user.name || athlete.user.username}
                  </span>
                ) : null;
              })()}
            </div>
          )}
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
                populateEventForm(event);
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

  const renderHighlightCard = (highlight: HighlightVideo) => {
    const hasVideo = highlight.publicUrl && highlight.status === "completed";
    const isProcessing = highlight.status === "processing" || highlight.status === "transcoding";
    
    return (
      <div 
        key={highlight.id} 
        className={`relative aspect-video rounded-xl overflow-hidden bg-black/20 group ${hasVideo ? "cursor-pointer" : ""}`}
        onClick={() => hasVideo && setPlayingHighlight(highlight)}
        data-testid={`highlight-card-${highlight.id}`}
      >
        {highlight.thumbnailKey ? (
          <img src={highlight.thumbnailKey} alt={highlight.title ?? "Highlight"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        {/* Play button overlay */}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-orange-500/90 flex items-center justify-center">
              <Video className="h-5 w-5 text-white ml-0.5" />
            </div>
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
              <span className="text-xs text-white">Processing...</span>
            </div>
          </div>
        )}
        
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
  };

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
                return (parseTextDate(a.date)?.getTime() || 0) - (parseTextDate(b.date)?.getTime() || 0);
              }).map((event) => (
                <Card 
                  key={event.id} 
                  className="bg-card/80 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-all min-w-[240px] max-w-[280px] flex-shrink-0 snap-start"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={event.type === "Game" ? "default" : "outline"} className="text-xs">
                        {event.type}
                      </Badge>
                      {event.type === "Game" && <Trophy className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="font-semibold text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{formatTextDate(event.date)}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </p>
                    )}
                    {((event as any).drinksAthleteId || (event as any).snacksAthleteId) && (
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        {(event as any).drinksAthleteId && (() => {
                          const athlete = teamMembers.find((m: TeamMember) => m.userId === (event as any).drinksAthleteId);
                          return athlete ? (
                            <p className="text-xs text-muted-foreground">
                              <span className="text-blue-400">🥤 Drinks:</span> {athlete.user.firstName} {athlete.user.lastName}
                            </p>
                          ) : null;
                        })()}
                        {(event as any).snacksAthleteId && (() => {
                          const athlete = teamMembers.find((m: TeamMember) => m.userId === (event as any).snacksAthleteId);
                          return athlete ? (
                            <p className="text-xs text-muted-foreground">
                              <span className="text-orange-400">🍿 Snacks:</span> {athlete.user.firstName} {athlete.user.lastName}
                            </p>
                          ) : null;
                        })()}
                      </div>
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
                  <PlaybookCanvas sport={currentTeam?.sport} onSave={async (data) => { createPlayMutation.mutate(data); }} />
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
        {selectedCard === "teamengagement" && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-pink-500/20 to-red-500/20 border-pink-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold uppercase">Team Engagement</h3>
                    <p className="text-sm text-muted-foreground">Total supporter activity this season</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-orange-500/30">
                <CardContent className="p-6 text-center">
                  <Zap className="h-10 w-10 mx-auto mb-2 text-orange-500" />
                  <p className="text-4xl font-display font-bold text-orange-500">
                    {teamEngagementStats?.totalTaps?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Total Taps</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-purple-500" />
                  <p className="text-4xl font-display font-bold text-purple-500">
                    {teamEngagementStats?.totalShoutouts?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Shoutouts</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Tappers Leaderboard */}
            <Card className="bg-card/80 backdrop-blur-sm border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-display font-bold uppercase">Top Tappers</h4>
                </div>
                {topTappers.length > 0 ? (
                  <div className="space-y-2">
                    {topTappers.map((tapper: TopTapper, index: number) => {
                      const rankColors = [
                        "bg-gradient-to-r from-yellow-500/30 to-amber-500/30 border-yellow-500/50",
                        "bg-gradient-to-r from-slate-300/30 to-slate-400/30 border-slate-400/50",
                        "bg-gradient-to-r from-orange-700/30 to-orange-600/30 border-orange-600/50",
                      ];
                      const rankIcons = ["🥇", "🥈", "🥉"];
                      const isTopThree = index < 3;
                      
                      return (
                        <div
                          key={tapper.supporterId}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            isTopThree ? rankColors[index] : "bg-muted/30"
                          } border ${isTopThree ? "" : "border-white/10"}`}
                          data-testid={`leaderboard-row-${index}`}
                        >
                          <span className="text-lg font-bold w-8 text-center">
                            {isTopThree ? rankIcons[index] : `#${index + 1}`}
                          </span>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={tapper.supporter.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {tapper.supporter.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 font-medium truncate">
                            {tapper.supporter.name}
                          </span>
                          <div className="flex items-center gap-1 text-orange-500">
                            <Zap className="h-4 w-4" />
                            <span className="font-bold">{tapper.totalTaps.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No taps recorded yet. Be the first!
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-card/80 backdrop-blur-sm border-white/10">
              <CardContent className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Join Game Day Live sessions to climb the leaderboard!</p>
              </CardContent>
            </Card>
          </div>
        )}
        {selectedCard === "stattracker" && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold uppercase">StatTracker</h3>
                    <p className="text-sm text-muted-foreground">Live game stat tracking</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Track individual player stats or team stats in real-time during games. 
                  Set up rosters, configure stat types, and record every play.
                </p>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setLocation("/stat-tracker")}
                >
                  <Activity className="h-4 w-4" />
                  Open Full StatTracker
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
            
            {aggregateStats && (
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-display font-bold text-primary">{aggregateStats.games}</p>
                    <p className="text-xs text-muted-foreground">Games Tracked</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-display font-bold">
                      <span className="text-green-500">{aggregateStats.wins}</span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className="text-red-500">{aggregateStats.losses}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Win/Loss Record</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
        {selectedCard === "chat" && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold uppercase">Team Chat</h3>
                    <p className="text-sm text-muted-foreground">Message your team</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Stay connected with your team. Send messages, share updates, and coordinate with coaches and teammates.
                </p>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setLocation("/chat")}
                >
                  <MessageSquare className="h-4 w-4" />
                  Open Full Chat
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
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

  const handleJoinTeamWithCode = async () => {
    if (!joinTeamCode.trim() || !user) return;
    setIsJoiningTeam(true);
    try {
      const result = await joinTeamByCode(joinTeamCode.trim(), user.id, userRole === "athlete" ? "athlete" : "supporter");
      setCurrentTeam(result.team);
      toast.success(`Joined ${result.team.name}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join team");
    } finally {
      setIsJoiningTeam(false);
    }
  };

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
                  <TeamBadge badgeId={team.badgeId} size="sm" fallbackInitials={team.name?.substring(0, 2)} teamColor={team.teamColor} />
                  {team.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!currentTeam && (userRole === "athlete" || userRole === "supporter")) {
    return (
      <>
        <DashboardBackground />
        <div className="min-h-screen relative z-10 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-white/10 bg-card/50 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                {userRole === "athlete" ? <Trophy className="h-8 w-8 text-primary" /> : <Users className="h-8 w-8 text-primary" />}
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-wide">Join a Team</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Enter a team code to join as {userRole === "athlete" ? "an athlete" : "a supporter"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter team code"
                  value={joinTeamCode}
                  onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg uppercase tracking-widest"
                  maxLength={6}
                  data-testid="input-join-team-code"
                />
              </div>
              <Button
                onClick={handleJoinTeamWithCode}
                disabled={!joinTeamCode.trim() || isJoiningTeam}
                className="w-full"
                size="lg"
                data-testid="button-join-team-submit"
              >
                {isJoiningTeam ? "Joining..." : "Join Team"}
              </Button>
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-2">Or scan a QR code from your team</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/join/scan")}
                  data-testid="button-scan-qr"
                >
                  Scan QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const athleteWelcomeModal: WelcomeModal = useMemo(() => ({
    title: "Welcome, Athlete!",
    subtitle: `You're part of ${currentTeam?.name || "the team"}`,
    description: "You're all set up and ready to go! Let us show you around so you can make the most of your dashboard.",
    buttonText: "Let's Go!"
  }), [currentTeam?.name]);

  const athleteTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-testid="card-schedule"]',
      title: "Stay Up to Date",
      description: "Check the schedule regularly to stay informed about upcoming practices, games, and team events.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-hype-portal"]',
      title: "Your HYPE Portal",
      description: "Post updates and fire up your followers! This is where you share your journey with fans and family.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-hype-card"]',
      title: "Your HYPE Card",
      description: "View and share your personal player card. See your stats, highlights, and shoutouts from supporters!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-playbook"]',
      title: "Study the Playbook",
      description: "Review team plays and strategies. Check back often to learn new formations!",
      position: "bottom"
    },
    {
      target: '[data-testid="button-settings-menu"]',
      title: "Personalize Your Profile",
      description: "Head to Settings to update your avatar and name. Make your profile stand out!",
      position: "bottom"
    }
  ], []);

  const coachWelcomeModal: WelcomeModal = useMemo(() => ({
    title: "Welcome, Coach!",
    subtitle: `Ready to lead ${currentTeam?.name || "your team"}`,
    description: "Your command center is all set up! Let us give you a quick tour so you can start managing your team like a pro.",
    buttonText: "Show Me Around"
  }), [currentTeam?.name]);

  const coachTourSteps: TourStep[] = useMemo(() => [
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
    },
    {
      target: '[data-testid="button-settings-menu"]',
      title: "Team Settings",
      description: "Manage your team settings, update your profile, and customize your experience.",
      position: "bottom"
    }
  ], []);

  const supporterWelcomeModal: WelcomeModal = useMemo(() => ({
    title: "Welcome, Supporter!",
    subtitle: `You're cheering for ${currentTeam?.name || "the team"}`,
    description: "You're all set to support your athletes! Let us show you around so you can stay connected and cheer them on.",
    buttonText: "Let's Go!"
  }), [currentTeam?.name]);

  const supporterTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-testid="card-schedule"]',
      title: "Team Schedule",
      description: "View upcoming games and practices. When a game is live, you'll see a banner to join and cheer!",
      position: "bottom"
    },
    {
      target: '[data-testid="card-roster"]',
      title: "Team Roster",
      description: "See all team members including athletes, coaches, and fellow supporters.",
      position: "bottom"
    },
    {
      target: '[data-testid="game-day-live-card"]',
      title: "Game Day Live",
      description: "When a game is live, join to send taps and shoutouts! Earn badges by cheering for your team.",
      position: "bottom"
    },
    {
      target: '[data-testid="card-highlights"]',
      title: "Team Highlights",
      description: "Watch video highlights from games and practices.",
      position: "bottom"
    },
    {
      target: '[data-testid="button-settings-menu"]',
      title: "Your Settings",
      description: "Update your profile and manage your notification preferences.",
      position: "bottom"
    }
  ], []);

  return (
    <>
      {user?.id && userRole === "athlete" && (
        <OnboardingTour 
          steps={athleteTourSteps} 
          storageKey={`unified-athlete-onboarding-${user.id}`}
          welcomeModal={athleteWelcomeModal}
        />
      )}
      {user?.id && userRole === "coach" && currentTeam && (
        <OnboardingTour 
          steps={coachTourSteps} 
          storageKey={`unified-coach-onboarding-${user.id}`}
          welcomeModal={coachWelcomeModal}
        />
      )}
      {user?.id && userRole === "supporter" && currentTeam && (
        <OnboardingTour 
          steps={supporterTourSteps} 
          storageKey={`unified-supporter-onboarding-${user.id}`}
          welcomeModal={supporterWelcomeModal}
        />
      )}
      <DashboardBackground />
      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/70 to-background dark:from-black/40 dark:via-black/60 dark:to-background" />
          <div className="absolute inset-0 bg-[url('/field-bg.jpg')] bg-cover bg-center opacity-30" />
          {/* Noise texture overlay - light mode only */}
          <div 
            className="absolute inset-0 opacity-[0.25] dark:opacity-0 z-[2]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '150px 150px',
            }}
          />
          
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
                {mounted && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    data-testid="button-theme-toggle"
                  >
                    {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                )}
                
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
            <div className="relative flex items-start gap-4 landscape:justify-center landscape:items-center landscape:gap-6">
              {/* Team Badge Watermark - positioned to align with profile content */}
              {currentTeam?.badgeId && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-35 pointer-events-none">
                  <TeamBadge badgeId={currentTeam.badgeId} size="xl" teamColor={currentTeam.teamColor} />
                </div>
              )}
              <div className="h-20 w-20 landscape:h-24 landscape:w-24 border-2 border-primary/50 rounded-xl overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-2xl landscape:text-3xl font-bold text-white">{getUserDisplayName().charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 landscape:flex-none landscape:text-center">
                {currentTeam && (
                  <p className="font-marker text-lg landscape:text-2xl -rotate-2 mb-1 text-[#de8816e6]">{currentTeam.name}</p>
                )}
                <h1 className="text-2xl landscape:text-3xl font-display font-bold text-primary uppercase tracking-wide">
                  {roleConfig[userRole].title}
                </h1>
                <p className="text-slate-600 dark:text-white/80 text-sm landscape:text-base">Welcome, {userRole === "coach" ? "Coach" : isStaff ? "Staff" : getUserDisplayName()}!</p>
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

        {/* Wave Divider */}
        <div className="relative -mt-1">
          <svg 
            viewBox="0 0 1440 80" 
            className="w-full h-8 sm:h-12"
            preserveAspectRatio="none"
          >
            <path 
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
              style={{ fill: 'hsl(var(--background))' }}
            />
          </svg>
        </div>

        {/* Main Content - switches based on supporter view mode */}
        {userRole === "supporter" && supporterViewMode === "athlete" && selectedManagedAthlete ? (
          /* Athlete Profile View for Supporters - matches coach layout */
          (<div className="px-4 pt-6 pb-8">
            {/* Two-column layout on landscape - matching coach dashboard */}
            <div className="flex flex-col landscape:flex-row landscape:gap-6">
              {/* Left Column - Cards */}
              <div className="landscape:w-1/3 landscape:shrink-0">
                {/* Athlete HYPE Card Preview */}
                <Card className="bg-card/80 backdrop-blur-sm border-white/10 mb-4 landscape:mb-5">
                  <CardContent className="p-4 landscape:p-5">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 landscape:h-16 landscape:w-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xl landscape:text-2xl font-bold text-white">
                        {selectedManagedAthlete.athlete.firstName?.[0]}{selectedManagedAthlete.athlete.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate">
                          {selectedManagedAthlete.athlete.firstName} {selectedManagedAthlete.athlete.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">Athlete</p>
                        {selectedManagedAthlete.team && (
                          <Badge variant="outline" className="text-xs mt-1">{selectedManagedAthlete.team.name}</Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 gap-2"
                      onClick={() => setLocation(`/share/athlete/${selectedManagedAthlete.athleteId}`)}
                      data-testid="button-view-hype-card"
                    >
                      <Flame className="h-4 w-4 text-orange-500" />
                      View HYPE Card
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-3 mb-4 landscape:mb-5">
                  <h2 className="text-xl landscape:text-2xl font-display font-bold uppercase tracking-wide">Quick Access</h2>
                </div>
                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-3 landscape:gap-4">
                  {visibleCards.map((card) => (
                    <Card
                      key={card.id}
                      className={`bg-card/80 backdrop-blur-sm border-white/10 cursor-pointer transition-all hover:border-primary/50 hover:scale-[1.02] ${selectedCard === card.id ? "border-primary ring-1 ring-primary" : ""}`}
                      onClick={() => handleCardClick(card.id)}
                      data-testid={`card-${card.id}`}
                    >
                      <CardContent className="p-4 landscape:p-5">
                        <div className="flex items-start gap-3">
                          <card.icon className={`h-6 w-6 landscape:h-7 landscape:w-7 ${card.color} shrink-0`} />
                          <div className="min-w-0">
                            <p className="font-semibold landscape:text-base">{card.name}</p>
                            <p className="text-xs landscape:text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column - Content Area */}
              <div className="landscape:flex-1 landscape:mt-0 landscape:min-h-[400px] mt-4">
                {renderContent()}
              </div>
            </div>
          </div>)
        ) : (
          /* Normal Dashboard View - Quick Access Section */
          (<div className="px-4 pt-6 pb-8">
            {/* Two-column layout on landscape */}
            <div className="flex flex-col landscape:flex-row landscape:gap-6">
              {/* Left Column - Cards */}
              <div className="landscape:w-1/3 landscape:shrink-0">
                {/* HYPE Cards - Athletes Only - Above Quick Access */}
                {userRole === "athlete" && (
                  <div className="mt-4 mb-4 landscape:mb-5 grid grid-cols-2 gap-3 landscape:gap-4">
                    {/* HYPE Portal Card */}
                    <Card 
                      onClick={() => setLocation("/athlete/hype-portal")}
                      className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-orange-500/40 hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer group overflow-hidden"
                      data-testid="card-hype-portal"
                    >
                      <CardContent className="p-3 sm:p-4 landscape:p-5 flex flex-col items-center gap-2 sm:gap-3 landscape:gap-4">
                        <div className="p-2 sm:p-2.5 landscape:p-3 rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-gray-400 to-gray-600">
                          <img src={logoImage} alt="STATFYR" className="h-6 w-6 sm:h-8 sm:w-8 landscape:h-10 landscape:w-10 object-contain" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-display font-bold text-sm sm:text-lg landscape:text-xl uppercase tracking-wide text-orange-500 group-hover:text-orange-400 transition-colors">
                            HYPE Portal
                          </h3>
                          <p className="hidden sm:block text-xs landscape:text-sm text-muted-foreground mt-0.5">
                            Post updates & fire up followers
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* HYPE Card - Link to dedicated page */}
                    <Card 
                      onClick={() => setLocation("/athlete/hype-card")}
                      className="bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border-cyan-500/40 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group overflow-hidden"
                      data-testid="card-hype-card"
                    >
                      <CardContent className="p-3 sm:p-4 landscape:p-5 flex flex-col items-center gap-2 sm:gap-3 landscape:gap-4">
                        <div className="p-2 sm:p-2.5 landscape:p-3 rounded-xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-slate-700 to-slate-900">
                          <User className="h-6 w-6 sm:h-8 sm:w-8 landscape:h-10 landscape:w-10 text-cyan-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-display font-bold text-sm sm:text-lg landscape:text-xl uppercase tracking-wide text-cyan-500 group-hover:text-cyan-400 transition-colors">
                            HYPE Card
                          </h3>
                          <p className="hidden sm:block text-xs landscape:text-sm text-muted-foreground mt-0.5">
                            View & share your player card
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Permanent Game Day Live Card - All roles with access */}
                {(effectiveRole === "coach" || userRole === "supporter" || isStaff) && (
                  <Card 
                    className={`relative overflow-hidden border-2 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 mb-4 transition-all duration-500 ${
                      nextGame && eventSessions[nextGame.id]?.status === "live" 
                        ? "border-green-500 ring-2 ring-green-500/50 animate-pulse shadow-lg shadow-green-500/30" 
                        : "border-primary/30"
                    }`} 
                    data-testid="game-day-live-card"
                  >
                    <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    <CardContent className="relative z-10 p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Radio className="h-4 w-4 text-primary" />
                            <span className="text-xs uppercase tracking-wider text-primary font-bold">Game Day Live</span>
                            {nextGame && eventSessions[nextGame.id]?.status === "live" && (
                              <Badge variant="destructive" className="animate-pulse text-xs">LIVE</Badge>
                            )}
                          </div>
                          {nextGame ? (
                            <>
                              <h3 className="text-lg font-display font-bold">
                                {nextGame.opponent ? `vs ${nextGame.opponent}` : nextGame.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3 text-primary" />
                                  <span>{formatTextDate(nextGame.date, "date")}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-primary" />
                                  <span>{formatTextDate(nextGame.date, "time")}</span>
                                </div>
                                {/* Mobile: Show buttons inline with date */}
                                {userRole === "supporter" && !isStaff && effectiveRole !== "coach" ? (
                                  eventSessions[nextGame.id]?.status === "live" && (
                                    <Button
                                      size="sm"
                                      className="sm:hidden font-bold gap-1 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 h-6 px-2 text-xs"
                                      onClick={() => setLocation(`/supporter/game/${nextGame.id}`)}
                                      data-testid="button-join-game-day-live-mobile"
                                    >
                                      <Zap className="h-3 w-3" />
                                      JOIN
                                    </Button>
                                  )
                                ) : (
                                  <Button
                                    size="sm"
                                    className={`sm:hidden font-bold gap-1 h-6 px-2 text-xs ${
                                      eventSessions[nextGame.id]?.status === "live"
                                        ? "bg-red-500 hover:bg-red-600 text-white"
                                        : "bg-green-500 hover:bg-green-600 text-white"
                                    }`}
                                    onClick={() => handleToggleGameDayLive(nextGame)}
                                    disabled={loadingSessionForEvent === nextGame.id}
                                    data-testid="button-game-day-live-mobile"
                                  >
                                    {loadingSessionForEvent === nextGame.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : eventSessions[nextGame.id]?.status === "live" ? (
                                      <>
                                        <Radio className="h-3 w-3" />
                                        STOP
                                      </>
                                    ) : (
                                      <>
                                        <Radio className="h-3 w-3" />
                                        START
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <h3 className="text-base font-display font-bold text-muted-foreground">
                                No upcoming games
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Create a game event to enable live supporter engagement
                              </p>
                            </>
                          )}
                        </div>
                        
                        <div className="hidden sm:flex flex-col items-center gap-1">
                          {nextGame ? (
                            <>
                              {/* Supporters only see Join button when session is live - Staff/Coaches get Start/Stop controls */}
                              {userRole === "supporter" && !isStaff && effectiveRole !== "coach" ? (
                                eventSessions[nextGame.id]?.status === "live" ? (
                                  <Button
                                    size="default"
                                    className="min-w-[140px] font-bold gap-2 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                                    onClick={() => setLocation(`/supporter/game/${nextGame.id}`)}
                                    data-testid="button-join-game-day-live"
                                  >
                                    <Zap className="h-4 w-4" />
                                    JOIN LIVE
                                  </Button>
                                ) : (
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">
                                      Session not started yet
                                    </p>
                                  </div>
                                )
                              ) : (
                                /* Coaches and Staff see Start/Stop buttons */
                                <Button
                                  size="default"
                                  className={`min-w-[140px] font-bold gap-2 transition-all ${
                                    eventSessions[nextGame.id]?.status === "live"
                                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30"
                                      : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30"
                                  }`}
                                  onClick={() => handleToggleGameDayLive(nextGame)}
                                  disabled={loadingSessionForEvent === nextGame.id}
                                  data-testid="button-game-day-live"
                                >
                                  {loadingSessionForEvent === nextGame.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : eventSessions[nextGame.id]?.status === "live" ? (
                                    <>
                                      <Radio className="h-4 w-4" />
                                      STOP LIVE
                                    </>
                                  ) : (
                                    <>
                                      <Radio className="h-4 w-4" />
                                      START LIVE
                                    </>
                                  )}
                                </Button>
                              )}
                              {(effectiveRole === "coach" || isStaff) && (
                                <span className="text-xs text-muted-foreground text-center">
                                  {eventSessions[nextGame.id]?.status === "live" 
                                    ? "Supporters are cheering!" 
                                    : "Enable engagement"}
                                </span>
                              )}
                            </>
                          ) : (
                            (effectiveRole === "coach" || isStaff) ? (
                              <Button
                                size="default"
                                variant="outline"
                                className="min-w-[140px] font-bold gap-2"
                                onClick={() => { setSelectedCard("schedule"); setIsEventModalOpen(true); }}
                                data-testid="button-add-game"
                              >
                                <Plus className="h-4 w-4" />
                                Add Game
                              </Button>
                            ) : null
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center gap-3 mb-4 landscape:mb-5 flex-wrap">
                  <h2 className="text-xl landscape:text-2xl font-display font-bold uppercase tracking-wide">Quick Access</h2>
                  {currentTeam?.code && userRole === "coach" && (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="gap-1 cursor-pointer hover:bg-primary/10 font-mono"
                        onClick={handleCopyCode}
                        data-testid="badge-team-code"
                      >
                        Team Code: {currentTeam.code}
                        {codeCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowQRModal(true)}
                        data-testid="button-show-qr"
                      >
                        QR
                      </Button>
                    </div>
                  )}
                </div>
                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-3 landscape:gap-4">
                  {visibleCards.map((card) => (
                    <Card
                      key={card.id}
                      className={`bg-card/80 backdrop-blur-sm border-white/10 cursor-pointer transition-all hover:border-primary/50 hover:scale-[1.02] ${selectedCard === card.id ? "border-primary ring-1 ring-primary" : ""}`}
                      onClick={() => handleCardClick(card.id)}
                      data-testid={`card-${card.id}`}
                    >
                      <CardContent className="p-4 landscape:p-5">
                        <div className="flex items-start gap-3">
                          <card.icon className={`h-6 w-6 landscape:h-7 landscape:w-7 ${card.color} shrink-0`} />
                          <div className="min-w-0">
                            <p className="font-semibold landscape:text-base">{card.name}</p>
                            <p className="text-xs landscape:text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column - Content Area */}
              <div className="landscape:flex-1 landscape:mt-0 landscape:min-h-[400px] mt-4">
                {renderContent()}
              </div>
            </div>
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
                <Label>Bringing Drinks</Label>
                <Select value={eventForm.drinksAthleteId || "none"} onValueChange={(v) => setEventForm({ ...eventForm, drinksAthleteId: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="select-event-drinks">
                    <SelectValue placeholder="Select athlete..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {athletes.map((athlete: TeamMember) => (
                      <SelectItem key={athlete.id} value={athlete.userId}>
                        {athlete.user.name || athlete.user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bringing Snacks</Label>
                <Select value={eventForm.snacksAthleteId || "none"} onValueChange={(v) => setEventForm({ ...eventForm, snacksAthleteId: v === "none" ? "" : v })}>
                  <SelectTrigger data-testid="select-event-snacks">
                    <SelectValue placeholder="Select athlete..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {athletes.map((athlete: TeamMember) => (
                      <SelectItem key={athlete.id} value={athlete.userId}>
                        {athlete.user.name || athlete.user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Details</Label>
                <Textarea value={eventForm.details} onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })} placeholder="Additional details" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEventModalOpen(false); resetEventForm(); }}>Cancel</Button>
              <Button onClick={() => {
                // Format date as text string for storage (e.g., "2026-01-02 05:00 PM")
                const dateText = `${eventForm.date} ${eventForm.hour}:${eventForm.minute} ${eventForm.ampm}`;
                const eventData = {
                  type: eventForm.type,
                  date: dateText,
                  location: eventForm.location || undefined,
                  details: eventForm.details || undefined,
                  opponent: eventForm.opponent || undefined,
                  drinksAthleteId: eventForm.drinksAthleteId || undefined,
                  snacksAthleteId: eventForm.snacksAthleteId || undefined
                };
                if (editingEvent) {
                  updateEventMutation.mutate({ id: editingEvent.id, data: eventData });
                } else {
                  createEventMutation.mutate(eventData);
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

        {/* Game Day Live Start Confirmation */}
        <AlertDialog open={!!confirmStartEvent} onOpenChange={(open) => !open && setConfirmStartEvent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-green-500" />
                Start Game Day Live?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Is the game starting? This will notify all supporters that the live session is active and they can start sending cheers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not Yet</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmStartGameDayLive}
                className="bg-green-500 hover:bg-green-600"
              >
                Yes, Start Live
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* QR Code Modal */}
        <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">Scan to Join Team</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {currentTeam?.code && (
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG 
                    value={`${window.location.origin}/join?code=${currentTeam.code}`}
                    size={200}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Athletes and supporters can scan this code to join <span className="font-bold">{currentTeam?.name}</span>
              </p>
              <Badge variant="outline" className="font-mono text-lg px-4 py-2">
                {currentTeam?.code}
              </Badge>
            </div>
          </DialogContent>
        </Dialog>

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
              <div className="rounded-lg overflow-hidden border max-h-[50vh] overflow-y-auto">
                <img src={expandedPlay.thumbnailData} alt={expandedPlay.name} className="w-full h-auto max-h-[50vh] object-contain" />
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

        {/* Video Player Dialog */}
        <Dialog open={!!playingHighlight} onOpenChange={(open) => !open && setPlayingHighlight(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black border-zinc-800">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-orange-500" />
                {playingHighlight?.title || "Video"}
              </DialogTitle>
            </DialogHeader>
            {playingHighlight?.publicUrl && (
              <div className="w-full aspect-video bg-black">
                <video
                  src={playingHighlight.publicUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  poster={playingHighlight.thumbnailKey || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
