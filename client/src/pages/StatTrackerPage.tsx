import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowLeft, Play, Pause, RotateCcw, Users, Timer, Target, 
  Plus, Minus, Check, X, ChevronUp, ChevronDown, Activity,
  Settings, User, Trophy, Edit2, Undo2, Clock, Save
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/userContext";
import { useToast } from "@/hooks/use-toast";
import {
  getTeamGames, getGame, createGame, updateGame, getGameByEvent,
  getTeamStatConfigs, createStatConfig,
  getGameStats, recordGameStat, deleteGameStat,
  getGameRoster, addToGameRoster, updateGameRoster, bulkCreateGameRoster,
  getTeamEvents, getTeamMembers,
  type Game, type StatConfig, type GameStat, type GameRoster, type Event, type TeamMember
} from "@/lib/api";

const SPORT_STATS: Record<string, { category: string; stats: { name: string; shortName: string; value: number; positions?: string[] }[] }[]> = {
  Baseball: [
    { category: "Batting", stats: [
      { name: "At Bat", shortName: "AB", value: 0 },
      { name: "Hit", shortName: "H", value: 0 },
      { name: "Single", shortName: "1B", value: 0 },
      { name: "Double", shortName: "2B", value: 0 },
      { name: "Triple", shortName: "3B", value: 0 },
      { name: "Home Run", shortName: "HR", value: 1 },
      { name: "RBI", shortName: "RBI", value: 0 },
      { name: "Walk", shortName: "BB", value: 0 },
      { name: "Strikeout", shortName: "K", value: 0 },
    ]},
    { category: "Pitching", stats: [
      { name: "Strikeout", shortName: "K", value: 0, positions: ["Pitcher"] },
      { name: "Walk Allowed", shortName: "BB", value: 0, positions: ["Pitcher"] },
      { name: "Hit Allowed", shortName: "HA", value: 0, positions: ["Pitcher"] },
      { name: "Earned Run", shortName: "ER", value: 0, positions: ["Pitcher"] },
    ]},
    { category: "Fielding", stats: [
      { name: "Putout", shortName: "PO", value: 0 },
      { name: "Assist", shortName: "A", value: 0 },
      { name: "Error", shortName: "E", value: 0 },
    ]}
  ],
  Basketball: [
    { category: "Scoring", stats: [
      { name: "Free Throw", shortName: "FT", value: 1 },
      { name: "2-Point", shortName: "2PT", value: 2 },
      { name: "3-Point", shortName: "3PT", value: 3 },
    ]},
    { category: "Other", stats: [
      { name: "Rebound", shortName: "REB", value: 0 },
      { name: "Assist", shortName: "AST", value: 0 },
      { name: "Steal", shortName: "STL", value: 0 },
      { name: "Block", shortName: "BLK", value: 0 },
      { name: "Turnover", shortName: "TO", value: 0 },
      { name: "Foul", shortName: "PF", value: 0 },
    ]}
  ],
  Football: [
    { category: "Offense", stats: [
      { name: "Touchdown", shortName: "TD", value: 6 },
      { name: "Extra Point", shortName: "XP", value: 1 },
      { name: "2-Point Conv", shortName: "2PC", value: 2 },
      { name: "Field Goal", shortName: "FG", value: 3 },
      { name: "Safety", shortName: "SAF", value: 2 },
    ]},
    { category: "Passing", stats: [
      { name: "Completion", shortName: "CMP", value: 0, positions: ["Quarterback"] },
      { name: "Incompletion", shortName: "INC", value: 0, positions: ["Quarterback"] },
      { name: "Pass TD", shortName: "PTD", value: 6, positions: ["Quarterback"] },
      { name: "Interception", shortName: "INT", value: 0, positions: ["Quarterback"] },
    ]},
    { category: "Rushing", stats: [
      { name: "Carry", shortName: "CAR", value: 0 },
      { name: "Rush TD", shortName: "RTD", value: 6 },
    ]},
    { category: "Defense", stats: [
      { name: "Tackle", shortName: "TKL", value: 0 },
      { name: "Sack", shortName: "SCK", value: 0 },
      { name: "INT", shortName: "INT", value: 0 },
      { name: "Fumble Recovery", shortName: "FR", value: 0 },
    ]}
  ],
  Soccer: [
    { category: "Offense", stats: [
      { name: "Goal", shortName: "G", value: 1 },
      { name: "Assist", shortName: "A", value: 0 },
      { name: "Shot", shortName: "SH", value: 0 },
      { name: "Shot on Target", shortName: "SOT", value: 0 },
    ]},
    { category: "Defense", stats: [
      { name: "Save", shortName: "SV", value: 0, positions: ["Goalkeeper"] },
      { name: "Tackle", shortName: "TKL", value: 0 },
      { name: "Interception", shortName: "INT", value: 0 },
      { name: "Clearance", shortName: "CLR", value: 0 },
    ]},
    { category: "Discipline", stats: [
      { name: "Yellow Card", shortName: "YC", value: 0 },
      { name: "Red Card", shortName: "RC", value: 0 },
      { name: "Foul", shortName: "FL", value: 0 },
    ]}
  ],
  Volleyball: [
    { category: "Offense", stats: [
      { name: "Kill", shortName: "K", value: 1 },
      { name: "Assist", shortName: "A", value: 0 },
      { name: "Ace", shortName: "ACE", value: 1 },
    ]},
    { category: "Defense", stats: [
      { name: "Dig", shortName: "DIG", value: 0 },
      { name: "Block", shortName: "BLK", value: 1 },
    ]},
    { category: "Errors", stats: [
      { name: "Attack Error", shortName: "AE", value: 0 },
      { name: "Service Error", shortName: "SE", value: 0 },
      { name: "Ball Handling Error", shortName: "BHE", value: 0 },
    ]}
  ]
};

