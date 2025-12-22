import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, TrendingUp, Trophy, Activity, Clock, MapPin, MessageSquare, BarChart3, ClipboardList, X, Repeat2, Settings, LogOut, Share2, Moon, Sun, Users, Utensils, Coffee, Video, Loader2, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { useUser } from "@/lib/userContext";
import { getTeamMembers, getTeamEvents, getAllTeamHighlights, deleteHighlightVideo, getTeamPlays, type TeamMember, type Event, type HighlightVideo, type Play } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, startOfMonth } from "date-fns";
import { VideoUploader } from "@/components/VideoUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePWA } from "@/lib/pwaContext";

export default function AthleteDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();
  
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
    refetchInterval: 5000, // Refetch every 5 seconds to check for transcoding completion
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const queryClient = useQueryClient();
  const nextEvent = teamEvents[0] || null;

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach"), [teamMembers]);
  const supporters = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "supporter"), [teamMembers]);
  
  // Get the current user's team membership to access team-specific jersey number and position
  const currentMembership = useMemo(() => teamMembers.find((m: TeamMember) => m.userId === user?.id), [teamMembers, user?.id]);
  
  const [rosterTab, setRosterTab] = useState<"all" | "athletes" | "coach" | "supporters">("all");
  const filteredRosterMembers = useMemo(() => {
    switch (rosterTab) {
      case "athletes": return athletes;
      case "coach": return coaches;
      case "supporters": return supporters;
      default: return teamMembers;
    }
  }, [rosterTab, teamMembers, athletes, coaches, supporters]);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isHypeCardFlipped, setIsHypeCardFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCardFlipped, setIsModalCardFlipped] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<TeamMember | null>(null);
  const [isAthleteModalOpen, setIsAthleteModalOpen] = useState(false);
  const [isAthleteCardFlipped, setIsAthleteCardFlipped] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));
  const [expandedPlay, setExpandedPlay] = useState<Play | null>(null);
  const [playbookTab, setPlaybookTab] = useState<"Offense" | "Defense" | "Special">("Offense");
  const { theme, setTheme } = useTheme();

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

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/athlete/${user?.id || 1}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Share link copied!");
  };
  const contentRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);
  const hypeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCard && contentRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    }
  }, [selectedCard]);

  const quickActions = [
    { 
      name: "Schedule", 
      id: "schedule",
      icon: CalendarIcon, 
      color: "from-blue-500/20 to-blue-600/20",
      description: "Your matches"
    },
    { 
      name: "Stats", 
      id: "stats",
      icon: BarChart3, 
      color: "from-orange-500/20 to-orange-600/20",
      description: "Performance"
    },
    { 
      name: "Chat", 
      id: "chat",
      icon: MessageSquare, 
      color: "from-pink-500/20 to-pink-600/20",
      description: "Messages"
    },
    { 
      name: "Highlights", 
      id: "highlights",
      icon: Video, 
      color: "from-yellow-500/20 to-yellow-600/20",
      description: "Team videos"
    },
    { 
      name: "Roster", 
      id: "roster",
      icon: Users, 
      color: "from-purple-500/20 to-purple-600/20",
      description: "Team players"
    },
    { 
      name: "Playbook", 
      id: "playbook",
      icon: BookOpen, 
      color: "from-green-500/20 to-green-600/20",
      description: "Team plays"
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
      case "stats":
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Goals</p>
                <p className="text-3xl font-display font-bold">0</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Assists</p>
                <p className="text-3xl font-display font-bold">0</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Games</p>
                <p className="text-3xl font-display font-bold">0</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Rating</p>
                <p className="text-3xl font-display font-bold text-accent">-</p>
              </CardContent>
            </Card>
          </div>
        );
      case "chat":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-background/40 border border-white/10 rounded-lg">
              <p className="text-sm font-bold">Coach Carter</p>
              <p className="text-xs text-muted-foreground">Great performance last match! See you at practice.</p>
            </div>
            <div className="p-3 bg-background/40 border border-white/10 rounded-lg">
              <p className="text-sm font-bold">Team Group</p>
              <p className="text-xs text-muted-foreground">Practice moved to 5 PM today.</p>
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
            {/* Upload section */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Team Highlights</h3>
              {currentTeam && user && (
                <VideoUploader 
                  teamId={currentTeam.id} 
                  userId={user.id} 
                  onUploadComplete={() => refetchHighlights()}
                  compact
                />
              )}
            </div>

            {/* Video list */}
            {teamHighlights.length === 0 ? (
              <div className="bg-background/50 border border-white/5 rounded-lg aspect-video flex items-center justify-center">
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
                            <p className="text-xs text-muted-foreground mt-1">Please try uploading again</p>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/5 to-primary/10">
                          <div className="text-center">
                            <div className="relative">
                              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                            </div>
                            <p className="text-sm font-medium mt-3">
                              {video.status === "queued" ? "Queued for processing..." : "Converting video..."}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              This usually takes about a minute
                            </p>
                            <div className="mt-3 flex items-center justify-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Video info */}
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{video.title || "Untitled"}</p>
                            {video.status !== "ready" && (
                              <Badge 
                                variant={video.status === "failed" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {video.status === "queued" && "Queued"}
                                {video.status === "processing" && "Processing"}
                                {video.status === "failed" && "Failed"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Uploaded by {video.uploader?.name || video.uploader?.username}
                            {video.createdAt && ` • ${format(new Date(video.createdAt), "MMM d, yyyy")}`}
                          </p>
                        </div>
                      </div>
                      {/* Delete button - only for owner */}
                      {user && video.uploaderId === user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVideo(video.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-video-${video.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 justify-items-center mx-auto max-w-md md:max-w-none">
              {filteredRosterMembers.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">No {rosterTab === "all" ? "teammates" : rosterTab} yet</p>
                  <p className="text-sm">Members will appear here once they join the team.</p>
                </div>
              ) : (
                filteredRosterMembers.map((member: TeamMember) => (
                  <Card 
                    key={member.id} 
                    className={`bg-background/40 border-white/10 hover:border-primary/50 transition-all w-full ${member.role === 'athlete' ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (member.role === 'athlete') {
                        setSelectedAthlete(member);
                        setIsAthleteCardFlipped(false);
                        setIsAthleteModalOpen(true);
                      }
                    }}
                    data-testid={`roster-card-${member.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center gap-2">
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                          <AvatarImage src={member.user.avatar || undefined} alt={member.user.name || ""} />
                          <AvatarFallback>{member.user.name?.split(' ').map(n => n[0]).join('') || "A"}</AvatarFallback>
                        </Avatar>
                        <div>
                          {member.role === "coach" ? (
                            <div className="font-bold uppercase text-[10px] bg-primary/20 text-primary px-2 py-1 rounded mb-1">Coach</div>
                          ) : member.role === "staff" ? (
                            <div className="font-bold uppercase text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded mb-1">Staff</div>
                          ) : member.role === "supporter" ? (
                            <div className="font-bold uppercase text-[10px] bg-accent/20 text-accent px-2 py-1 rounded mb-1">Fan</div>
                          ) : (
                            <div className="font-bold text-sm">#{member.jerseyNumber || "00"}</div>
                          )}
                          <p className="text-xs font-bold text-primary truncate max-w-[70px]">{member.user.name || member.user.username}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {member.role === "coach" ? "Head Coach" : member.role === "staff" ? "Staff" : member.role === "supporter" ? "Supporter" : (member.position || "Player")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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
              {play.status && (
                <Badge 
                  className={play.status === "Successful" ? "bg-green-600 text-white" : play.status === "Not Successful" ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}
                >
                  {play.status}
                </Badge>
              )}
            </CardContent>
          </Card>
        );
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold">Playbook</h3>
              <p className="text-sm text-muted-foreground">View team plays ({teamPlays.length} plays)</p>
            </div>
            <Tabs value={playbookTab} onValueChange={(v) => setPlaybookTab(v as "Offense" | "Defense" | "Special")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="Offense" className="gap-2" data-testid="playbook-tab-offense">
                  <span>Offense</span>
                  <Badge className="bg-blue-600 text-white text-xs">{offensePlays.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="Defense" className="gap-2" data-testid="playbook-tab-defense">
                  <span>Defense</span>
                  <Badge className="bg-orange-600 text-white text-xs">{defensePlays.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="Special" className="gap-2" data-testid="playbook-tab-special">
                  <span>Special</span>
                  <Badge className="bg-purple-600 text-white text-xs">{specialPlays.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              {teamPlays.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">No plays yet</p>
                  <p className="text-sm">Your coach will add plays here.</p>
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
                        className={expandedPlay.category === "Offense" ? "bg-blue-600 text-white" : expandedPlay.category === "Defense" ? "bg-orange-600 text-white" : "bg-purple-600 text-white"}
                      >
                        {expandedPlay.category}
                      </Badge>
                    )}
                    {expandedPlay?.status && (
                      <Badge 
                        className={expandedPlay.status === "Successful" ? "bg-green-600 text-white" : expandedPlay.status === "Not Successful" ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <DashboardBackground />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="max-w-full px-4 md:px-8 py-4 flex items-center justify-end gap-3">
          {updateAvailable && (
            <Button
              variant="outline"
              size="icon"
              className="border-amber-500 dark:border-amber-400 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 animate-pulse"
              onClick={applyUpdate}
              data-testid="button-pwa-update"
              title="Update available - click to refresh"
            >
              <AlertCircle className="h-5 w-5" />
            </Button>
          )}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 border border-white/20 rounded-lg hover:bg-white/10 transition"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
          <Link href="/athlete/settings">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="max-w-full px-4 md:px-8 py-8">
          {/* HYPE Card & Quick Navigation Grid */}
          <div ref={hypeCardRef} className="grid grid-cols-[280px_1fr] gap-2 mb-6 items-center">
            {/* HYPE Card - Sports Trading Card Style with Flip */}
            <div className="w-60 space-y-2">
              {/* Share Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                  data-testid="button-share-card"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                
                {/* Share Menu */}
                {showShareMenu && (
                  <div className="absolute mt-10 border border-white/10 rounded-lg p-3 backdrop-blur-sm space-y-2 z-50 bg-[#000000f2]">
                    <div className="text-xs font-semibold text-white mb-2">Share HYPE Card</div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 font-mono"
                        data-testid="input-share-url"
                      />
                      <button
                        onClick={copyShareLink}
                        className="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-xs font-semibold transition"
                        data-testid="button-copy-share"
                      >
                        {copied ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)} style={{ perspective: '1000px' }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div 
                className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isHypeCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s ease-in-out'
                }}
              >
                {/* Card Background */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                
                {/* Front of Card */}
                {!isHypeCardFlipped ? (
                  <div className="relative w-full h-96 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                    {/* Full Image Background */}
                    <img src={user?.avatar || ""} alt={user?.name || ""} className="absolute inset-0 w-full h-full object-contain" />
                    
                    {/* Gradient Overlays for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                    
                    {/* Top Left - Name Overlay */}
                    <div className="absolute top-0 left-0 p-4 text-left">
                      <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{user?.name || user?.username}</h3>
                      <p className="text-[10px] text-white/90 uppercase mt-1 tracking-wider drop-shadow-md font-semibold">{currentTeam?.name || "Team"}</p>
                    </div>

                    {/* Bottom Left - Position */}
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="text-sm font-bold text-accent uppercase tracking-wider drop-shadow-lg">{currentMembership?.position || user?.position || "Player"}</p>
                    </div>

                    {/* Bottom Right - Number */}
                    <div className="absolute bottom-0 right-0 p-4">
                      <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-3 shadow-lg">
                        <span className="text-white font-display font-bold text-2xl drop-shadow">#{currentMembership?.jerseyNumber || user?.number || "00"}</span>
                      </div>
                    </div>

                    {/* Right Center - HYPE Card Text (Vertical) */}
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2">
                      <div className="flex flex-row items-center gap-1 -rotate-90 whitespace-nowrap origin-center">
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                        <div className="w-0.5 h-2 bg-white/60"></div>
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Back of Card - Four Quadrants */
                  (<div className="relative w-full h-96 overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                    <div className="relative w-full h-full p-3 grid grid-cols-2 gap-2">
                      {/* Top Left - Events */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-accent font-bold uppercase tracking-widest mb-2">Events</p>
                        <div className="space-y-1 text-[9px] text-white/70 flex-1 overflow-y-auto">
                          {teamEvents.length === 0 ? (
                              <div className="text-[8px]">No events</div>
                            ) : (
                              teamEvents.slice(0, 2).map((event: Event) => (
                                <div key={event.id} className="line-clamp-2">
                                  <span className="font-semibold text-white">{event.type}</span>
                                  <div className="text-[8px]">{new Date(event.date).toLocaleDateString()}</div>
                                </div>
                              ))
                            )}
                        </div>
                      </div>

                      {/* Top Right - Stats with Bars */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-primary font-bold uppercase tracking-widest mb-2">Stats</p>
                        <div className="space-y-2 flex-1">
                          <div>
                            <div className="flex justify-between items-end gap-1 mb-1">
                              <span className="text-[8px] text-white/70">Goals</span>
                              <span className="text-[9px] font-bold text-primary">0</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{width: "0%"}}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-end gap-1 mb-1">
                              <span className="text-[8px] text-white/70">Assists</span>
                              <span className="text-[9px] font-bold text-accent">0</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{width: "0%"}}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Left - Highlights */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-green-400 font-bold uppercase tracking-widest mb-2">Highlights</p>
                        <div className="space-y-1 text-[9px] text-white/70 flex-1">
                          <div>⚡ Crucial goal</div>
                          <div>✨ MVP award</div>
                          <div>🎯 Key assist</div>
                        </div>
                      </div>

                      {/* Bottom Right - Shoutouts */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-widest mb-2">Shoutouts</p>
                        <div className="text-[8px] text-white/70 italic flex-1">
                          <p className="line-clamp-3">"Excellent form lately!"</p>
                          <p className="text-[7px] mt-1 text-white/50">— Coach</p>
                        </div>
                      </div>
                    </div>
                  </div>)
                )}
              </div>
            </div>
            
            {/* Tap to Flip Bar */}
            <button
              onClick={() => setIsHypeCardFlipped(!isHypeCardFlipped)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
              data-testid="button-tap-to-flip"
            >
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
            </button>
            </div>

            {/* Quick Navigation - Icons Only */}
            <div className="w-full h-60">
              <div className="grid grid-cols-2 gap-2 h-full pl-[0px] pr-[0px] ml-[5px] mr-[5px]">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
                    className={`h-full rounded-lg border transition-all duration-200 backdrop-blur-sm group flex items-center justify-center bg-slate-300/90 dark:bg-transparent border-slate-400 dark:border-white/5 ${
                      selectedCard === action.id
                        ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/20"
                        : `dark:bg-gradient-to-br ${action.color} hover:border-slate-500 dark:hover:border-white/20 hover:bg-slate-400/50 dark:hover:bg-white/5`
                    }`}
                  >
                    <div className="p-3 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                      <action.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HYPE Card Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-24" onClick={() => setIsModalOpen(false)}>
              <div className="relative w-80" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-white/70 transition"
                  data-testid="button-close-modal"
                >
                  <X className="h-8 w-8" />
                </button>

                {/* Enlarged Card */}
                <div className="w-full space-y-4">
                  <div className="relative group" style={{ perspective: '1000px' }}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                    <div 
                      className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isModalCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.6s ease-in-out',
                        aspectRatio: '9/16'
                      }}
                    >
                      {/* Card Background */}
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                      
                      {/* Front of Card */}
                      {!isModalCardFlipped ? (
                        <div className="relative w-full h-full overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                          {/* Full Image Background */}
                          <img src={user?.avatar || ""} alt={user?.name || ""} className="absolute inset-0 w-full h-full object-contain" />
                          
                          {/* Gradient Overlays for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                          
                          {/* Top Left - Name Overlay */}
                          <div className="absolute top-0 left-0 p-6 text-left">
                            <h3 className="text-4xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{user?.name || user?.username}</h3>
                            <p className="text-sm text-white/90 uppercase mt-2 tracking-wider drop-shadow-md font-semibold">{currentTeam?.name || "Team"}</p>
                          </div>

                          {/* Bottom Left - Position */}
                          <div className="absolute bottom-0 left-0 p-6">
                            <p className="text-lg font-bold text-accent uppercase tracking-wider drop-shadow-lg">{currentMembership?.position || user?.position || "Player"}</p>
                          </div>

                          {/* Bottom Right - Number */}
                          <div className="absolute bottom-0 right-0 p-6">
                            <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-4 shadow-lg">
                              <span className="text-white font-display font-bold text-4xl drop-shadow">#{currentMembership?.jerseyNumber || user?.number || "00"}</span>
                            </div>
                          </div>

                          {/* Right Center - HYPE Card Text (Vertical) */}
                          <div className="absolute right-1 top-1/2 -translate-y-1/2">
                            <div className="flex flex-row items-center gap-2 -rotate-90 whitespace-nowrap origin-center">
                              <span className="text-sm text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                              <div className="w-1 h-3 bg-white/60"></div>
                              <span className="text-sm text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Back of Card - Four Quadrants */
                        (<div className="relative w-full h-full overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                          <div className="relative w-full h-full p-6 grid grid-cols-2 gap-3">
                            {/* Top Left - Events */}
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

                            {/* Top Right - Stats with Bars */}
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

                            {/* Bottom Left - Highlights */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                              <p className="text-sm text-green-400 font-bold uppercase tracking-widest mb-3">Highlights</p>
                              <div className="space-y-2 text-sm text-white/70 flex-1">
                                <div>⚡ Crucial goal</div>
                                <div>✨ MVP award</div>
                                <div>🎯 Key assist</div>
                              </div>
                            </div>

                            {/* Bottom Right - Shoutouts */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                              <p className="text-sm text-orange-400 font-bold uppercase tracking-widest mb-3">Shoutouts</p>
                              <div className="text-sm text-white/70 italic flex-1">
                                <p className="line-clamp-4">"Excellent form lately!"</p>
                                <p className="text-xs mt-2 text-white/50">— Coach</p>
                              </div>
                            </div>
                          </div>
                        </div>)
                      )}
                    </div>
                  </div>

                  {/* Tap to Flip Bar */}
                  <button
                    onClick={() => setIsModalCardFlipped(!isModalCardFlipped)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
                    data-testid="button-modal-tap-to-flip"
                  >
                    <p className="text-sm text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Athlete HYPE Card Modal */}
          {isAthleteModalOpen && selectedAthlete && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-24" onClick={() => setIsAthleteModalOpen(false)}>
              <div className="relative w-80" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsAthleteModalOpen(false)}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-white/70 transition"
                  data-testid="button-close-athlete-modal"
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
                    data-testid="button-athlete-tap-to-flip"
                  >
                    <p className="text-sm text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Content Container */}
          {selectedCard && (
            <div ref={contentRef} className="relative rounded-xl overflow-hidden bg-card/50 border border-white/10 backdrop-blur-sm p-6 animate-in slide-in-from-top duration-300 mb-6">
              <button
                onClick={() => {
                  setSelectedCard(null);
                  setTimeout(() => {
                    if (hypeCardRef.current) {
                      hypeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

          {/* Stats Overview Dropdown */}
          <div className="mb-6 space-y-4">
            <Select value={selectedStat || ""} onValueChange={(value) => setSelectedStat(value || null)}>
              <SelectTrigger className="w-full max-w-md" data-testid="stats-overview-dropdown">
                <SelectValue placeholder="View your stats..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="goals">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>Goals</span>
                  </div>
                </SelectItem>
                <SelectItem value="assists">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Assists</span>
                  </div>
                </SelectItem>
                <SelectItem value="appearances">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    <span>Appearances</span>
                  </div>
                </SelectItem>
                <SelectItem value="rating">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>Rating</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {selectedStat === "goals" && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Goals</CardTitle>
                  <Trophy className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">This season</p>
                </CardContent>
              </Card>
            )}
            
            {selectedStat === "assists" && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assists</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">Team contribution</p>
                </CardContent>
              </Card>
            )}
            
            {selectedStat === "appearances" && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearances</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">Games played</p>
                </CardContent>
              </Card>
            )}
            
            {selectedStat === "rating" && (
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rating</CardTitle>
                  <Trophy className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold text-accent">8.5</div>
                  <p className="text-xs text-muted-foreground mt-1">Average</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Next Match */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Next Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {nextEvent ? (
                    <>
                      <div className="p-4 bg-primary/20 border border-primary/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">{nextEvent.type}</p>
                        <p className="text-lg font-bold text-foreground">{nextEvent.title}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(nextEvent.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{nextEvent.location || "TBD"}</span>
                        </div>
                      </div>
                      <Button className="w-full" size="sm">Add to Calendar</Button>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming events</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Training Goals */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Goals This Week</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Speed & Agility</span>
                      <span className="font-bold">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Shooting Accuracy</span>
                      <span className="font-bold">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Passing Precision</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Overview */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background/50 border border-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase mb-2">This Week</p>
                      <p className="text-2xl font-display font-bold">2 Games</p>
                      <p className="text-xs text-green-400 mt-1">Played full 90 min</p>
                    </div>
                    <div className="p-4 bg-background/50 border border-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase mb-2">Last Match</p>
                      <p className="text-2xl font-display font-bold text-accent">7.8</p>
                      <p className="text-xs text-muted-foreground mt-1">Player rating</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold uppercase text-sm tracking-wide">Recent Achievements</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div>
                          <p className="text-sm font-medium">Man of the Match</p>
                          <p className="text-xs text-muted-foreground">Oct 18 vs Eagles</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div>
                          <p className="text-sm font-medium">5-Game Streak</p>
                          <p className="text-xs text-muted-foreground">Consecutive starts</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div>
                          <p className="text-sm font-medium">Top Scorer</p>
                          <p className="text-xs text-muted-foreground">12 goals this season</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coach Messages */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Coach Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-200 mb-3">
                      "Great performance last match! Work on your positioning in the box. See you at practice."
                    </p>
                    <p className="text-xs text-muted-foreground">Coach Carter • 2 hours ago</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
