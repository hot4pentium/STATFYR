import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Trophy, ChevronDown, ChevronUp, BarChart3, Target } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useUser } from "@/lib/userContext";

interface SeasonArchive {
  id: number;
  managedAthleteId: number;
  season: string;
  startDate: string;
  endDate: string;
  totalGames: number;
  wins: number;
  losses: number;
  ties: number;
  statTotals: Record<string, number>;
  gameStats: Array<{
    date: string;
    opponent?: string;
    stats: Record<string, number>;
  }>;
  archivedEvents: Array<{
    title: string;
    date: string;
    type: string;
  }>;
}

export default function SupporterSeasonHistoryPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ athleteId: string }>();
  const athleteId = parseInt(params.athleteId || "0");
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const { user } = useUser();

  const { data: archives = [], isLoading } = useQuery<SeasonArchive[]>({
    queryKey: ["supporter-season-archives", athleteId],
    queryFn: async () => {
      const res = await fetch(`/api/supporter/managed-athletes/${athleteId}/season-archives`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.archives || [];
    },
    enabled: !!athleteId && !!user?.id,
  });

  const { data: athlete } = useQuery({
    queryKey: ["managed-athlete", athleteId],
    queryFn: async () => {
      const res = await fetch(`/api/supporter/managed-athletes`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      const athletes = data.managedAthletes || [];
      return athletes.find((a: any) => a.id === athleteId);
    },
    enabled: !!athleteId && !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <DashboardBackground />
      <div className="min-h-screen p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/supporter/dashboard")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-wide text-primary">
              Season History
            </h1>
            {athlete && (
              <p className="text-sm text-muted-foreground">{athlete.athleteName}</p>
            )}
          </div>
        </div>

        {archives.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-900/80">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Seasons Archived</h3>
              <p className="text-sm text-muted-foreground">
                When you end a season, it will appear here with all stats and events preserved.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {archives.map((archive) => (
              <Collapsible
                key={archive.id}
                open={expandedSeason === archive.id}
                onOpenChange={(open) => setExpandedSeason(open ? archive.id : null)}
              >
                <Card className="bg-white/80 dark:bg-slate-900/80 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Trophy className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{archive.season}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(archive.startDate), "MMM d, yyyy")} - {format(new Date(archive.endDate), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-500 font-bold">{archive.wins}W</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-red-500 font-bold">{archive.losses}L</span>
                            {archive.ties > 0 && (
                              <>
                                <span className="text-muted-foreground">-</span>
                                <span className="text-yellow-500 font-bold">{archive.ties}T</span>
                              </>
                            )}
                          </div>
                          <Badge variant="secondary">{archive.totalGames} Games</Badge>
                          {expandedSeason === archive.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="border-t pt-4 space-y-6">
                      {Object.keys(archive.statTotals || {}).length > 0 && (
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Season Totals
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(archive.statTotals).map(([stat, value]) => (
                              <div
                                key={stat}
                                className="bg-muted/50 rounded-lg p-3 text-center"
                              >
                                <p className="text-2xl font-bold text-primary">{value}</p>
                                <p className="text-xs text-muted-foreground uppercase">{stat}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(archive.gameStats?.length || 0) > 0 && (
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <Target className="h-4 w-4 text-primary" />
                            Game-by-Game Stats
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {archive.gameStats.map((game, idx) => (
                              <div
                                key={idx}
                                className="bg-muted/30 rounded-lg p-3 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {game.opponent || `Game ${idx + 1}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(game.date), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div className="flex gap-3 text-sm">
                                  {Object.entries(game.stats).slice(0, 4).map(([stat, value]) => (
                                    <span key={stat} className="text-muted-foreground">
                                      <span className="font-bold text-foreground">{value}</span> {stat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(archive.archivedEvents?.length || 0) > 0 && (
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            Archived Events ({archive.archivedEvents.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {archive.archivedEvents.map((event, idx) => (
                              <div
                                key={idx}
                                className="bg-muted/30 rounded-lg p-2 flex items-center gap-2"
                              >
                                <Badge variant="outline" className="text-xs">
                                  {event.type}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{event.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(event.date), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
