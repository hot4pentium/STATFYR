import { useState, useEffect } from "react";
import { startOfDay, parse, isValid } from "date-fns";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Play, Pause, RotateCcw, Users, Timer, Target, 
  Plus, Minus, Check, X, ChevronUp, ChevronDown, Activity,
  Settings, User, Trophy, Edit2, Undo2, Clock, Save, Sliders
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/userContext";
import { useToast } from "@/hooks/use-toast";
import {
  getTeamGames, getGame, createGame, updateGame, getGameByEvent,
  getTeamStatConfigs, createStatConfig, updateStatConfig,
  getGameStats, recordGameStat, deleteGameStat,
  getGameRoster, addToGameRoster, updateGameRoster, bulkCreateGameRoster,
  getTeamEvents, getTeamMembers, updateTeamMember, getStartingLineup,
  type Game, type StatConfig, type GameStat, type GameRoster, type Event, type TeamMember
} from "@/lib/api";
import { SPORT_STATS, SPORT_POSITIONS } from "@/lib/sportConstants";

type ViewMode = "setup" | "roster" | "tracking" | "summary" | "settings";

export default function StatTrackerPage() {
  const { user, currentTeam: selectedTeam } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/stattracker/:gameId");

  const [viewMode, setViewMode] = useState<ViewMode>("setup");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [trackingMode, setTrackingMode] = useState<"individual" | "team">("individual");
  const [totalPeriods, setTotalPeriods] = useState(4);
  const [periodType, setPeriodType] = useState("quarter");
  const [opponentName, setOpponentName] = useState("");
  const [currentGameId, setCurrentGameId] = useState<string | null>(params?.gameId || null);
  const [showScoreEdit, setShowScoreEdit] = useState(false);
  const [tempTeamScore, setTempTeamScore] = useState(0);
  const [tempOpponentScore, setTempOpponentScore] = useState(0);
  const [editingStatConfig, setEditingStatConfig] = useState<StatConfig | null>(null);
  const [editingAthlete, setEditingAthlete] = useState<TeamMember | null>(null);
  const [athletePosition, setAthletePosition] = useState("");
  const [settingsTab, setSettingsTab] = useState<"stats" | "athletes">("stats");
  const [selectedStat, setSelectedStat] = useState<StatConfig | null>(null);
  const [isInitializingStats, setIsInitializingStats] = useState(false);
  const [recordedPlayerId, setRecordedPlayerId] = useState<string | null>(null);
  const [showEndGameConfirm, setShowEndGameConfirm] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["team-events", selectedTeam?.id],
    queryFn: () => selectedTeam ? getTeamEvents(selectedTeam.id) : [],
    enabled: !!selectedTeam
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members", selectedTeam?.id],
    queryFn: () => selectedTeam ? getTeamMembers(selectedTeam.id) : [],
    enabled: !!selectedTeam
  });

  const { data: statConfigs = [] } = useQuery({
    queryKey: ["stat-configs", selectedTeam?.id],
    queryFn: () => selectedTeam ? getTeamStatConfigs(selectedTeam.id) : [],
    enabled: !!selectedTeam
  });

  const { data: currentGame } = useQuery({
    queryKey: ["game", currentGameId],
    queryFn: () => currentGameId ? getGame(currentGameId) : null,
    enabled: !!currentGameId
  });

  const { data: gameRoster = [] } = useQuery({
    queryKey: ["game-roster", currentGameId],
    queryFn: () => currentGameId ? getGameRoster(currentGameId) : [],
    enabled: !!currentGameId
  });

  const { data: gameStats = [] } = useQuery({
    queryKey: ["game-stats", currentGameId],
    queryFn: () => currentGameId ? getGameStats(currentGameId) : [],
    enabled: !!currentGameId
  });

  const gameEvents = events.filter(e => e.type?.toLowerCase() === "game");
  const today = startOfDay(new Date());
  
  const parseEventDate = (dateStr: string): Date => {
    let parsed = new Date(dateStr);
    if (!isValid(parsed)) {
      parsed = parse(dateStr, "yyyy-MM-dd hh:mm a", new Date());
    }
    if (!isValid(parsed)) {
      parsed = parse(dateStr, "yyyy-MM-dd HH:mm:ss", new Date());
    }
    return parsed;
  };
  
  const upcomingGames = gameEvents.filter(e => {
    const eventDate = parseEventDate(e.date);
    return isValid(eventDate) && startOfDay(eventDate) >= today;
  });

  useEffect(() => {
    if (currentGame) {
      if (currentGame.trackingMode) {
        setTrackingMode(currentGame.trackingMode as "individual" | "team");
      }
      if (currentGame.periodType) {
        setPeriodType(currentGame.periodType);
      }
      if (currentGame.status === "completed") {
        setViewMode("summary");
      } else if (currentGame.status === "active" || currentGame.status === "paused") {
        setViewMode("tracking");
      }
    }
  }, [currentGame, gameRoster]);

  const createGameMutation = useMutation({
    mutationFn: () => {
      if (!selectedTeam || !user) throw new Error("No team or user");
      return createGame(selectedTeam.id, user.id, {
        eventId: selectedEventId && selectedEventId !== "none" ? selectedEventId : undefined,
        trackingMode,
        totalPeriods,
        periodType,
        opponentName: opponentName || undefined
      });
    },
    onSuccess: async (game) => {
      setCurrentGameId(game.id);
      if (trackingMode === "team") {
        await updateGame(game.id, user!.id, { status: "active", startedAt: new Date().toISOString() });
        queryClient.invalidateQueries({ queryKey: ["game", game.id] });
        setViewMode("tracking");
        toast({ title: "Game started", description: "Recording team stats" });
      } else {
        await bulkCreateGameRoster(game.id, user!.id);
        
        if (selectedEventId && selectedEventId !== "none") {
          try {
            const lineup = await getStartingLineup(selectedEventId);
            if (lineup && lineup.players && lineup.players.length > 0) {
              const starterUserIds = lineup.players.filter(p => p.isStarter).map(p => p.teamMember?.userId).filter(Boolean);
              const benchUserIds = lineup.players.filter(p => !p.isStarter).map(p => p.teamMember?.userId).filter(Boolean);
              
              const updatedRoster = await getGameRoster(game.id);
              for (const rosterEntry of updatedRoster) {
                const isStarter = starterUserIds.includes(rosterEntry.athleteId);
                const isBench = benchUserIds.includes(rosterEntry.athleteId);
                if (isStarter || isBench) {
                  await updateGameRoster(rosterEntry.id, user!.id, { isInGame: isStarter });
                }
              }
              
              queryClient.invalidateQueries({ queryKey: ["game-roster", game.id] });
              toast({ title: "Game created", description: "Lineup loaded from pre-game settings" });
            } else {
              toast({ title: "Game created", description: "Set up your game roster" });
            }
          } catch {
            toast({ title: "Game created", description: "Set up your game roster" });
          }
        } else {
          toast({ title: "Game created", description: "Set up your game roster" });
        }
        
        queryClient.invalidateQueries({ queryKey: ["game-roster", game.id] });
        setViewMode("roster");
      }
    },
    onError: () => toast({ title: "Error", description: "Failed to create game", variant: "destructive" })
  });

  const updateGameMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateGame>[2]) => {
      if (!currentGameId || !user) throw new Error("No game or user");
      return updateGame(currentGameId, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", currentGameId] });
      queryClient.invalidateQueries({ queryKey: ["game-stats", currentGameId] });
      queryClient.invalidateQueries({ queryKey: ["game-roster", currentGameId] });
    }
  });

  const updateRosterMutation = useMutation({
    mutationFn: ({ rosterId, data }: { rosterId: string; data: Parameters<typeof updateGameRoster>[2] }) => {
      if (!user) throw new Error("No user");
      return updateGameRoster(rosterId, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-roster", currentGameId] });
    }
  });

  const recordStatMutation = useMutation({
    mutationFn: (data: { statConfigId: string; athleteId?: string; pointsValue: number }) => {
      if (!currentGameId || !user || !currentGame) throw new Error("Missing data");
      return recordGameStat(currentGameId, user.id, {
        ...data,
        period: currentGame.currentPeriod,
        value: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-stats", currentGameId] });
      queryClient.invalidateQueries({ queryKey: ["game", currentGameId] });
    }
  });

  const deleteStatMutation = useMutation({
    mutationFn: (statId: string) => {
      if (!user) throw new Error("No user");
      return deleteGameStat(statId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-stats", currentGameId] });
      queryClient.invalidateQueries({ queryKey: ["game", currentGameId] });
    }
  });

  const updateStatConfigMutation = useMutation({
    mutationFn: ({ configId, positions }: { configId: string; positions: string[] }) => {
      if (!user) throw new Error("No user");
      return updateStatConfig(configId, user.id, { positions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stat-configs", selectedTeam?.id] });
      setEditingStatConfig(null);
      toast({ title: "Stat updated", description: "Position assignments saved" });
    }
  });

  const updateAthleteMutation = useMutation({
    mutationFn: ({ memberId, position }: { memberId: string; position: string }) => {
      if (!user || !selectedTeam) throw new Error("No user or team");
      return updateTeamMember(selectedTeam.id, memberId, user.id, { position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", selectedTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ["game-roster", currentGameId] });
      setEditingAthlete(null);
      setAthletePosition("");
      toast({ title: "Athlete updated", description: "Position saved. Changes will apply to new games." });
    }
  });

  const initStatConfigs = async () => {
    if (!selectedTeam || !user || statConfigs.length > 0 || isInitializingStats) return;
    setIsInitializingStats(true);
    try {
      const sport = selectedTeam.sport || "Basketball";
      const sportStats = SPORT_STATS[sport] || SPORT_STATS.Basketball;
      
      let order = 0;
      for (const category of sportStats) {
        for (const stat of category.stats) {
          await createStatConfig(selectedTeam.id, user.id, {
            name: stat.name,
            shortName: stat.shortName,
            value: stat.value,
            positions: stat.positions,
            category: category.category,
            displayOrder: order++
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["stat-configs", selectedTeam?.id] });
      toast({ title: "Stats configured", description: `${sport} stats have been set up` });
    } finally {
      setIsInitializingStats(false);
    }
  };

  const goToTracking = () => {
    setViewMode("tracking");
  };

  const toggleGamePause = () => {
    if (!currentGame) return;
    if (currentGame.status === "active") {
      updateGameMutation.mutate({ status: "paused" });
    } else if (!currentGame.startedAt || currentGame.status === "setup") {
      updateGameMutation.mutate({ 
        status: "active", 
        startedAt: new Date().toISOString() 
      });
    } else {
      updateGameMutation.mutate({ status: "active" });
    }
  };

  const confirmEndGame = () => {
    updateGameMutation.mutate({ 
      status: "completed", 
      endedAt: new Date().toISOString() 
    });
    setShowEndGameConfirm(false);
    setViewMode("summary");
  };

  const nextPeriod = () => {
    if (!currentGame) return;
    if (currentGame.currentPeriod < currentGame.totalPeriods) {
      updateGameMutation.mutate({ currentPeriod: currentGame.currentPeriod + 1 });
    }
  };

  const handleRecordStat = (config: StatConfig, player?: GameRoster) => {
    if (trackingMode === "team") {
      recordStatMutation.mutate({ 
        statConfigId: config.id, 
        pointsValue: config.value 
      });
      setSelectedStat(null);
    } else if (player) {
      recordStatMutation.mutate({ 
        statConfigId: config.id, 
        athleteId: player.athleteId,
        pointsValue: config.value 
      });
      setRecordedPlayerId(player.athleteId);
      setTimeout(() => setRecordedPlayerId(null), 800);
      setSelectedStat(null);
    }
  };

  const handleStatClick = (config: StatConfig) => {
    if (trackingMode === "team") {
      handleRecordStat(config);
    } else {
      setSelectedStat(config);
    }
  };

  const handlePlayerClick = (player: GameRoster) => {
    if (selectedStat) {
      handleRecordStat(selectedStat, player);
    }
  };

  const athleteRoster = gameRoster.filter(r => r.athlete?.role === "athlete");
  const sortedInGamePlayers = [...athleteRoster.filter(r => r.isInGame)].sort((a, b) => 
    (a.athlete.firstName || "").localeCompare(b.athlete.firstName || "")
  );

  const inGamePlayers = athleteRoster.filter(r => r.isInGame);
  const benchPlayers = athleteRoster.filter(r => !r.isInGame);
  const activeStats = statConfigs.filter(c => c.isActive);

  const getFilteredPlayersForStat = (stat: StatConfig | null) => {
    if (!stat || !stat.positions || stat.positions.length === 0) {
      return sortedInGamePlayers;
    }
    return sortedInGamePlayers.filter(player => {
      const playerPositions = player.positions || [];
      if (playerPositions.length === 0) return true;
      return stat.positions!.some(p => playerPositions.includes(p));
    });
  };

  const filteredPlayers = getFilteredPlayersForStat(selectedStat);

  const getPlayerStats = (athleteId: string) => {
    return gameStats.filter(s => s.athleteId === athleteId && !s.isDeleted);
  };

  const getTeamTotalStats = () => {
    const totals: Record<string, number> = {};
    gameStats.filter(s => !s.isDeleted).forEach(stat => {
      const key = stat.statConfigId;
      totals[key] = (totals[key] || 0) + stat.value;
    });
    return totals;
  };

  if (!user || !selectedTeam) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please select a team first</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tight">
              StatTracker
            </h1>
            <p className="text-muted-foreground text-sm">
              {viewMode === "setup" && "Set up a new game"}
              {viewMode === "roster" && "Manage game roster"}
              {viewMode === "tracking" && "Live game tracking"}
              {viewMode === "summary" && "Game summary"}
              {viewMode === "settings" && "Configure stats & positions"}
            </p>
          </div>
          {viewMode === "setup" && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setViewMode("settings")}
              data-testid="button-settings"
            >
              <Sliders className="h-5 w-5" />
            </Button>
          )}
          {currentGame && viewMode !== "setup" && viewMode !== "settings" && (
            <Badge variant={currentGame.status === "active" ? "default" : "secondary"} data-testid="badge-game-status">
              {currentGame.status}
            </Badge>
          )}
        </div>

        {viewMode === "setup" && (
          <div className="space-y-6">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Game Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Select Game (Optional)</Label>
                  <Select value={selectedEventId} onValueChange={(value) => {
                    setSelectedEventId(value);
                    if (value && value !== "none") {
                      const selectedEvent = events.find(e => e.id === value);
                      if (selectedEvent?.opponent) {
                        setOpponentName(selectedEvent.opponent);
                      }
                    }
                  }}>
                    <SelectTrigger data-testid="select-event">
                      <SelectValue placeholder="Choose a scheduled game or track standalone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Standalone Game (Not on schedule)</SelectItem>
                      {upcomingGames.map(event => {
                        const eventDate = parseEventDate(event.date);
                        const dateStr = isValid(eventDate) ? eventDate.toLocaleDateString() : event.date;
                        return (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {dateStr}
                            {event.opponent && ` vs ${event.opponent}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedEventId && selectedEventId !== "none" && (
                    <p className="text-xs text-green-500">
                      Game linked to schedule event
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Tracking Mode</Label>
                  <RadioGroup value={trackingMode} onValueChange={(v) => setTrackingMode(v as "individual" | "team")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" data-testid="radio-individual" />
                      <Label htmlFor="individual" className="cursor-pointer">
                        <span className="font-medium">Individual Stats</span>
                        <p className="text-xs text-muted-foreground">Track stats per player</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team" id="team" data-testid="radio-team" />
                      <Label htmlFor="team" className="cursor-pointer">
                        <span className="font-medium">Team Stats Only</span>
                        <p className="text-xs text-muted-foreground">Track team totals without player attribution</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Period Type</Label>
                    <Select value={periodType} onValueChange={setPeriodType}>
                      <SelectTrigger data-testid="select-period-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarter">Quarters</SelectItem>
                        <SelectItem value="half">Halves</SelectItem>
                        <SelectItem value="period">Periods</SelectItem>
                        <SelectItem value="inning">Innings</SelectItem>
                        <SelectItem value="set">Sets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of {periodType}s</Label>
                    <Select value={String(totalPeriods)} onValueChange={(v) => setTotalPeriods(Number(v))}>
                      <SelectTrigger data-testid="select-total-periods">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 9].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {statConfigs.length === 0 && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-400 mb-2">
                      No stat configurations found. Click below to set up default stats for {selectedTeam.sport || "Basketball"}.
                    </p>
                    <Button variant="outline" size="sm" onClick={initStatConfigs} disabled={isInitializingStats} data-testid="button-init-stats">
                      {isInitializingStats ? "Initializing..." : `Initialize ${selectedTeam.sport || "Basketball"} Stats`}
                    </Button>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => createGameMutation.mutate()}
                  disabled={createGameMutation.isPending}
                  data-testid="button-create-game"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Create Game
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "roster" && currentGame && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    In Game ({inGamePlayers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {inGamePlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                          data-testid={`roster-in-game-${player.athleteId}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-green-400 w-8">
                              #{player.jerseyNumber || "--"}
                            </span>
                            <div>
                              <p className="font-medium">{player.athlete.firstName} {player.athlete.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                {player.positions?.join(", ") || "No position"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateRosterMutation.mutate({ 
                              rosterId: player.id, 
                              data: { isInGame: false } 
                            })}
                            data-testid={`button-bench-${player.athleteId}`}
                          >
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Bench
                          </Button>
                        </div>
                      ))}
                      {inGamePlayers.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No players in game. Add players from the bench.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    On Bench ({benchPlayers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {benchPlayers.map(player => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-muted/30 border border-white/5 rounded-lg"
                          data-testid={`roster-bench-${player.athleteId}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-muted-foreground w-8">
                              #{player.jerseyNumber || "--"}
                            </span>
                            <div>
                              <p className="font-medium">{player.athlete.firstName} {player.athlete.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                {player.positions?.join(", ") || "No position"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateRosterMutation.mutate({ 
                              rosterId: player.id, 
                              data: { isInGame: true } 
                            })}
                            data-testid={`button-add-to-game-${player.athleteId}`}
                          >
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                      {benchPlayers.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          All players are in the game
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setViewMode("setup")} data-testid="button-back-setup">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Setup
              </Button>
              <Button className="flex-1" size="lg" onClick={goToTracking} data-testid="button-start-game">
                <Play className="h-4 w-4 mr-2" />
                Go to Tracking
              </Button>
            </div>
          </div>
        )}

        {viewMode === "tracking" && currentGame && (
          <div className="space-y-4">
            {/* Scoreboard */}
            <Card className="bg-card border-white/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">{selectedTeam.name}</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateGameMutation.mutate({ teamScore: Math.max(0, currentGame.teamScore - 1) })}
                        data-testid="button-team-score-minus"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <p className="text-3xl font-display font-bold min-w-[3rem]" data-testid="text-team-score">
                        {currentGame.teamScore}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateGameMutation.mutate({ teamScore: currentGame.teamScore + 1 })}
                        data-testid="button-team-score-plus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="px-2 flex flex-col items-center gap-1">
                    <Badge variant="outline" className="text-sm px-2 py-0.5" data-testid="badge-period">
                      {periodType.charAt(0).toUpperCase()}{currentGame.currentPeriod}
                    </Badge>
                  </div>
                  
                  <div className="text-center flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {currentGame.opponentName || "Opponent"}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateGameMutation.mutate({ opponentScore: Math.max(0, currentGame.opponentScore - 1) })}
                        data-testid="button-opponent-score-minus"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <p className="text-3xl font-display font-bold min-w-[3rem]" data-testid="text-opponent-score">
                        {currentGame.opponentScore}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateGameMutation.mutate({ opponentScore: currentGame.opponentScore + 1 })}
                        data-testid="button-opponent-score-plus"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center gap-2 mt-2">
                  <Button
                    variant={currentGame.status === "active" ? "outline" : "default"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={toggleGamePause}
                    data-testid="button-toggle-pause"
                  >
                    {currentGame.status === "active" ? (
                      <><Pause className="h-3 w-3 mr-1" /> Pause</>
                    ) : currentGame.status === "setup" || !currentGame.startedAt ? (
                      <><Play className="h-3 w-3 mr-1" /> Start</>
                    ) : (
                      <><Play className="h-3 w-3 mr-1" /> Resume</>
                    )}
                  </Button>
                  {currentGame.currentPeriod < currentGame.totalPeriods && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={nextPeriod} data-testid="button-next-period">
                      Next {periodType}
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => setShowEndGameConfirm(true)} data-testid="button-end-game">
                    End
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid with inline player selection */}
            <Card className="bg-card border-white/5">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {trackingMode === "team" ? "Record Stats" : "Tap Stat, Then Player"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-2">
                  {(() => {
                    const rows: StatConfig[][] = [];
                    for (let i = 0; i < activeStats.length; i += 2) {
                      rows.push(activeStats.slice(i, i + 2));
                    }
                    const selectedRowIndex = selectedStat 
                      ? rows.findIndex(row => row.some(s => s.id === selectedStat.id))
                      : -1;
                    
                    return rows.map((row, rowIndex) => (
                      <div key={rowIndex}>
                        <div className="grid grid-cols-2 gap-2">
                          {row.map(config => (
                            <Button
                              key={config.id}
                              variant={selectedStat?.id === config.id ? "default" : "outline"}
                              className={`h-14 flex flex-col gap-0.5 ${selectedStat?.id === config.id ? "ring-2 ring-primary" : ""}`}
                              onClick={() => handleStatClick(config)}
                              data-testid={`button-stat-${config.shortName}`}
                            >
                              <span className="text-base font-bold">{config.shortName}</span>
                              <span className="text-[9px] text-muted-foreground leading-tight truncate max-w-full">
                                {config.name}
                              </span>
                              {config.value > 0 && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">
                                  +{config.value}
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </div>
                        {trackingMode === "individual" && selectedRowIndex === rowIndex && selectedStat && (
                          <div className="mt-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-3 w-3 text-primary" />
                              <span className="text-xs text-primary font-medium">
                                Tap player for {selectedStat.shortName}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-6 px-2 text-xs"
                                onClick={() => setSelectedStat(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <ScrollArea className="w-full">
                              <div className="flex gap-2 pb-1">
                                {filteredPlayers.map(player => (
                                  <Button
                                    key={player.id}
                                    variant={recordedPlayerId === player.athleteId ? "default" : "outline"}
                                    size="sm"
                                    className={`flex-shrink-0 h-9 transition-all duration-300 ${
                                      recordedPlayerId === player.athleteId 
                                        ? "bg-green-500 text-white scale-105" 
                                        : "bg-background hover:bg-primary hover:text-primary-foreground"
                                    }`}
                                    onClick={() => handlePlayerClick(player)}
                                    data-testid={`button-player-${player.athleteId}`}
                                  >
                                    {recordedPlayerId === player.athleteId ? (
                                      <Check className="h-4 w-4 animate-pulse" />
                                    ) : (
                                      <>
                                        <span className="font-mono text-xs font-bold">
                                          #{player.jerseyNumber || "--"}
                                        </span>
                                        <span className="ml-1 text-xs">
                                          {player.athlete.firstName}
                                        </span>
                                      </>
                                    )}
                                  </Button>
                                ))}
                                {filteredPlayers.length === 0 && (
                                  <span className="text-xs text-muted-foreground py-2">No eligible players</span>
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-card border-white/5">
              <CardHeader className="pb-2 px-3 pt-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setViewMode("roster")}
                    data-testid="button-manage-roster"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Roster
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ScrollArea className="h-[100px]">
                  <div className="space-y-1">
                    {gameStats
                      .filter(s => !s.isDeleted)
                      .sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime())
                      .slice(0, 5)
                      .map(stat => (
                        <div
                          key={stat.id}
                          className="flex items-center justify-between p-1.5 bg-muted/30 rounded text-sm"
                          data-testid={`stat-entry-${stat.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {stat.statConfig?.shortName || "?"}
                            </Badge>
                            {stat.athlete && (
                              <span className="text-xs">
                                {stat.athlete.firstName} {stat.athlete.lastName?.charAt(0)}.
                              </span>
                            )}
                            {!stat.athlete && trackingMode === "team" && (
                              <span className="text-xs text-muted-foreground">Team</span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => deleteStatMutation.mutate(stat.id)}
                            data-testid={`button-undo-stat-${stat.id}`}
                          >
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    {gameStats.filter(s => !s.isDeleted).length === 0 && (
                      <p className="text-center text-muted-foreground py-2 text-xs">
                        No stats yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === "summary" && currentGame && (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-white/10">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <h2 className="text-xl font-display font-bold uppercase">Final Score</h2>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{selectedTeam.name}</p>
                    <p className="text-5xl font-display font-bold" data-testid="text-final-team-score">
                      {currentGame.teamScore}
                    </p>
                  </div>
                  <span className="text-2xl text-muted-foreground">-</span>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{currentGame.opponentName || "Opponent"}</p>
                    <p className="text-5xl font-display font-bold" data-testid="text-final-opponent-score">
                      {currentGame.opponentScore}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Team Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Object.entries(getTeamTotalStats()).map(([configId, total]) => {
                    const config = statConfigs.find(c => c.id === configId);
                    if (!config) return null;
                    return (
                      <div key={configId} className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold">{total}</p>
                        <p className="text-xs text-muted-foreground">{config.name}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {trackingMode === "individual" && (
              <Card className="bg-card border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Individual Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gameRoster.map(player => {
                      const playerStats = getPlayerStats(player.athleteId);
                      if (playerStats.length === 0) return null;
                      
                      const statTotals: Record<string, number> = {};
                      playerStats.forEach(s => {
                        statTotals[s.statConfigId] = (statTotals[s.statConfigId] || 0) + s.value;
                      });
                      
                      return (
                        <div key={player.id} className="p-4 bg-muted/20 rounded-lg" data-testid={`summary-player-${player.athleteId}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-mono font-bold text-primary">
                              #{player.jerseyNumber || "--"}
                            </span>
                            <span className="font-medium">
                              {player.athlete.firstName} {player.athlete.lastName}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(statTotals).map(([configId, total]) => {
                              const config = statConfigs.find(c => c.id === configId);
                              return (
                                <Badge key={configId} variant="secondary">
                                  {config?.shortName}: {total}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                className="flex-1"
                onClick={() => {
                  setCurrentGameId(null);
                  setViewMode("setup");
                  setSelectedEventId("");
                  setOpponentName("");
                  setSelectedStat(null);
                }}
                data-testid="button-new-game"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
          </div>
        )}

        {viewMode === "settings" && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => setViewMode("setup")}
              className="mb-2"
              data-testid="button-back-setup"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Setup
            </Button>

            <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as "stats" | "athletes")}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="stats" data-testid="tab-stats">
                  <Target className="h-4 w-4 mr-2" />
                  Stat Positions
                </TabsTrigger>
                <TabsTrigger value="athletes" data-testid="tab-athletes">
                  <Users className="h-4 w-4 mr-2" />
                  Athlete Positions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4 mt-4">
                <Card className="bg-card border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Assign Positions to Stats</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Choose which positions can track each stat. Stats with no positions assigned will be available to everyone.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {statConfigs.map(config => (
                        <div 
                          key={config.id} 
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          data-testid={`stat-config-${config.id}`}
                        >
                          <div>
                            <p className="font-medium">{config.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {config.positions && config.positions.length > 0 
                                ? config.positions.join(", ")
                                : "All positions"}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingStatConfig(config)}
                            data-testid={`button-edit-stat-${config.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      ))}
                      {statConfigs.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No stats configured. Start a game to initialize stats.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="athletes" className="space-y-4 mt-4">
                <Card className="bg-card border-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Assign Athlete Positions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Set each athlete's position for stat filtering during games.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {teamMembers
                        .filter(m => m.role === "athlete")
                        .map(member => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                            data-testid={`athlete-member-${member.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-primary">
                                #{member.jerseyNumber || "--"}
                              </span>
                              <div>
                                <p className="font-medium">
                                  {member.user.firstName} {member.user.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {member.position || "No position set"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAthlete(member);
                                setAthletePosition(member.position || "");
                              }}
                              data-testid={`button-edit-athlete-${member.id}`}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        ))}
                      {teamMembers.filter(m => m.role === "athlete").length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No athletes on this team yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Dialog open={!!editingStatConfig} onOpenChange={(open) => !open && setEditingStatConfig(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Stat Positions</DialogTitle>
                </DialogHeader>
                {editingStatConfig && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select which positions can track "{editingStatConfig.name}". Leave all unchecked to allow all positions.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(SPORT_POSITIONS[selectedTeam?.sport || ""] || []).map(pos => (
                        <label 
                          key={pos} 
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                          data-testid={`checkbox-position-${pos}`}
                        >
                          <Checkbox
                            checked={editingStatConfig.positions?.includes(pos) || false}
                            onCheckedChange={(checked) => {
                              const current = editingStatConfig.positions || [];
                              const updated = checked 
                                ? [...current, pos]
                                : current.filter(p => p !== pos);
                              setEditingStatConfig({ ...editingStatConfig, positions: updated });
                            }}
                          />
                          <span className="text-sm">{pos}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setEditingStatConfig(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingStatConfig) {
                        updateStatConfigMutation.mutate({
                          configId: editingStatConfig.id,
                          positions: editingStatConfig.positions || []
                        });
                      }
                    }}
                    disabled={updateStatConfigMutation.isPending}
                    data-testid="button-save-stat-positions"
                  >
                    {updateStatConfigMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={!!editingAthlete} onOpenChange={(open) => !open && setEditingAthlete(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Athlete Position</DialogTitle>
                </DialogHeader>
                {editingAthlete && (
                  <div className="space-y-4">
                    <p className="font-medium">
                      {editingAthlete.user.firstName} {editingAthlete.user.lastName}
                    </p>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select value={athletePosition} onValueChange={setAthletePosition}>
                        <SelectTrigger data-testid="select-athlete-position">
                          <SelectValue placeholder="Select a position" />
                        </SelectTrigger>
                        <SelectContent>
                          {(SPORT_POSITIONS[selectedTeam?.sport || ""] || []).map(pos => (
                            <SelectItem key={pos} value={pos} data-testid={`position-option-${pos}`}>
                              {pos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setEditingAthlete(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingAthlete && athletePosition) {
                        updateAthleteMutation.mutate({
                          memberId: editingAthlete.id,
                          position: athletePosition
                        });
                      }
                    }}
                    disabled={updateAthleteMutation.isPending || !athletePosition}
                    data-testid="button-save-athlete-position"
                  >
                    {updateAthleteMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* End Game Confirmation Dialog */}
      <AlertDialog open={showEndGameConfirm} onOpenChange={setShowEndGameConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Game?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this game? The final score will be {currentGame?.teamScore || 0} - {currentGame?.opponentScore || 0}. 
              You won't be able to record more stats after ending.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-end-game">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmEndGame}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-end-game"
            >
              End Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