type ViewMode = "setup" | "roster" | "tracking" | "summary";

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
  const [selectedPlayer, setSelectedPlayer] = useState<GameRoster | null>(null);
  const [showScoreEdit, setShowScoreEdit] = useState(false);
  const [tempTeamScore, setTempTeamScore] = useState(0);
  const [tempOpponentScore, setTempOpponentScore] = useState(0);

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

  const gameEvents = events.filter(e => e.type === "game");
  const upcomingGames = gameEvents.filter(e => new Date(e.date) >= new Date());

  useEffect(() => {
    if (currentGame) {
      if (currentGame.status === "completed") {
        setViewMode("summary");
      } else if (currentGame.status === "active" || currentGame.status === "paused") {
        setViewMode("tracking");
      } else if (gameRoster.length > 0) {
        setViewMode("roster");
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
      await bulkCreateGameRoster(game.id, user!.id);
      queryClient.invalidateQueries({ queryKey: ["game-roster", game.id] });
      setViewMode("roster");
      toast({ title: "Game created", description: "Set up your game roster" });
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

  const initStatConfigs = async () => {
    if (!selectedTeam || !user || statConfigs.length > 0) return;
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
  };

  const startGame = () => {
    updateGameMutation.mutate({ 
      status: "active", 
      startedAt: new Date().toISOString() 
    });
    setViewMode("tracking");
  };

  const toggleGamePause = () => {
    if (!currentGame) return;
    updateGameMutation.mutate({ 
      status: currentGame.status === "active" ? "paused" : "active" 
    });
  };

  const endGame = () => {
    updateGameMutation.mutate({ 
      status: "completed", 
      endedAt: new Date().toISOString() 
    });
    setViewMode("summary");
  };

  const nextPeriod = () => {
    if (!currentGame) return;
    if (currentGame.currentPeriod < currentGame.totalPeriods) {
      updateGameMutation.mutate({ currentPeriod: currentGame.currentPeriod + 1 });
    }
  };

  const handleRecordStat = (config: StatConfig) => {
    if (trackingMode === "team") {
      recordStatMutation.mutate({ 
        statConfigId: config.id, 
        pointsValue: config.value 
      });
    } else if (selectedPlayer) {
      recordStatMutation.mutate({ 
        statConfigId: config.id, 
        athleteId: selectedPlayer.athleteId,
        pointsValue: config.value 
      });
    } else {
      toast({ title: "Select a player", description: "Choose a player to record this stat", variant: "destructive" });
    }
  };

  const inGamePlayers = gameRoster.filter(r => r.isInGame);
  const benchPlayers = gameRoster.filter(r => !r.isInGame);
  const activeStats = statConfigs.filter(c => c.isActive);

  const getFilteredStats = () => {
    if (!selectedPlayer || trackingMode === "team") return activeStats;
    const playerPositions = selectedPlayer.positions || [];
    return activeStats.filter(config => {
      if (!config.positions || config.positions.length === 0) return true;
      return config.positions.some(p => playerPositions.includes(p));
    });
  };

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
            </p>
          </div>
          {currentGame && viewMode !== "setup" && (
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
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger data-testid="select-event">
                      <SelectValue placeholder="Choose a scheduled game or track standalone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Standalone Game (Not on schedule)</SelectItem>
                      {upcomingGames.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {new Date(event.date).toLocaleDateString()}
                          {event.opponent && ` vs ${event.opponent}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Opponent Name</Label>
                  <Input
                    placeholder="Enter opponent team name"
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    data-testid="input-opponent"
                  />
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
                    <Button variant="outline" size="sm" onClick={initStatConfigs} data-testid="button-init-stats">
                      Initialize {selectedTeam.sport || "Basketball"} Stats
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
              <Button className="flex-1" size="lg" onClick={startGame} data-testid="button-start-game">
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </Button>
            </div>
          </div>
        )}

        {viewMode === "tracking" && currentGame && (
          <div className="space-y-4">
            <Card className="bg-card border-white/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground uppercase">{selectedTeam.name}</p>
                    <p className="text-4xl font-display font-bold" data-testid="text-team-score">
                      {currentGame.teamScore}
                    </p>
                  </div>
                  
                  <div className="px-4">
                    <Dialog open={showScoreEdit} onOpenChange={setShowScoreEdit}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setTempTeamScore(currentGame.teamScore);
                          setTempOpponentScore(currentGame.opponentScore);
                        }} data-testid="button-edit-score">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Score</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <Label>{selectedTeam.name}</Label>
                            <Input
                              type="number"
                              value={tempTeamScore}
                              onChange={(e) => setTempTeamScore(Number(e.target.value))}
                              data-testid="input-edit-team-score"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{currentGame.opponentName || "Opponent"}</Label>
                            <Input
                              type="number"
                              value={tempOpponentScore}
                              onChange={(e) => setTempOpponentScore(Number(e.target.value))}
                              data-testid="input-edit-opponent-score"
                            />
                          </div>
                        </div>
                        <Button onClick={() => {
                          updateGameMutation.mutate({ 
                            teamScore: tempTeamScore, 
                            opponentScore: tempOpponentScore 
                          });
                          setShowScoreEdit(false);
                        }} data-testid="button-save-score">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </DialogContent>
                    </Dialog>
                    
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-3 py-1" data-testid="badge-period">
                        {periodType.charAt(0).toUpperCase() + periodType.slice(1)} {currentGame.currentPeriod}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground uppercase">
                      {currentGame.opponentName || "Opponent"}
                    </p>
                    <p className="text-4xl font-display font-bold" data-testid="text-opponent-score">
                      {currentGame.opponentScore}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant={currentGame.status === "active" ? "outline" : "default"}
                    size="sm"
                    onClick={toggleGamePause}
                    data-testid="button-toggle-pause"
                  >
                    {currentGame.status === "active" ? (
                      <><Pause className="h-4 w-4 mr-1" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4 mr-1" /> Resume</>
                    )}
                  </Button>
                  {currentGame.currentPeriod < currentGame.totalPeriods && (
                    <Button variant="outline" size="sm" onClick={nextPeriod} data-testid="button-next-period">
                      Next {periodType}
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={endGame} data-testid="button-end-game">
                    End Game
                  </Button>
                </div>
              </CardContent>
            </Card>

            {trackingMode === "individual" && (
              <Card className="bg-card border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Select Player
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {inGamePlayers.map(player => (
                        <Button
                          key={player.id}
                          variant={selectedPlayer?.id === player.id ? "default" : "outline"}
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => setSelectedPlayer(player)}
                          data-testid={`button-select-player-${player.athleteId}`}
                        >
                          #{player.jerseyNumber || "--"} {player.athlete.firstName}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                  {selectedPlayer && (
                    <p className="text-sm text-primary mt-2">
                      Recording for: {selectedPlayer.athlete.firstName} {selectedPlayer.athlete.lastName}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Record Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(
                  getFilteredStats().reduce((acc, config) => {
                    const cat = config.category || "Other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(config);
                    return acc;
                  }, {} as Record<string, StatConfig[]>)
                ).map(([category, configs]) => (
                  <div key={category} className="mb-4">
                    <p className="text-xs text-muted-foreground uppercase mb-2">{category}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {configs.map(config => (
                        <Button
                          key={config.id}
                          variant="outline"
                          className="h-16 flex flex-col gap-1"
                          onClick={() => handleRecordStat(config)}
                          disabled={trackingMode === "individual" && !selectedPlayer}
                          data-testid={`button-stat-${config.shortName}`}
                        >
                          <span className="text-lg font-bold">{config.shortName}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            {config.name}
                          </span>
                          {config.value > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              +{config.value}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {gameStats
                      .filter(s => !s.isDeleted)
                      .sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime())
                      .slice(0, 10)
                      .map(stat => (
                        <div
                          key={stat.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded"
                          data-testid={`stat-entry-${stat.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{stat.statConfig?.shortName || "?"}</Badge>
                            {stat.athlete && (
                              <span className="text-sm">
                                {stat.athlete.firstName} {stat.athlete.lastName}
                              </span>
                            )}
                            {!stat.athlete && trackingMode === "team" && (
                              <span className="text-sm text-muted-foreground">Team</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              P{stat.period}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteStatMutation.mutate(stat.id)}
                            data-testid={`button-undo-stat-${stat.id}`}
                          >
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    {gameStats.filter(s => !s.isDeleted).length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No stats recorded yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setViewMode("roster")}
              data-testid="button-manage-roster"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Roster
            </Button>
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
                  setSelectedPlayer(null);
                }}
                data-testid="button-new-game"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
