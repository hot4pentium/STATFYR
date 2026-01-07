import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { Activity, Trophy, TrendingUp, TrendingDown, Target, ArrowLeft, Users, Flame, Calendar, ChevronDown, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/userContext";
import { getAdvancedTeamStats, getTeamAggregateStats, type AdvancedTeamStats, type TeamAggregateStats } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function StatsPage() {
  const { user, currentTeam: selectedTeam } = useUser();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("season");

  const { data: aggregateStats, isLoading: loadingAggregate } = useQuery({
    queryKey: ['teamAggregateStats', selectedTeam?.id],
    queryFn: () => selectedTeam ? getTeamAggregateStats(selectedTeam.id) : null,
    enabled: !!selectedTeam,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: advancedStats, isLoading: loadingAdvanced } = useQuery({
    queryKey: ['advancedTeamStats', selectedTeam?.id],
    queryFn: () => selectedTeam ? getAdvancedTeamStats(selectedTeam.id) : null,
    enabled: !!selectedTeam,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const isLoading = loadingAggregate && !aggregateStats;

  const totalGames = aggregateStats ? aggregateStats.wins + aggregateStats.losses : 0;
  const winRate = totalGames > 0 ? Math.round((aggregateStats!.wins / totalGames) * 100) : 0;

  const gameHistory = advancedStats?.gameHistory || [];
  const athletePerformance = advancedStats?.athletePerformance || [];
  const ratios = advancedStats?.ratios || {};

  const selectedAthlete = selectedAthleteId 
    ? athletePerformance.find(a => a.athleteId === selectedAthleteId)
    : athletePerformance[0];

  const gameChartData = gameHistory.map((game, idx) => ({
    game: `G${idx + 1}`,
    teamScore: game.teamScore,
    oppScore: game.opponentScore,
    result: game.result,
    opponent: game.opponent,
  }));

  const statTotals: Record<string, number> = {};
  gameHistory.forEach(game => {
    Object.entries(game.stats).forEach(([key, value]) => {
      statTotals[key] = (statTotals[key] || 0) + value;
    });
  });

  if (!selectedTeam) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Please select a team to view stats.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">STATS</h1>
            <p className="text-muted-foreground">{selectedTeam.name} performance analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-white/5" data-testid="card-games">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-display font-bold text-primary">{totalGames}</div>
              <div className="text-sm text-muted-foreground mt-1">Games</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-white/5" data-testid="card-wins">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-display font-bold text-green-500">{aggregateStats?.wins || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Wins</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-white/5" data-testid="card-losses">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-display font-bold text-red-500">{aggregateStats?.losses || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Losses</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-white/5" data-testid="card-winrate">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-display font-bold text-foreground">{winRate}%</div>
              <div className="text-sm text-muted-foreground mt-1">Win Rate</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 border border-white/10">
                <TabsTrigger value="season" data-testid="tab-season" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Season</TabsTrigger>
                <TabsTrigger value="athletes" data-testid="tab-athletes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Athletes</TabsTrigger>
                <TabsTrigger value="games" data-testid="tab-games" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Games</TabsTrigger>
              </TabsList>

              <TabsContent value="season" className="space-y-4">
                {Object.keys(statTotals).length === 0 ? (
                  <Card className="bg-card border-white/5">
                    <CardContent className="p-8 text-center">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No stats recorded yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">Complete games in StatTracker to see season totals here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="bg-card border-white/5">
                      <CardHeader>
                        <CardTitle className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          Season Totals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                          {Object.entries(statTotals).map(([key, value]) => (
                            <div key={key} className="text-center p-3 bg-background/50 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{value}</div>
                              <div className="text-xs text-muted-foreground uppercase">{key}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-white/5">
                      <CardHeader>
                        <CardTitle className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                          Per-Game Averages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                          {Object.entries(statTotals).map(([key, value]) => (
                            <div key={key} className="text-center p-3 bg-background/50 rounded-lg">
                              <div className="text-2xl font-bold text-foreground">
                                {totalGames > 0 ? (value / totalGames).toFixed(1) : '0'}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">{key}/game</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {ratios && Object.keys(ratios).length > 0 && (
                      <Card className="bg-card border-white/5">
                        <CardHeader>
                          <CardTitle className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-green-500" />
                            Key Metrics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(ratios).map(([key, ratio]) => (
                              <div key={key} className="text-center p-3 bg-background/50 rounded-lg">
                                <div className="text-2xl font-bold text-foreground">
                                  {typeof ratio.value === 'number' ? 
                                    (ratio.value % 1 === 0 ? ratio.value : ratio.value.toFixed(1)) : ratio.value}
                                  {key === 'win_pct' ? '%' : ''}
                                </div>
                                <div className="text-xs text-muted-foreground">{ratio.name}</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="athletes" className="space-y-4">
                {athletePerformance.length === 0 ? (
                  <Card className="bg-card border-white/5">
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No athlete stats recorded yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">Record individual stats in StatTracker to see athlete performance here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {athletePerformance.map((athlete, idx) => {
                      const totalStats = Object.values(athlete.stats).reduce((a, b) => a + b, 0);
                      const lastGame = athlete.recentGames[0];
                      const lastGameInfo = lastGame ? gameHistory.find(g => g.id === lastGame.gameId) : null;
                      
                      return (
                        <Card 
                          key={athlete.athleteId} 
                          className={`bg-card border-white/5 ${idx === 0 ? 'ring-2 ring-yellow-500/30' : ''}`}
                          data-testid={`athlete-card-${athlete.athleteId}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                  idx === 0 ? 'bg-yellow-500 text-black' : 
                                  idx === 1 ? 'bg-gray-400 text-black' : 
                                  idx === 2 ? 'bg-orange-600 text-white' : 'bg-primary/20 text-primary'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    {athlete.athleteName}
                                    {athlete.hotStreak && (
                                      <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                        <Flame className="h-3 w-3" />
                                        {athlete.streakLength} game streak!
                                      </span>
                                    )}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {athlete.gamesPlayed} game{athlete.gamesPlayed !== 1 ? 's' : ''} played
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">{totalStats}</div>
                                <div className="text-xs text-muted-foreground">total stats</div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {Object.entries(athlete.stats).map(([statKey, totalValue]) => {
                                const avgPerGame = athlete.gamesPlayed > 0 ? totalValue / athlete.gamesPlayed : 0;
                                const lastGameValue = lastGame?.stats[statKey] || 0;
                                const growthTrend = lastGameValue > avgPerGame ? 'up' : lastGameValue < avgPerGame ? 'down' : 'same';
                                
                                return (
                                  <div key={statKey} className="bg-background/50 rounded-lg p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="text-2xl font-bold text-foreground">{totalValue}</span>
                                      {athlete.gamesPlayed > 1 && (
                                        growthTrend === 'up' ? (
                                          <ArrowUp className="h-4 w-4 text-green-500" />
                                        ) : growthTrend === 'down' ? (
                                          <ArrowDown className="h-4 w-4 text-red-500" />
                                        ) : (
                                          <Minus className="h-4 w-4 text-gray-500" />
                                        )
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase font-medium">{statKey}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {avgPerGame.toFixed(1)}/game
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {athlete.recentGames.length > 0 && (
                              <div className="pt-2 border-t border-white/5">
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Game History</h4>
                                <div className="space-y-1.5">
                                  {athlete.recentGames.map((game) => {
                                    const gameInfo = gameHistory.find(g => g.id === game.gameId);
                                    return (
                                      <div key={game.gameId} className="flex items-center justify-between p-2 bg-background/30 rounded text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                                            gameInfo?.result === 'W' ? 'bg-green-500/20 text-green-400' :
                                            gameInfo?.result === 'L' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                          }`}>
                                            {gameInfo?.result || '?'}
                                          </span>
                                          <span className="text-muted-foreground text-xs">
                                            vs {gameInfo?.opponent || 'Unknown'}
                                          </span>
                                        </div>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                          {Object.entries(game.stats).map(([key, value]) => (
                                            <span key={key} className="text-xs bg-primary/10 px-2 py-0.5 rounded">
                                              <span className="font-bold text-primary">{value}</span>
                                              <span className="text-muted-foreground ml-1">{key}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="games" className="space-y-4">
                {gameHistory.length === 0 ? (
                  <Card className="bg-card border-white/5">
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No completed games yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">Complete games in StatTracker to see game history here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {gameChartData.length > 1 && (
                      <Card className="bg-card border-white/5">
                        <CardHeader>
                          <CardTitle className="font-display uppercase tracking-wide text-sm">Score Progression</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={gameChartData}>
                              <defs>
                                <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                              <XAxis dataKey="game" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                                itemStyle={{ color: 'white' }}
                              />
                              <Area type="monotone" dataKey="teamScore" name="Team" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTeam)" strokeWidth={3} />
                              <Area type="monotone" dataKey="oppScore" name="Opponent" stroke="hsl(var(--destructive))" fillOpacity={0.1} fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-card border-white/5">
                      <CardHeader>
                        <CardTitle className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Game History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {gameHistory.map((game, idx) => (
                          <div 
                            key={game.id} 
                            className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                            data-testid={`game-row-${game.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                                game.result === 'W' ? 'bg-green-500/20 text-green-400' :
                                game.result === 'L' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {game.result}
                              </span>
                              <div>
                                <div className="font-semibold">vs {game.opponent}</div>
                                <div className="text-xs text-muted-foreground">{game.date}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">
                                <span className="text-primary">{game.teamScore}</span>
                                <span className="text-muted-foreground mx-1">-</span>
                                <span className="text-muted-foreground">{game.opponentScore}</span>
                              </div>
                              <div className="flex gap-2 mt-1">
                                {Object.entries(game.stats).slice(0, 4).map(([key, value]) => (
                                  <span key={key} className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">
                                    {value} {key}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
