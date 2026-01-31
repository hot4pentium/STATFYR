import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, Share2, ArrowLeft, Eye, Crown, Loader2, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { isDemoMode, demoPlays } from "@/lib/demoData";
import { useEntitlements } from "@/lib/entitlementsContext";
import { useUser } from "@/lib/userContext";
import { useQuery } from "@tanstack/react-query";
import { getTeamPlays, getTeamPlayStats, type Play as PlayType, type TeamPlayStats } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RatingFilter = "all" | "high" | "medium" | "low" | "unrated";

function getSuccessRateBadge(stats: TeamPlayStats[string] | undefined) {
  if (!stats || stats.total === 0) {
    return null;
  }
  
  const rate = stats.successRate;
  if (rate === null) return null;
  
  if (rate >= 70) {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
        <TrendingUp className="h-3 w-3" />
        {rate}%
      </Badge>
    );
  } else if (rate >= 40) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1">
        {rate}%
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1">
        <TrendingDown className="h-3 w-3" />
        {rate}%
      </Badge>
    );
  }
}

function getRatingCategory(stats: TeamPlayStats[string] | undefined): RatingFilter {
  if (!stats || stats.total === 0) return "unrated";
  const rate = stats.successRate;
  if (rate === null) return "unrated";
  if (rate >= 70) return "high";
  if (rate >= 40) return "medium";
  return "low";
}

export default function PlaybookPage() {
  const [, navigate] = useLocation();
  const isDemo = isDemoMode();
  const { entitlements, isLoading: entitlementsLoading } = useEntitlements();
  const { currentTeam } = useUser();
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const { data: teamPlays = [], isLoading: playsLoading } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam && !isDemo,
  });

  const { data: playStats = {} as TeamPlayStats } = useQuery<TeamPlayStats>({
    queryKey: ["/api/teams", currentTeam?.id, "play-stats"],
    queryFn: () => currentTeam ? getTeamPlayStats(currentTeam.id) : Promise.resolve({} as TeamPlayStats),
    enabled: !!currentTeam && !isDemo,
  });

  const playsToShow = isDemo 
    ? demoPlays 
    : teamPlays.filter((play) => {
        if (ratingFilter === "all") return true;
        const category = getRatingCategory(playStats[play.id]);
        return category === ratingFilter;
      });

  if ((entitlementsLoading || playsLoading) && !isDemo) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!entitlementsLoading && !entitlements.canEditPlayMaker && !isDemo) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
          <div className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              PlayMaker is a premium feature. Upgrade to Coach Pro to design and share plays with your team.
            </p>
            <Button 
              onClick={() => navigate("/subscription")}
              className="gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Coach Pro
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/playbook?demo=true")}
              className="mt-2 w-full gap-2"
            >
              <Eye className="w-4 h-4" />
              Try Demo
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="mt-2 w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isDemo && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-200">Demo Mode</p>
                <p className="text-xs text-amber-300/70">Explore PlayMaker with sample plays. Changes won't be saved.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => navigate("/subscription")}
                className="border-amber-500/30 text-amber-200 hover:bg-amber-500/20"
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => navigate("/playbook")}
                className="text-amber-300/70 hover:text-amber-200"
              >
                Exit Demo
              </Button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">
              PlayMaker {isDemo && <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30">DEMO</Badge>}
            </h1>
            <p className="text-muted-foreground">Design and distribute tactical plays.</p>
          </div>
          <Button size="lg" className="shadow-lg shadow-primary/20" disabled={isDemo} title={isDemo ? "Disabled in demo mode" : undefined}>
            <Plus className="mr-2 h-5 w-5" />
            New Play
          </Button>
        </div>

        {!isDemo && teamPlays.length > 0 && (
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as RatingFilter)}>
              <SelectTrigger className="w-[180px]" data-testid="select-rating-filter">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plays</SelectItem>
                <SelectItem value="high">Success</SelectItem>
                <SelectItem value="medium">Needs Work</SelectItem>
                <SelectItem value="low">Failed</SelectItem>
                <SelectItem value="unrated">Not Rated</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {playsToShow.length} of {teamPlays.length} plays
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playsToShow.map((play) => {
            const playUrl = isDemo ? `/playbook/${play.id}?demo=true` : `/playbook/${play.id}`;
            const stats = !isDemo ? playStats[play.id] : undefined;
            const successBadge = getSuccessRateBadge(stats);
            
            return (
            <Card 
              key={play.id} 
              className="bg-card border-white/5 hover:border-primary/50 transition-all group overflow-hidden cursor-pointer"
              onClick={() => navigate(playUrl)}
              data-testid={`play-card-${play.id}`}
            >
              <div className="h-48 bg-[#1a3c28] relative overflow-hidden border-b border-white/5 pattern-grid-lg">
                {play.thumbnailData ? (
                  <img 
                    src={play.thumbnailData} 
                    alt={play.name} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1">
                      <circle cx="50" cy="50" r="10" strokeDasharray="4 4" />
                      <line x1="10" y1="10" x2="40" y2="40" markerEnd="url(#arrow)" />
                      <path d="M 60 60 Q 75 40 90 60" strokeDasharray="2 2" />
                      <rect x="5" y="5" width="90" height="90" rx="2" strokeOpacity="0.2" />
                    </svg>
                  </>
                )}
                
                <div className="absolute top-2 right-2 flex gap-2">
                  {successBadge}
                  <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white border-white/10 hover:bg-black/70">
                    {play.category || 'General'}
                  </Badge>
                </div>
                
                {stats && stats.total > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs bg-black/50 backdrop-blur-sm text-white/70 px-2 py-1 rounded">
                      {stats.total} run{stats.total !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                   <h3 className="font-display text-xl font-bold uppercase">{play.name}</h3>
                </div>
                
                {stats && stats.total > 0 && (
                  <div className="flex gap-2 mb-3 text-xs">
                    <span className="text-green-400">{stats.success} success</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-amber-400">{stats.needsWork} work</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-red-400">{stats.unsuccessful} miss</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                   <Button 
                     size="sm" 
                     className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                     onClick={(e) => {
                       e.stopPropagation();
                       navigate(playUrl);
                     }}
                   >
                     <Play className="mr-2 h-4 w-4" /> View Play
                   </Button>
                   <Button size="icon" variant="outline" className="border-white/10 hover:bg-white/5" onClick={(e) => e.stopPropagation()}>
                     <Share2 className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}

           {!isDemo && (
           <Card className="bg-card/30 border-dashed border-white/10 hover:border-primary/50 transition-all flex items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-white/5">
              <div className="text-center">
                 <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                    <Plus className="h-8 w-8" />
                 </div>
                 <h3 className="font-display text-xl font-bold uppercase text-muted-foreground">Create New Play</h3>
              </div>
           </Card>
           )}
        </div>
      </div>
    </Layout>
  );
}
