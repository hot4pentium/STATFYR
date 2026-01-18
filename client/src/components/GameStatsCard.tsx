import { useUser } from "@/lib/userContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Check, AlertTriangle, X, BookOpen, Loader2, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { getGamePlayOutcomes, type GamePlayOutcomes } from "@/lib/api";

interface GameData {
  id?: string;
  opponent: string;
  date: string;
  result: 'W' | 'L' | 'T';
  teamScore: number;
  opponentScore: number;
  stats?: Record<string, number>;
}

interface GameStatsCardProps {
  game: GameData;
  gameId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function GameStatsCard({ game, gameId, isExpanded, onToggle }: GameStatsCardProps) {
  const { user } = useUser();
  
  const { data: playOutcomes, isLoading: loadingPlays } = useQuery({
    queryKey: ["/api/games", gameId, "play-outcomes"],
    queryFn: () => getGamePlayOutcomes(gameId, user!.id),
    enabled: isExpanded && !!game.id && !!user,
  });

  const hasStats = game.stats && Object.keys(game.stats).length > 0;
  const hasPlayData = playOutcomes && playOutcomes.totalOutcomes > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="bg-card/60 backdrop-blur-sm border-white/10 overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-bold">
                    <span className="text-primary">{game.teamScore}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-muted-foreground">{game.opponentScore}</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-white/10 p-4 space-y-4 bg-background/30">
            {hasStats && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Game Stats</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Object.entries(game.stats!).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-background/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">{value}</div>
                      <div className="text-xs text-muted-foreground uppercase">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {game.id && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Play Results</h4>
                {loadingPlays ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : hasPlayData ? (
                  <div className="space-y-3">
                    {Object.entries(playOutcomes.playStats).map(([playId, stats]) => (
                      <div key={playId} className="bg-background/50 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-sm">{stats.playName}</span>
                            <Badge variant="outline" className="text-xs">{stats.playType}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs">
                              <Check className="h-3 w-3 text-green-500" />
                              <span className="text-green-400">{stats.success}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              <span className="text-yellow-400">{stats.needsWork}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <X className="h-3 w-3 text-red-500" />
                              <span className="text-red-400">{stats.unsuccessful}</span>
                            </div>
                            {stats.successRate !== null && (
                              <Badge 
                                className={`text-xs ml-2 ${
                                  stats.successRate >= 70 ? "bg-green-600" : 
                                  stats.successRate >= 40 ? "bg-yellow-600" : 
                                  "bg-red-600"
                                }`}
                              >
                                {stats.successRate}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        {stats.notes.length > 0 && (
                          <div className="border-t border-white/5 p-2 space-y-1.5">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>Notes ({stats.notes.length})</span>
                            </div>
                            {stats.notes.map((note, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs pl-1">
                                <span className={`mt-0.5 ${
                                  note.outcome === 'success' ? 'text-green-500' :
                                  note.outcome === 'needs_work' ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                  {note.outcome === 'success' ? <Check className="h-3 w-3" /> :
                                   note.outcome === 'needs_work' ? <AlertTriangle className="h-3 w-3" /> :
                                   <X className="h-3 w-3" />}
                                </span>
                                <div className="flex-1">
                                  <p className="text-foreground">{note.text}</p>
                                  <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    <span>{format(new Date(note.recordedAt), "h:mm a")}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {playOutcomes.totalOutcomes > 0 && (
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {playOutcomes.totalOutcomes} play outcome{playOutcomes.totalOutcomes !== 1 ? 's' : ''} recorded
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted-foreground text-sm">
                    No play outcomes recorded for this game
                  </div>
                )}
              </div>
            )}
            
            {!hasStats && !game.id && (
              <div className="text-center py-3 text-muted-foreground text-sm">
                No detailed stats available
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
