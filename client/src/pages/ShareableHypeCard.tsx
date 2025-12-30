import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Share2, Copy, Check, Home, Star, Flame, Zap, Trophy, Video, Clock, TrendingUp, Heart, MessageCircle, Send, User, X, Bell, BellOff, Users, Calendar, ChevronUp, MapPin } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { requestFollowerNotificationPermission } from "@/lib/firebase";

import logoImage from "@assets/red_logo-removebg-preview_1766973716904.png";
import clutchImg from "@assets/clutch_1766970267487.png";
import dominationImg from "@assets/domination_1766970267487.png";
import gamechangerImg from "@assets/gamechanger_1766970267487.png";
import highlightImg from "@assets/highlight_1766970267487.png";
import hustleImg from "@assets/hustle_1766970267487.png";
import lockedinImg from "@assets/lockedin_1766970267487.png";
import milestoneImg from "@assets/milestone_1766970267487.png";
import nextlevelImg from "@assets/nextlevel_1766970267487.png";
import unstoppableImg from "@assets/unstoppable_1766970267487.png";
import victoryImg from "@assets/victory_1766970267487.png";

const HYPE_TEMPLATE_IMAGES: Record<string, string> = {
  clutch: clutchImg,
  domination: dominationImg,
  gamechanger: gamechangerImg,
  highlight: highlightImg,
  hustle: hustleImg,
  lockedin: lockedinImg,
  milestone: milestoneImg,
  nextlevel: nextlevelImg,
  unstoppable: unstoppableImg,
  victory: victoryImg,
};

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

type HypePost = {
  id: string;
  athleteId: string;
  templateImage: string;
  message: string;
  highlightId: string | null;
  createdAt: string;
  highlight?: {
    id: string;
    title: string | null;
    publicUrl: string | null;
  };
};

type TeamEvent = {
  id: string;
  teamId: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  details: string | null;
};

async function getTeamEvents(teamId: string): Promise<TeamEvent[]> {
  const res = await fetch(`/api/teams/${teamId}/events`);
  if (!res.ok) return [];
  return res.json();
}

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

