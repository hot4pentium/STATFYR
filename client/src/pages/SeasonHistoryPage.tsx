import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Users, Medal, Heart, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";

interface SeasonArchive {
  id: string;
  teamId: string;
  season: string;
  wins: number;
  losses: number;
  ties: number;
  totalGames: number;
  topPerformers: { userId: string; name: string; statName: string; value: number }[] | null;
  mvpUserId: string | null;
  mvpName: string | null;
  totalTaps: number;
  topTapperId: string | null;
  topTapperName: string | null;
  topTapperTaps: number;
  totalBadgesEarned: number;
  archivedEvents: { id: string; title: string; type: string; date: string; opponent?: string; location?: string }[] | null;
  endedAt: string;
  createdAt: string;
}

export default function SeasonHistoryPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);

  const { data: seasons = [], isLoading } = useQuery<SeasonArchive[]>({
    queryKey: ["/api/teams", teamId, "seasons"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/seasons`);
      if (!res.ok) throw new Error("Failed to fetch seasons");
      return res.json();
    },
    enabled: !!teamId,
  });

  const toggleExpand = (seasonId: string) => {
    setExpandedSeason(expandedSeason === seasonId ? null : seasonId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Season History</h1>
            <p className="text-sm text-muted-foreground">View past seasons and archived data</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading seasons...</p>
          </div>
        ) : seasons.length === 0 ? (
          <Card className="bg-background/40 border-white/10">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-bold mb-2">No Season History</h3>
              <p className="text-sm text-muted-foreground">
                When you end a season, it will be archived here for you to review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {seasons.map((season) => (
              <Card key={season.id} className="bg-background/40 border-white/10 overflow-hidden" data-testid={`season-card-${season.id}`}>
                <CardHeader 
                  className="cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleExpand(season.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 border border-primary/30">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{season.season}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Ended {format(new Date(season.endedAt), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{season.wins}-{season.losses}{season.ties > 0 ? `-${season.ties}` : ""}</p>
                        <p className="text-xs text-muted-foreground">{season.totalGames} games</p>
                      </div>
                      {expandedSeason === season.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {expandedSeason === season.id && (
                  <CardContent className="pt-0 pb-6 space-y-6 border-t border-white/10">
                    {season.mvpName && (
                      <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Medal className="h-8 w-8 text-yellow-500" />
                          <div>
                            <p className="text-xs uppercase tracking-wider text-yellow-500 font-bold">Season MVP</p>
                            <p className="text-lg font-bold">{season.mvpName}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {season.topPerformers && season.topPerformers.length > 0 && (
                        <div className="bg-background/60 rounded-lg p-4 border border-white/10">
                          <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Top Performers
                          </h4>
                          <div className="space-y-2">
                            {season.topPerformers.map((performer, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{performer.name}</span>
                                <span className="text-muted-foreground">
                                  {performer.value} {performer.statName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-background/60 rounded-lg p-4 border border-white/10">
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          Supporter Engagement
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Taps</span>
                            <span className="font-bold text-primary">{season.totalTaps.toLocaleString()}</span>
                          </div>
                          {season.topTapperName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Top Tapper</span>
                              <span className="font-medium">
                                {season.topTapperName} ({season.topTapperTaps.toLocaleString()})
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Badges Earned</span>
                            <span className="font-bold">{season.totalBadgesEarned}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {season.archivedEvents && season.archivedEvents.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          Archived Events ({season.archivedEvents.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {season.archivedEvents.slice(0, 6).map((event) => (
                            <div 
                              key={event.id} 
                              className="bg-background/60 rounded-lg p-3 border border-white/10 text-sm"
                            >
                              <p className="font-medium truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.type}
                                {event.opponent && ` vs ${event.opponent}`}
                              </p>
                            </div>
                          ))}
                          {season.archivedEvents.length > 6 && (
                            <div className="bg-background/40 rounded-lg p-3 border border-white/10 text-sm flex items-center justify-center">
                              <p className="text-muted-foreground">
                                +{season.archivedEvents.length - 6} more
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
