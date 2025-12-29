import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Copy, Check, Home, Star, Flame, Zap, Trophy, Video, Clock, TrendingUp, Heart, MessageCircle, Send, User, X, RotateCw, Bell, BellOff, Users } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { requestFollowerNotificationPermission } from "@/lib/firebase";

type Athlete = {
  id: number;
  username: string;
  name: string | null;
  avatar: string | null;
  role: string;
};

type TeamMember = {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  jerseyNumber: string | null;
  position: string | null;
  team?: {
    id: number;
    name: string;
    sport: string;
  };
};

type AthleteStats = {
  gamesPlayed: number;
  stats: Record<string, number>;
  gameHistory: any[];
  hotStreak: boolean;
  streakLength: number;
};

type HighlightVideo = {
  id: number;
  title: string;
  thumbnail: string | null;
  videoUrl: string | null;
};

type Shoutout = {
  id: number;
  emoji: string;
  supporterName: string | null;
  createdAt: string;
};

type ProfileLike = {
  id: string;
  athleteId: string;
  visitorName: string;
  createdAt: string;
};

type ProfileComment = {
  id: string;
  athleteId: string;
  visitorName: string;
  message: string;
  createdAt: string;
};

async function getPublicAthleteProfile(athleteId: string): Promise<{
  athlete: Athlete;
  membership: TeamMember | null;
  stats: AthleteStats;
  highlights: HighlightVideo[];
  shoutouts: Shoutout[];
  shoutoutCount: number;
} | null> {
  try {
    const res = await fetch(`/api/athletes/${athleteId}/public-profile`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getProfileLikes(athleteId: string): Promise<{ likes: ProfileLike[]; count: number }> {
  const res = await fetch(`/api/athletes/${athleteId}/profile-likes`);
  if (!res.ok) throw new Error("Failed to fetch likes");
  return res.json();
}

async function addProfileLike(athleteId: string, visitorName: string): Promise<ProfileLike> {
  const res = await fetch(`/api/athletes/${athleteId}/profile-likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorName }),
  });
  if (!res.ok) throw new Error("Failed to add like");
  return res.json();
}

async function getProfileComments(athleteId: string): Promise<ProfileComment[]> {
  const res = await fetch(`/api/athletes/${athleteId}/profile-comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

async function addProfileComment(athleteId: string, visitorName: string, message: string): Promise<ProfileComment> {
  const res = await fetch(`/api/athletes/${athleteId}/profile-comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorName, message }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}

async function getFollowerCount(athleteId: string): Promise<{ count: number }> {
  const res = await fetch(`/api/athletes/${athleteId}/followers/count`);
  if (!res.ok) throw new Error("Failed to fetch follower count");
  return res.json();
}

async function checkFollowStatus(athleteId: string, token: string): Promise<{ isFollowing: boolean }> {
  const res = await fetch(`/api/athletes/${athleteId}/followers/check?token=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error("Failed to check follow status");
  return res.json();
}

async function followAthlete(athleteId: string, fcmToken: string, followerName: string): Promise<{ follower: any; count: number }> {
  const res = await fetch(`/api/athletes/${athleteId}/followers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fcmToken, followerName }),
  });
  if (!res.ok) throw new Error("Failed to follow athlete");
  return res.json();
}

async function unfollowAthlete(athleteId: string, token: string): Promise<{ success: boolean; count: number }> {
  const res = await fetch(`/api/athletes/${athleteId}/followers?token=${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to unfollow athlete");
  return res.json();
}

export default function ShareableHypeCard(props: any) {
  const athleteId = props.params?.id;
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerFcmToken, setFollowerFcmToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Persist liked state in localStorage to prevent spam
  const likeStorageKey = `profile-liked-${athleteId}`;
  const fcmTokenStorageKey = `follower-fcm-token-${athleteId}`;
  
  const [hasLiked, setHasLiked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(likeStorageKey) === 'true';
    }
    return false;
  });

  // Load stored FCM token on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && athleteId) {
      const storedToken = localStorage.getItem(fcmTokenStorageKey);
      if (storedToken) {
        setFollowerFcmToken(storedToken);
        checkFollowStatus(athleteId, storedToken).then(({ isFollowing }) => {
          setIsFollowing(isFollowing);
        }).catch(() => {});
      }
    }
  }, [athleteId]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/athletes", athleteId, "public-profile"],
    queryFn: () => getPublicAthleteProfile(athleteId),
    enabled: !!athleteId,
  });

  const { data: likesData } = useQuery({
    queryKey: ["/api/athletes", athleteId, "profile-likes"],
    queryFn: () => getProfileLikes(athleteId),
    enabled: !!athleteId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/athletes", athleteId, "profile-comments"],
    queryFn: () => getProfileComments(athleteId),
    enabled: !!athleteId,
  });

  const { data: followerData } = useQuery({
    queryKey: ["/api/athletes", athleteId, "followers", "count"],
    queryFn: () => getFollowerCount(athleteId),
    enabled: !!athleteId,
  });

  const likeMutation = useMutation({
    mutationFn: (name: string) => addProfileLike(athleteId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "profile-likes"] });
      setHasLiked(true);
      localStorage.setItem(likeStorageKey, 'true');
      toast.success("Thanks for the love!");
    },
    onError: () => toast.error("Failed to add like"),
  });

  const commentMutation = useMutation({
    mutationFn: ({ name, message }: { name: string; message: string }) => addProfileComment(athleteId, name, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "profile-comments"] });
      setCommentMessage("");
      setShowCommentForm(false);
      toast.success("Comment added!");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleFollow = async () => {
    if (!visitorName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    
    setIsFollowLoading(true);
    try {
      const token = await requestFollowerNotificationPermission();
      
      if (!token) {
        toast.error("Please allow notifications to follow this athlete");
        setIsFollowLoading(false);
        return;
      }
      
      await followAthlete(athleteId, token, visitorName.trim());
      setFollowerFcmToken(token);
      setIsFollowing(true);
      localStorage.setItem(fcmTokenStorageKey, token);
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "followers", "count"] });
      toast.success("You're now following this athlete!");
    } catch (error) {
      toast.error("Failed to follow athlete");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!followerFcmToken) return;
    
    setIsFollowLoading(true);
    try {
      await unfollowAthlete(athleteId, followerFcmToken);
      setIsFollowing(false);
      localStorage.removeItem(fcmTokenStorageKey);
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "followers", "count"] });
      toast.success("Unfollowed");
    } catch (error) {
      toast.error("Failed to unfollow");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleLike = () => {
    if (!visitorName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    likeMutation.mutate(visitorName.trim());
  };

  const handleComment = () => {
    if (!visitorName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    if (!commentMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    commentMutation.mutate({ name: visitorName.trim(), message: commentMessage.trim() });
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/athlete/${athleteId}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const shareToSocial = (platform: string) => {
    const text = profile?.athlete ? `Check out ${profile.athlete.name || profile.athlete.username}'s profile!` : 'Check out this athlete profile!';
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const getBadgeLevel = (shoutoutCount: number) => {
    if (shoutoutCount >= 100) return { name: "Legend", color: "bg-gradient-to-r from-yellow-400 to-amber-500", icon: Trophy };
    if (shoutoutCount >= 50) return { name: "Gold", color: "bg-gradient-to-r from-yellow-300 to-yellow-500", icon: Star };
    if (shoutoutCount >= 20) return { name: "Silver", color: "bg-gradient-to-r from-gray-300 to-gray-400", icon: Star };
    if (shoutoutCount >= 5) return { name: "Bronze", color: "bg-gradient-to-r from-amber-600 to-amber-700", icon: Zap };
    return { name: "Rookie", color: "bg-gradient-to-r from-slate-500 to-slate-600", icon: Flame };
  };

  const calculateRating = (gamesPlayed: number, shoutoutCount: number) => {
    const baseRating = 3.0;
    const gameBonus = Math.min(gamesPlayed * 0.1, 1.5);
    const shoutoutBonus = Math.min(shoutoutCount * 0.05, 0.5);
    return Math.min(baseRating + gameBonus + shoutoutBonus, 5.0).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Link href="/">
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  const { athlete, membership, stats, highlights, shoutouts, shoutoutCount } = profile;
  const badge = getBadgeLevel(shoutoutCount);
  const rating = calculateRating(stats.gamesPlayed, shoutoutCount);

  const topStats = Object.entries(stats.stats || {}).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/dashboard')}
            data-testid="button-close-hype-card"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="STATFYR" className="h-6 w-6" />
            <span className="text-sm font-display font-bold">STATF<span className="text-orange-500">Y</span>R</span>
          </div>
          <Button variant="ghost" size="icon" onClick={copyShareLink} data-testid="button-share">
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Flip Card Container */}
        <div 
          className="relative mb-6 cursor-pointer" 
          style={{ aspectRatio: "3/4", perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
          data-testid="flip-card"
        >
          <div 
            className="relative w-full h-full transition-transform duration-700"
            style={{ 
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* FRONT FACE */}
            <div 
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-teal-600 via-teal-500 to-teal-400" />
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="absolute inset-0 flex flex-col">
                <div className="relative flex-1 flex items-end justify-center overflow-hidden">
                  {athlete.avatar ? (
                    <img 
                      src={athlete.avatar} 
                      alt={athlete.name || ""} 
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[120px] font-display font-bold text-white/30">
                        {(athlete.name || athlete.username || "A").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-rose-200/50 via-rose-100/30 to-transparent" />
                </div>
              </div>

              <div className="absolute top-4 left-4">
                <div className={`${badge.color} px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5`}>
                  <badge.icon className="h-4 w-4 text-white" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{badge.name}</span>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <span className="text-lg font-bold text-slate-800">{rating}</span>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-display font-bold mb-1 drop-shadow-lg">
                  {athlete.name || athlete.username}
                </h2>
                <p className="text-white/80 text-sm mb-4 drop-shadow">
                  {membership?.position || "Athlete"} {membership?.team ? `• ${membership.team.name}` : ""}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 text-center border-r border-white/20">
                    <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
                    <div className="text-xs text-white/70 uppercase tracking-wider">Games</div>
                  </div>
                  <div className="flex-1 text-center border-r border-white/20">
                    <div className="text-2xl font-bold">{membership?.jerseyNumber || "—"}</div>
                    <div className="text-xs text-white/70 uppercase tracking-wider">Jersey</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold">{shoutoutCount}</div>
                    <div className="text-xs text-white/70 uppercase tracking-wider">Cheers</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
                  <RotateCw className="h-3 w-3" />
                  <span>Tap to flip</span>
                </div>
              </div>
            </div>

            {/* BACK FACE - Quadrants */}
            <div 
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
              <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="absolute inset-0 p-4 flex flex-col">
                <div className="text-center mb-3">
                  <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider">
                    {athlete.name || athlete.username}
                  </h3>
                  <p className="text-xs text-white/60">{membership?.team?.name || "Athlete Stats"}</p>
                </div>

                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2">
                  {/* Quadrant 1: Season Stats */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-white uppercase">Stats</span>
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {topStats.slice(0, 4).map(([statName, value]) => (
                        <div key={statName} className="flex justify-between items-center">
                          <span className="text-[10px] text-white/70 truncate">{statName}</span>
                          <span className="text-sm font-bold text-primary">{value}</span>
                        </div>
                      ))}
                      {topStats.length === 0 && (
                        <p className="text-[10px] text-white/50">No stats yet</p>
                      )}
                    </div>
                  </div>

                  {/* Quadrant 2: Performance */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold text-white uppercase">Performance</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center gap-2">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white">{stats.gamesPlayed}</div>
                        <div className="text-[10px] text-white/60 uppercase">Games Played</div>
                      </div>
                      {stats.hotStreak && (
                        <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-full">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="text-[10px] text-orange-400 font-bold">{stats.streakLength} Game Streak</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quadrant 3: Highlights */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Video className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase">Highlights</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1">
                      {highlights.slice(0, 4).map((highlight) => (
                        <div key={highlight.id} className="relative aspect-video rounded overflow-hidden bg-black/30">
                          {highlight.thumbnail ? (
                            <img src={highlight.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-3 w-3 text-white/30" />
                            </div>
                          )}
                        </div>
                      ))}
                      {highlights.length === 0 && (
                        <p className="col-span-2 text-[10px] text-white/50 text-center">No highlights</p>
                      )}
                    </div>
                  </div>

                  {/* Quadrant 4: Fan Love */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span className="text-xs font-bold text-white uppercase">Fan Love</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center">
                      <div className="text-3xl font-bold text-pink-400">{shoutoutCount}</div>
                      <div className="text-[10px] text-white/60 uppercase mb-2">Total Cheers</div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {shoutouts.slice(0, 6).map((shoutout, i) => (
                          <span key={i} className="text-lg">{shoutout.emoji}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/60 text-xs mt-3">
                  <RotateCw className="h-3 w-3" />
                  <span>Tap to flip back</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Buttons (outside flip card) */}
        <div className="flex gap-2 mb-6">
          <Button 
            onClick={(e) => { e.stopPropagation(); shareToSocial('twitter'); }}
            className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-sm"
            data-testid="button-share-twitter"
          >
            Twitter
          </Button>
          <Button 
            onClick={(e) => { e.stopPropagation(); shareToSocial('whatsapp'); }}
            className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-sm"
            data-testid="button-share-whatsapp"
          >
            WhatsApp
          </Button>
          <Button 
            onClick={(e) => { e.stopPropagation(); copyShareLink(); }}
            className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-full text-sm font-bold"
            data-testid="button-copy-link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>

        {/* Season Stats */}
        {topStats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Season Stats
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {topStats.map(([statName, value]) => (
                <Card key={statName} className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{value}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider truncate">{statName}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Highlights
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {highlights.slice(0, 4).map((highlight) => (
                <div key={highlight.id} className="relative aspect-video rounded-xl overflow-hidden bg-black/20">
                  {highlight.thumbnail ? (
                    <img src={highlight.thumbnail} alt={highlight.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white font-medium truncate">{highlight.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shoutouts */}
        {shoutouts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Recent Cheers
            </h3>
            <div className="flex flex-wrap gap-2">
              {shoutouts.slice(0, 20).map((shoutout, i) => (
                <div 
                  key={shoutout.id || i} 
                  className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1"
                >
                  <span className="text-lg">{shoutout.emoji}</span>
                  {shoutout.supporterName && (
                    <span className="text-xs text-muted-foreground">{shoutout.supporterName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hot Streak */}
        {stats.hotStreak && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <div className="font-bold text-orange-500">Hot Streak!</div>
                  <div className="text-sm text-muted-foreground">{stats.streakLength} games strong</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Follow Me Section */}
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Follow Me
            <Badge variant="secondary" className="ml-auto text-xs">
              <Users className="h-3 w-3 mr-1" />
              {followerData?.count || 0} followers
            </Badge>
          </h3>
          
          <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Get notified when {athlete.name || athlete.username} shares updates!
              </p>
              
              {!isFollowing ? (
                <Button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  data-testid="button-follow-athlete"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {isFollowLoading ? 'Setting up...' : 'Follow & Get Notified'}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-600 rounded-lg py-2 px-4">
                    <Bell className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">Following!</span>
                  </div>
                  <Button
                    onClick={handleUnfollow}
                    disabled={isFollowLoading}
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    data-testid="button-unfollow-athlete"
                  >
                    <BellOff className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Show Your Support Section */}
        <div className="mb-6">
          <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Show Your Support
          </h3>
          
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 space-y-4">
              {/* Visitor Name Input */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter your name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="flex-1 bg-background/50"
                  data-testid="input-visitor-name"
                />
              </div>

              {/* Like and Comment Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleLike}
                  disabled={hasLiked || likeMutation.isPending}
                  className={`flex-1 ${hasLiked ? 'bg-pink-500/20 text-pink-500' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
                  data-testid="button-like-profile"
                >
                  <Heart className={`h-4 w-4 mr-2 ${hasLiked ? 'fill-pink-500' : ''}`} />
                  {hasLiked ? 'Liked!' : 'Like'} ({likesData?.count || 0})
                </Button>
                <Button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-toggle-comment"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment ({comments.length})
                </Button>
              </div>

              {/* Comment Form */}
              {showCommentForm && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <Textarea
                    placeholder="Leave an encouraging message..."
                    value={commentMessage}
                    onChange={(e) => setCommentMessage(e.target.value)}
                    maxLength={500}
                    className="bg-background/50 resize-none"
                    rows={3}
                    data-testid="input-comment-message"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{commentMessage.length}/500</span>
                    <Button
                      onClick={handleComment}
                      disabled={commentMutation.isPending || !commentMessage.trim()}
                      size="sm"
                      className="bg-primary"
                      data-testid="button-submit-comment"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        {comments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Messages ({comments.length})
            </h3>
            <div className="space-y-2">
              {comments.slice(0, 10).map((comment) => (
                <Card key={comment.id} className="bg-card/80 backdrop-blur-sm border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {comment.visitorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{comment.visitorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {comments.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  + {comments.length - 10} more messages
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-2">Powered by</p>
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="STATFYR" className="h-6 w-6" />
            <span className="font-display font-bold">STATF<span className="text-orange-500">Y</span>R</span>
          </div>
        </div>
      </main>
    </div>
  );
}
