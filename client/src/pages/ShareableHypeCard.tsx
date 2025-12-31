import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Copy, Check, Home, Star, Flame, Zap, Trophy, Video, Clock, TrendingUp, Heart, MessageCircle, Send, User, X, Bell, BellOff, Users, Calendar, ChevronUp, MapPin, Download, Smartphone, Plus, ExternalLink } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { requestNotificationPermission, isIOS, isAndroid, isChrome, isStandalonePWA, isSafari, initOneSignal, getPushNotificationStatus } from "@/lib/onesignal";
import { DashboardBackground } from "@/components/layout/DashboardBackground";

import logoImage from "@assets/red_logo-removebg-preview_1766973716904.png";
import hypeCardBg from "@assets/hype_card_BG_1767219165965.png";
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

type HypeTab = "events" | "highlights" | "stats" | "hypes";

export default function ShareableHypeCard(props: any) {
  const athleteId = props.params?.id;
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [commentMessage, setCommentMessage] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [activeTab, setActiveTab] = useState<HypeTab | null>(null);
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

  // Load stored player ID on mount and check follow status
  useEffect(() => {
    if (typeof window !== 'undefined' && athleteId) {
      const storedToken = localStorage.getItem(fcmTokenStorageKey);
      if (storedToken) {
        setFollowerFcmToken(storedToken);
        checkFollowStatus(athleteId, storedToken).then(({ isFollowing }) => {
          setIsFollowing(isFollowing);
        }).catch(() => {});
      }
      
      // Initialize OneSignal (wrapped in try-catch to prevent crashes on unsupported browsers)
      try {
        initOneSignal().catch(() => {
          // Silently fail - notifications will just not work
        });
      } catch (e) {
        // Silently fail
      }
    }
  }, [athleteId]);

  // Set dynamic manifest for this athlete's HYPE card PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && athleteId) {
      const existingManifest = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      const hadExistingManifest = !!existingManifest;
      const originalHref = hadExistingManifest ? existingManifest.href : null;
      
      if (existingManifest) {
        // Update existing manifest href
        existingManifest.href = `/api/athletes/${athleteId}/manifest.json`;
      } else {
        // Create new manifest link
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = `/api/athletes/${athleteId}/manifest.json`;
        manifestLink.id = `athlete-manifest-${athleteId}`;
        document.head.appendChild(manifestLink);
      }
      
      // Cleanup
      return () => {
        if (hadExistingManifest && originalHref !== null) {
          // Restore original href
          const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
          if (manifestLink) {
            manifestLink.href = originalHref;
          }
        } else {
          // Remove the manifest we created (no original existed)
          const addedManifest = document.querySelector(`link#athlete-manifest-${athleteId}`);
          if (addedManifest) {
            addedManifest.remove();
          }
        }
      };
    }
  }, [athleteId]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/athletes", athleteId, "public-profile"],
    queryFn: () => getPublicAthleteProfile(athleteId),
    enabled: !!athleteId,
  });

  // Update apple-mobile-web-app-title when athlete data loads
  useEffect(() => {
    if (typeof window !== 'undefined' && profile?.athlete) {
      const athleteName = profile.athlete.name || profile.athlete.username;
      const appTitle = `${athleteName} HYPE`;
      
      // Find existing meta tag
      const existingMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
      const hadExistingMeta = !!existingMeta;
      const originalContent = hadExistingMeta ? existingMeta.content : null;
      
      // Create or update meta tag
      let appleTitleMeta = existingMeta;
      if (!appleTitleMeta) {
        appleTitleMeta = document.createElement('meta');
        appleTitleMeta.name = 'apple-mobile-web-app-title';
        appleTitleMeta.id = `athlete-app-title-${athleteId}`;
        document.head.appendChild(appleTitleMeta);
      }
      appleTitleMeta.content = appTitle;
      
      // Also update the document title for better UX
      const originalTitle = document.title;
      document.title = appTitle;
      
      // Cleanup: restore original values or remove created meta
      return () => {
        if (hadExistingMeta && originalContent !== null) {
          const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
          if (meta) {
            meta.content = originalContent;
          }
        } else {
          const addedMeta = document.querySelector(`meta#athlete-app-title-${athleteId}`);
          if (addedMeta) {
            addedMeta.remove();
          }
        }
        document.title = originalTitle;
      };
    }
  }, [profile?.athlete, athleteId]);

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
    refetchInterval: 30000,
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
  const [followInstructions, setFollowInstructions] = useState<string | null>(null);
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [followFormName, setFollowFormName] = useState("");
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`install-prompt-dismissed-${athleteId}`) === 'true';
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for Android Chrome's beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Check if we should show install prompt for iOS Safari
  const shouldShowIOSInstallPrompt = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (installPromptDismissed) return false;
    return isIOS() && !isStandalonePWA();
  }, [installPromptDismissed]);

  // Check if we should show install prompt for Android Chrome
  const shouldShowAndroidInstallPrompt = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (installPromptDismissed) return false;
    if (isStandalonePWA()) return false;
    return isAndroid() && isChrome() && deferredPrompt !== null;
  }, [installPromptDismissed, deferredPrompt]);

  // Handle Android install button click
  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    
    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);
    
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      
      if (outcome === 'accepted') {
        toast.success("App installed! Open from your home screen.");
      } else {
        localStorage.setItem(`install-prompt-dismissed-${athleteId}`, 'true');
        setInstallPromptDismissed(true);
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  };

  const handleFollowClick = () => {
    setFollowError(null);
    setFollowInstructions(null);
    setShowFollowForm(true);
  };

  const [followStep, setFollowStep] = useState<string>("");
  
  const handleFollowSubmit = async () => {
    setFollowError(null);
    setFollowInstructions(null);
    setFollowStep("");
    
    if (!followFormName.trim()) {
      setFollowError("Please enter your name");
      return;
    }
    
    setIsFollowLoading(true);
    
    try {
      setFollowStep("Requesting notification permission...");
      
      const result = await requestNotificationPermission();
      
      if (!result.granted || !result.playerId) {
        const errorMsg = result.error || "Please allow notifications to follow this athlete";
        setFollowError(errorMsg);
        setFollowStep("");
        if (result.instructions) {
          setFollowInstructions(result.instructions);
        }
        toast.error(errorMsg);
        setIsFollowLoading(false);
        return;
      }
      
      setFollowStep("Got permission! Registering with server...");
      console.log('[Follow] Registering follower with OneSignal player ID:', result.playerId);
      
      const requestBody = { 
        followerName: followFormName.trim(),
        onesignalPlayerId: result.playerId
      };
      
      const res = await fetch(`/api/athletes/${athleteId}/followers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      setFollowStep("Waiting for server response...");
      const data = await res.json();
      console.log('[Follow] Server response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to follow athlete");
      }
      
      setFollowStep("Success!");
      setFollowerFcmToken(result.playerId);
      setIsFollowing(true);
      setShowFollowForm(false);
      setVisitorName(followFormName.trim());
      localStorage.setItem(fcmTokenStorageKey, result.playerId);
      localStorage.setItem(visitorNameStorageKey, followFormName.trim());
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "followers", "count"] });
      toast.success("You're now following this athlete!");
    } catch (error: any) {
      console.error('[Follow] Error:', error);
      const errorMsg = error.message || "Failed to follow athlete";
      setFollowError(errorMsg);
      setFollowStep("");
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
      <header className="sticky top-0 z-50 bg-background border-b border-border">
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

      <main className="max-w-sm mx-auto px-4 pt-6">
        {/* HYPE Card - Trading Card Style */}
        <Card className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-cyan-500/40 overflow-hidden rounded-2xl" data-testid="hype-card">
          <CardContent className="p-0">
            {/* Vertical Avatar Section - 2:3 aspect ratio */}
            <div className="relative aspect-[2/3] bg-gradient-to-b from-slate-700 to-slate-800">
              {athlete.avatar ? (
                <img src={athlete.avatar} alt={athlete.name || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-32 w-32 rounded-full border-4 border-cyan-500/50 bg-slate-700 flex items-center justify-center">
                    <span className="text-4xl text-cyan-400">
                      {(athlete.name || athlete.username || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-4 pt-12">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white uppercase">
                      {athlete.name || athlete.username}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {membership?.jerseyNumber && `#${membership.jerseyNumber} `}
                      {membership?.position && `• ${membership.position}`}
                    </p>
                  </div>
                  <Badge className="bg-blue-500/80 text-white border-0">
                    {new Date().getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
              <button
                onClick={() => setActiveTab(activeTab === "events" ? null : "events")}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all ${
                  activeTab === "events"
                    ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
                }`}
                data-testid="tab-events"
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs font-medium">Events</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "highlights" ? null : "highlights")}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all ${
                  activeTab === "highlights"
                    ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
                }`}
                data-testid="tab-highlights"
              >
                <Video className="h-5 w-5" />
                <span className="text-xs font-medium">Highlights</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "stats" ? null : "stats")}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all ${
                  activeTab === "stats"
                    ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
                }`}
                data-testid="tab-stats"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs font-medium">Stats</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "hypes" ? null : "hypes")}
                className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all ${
                  activeTab === "hypes"
                    ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
                }`}
                data-testid="tab-hypes"
              >
                <Flame className="h-5 w-5" />
                <span className="text-xs font-medium">HYPES</span>
              </button>
            </div>

            {/* Tab Content - only shown when a tab is selected */}
            <AnimatePresence>
              {activeTab && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 min-h-[140px]">
                    {activeTab === "events" && (
                      <div className="space-y-2">
                        {upcomingEvents.length > 0 ? (
                          upcomingEvents.map((event: TeamEvent) => (
                            <div key={event.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-cyan-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{event.title}</p>
                                <p className="text-xs text-slate-400">{format(new Date(event.date), "MMM d, yyyy")}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-slate-500 py-4">No upcoming events</p>
                        )}
                      </div>
                    )}
                    {activeTab === "highlights" && (
                      <div className="grid grid-cols-2 gap-2">
                        {highlights.slice(0, 4).map((highlight) => (
                          <div key={highlight.id} className="relative aspect-video rounded-lg overflow-hidden bg-slate-800">
                            {highlight.thumbnail ? (
                              <img src={highlight.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-6 w-6 text-slate-600" />
                              </div>
                            )}
                          </div>
                        ))}
                        {highlights.length === 0 && (
                          <p className="col-span-2 text-center text-slate-500 py-4">No highlights yet</p>
                        )}
                      </div>
                    )}
                    {activeTab === "stats" && (
                      <div className="space-y-2">
                        {topStats.slice(0, 4).map(([statName, statData]) => {
                          const data = statData as any;
                          const displayValue = typeof data === 'object' && data !== null 
                            ? (data.total ?? data.perGame ?? 0)
                            : data;
                          const displayName = typeof data === 'object' && data !== null && data.name
                            ? data.name
                            : statName;
                          return (
                            <div key={statName} className="flex justify-between items-center p-2 bg-slate-800/50 rounded-lg">
                              <span className="text-sm text-slate-400">{displayName}</span>
                              <span className="text-lg font-bold text-cyan-400">{displayValue}</span>
                            </div>
                          );
                        })}
                        {topStats.length === 0 && (
                          <p className="text-center text-slate-500 py-4">No stats yet</p>
                        )}
                      </div>
                    )}
                    {activeTab === "hypes" && (
                      <div className="space-y-2">
                        {hypePosts.slice(0, 3).map((post: HypePost) => (
                          <div key={post.id} className="flex gap-3 p-2 bg-slate-800/50 rounded-lg">
                            <img
                              src={HYPE_TEMPLATE_IMAGES[post.templateImage] || clutchImg}
                              alt=""
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white line-clamp-2">{post.message}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {format(new Date(post.createdAt), "MMM d")}
                              </p>
                            </div>
                          </div>
                        ))}
                        {hypePosts.length === 0 && (
                          <p className="text-center text-slate-500 py-4">No HYPE posts yet</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
              <span className="text-xs font-display font-bold text-slate-500 tracking-widest">HYPE CARD™</span>
              <span className="text-xs text-cyan-500/70 font-mono">
                {membership?.jerseyNumber ? `#${membership.jerseyNumber}` : membership?.position || ""}
                {membership?.team && ` • ${membership.team.name.slice(0, 3).toUpperCase()}`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Season Stats */}
        {topStats.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Season Stats
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {topStats.map(([statName, statData]) => {
                const data = statData as any;
                const displayValue = typeof data === 'object' && data !== null 
                  ? (data.total ?? data.perGame ?? 0)
                  : data;
                const displayName = typeof data === 'object' && data !== null && data.name
                  ? data.name
                  : statName;
                return (
                  <Card key={statName} className="bg-card border-white/10">
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{displayValue}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider truncate">{displayName}</div>
                    </CardContent>
                  </Card>
                );
              })}
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
                  className="bg-card border border-white/10 rounded-xl overflow-hidden"
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
                  className="bg-card border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1"
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
          
          {/* Install App Prompt for iOS Safari */}
          {shouldShowIOSInstallPrompt && !showInstallPrompt && (
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Stay up to date with {athlete?.name?.split(' ')[0] || 'this athlete'}'s journey.
                    </p>
                    <Button
                      onClick={() => setShowInstallPrompt(true)}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
                      data-testid="button-show-install-ios"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      INSTALL THE APP
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground -mt-1 -mr-2"
                    onClick={() => {
                      localStorage.setItem(`install-prompt-dismissed-${athleteId}`, 'true');
                      setInstallPromptDismissed(true);
                    }}
                    data-testid="button-dismiss-install"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Install App Prompt for Android Chrome */}
          {shouldShowAndroidInstallPrompt && (
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Smartphone className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-3">
                      Stay up to date with {athlete?.name?.split(' ')[0] || 'this athlete'}'s journey.
                    </p>
                    <Button
                      onClick={handleAndroidInstall}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold"
                      data-testid="button-install-android"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      INSTALL THE APP
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground -mt-1 -mr-2"
                    onClick={() => {
                      localStorage.setItem(`install-prompt-dismissed-${athleteId}`, 'true');
                      setInstallPromptDismissed(true);
                    }}
                    data-testid="button-dismiss-install-android"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Install Instructions Modal */}
          <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
            <DialogContent className="max-w-sm mx-auto bg-gradient-to-b from-zinc-900 to-black border-zinc-700">
              <DialogHeader className="text-center pb-2">
                <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                  {athlete?.avatar ? (
                    <img src={athlete.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-white" />
                  )}
                </div>
                <DialogTitle className="text-xl font-display text-white">
                  Install {athlete?.name?.split(' ')[0] || 'Athlete'}'s HYPE Card
                </DialogTitle>
                <p className="text-sm text-zinc-400 mt-1">
                  Add to your home screen for the full experience
                </p>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Step 1: Tap Share */}
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="8" width="14" height="12" rx="2" />
                      <path d="M12 2v10M8 6l4-4 4 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">1</span>
                      <span className="font-semibold text-white">Tap Share</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Look for the share icon at the bottom of Safari
                    </p>
                  </div>
                </div>

                {/* Step 2: Add to Home Screen */}
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex-shrink-0 w-12 h-12 bg-zinc-600 rounded-xl flex items-center justify-center">
                    <div className="relative">
                      <div className="w-6 h-6 border-2 border-white rounded-md" />
                      <Plus className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                      <span className="font-semibold text-white">Add to Home Screen</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Scroll down in the menu and tap this option
                    </p>
                  </div>
                </div>

                {/* Step 3: Tap Add */}
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                      <span className="font-semibold text-white">Tap "Add"</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Confirm by tapping Add in the top right corner
                    </p>
                  </div>
                </div>
              </div>

              {/* What you'll get */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                <h4 className="font-semibold text-orange-400 mb-2 text-sm">What you'll get:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Bell className="h-3.5 w-3.5 text-orange-400" />
                    <span>Push notifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Smartphone className="h-3.5 w-3.5 text-orange-400" />
                    <span>Home screen icon</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Zap className="h-3.5 w-3.5 text-orange-400" />
                    <span>Instant access</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <ExternalLink className="h-3.5 w-3.5 text-orange-400" />
                    <span>Full screen mode</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-2 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                onClick={() => setShowInstallPrompt(false)}
                data-testid="button-close-install"
              >
                Got it
              </Button>
            </DialogContent>
          </Dialog>

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
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg space-y-2">
                      <p className="text-red-400 text-sm font-medium">{followError}</p>
                      {followInstructions && (
                        <p className="text-amber-400 text-xs">{followInstructions}</p>
                      )}
                    </div>
                  )}
                  {followStep && (
                    <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 text-xs font-mono">{followStep}</p>
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
                        setFollowInstructions(null);
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
          <Card className="bg-card border-white/10">
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
                <Card key={comment.id} className="bg-card border-white/10">
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
