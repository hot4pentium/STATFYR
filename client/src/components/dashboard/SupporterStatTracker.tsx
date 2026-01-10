import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, Plus, Minus, Target, Trophy, Crown, Lock, 
  ChevronRight, Undo2, X
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import {
  getSupporterFollowing,
  getSupporterStats,
  recordSupporterStat,
  deleteSupporterStat,
  getTeamEvents,
  type FollowedAthlete,
  type SupporterStat,
  type Event
} from "@/lib/api";
import { SPORT_STATS } from "@/lib/sportConstants";
import { format, isToday, isFuture } from "date-fns";
import { Link } from "wouter";

interface SupporterStatTrackerProps {
  teamId: string;
  sport?: string;
}

export function SupporterStatTracker({ teamId, sport = "basketball" }: SupporterStatTrackerProps) {
  const { user } = useUser();
  const { entitlements } = useEntitlements();
  const queryClient = useQueryClient();
  
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [recentStats, setRecentStats] = useState<SupporterStat[]>([]);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const { data: followingData } = useQuery({
    queryKey: ["supporter-following"],
    queryFn: () => user ? getSupporterFollowing(user.id) : { following: [] },
    enabled: !!user
  });

  const { data: events = [] } = useQuery({
    queryKey: ["team-events", teamId],
    queryFn: () => getTeamEvents(teamId),
    enabled: !!teamId
  });

  const { data: athleteStats } = useQuery({
    queryKey: ["supporter-stats", selectedAthleteId, selectedEventId],
    queryFn: () => user && selectedAthleteId ? getSupporterStats(user.id, selectedAthleteId, selectedEventId || undefined) : { stats: [] },
    enabled: !!user && !!selectedAthleteId
  });

  const recordStatMutation = useMutation({
    mutationFn: (data: { statName: string; statValue?: number }) => {
      if (!user || !selectedAthleteId) throw new Error("Not ready");
      return recordSupporterStat(user.id, {
        athleteId: selectedAthleteId,
        teamId,
        statName: data.statName,
        statValue: data.statValue || 1,
        eventId: selectedEventId || undefined
      });
    },
    onSuccess: (result) => {
      setRecentStats(prev => [result.stat, ...prev.slice(0, 9)]);
      queryClient.invalidateQueries({ queryKey: ["supporter-stats"] });
      toast.success(`Recorded ${result.stat.statName}`);
    },
    onError: (error: Error) => {
      if (error.message.includes("requires Supporter Pro")) {
        toast.error("Tracking stats requires Supporter Pro", {
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/subscription"
          }
        });
      } else {
        toast.error(error.message);
      }
    }
  });

  const deleteStatMutation = useMutation({
    mutationFn: (statId: string) => {
      if (!user) throw new Error("Not authenticated");
      return deleteSupporterStat(user.id, statId);
    },
    onSuccess: (_, statId) => {
      setRecentStats(prev => prev.filter(s => s.id !== statId));
      queryClient.invalidateQueries({ queryKey: ["supporter-stats"] });
      toast.success("Stat removed");
    }
  });

  const following = followingData?.following || [];
  const selectedAthlete = following.find(f => f.athleteId === selectedAthleteId);

  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return isToday(eventDate) || isFuture(eventDate);
  }).slice(0, 10);

  const sportStats = SPORT_STATS[sport as keyof typeof SPORT_STATS] || SPORT_STATS.Basketball || [];
  const statCategories = sportStats.map(category => ({
    category: category.category,
    stats: category.stats
  }));

  if (!entitlements.canTrackOwnStats) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            Track Stats
            <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Crown className="w-10 h-10 mx-auto text-amber-500 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Track your athlete's stats when the coach doesn't
            </p>
            <Link href="/subscription">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500">
                Upgrade to Supporter Pro
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (following.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            Track Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Follow an athlete to start tracking their stats
            </p>
            <p className="text-xs text-muted-foreground">
              Use the Following tab to add athletes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Track Stats
          <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger data-testid="select-athlete">
              <SelectValue placeholder="Select athlete to track" />
            </SelectTrigger>
            <SelectContent>
              {following.map(f => (
                <SelectItem key={f.athleteId} value={f.athleteId}>
                  <div className="flex items-center gap-2">
                    <span>{f.nickname || f.athlete.name || f.athlete.username}</span>
                    {f.athlete.number && (
                      <Badge variant="outline" className="text-xs">#{f.athlete.number}</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAthleteId && (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger data-testid="select-event">
                <SelectValue placeholder="Select game (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No specific game</SelectItem>
                {todayEvents.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {format(new Date(e.date), "MMM d")} - {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedAthleteId && (
          <Dialog open={isTrackingOpen} onOpenChange={setIsTrackingOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                variant="default"
                data-testid="button-start-tracking"
              >
                <Target className="w-4 h-4 mr-2" />
                Start Tracking {selectedAthlete?.nickname || selectedAthlete?.athlete.name}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Track Stats for {selectedAthlete?.nickname || selectedAthlete?.athlete.name}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  {statCategories.map((categoryGroup) => (
                    categoryGroup.stats.length > 0 && (
                      <div key={categoryGroup.category}>
                        <h4 className="text-sm font-medium text-muted-foreground capitalize mb-2">
                          {categoryGroup.category}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryGroup.stats.map(stat => (
                            <Button
                              key={stat.name}
                              variant="outline"
                              size="sm"
                              className="justify-start h-auto py-2"
                              onClick={() => recordStatMutation.mutate({ statName: stat.name })}
                              disabled={recordStatMutation.isPending}
                              data-testid={`button-record-${stat.shortName.toLowerCase()}`}
                            >
                              <Plus className="w-3 h-3 mr-1.5" />
                              <span className="truncate">{stat.shortName}</span>
                              {stat.value > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  +{stat.value}
                                </Badge>
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </ScrollArea>

              {recentStats.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Recent (tap to undo)</h4>
                  <div className="flex flex-wrap gap-1">
                    {recentStats.slice(0, 5).map(stat => (
                      <Badge 
                        key={stat.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => deleteStatMutation.mutate(stat.id)}
                      >
                        {stat.statName}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {athleteStats && athleteStats.stats.length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Session Stats</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(
                athleteStats.stats.reduce((acc, s) => {
                  acc[s.statName] = (acc[s.statName] || 0) + s.statValue;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([name, total]) => (
                <Badge key={name} variant="outline">
                  {name}: {total}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