async function getHypePosts(athleteId: string): Promise<HypePost[]> {
  const res = await fetch(`/api/athletes/${athleteId}/hype-posts`);
  if (!res.ok) throw new Error("Failed to fetch HYPE posts");
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerFcmToken, setFollowerFcmToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Persist liked state in localStorage to prevent spam
  const likeStorageKey = `profile-liked-${athleteId}`;
  const fcmTokenStorageKey = `follower-fcm-token-${athleteId}`;
  const visitorNameStorageKey = `visitor-name-${athleteId}`;
  
  const [hasLiked, setHasLiked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(likeStorageKey) === 'true';
    }
    return false;
  });
  
  // Persist visitor name in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && athleteId) {
      const storedName = localStorage.getItem(visitorNameStorageKey);
      if (storedName) {
        setVisitorName(storedName);
      }
    }
  }, [athleteId]);
  
  // Save visitor name when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && athleteId && visitorName.trim()) {
      localStorage.setItem(visitorNameStorageKey, visitorName.trim());
    }
  }, [visitorName, athleteId]);

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

  const { data: hypePosts = [] } = useQuery({
    queryKey: ["/api/athletes", athleteId, "hype-posts"],
    queryFn: () => getHypePosts(athleteId),
    enabled: !!athleteId,
  });

  // Fetch team events for the upcoming games section
  const teamId = profile?.membership?.team?.id;
  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", teamId, "events"],
    queryFn: () => getTeamEvents(String(teamId)),
    enabled: !!teamId,
  });

  // Get upcoming events (next 3 future events)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return teamEvents
      .filter((e: TeamEvent) => new Date(e.date) >= now)
      .sort((a: TeamEvent, b: TeamEvent) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [teamEvents]);

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
  const [followError, setFollowError] = useState<string | null>(null);
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [followFormName, setFollowFormName] = useState("");

  const handleFollowClick = () => {
    setFollowError(null);
    setShowFollowForm(true);
  };

  const handleFollowSubmit = async () => {
    alert("DEBUG 1: handleFollowSubmit called, followFormName=" + followFormName);
    setFollowError(null);
    alert("DEBUG 1.5: After setFollowError(null)");
    
    if (!followFormName.trim()) {
      alert("DEBUG 1.6: Name is empty, returning");
      setFollowError("Please enter your name");
      return;
    }
    
    alert("DEBUG 1.7: Name is valid, about to set loading");
    setIsFollowLoading(true);
    alert("DEBUG 2: About to request notification permission");
    
    try {
      let result;
      try {
        result = await requestFollowerNotificationPermission();
        alert("DEBUG 3: Permission result: " + JSON.stringify(result));
      } catch (permError: any) {
        alert("DEBUG 3-ERROR: " + (permError.message || String(permError)));
        const errorMsg = permError.message || "Failed to set up notifications. Please try again.";
        setFollowError(errorMsg);
        toast.error(errorMsg);
        setIsFollowLoading(false);
        return;
      }
      
      if (!result || !result.token) {
        const errorMsg = result?.error || "Please allow notifications to follow this athlete";
        alert("DEBUG 4: No token, error: " + errorMsg);
        setFollowError(errorMsg);
        toast.error(errorMsg);
        setIsFollowLoading(false);
        return;
      }
      
      console.log('[Follow] Got token, registering follower...');
      const res = await fetch(`/api/athletes/${athleteId}/followers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fcmToken: result.token, followerName: followFormName.trim() }),
      });
      
      const data = await res.json();
      console.log('[Follow] Server response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to follow athlete");
      }
      
      setFollowerFcmToken(result.token);
      setIsFollowing(true);
      setShowFollowForm(false);
      setVisitorName(followFormName.trim());
      localStorage.setItem(fcmTokenStorageKey, result.token);
      localStorage.setItem(visitorNameStorageKey, followFormName.trim());
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "followers", "count"] });
      toast.success("You're now following this athlete!");
    } catch (error: any) {
      console.error('[Follow] Error:', error);
      const errorMsg = error.message || "Failed to follow athlete";
      setFollowError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!followerFcmToken) return;
    
    setIsFollowLoading(true);
    try {
      const res = await fetch(`/api/athletes/${athleteId}/followers?token=${encodeURIComponent(followerFcmToken)}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to unfollow");
      }
      
      setIsFollowing(false);
      localStorage.removeItem(fcmTokenStorageKey);
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "followers", "count"] });
      toast.success("Unfollowed");
    } catch (error: any) {
      toast.error(error.message || "Failed to unfollow");
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
    <>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/dashboard')}
            className="text-foreground"
            data-testid="button-close-hype-card"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="STATFYR" className="h-6 w-6" />
            <span className="text-sm font-display font-bold text-slate-900 dark:text-white">STATF<span className="text-orange-500">Y</span>R</span>
          </div>
          <Button variant="ghost" size="icon" onClick={copyShareLink} className="text-foreground" data-testid="button-share">
            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Share2 className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* HYPE Card with Sliding Detail Grid */}
        <div className="relative mb-6">
          {/* Main HYPE Card */}
          <div 
            className="relative cursor-pointer mx-auto w-[65%]" 
            style={{ aspectRatio: "3/4" }}
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            data-testid="hype-card"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl">
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

              <div className="absolute top-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <span className="text-lg font-bold text-slate-800">{rating}</span>
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h2 className="text-3xl font-display font-bold mb-1" style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000, 2px 0 0 #000' }}>
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
                  <ChevronUp className={`h-3 w-3 transition-transform duration-300 ${isDetailOpen ? 'rotate-180' : ''}`} />
                  <span>{isDetailOpen ? 'Tap to close' : 'Tap to explore'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sliding Detail Grid */}
          <AnimatePresence>
            {isDetailOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="mt-4 grid grid-cols-2 gap-3"
                data-testid="detail-grid"
              >
                {/* Events Card */}
                <Card className="bg-gradient-to-br from-blue-900/80 to-blue-800/70 border-blue-500/40 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <span className="text-sm font-bold text-white uppercase">Upcoming</span>
                    </div>
                    <div className="space-y-2">
                      {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event: TeamEvent) => (
                          <div key={event.id} className="bg-white/5 rounded-lg p-2">
                            <div className="text-xs font-semibold text-white truncate">{event.title}</div>
                            <div className="flex items-center gap-1 text-[10px] text-white/60 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(event.date), "MMM d")}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 text-[10px] text-white/60">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-white/50 text-center py-2">No upcoming events</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Highlights Card */}
                <Card className="bg-gradient-to-br from-purple-900/80 to-purple-800/70 border-purple-500/40 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="h-5 w-5 text-purple-400" />
                      <span className="text-sm font-bold text-white uppercase">Highlights</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{highlights.length}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {highlights.slice(0, 4).map((highlight) => (
                        <div key={highlight.id} className="relative aspect-video rounded-lg overflow-hidden bg-black/30">
                          {highlight.thumbnail ? (
                            <img src={highlight.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-4 w-4 text-white/30" />
                            </div>
                          )}
                        </div>
                      ))}
                      {highlights.length === 0 && (
                        <p className="col-span-2 text-xs text-white/50 text-center py-4">No highlights yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card className="bg-gradient-to-br from-green-900/80 to-green-800/70 border-green-500/40 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      <span className="text-sm font-bold text-white uppercase">Stats</span>
                    </div>
                    <div className="space-y-2">
                      {topStats.slice(0, 4).map(([statName, value]) => (
                        <div key={statName} className="flex justify-between items-center bg-white/5 rounded-lg px-2 py-1.5">
                          <span className="text-xs text-white/70 truncate">{statName}</span>
                          <span className="text-sm font-bold text-green-400">{value}</span>
                        </div>
                      ))}
                      {topStats.length === 0 && (
                        <p className="text-xs text-white/50 text-center py-4">No stats yet</p>
                      )}
                      {stats.hotStreak && (
                        <div className="flex items-center justify-center gap-1 bg-orange-500/20 px-2 py-1.5 rounded-full mt-2">
                          <Flame className="h-3 w-3 text-orange-500" />
                          <span className="text-xs text-orange-400 font-bold">{stats.streakLength} Game Streak!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* HYPES Card */}
                <Card className="bg-gradient-to-br from-orange-900/80 to-red-800/70 border-orange-500/40 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="h-5 w-5 text-orange-400" />
                      <span className="text-sm font-bold text-white uppercase">HYPES</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{hypePosts.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {hypePosts.slice(0, 2).map((post: HypePost) => (
                        <div key={post.id} className="flex gap-2 bg-white/5 rounded-lg p-2">
                          <img
                            src={HYPE_TEMPLATE_IMAGES[post.templateImage] || clutchImg}
                            alt=""
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white line-clamp-2">{post.message}</p>
                            <p className="text-[10px] text-white/50 mt-0.5">
                              {format(new Date(post.createdAt), "MMM d")}
                            </p>
                          </div>
                        </div>
                      ))}
                      {hypePosts.length === 0 && (
                        <p className="text-xs text-white/50 text-center py-4">No HYPE posts yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share Buttons */}
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

        {/* HYPE Posts */}
        {hypePosts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Latest HYPE
            </h3>
            <div className="space-y-3">
              {hypePosts.slice(0, 5).map((post) => (
                <div 
                  key={post.id}
                  className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
                  data-testid={`hype-post-${post.id}`}
                >
                  <div className="flex gap-3 p-3">
                    <img
                      src={HYPE_TEMPLATE_IMAGES[post.templateImage] || clutchImg}
                      alt="HYPE template"
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{post.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </p>
                      {post.highlight && post.highlight.publicUrl && (
                        <div className="mt-2">
                          <a
                            href={post.highlight.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-400"
                          >
                            <Video className="h-3 w-3" />
                            Watch highlight
                          </a>
                        </div>
                      )}
                    </div>
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
              {isFollowing ? (
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
              ) : showFollowForm ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Enter your name to follow {athlete.name || athlete.username}
                  </p>
                  <Input
                    placeholder="Your name"
                    value={followFormName}
                    onChange={(e) => setFollowFormName(e.target.value)}
                    data-testid="input-follow-name"
                    autoFocus
                  />
                  {followError && (
                    <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {followError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleFollowSubmit}
                      disabled={isFollowLoading || !followFormName.trim()}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white disabled:opacity-50"
                      data-testid="button-submit-follow"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {isFollowLoading ? 'Setting up...' : 'Get Notified'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowFollowForm(false);
                        setFollowError(null);
                        setFollowFormName("");
                      }}
                      variant="outline"
                      disabled={isFollowLoading}
                      data-testid="button-cancel-follow"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/70 text-center">
                    You'll need to allow notifications when prompted
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Get notified when {athlete.name || athlete.username} shares updates!
                  </p>
                  <Button
                    onClick={handleFollowClick}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    data-testid="button-follow-athlete"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Follow & Get Notified
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Like & Comment Section */}
        <div className="mb-6">
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardContent className="p-4 space-y-4">
              {!visitorName.trim() && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Enter your name to like or comment
                  </p>
                  <Input
                    placeholder="Your name"
                    value={visitorName}
                    onChange={(e) => {
                      setVisitorName(e.target.value);
                      if (e.target.value.trim()) {
                        localStorage.setItem(visitorNameStorageKey, e.target.value.trim());
                      }
                    }}
                    className="bg-background/50"
                    data-testid="input-visitor-name"
                  />
                </div>
              )}
              {/* Like and Comment Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleLike}
                  disabled={hasLiked || likeMutation.isPending || !visitorName.trim()}
                  className={`flex-1 ${hasLiked ? 'bg-pink-500/20 text-pink-500' : 'bg-pink-500 hover:bg-pink-600 text-white'} disabled:opacity-50`}
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
    </>
  );
}
