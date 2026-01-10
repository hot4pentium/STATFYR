import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Search, UserPlus, X, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { 
  getSupporterFollowing, 
  searchAthletesToFollow, 
  followAthlete, 
  unfollowAthlete,
  type FollowedAthlete,
  type AthleteSearchResult 
} from "@/lib/api";
import { Link } from "wouter";

export function FollowedAthletesCard() {
  const { user } = useUser();
  const { entitlements } = useEntitlements();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AthleteSearchResult[]>([]);
  const [followingInProgress, setFollowingInProgress] = useState<string | null>(null);

  const { data: followingData, isLoading } = useQuery({
    queryKey: ["supporter-following", user?.id],
    queryFn: () => user ? getSupporterFollowing(user.id) : Promise.resolve({ following: [] }),
    enabled: !!user,
  });

  const following = followingData?.following || [];

  const handleSearch = async () => {
    if (!user || searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const result = await searchAthletesToFollow(user.id, searchQuery);
      setSearchResults(result.athletes);
    } catch (error) {
      toast.error("Failed to search athletes");
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (athlete: AthleteSearchResult) => {
    if (!user) return;

    setFollowingInProgress(athlete.id);
    try {
      const result = await followAthlete(user.id, athlete.id);
      toast.success(`Now following ${athlete.name}!${result.isCrossTeam ? ' (Cross-team)' : ''}`);
      setSearchResults(prev => prev.map(a => 
        a.id === athlete.id ? { ...a, isFollowing: true } : a
      ));
      queryClient.invalidateQueries({ queryKey: ["supporter-following"] });
    } catch (error: any) {
      if (error.message?.includes("Cross-team following requires")) {
        toast.error("Cross-team following requires Supporter Pro", {
          action: {
            label: "Upgrade",
            onClick: () => window.location.href = "/subscription",
          },
        });
      } else {
        toast.error(error.message || "Failed to follow athlete");
      }
    } finally {
      setFollowingInProgress(null);
    }
  };

  const handleUnfollow = async (athleteId: string) => {
    if (!user) return;
    try {
      await unfollowAthlete(user.id, athleteId);
      toast.success("Unfollowed athlete");
      queryClient.invalidateQueries({ queryKey: ["supporter-following"] });
    } catch (error) {
      toast.error("Failed to unfollow athlete");
    }
  };

  return (
    <Card className="h-full" data-testid="card-followed-athletes">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Following
            {!entitlements.canFollowCrossTeam && (
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" /> Pro
              </span>
            )}
          </CardTitle>
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8" data-testid="button-search-athletes">
                <UserPlus className="h-4 w-4 mr-1" />
                Follow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Find Athletes to Follow</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-search-athletes"
                />
                <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 2}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              <ScrollArea className="h-[300px] mt-4">
                {searchResults.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery.length >= 2 ? "No athletes found" : "Enter a name to search"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((athlete) => (
                      <div 
                        key={athlete.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        data-testid={`search-result-${athlete.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={athlete.profileImageUrl || undefined} />
                            <AvatarFallback>{athlete.name?.charAt(0) || "A"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{athlete.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {athlete.position && `${athlete.position}`}
                              {athlete.number && ` #${athlete.number}`}
                            </p>
                          </div>
                        </div>
                        {athlete.isFollowing ? (
                          <Button size="sm" variant="secondary" disabled>
                            Following
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleFollow(athlete)}
                            disabled={followingInProgress === athlete.id}
                            data-testid={`button-follow-${athlete.id}`}
                          >
                            {followingInProgress === athlete.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Follow
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {!entitlements.canFollowCrossTeam && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  <Crown className="h-3 w-3 inline mr-1" />
                  Upgrade to Supporter Pro to follow athletes across teams
                </p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No athletes followed yet</p>
            <p className="text-xs mt-1">Click "Follow" to find athletes</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {following.map((follow: FollowedAthlete) => (
                <Link 
                  key={follow.id} 
                  href={`/athlete/${follow.athleteId}`}
                  className="block"
                >
                  <div 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    data-testid={`followed-athlete-${follow.athleteId}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={follow.athlete.avatar || undefined} />
                        <AvatarFallback>
                          {(follow.nickname || follow.athlete.name || follow.athlete.username)?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {follow.nickname || follow.athlete.name || follow.athlete.username}
                        </p>
                        {follow.team && (
                          <p className="text-xs text-muted-foreground">{follow.team.name}</p>
                        )}
                        {!follow.teamId && (
                          <p className="text-xs text-yellow-500 flex items-center gap-1">
                            <Crown className="h-3 w-3" /> Cross-team
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnfollow(follow.athleteId);
                      }}
                      data-testid={`button-unfollow-${follow.athleteId}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
