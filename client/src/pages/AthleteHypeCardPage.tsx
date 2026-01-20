import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Share2, CalendarClock, Video, TrendingUp, Zap,
  Heart, MessageCircle, Send, Copy, Check
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import {
  getTeamMembers, getTeamEvents, getAllTeamHighlights, getAthleteStats,
  type TeamMember, type Event, type HighlightVideo
} from "@/lib/api";

import logoImage from "@assets/red_logo-removebg-preview_1766973716904.png";
import hypeCardBg from "@assets/hype_card_BG_1767219165965.png";

type HypeTab = "events" | "highlights" | "stats" | "hypes";

export default function AthleteHypeCardPage() {
  const [, setLocation] = useLocation();
  const { user, currentTeam } = useUser();

  const [activeTab, setActiveTab] = useState<HypeTab | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ name: string; text: string; time: string }>>([]);
  const [visitorName, setVisitorName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/athlete/${user?.id}` : "";

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const currentMembership = teamMembers.find((m: TeamMember) => m.userId === user?.id);

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamHighlights = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: athleteStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", user?.id, "stats"],
    queryFn: () => currentTeam && user ? getAthleteStats(currentTeam.id, user.id) : Promise.resolve(null),
    enabled: !!currentTeam && !!user,
  });

  const upcomingEvents = teamEvents
    .filter((e: Event) => new Date(e.date) >= new Date())
    .slice(0, 5);

  const myHighlights = teamHighlights
    .filter((h: HighlightVideo) => h.uploaderId === String(user?.id))
    .slice(0, 6);

  const hypeScore = Math.min(100, (athleteStats as any)?.hypeCount || 0);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleLike = () => {
    if (!visitorName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    if (!visitorName.trim()) {
      toast.error("Please enter your name first");
      return;
    }
    if (!commentText.trim()) return;
    setComments(prev => [...prev, { name: visitorName, text: commentText, time: "Just now" }]);
    setCommentText("");
    setShowCommentForm(false);
    toast.success("Comment added!");
  };

  const tabs = [
    { id: "events" as const, label: "Events", icon: CalendarClock },
    { id: "highlights" as const, label: "Highlights", icon: Video },
    { id: "stats" as const, label: "Stats", icon: TrendingUp },
    { id: "hypes" as const, label: "Hypes", icon: Zap },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "events":
        return (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event: Event) => (
                <div key={event.id} className="flex-shrink-0 w-32 bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-cyan-400 font-medium">{event.type}</p>
                  <p className="text-sm font-semibold mt-1">{format(new Date(event.date), "MMM d")}</p>
                  {event.location && <p className="text-xs text-slate-400 mt-1 truncate">{event.location}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 w-full text-center py-4">No upcoming events</p>
            )}
          </div>
        );

      case "highlights":
        return (
          <div className="grid grid-cols-2 gap-2">
            {myHighlights.length > 0 ? (
              myHighlights.map((highlight: HighlightVideo) => (
                <div key={highlight.id} className="aspect-video bg-slate-800/50 rounded-lg overflow-hidden relative">
                  {highlight.thumbnailKey ? (
                    <img src={highlight.thumbnailKey} alt={highlight.title || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-slate-600" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="col-span-2 text-sm text-slate-500 text-center py-4">No highlights yet</p>
            )}
          </div>
        );

      case "stats":
        return (
          <div className="grid grid-cols-2 gap-2">
            {athleteStats?.stats && Object.keys(athleteStats.stats).length > 0 ? (
              Object.entries(athleteStats.stats).slice(0, 4).map(([key, stat]) => {
                const statValue = typeof stat === 'object' && stat !== null ? (stat as any).total || 0 : stat;
                return (
                  <div key={key} className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{statValue}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{key}</p>
                  </div>
                );
              })
            ) : (
              <p className="col-span-2 text-sm text-slate-500 text-center py-4">No stats recorded yet</p>
            )}
          </div>
        );

      case "hypes":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src={logoImage} alt="Hype" className="h-8 w-8 drop-shadow-[0_0_8px_rgba(255,140,0,0.8)]" />
                <span className="text-3xl font-bold text-orange-400">{(athleteStats as any)?.hypeCount || 0}</span>
              </div>
              <p className="text-sm text-slate-400">Total Hypes Received</p>
            </div>
            <p className="text-center text-slate-500 text-sm">
              Share your HYPE Card to receive more hypes from supporters!
            </p>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <>
        <div className="fixed inset-0 z-0">
          <img src={hypeCardBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/70" />
        </div>
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <p className="text-slate-400">Please log in to view your HYPE Card</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <img src={hypeCardBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/70" />
      </div>
      <div className="min-h-screen pb-8 relative z-10">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto font-thin">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/athlete/dashboard")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg uppercase tracking-wide">
              <span className="font-marker text-orange-500 text-[26px]">HYPE</span>
              <span className="font-display font-thin text-[22px]"> Card</span>
            </h1>
            <Button variant="ghost" size="icon" onClick={handleShare} data-testid="button-share">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="max-w-sm mx-auto px-4 pt-6">
          <Card className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-cyan-500/40 overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              {/* Vertical Avatar Section - 2:3 aspect ratio */}
              <div className="relative aspect-[2/3] bg-gradient-to-b from-slate-700 to-slate-800">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="h-32 w-32 border-4 border-cyan-500/50">
                      <AvatarFallback className="bg-slate-700 text-cyan-400 text-4xl">
                        {user.name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-4 pt-12">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display font-bold text-2xl text-white uppercase">
                        {user.name || user.username}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        {currentMembership?.jerseyNumber && `#${currentMembership.jerseyNumber} `}
                        {currentMembership?.position && `• ${currentMembership.position}`}
                      </p>
                      {/* Extended Profile Stats */}
                      {(user as any)?.bio && (
                        <p className="text-xs text-slate-300 mt-2 line-clamp-2">{(user as any).bio}</p>
                      )}
                      {((user as any)?.height || (user as any)?.weight || (user as any)?.handedness || (user as any)?.footedness) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(user as any)?.height && (
                            <span className="text-xs bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded">{(user as any).height}</span>
                          )}
                          {(user as any)?.weight && (
                            <span className="text-xs bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded">{(user as any).weight}</span>
                          )}
                          {(user as any)?.handedness && (
                            <span className="text-xs bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded capitalize">{(user as any).handedness === 'ambidextrous' ? 'Both Hands' : `${(user as any).handedness}-handed`}</span>
                          )}
                          {(user as any)?.footedness && (
                            <span className="text-xs bg-slate-800/80 text-cyan-300 px-2 py-0.5 rounded capitalize">{(user as any).footedness === 'both' ? 'Both Feet' : `${(user as any).footedness}-footed`}</span>
                          )}
                        </div>
                      )}
                      {((user as any)?.gpa || (user as any)?.graduationYear) && (
                        <div className="flex gap-2 mt-1">
                          {(user as any)?.gpa && (
                            <span className="text-xs text-slate-400">GPA: <span className="text-white font-medium">{(user as any).gpa}</span></span>
                          )}
                          {(user as any)?.graduationYear && (
                            <span className="text-xs text-slate-400">Class of <span className="text-white font-medium">{(user as any).graduationYear}</span></span>
                          )}
                        </div>
                      )}
                      {((user as any)?.favoritePlayer || (user as any)?.favoriteTeam) && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(user as any)?.favoritePlayer && (
                            <span className="text-xs text-slate-400">Fav Player: <span className="text-white font-medium">{(user as any).favoritePlayer}</span></span>
                          )}
                          {(user as any)?.favoriteTeam && (
                            <span className="text-xs text-slate-400">Fav Team: <span className="text-white font-medium">{(user as any).favoriteTeam}</span></span>
                          )}
                        </div>
                      )}
                      {(user as any)?.teamAwards && (user as any).teamAwards.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(user as any).teamAwards.map((award: string, i: number) => (
                            <span key={i} className="text-xs bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded">{award}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge className="bg-blue-500/80 text-white border-0">
                      {new Date().getFullYear()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-700/50">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-all ${
                      activeTab === tab.id
                        ? "bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400"
                        : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                ))}
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
                      {renderTabContent()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700/50 bg-slate-900/50">
                <span className="text-xs font-display font-bold text-slate-500 tracking-widest">HYPE CARD™</span>
                <span className="text-xs text-cyan-500/70 font-mono">
                  {currentMembership?.jerseyNumber ? `#${currentMembership.jerseyNumber}` : currentMembership?.position || ""}
                  {currentTeam && ` • ${currentTeam.name}`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Like and Comment Section */}
          <Card className="mt-4 bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4 space-y-4">
              {/* Like/Comment Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-colors ${liked ? "text-red-500" : "text-slate-400 hover:text-red-400"}`}
                  data-testid="button-like"
                >
                  <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} />
                  <span className="text-sm font-medium">{likeCount}</span>
                </button>
                <button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                  data-testid="button-comment"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-sm font-medium">{comments.length}</span>
                </button>
              </div>

              {/* Visitor Name Input */}
              <Input
                placeholder="Enter your name to interact..."
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-visitor-name"
              />

              {/* Comment Form */}
              <AnimatePresence>
                {showCommentForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
                      data-testid="input-comment"
                    />
                    <Button
                      onClick={handleComment}
                      disabled={!commentText.trim() || !visitorName.trim()}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                      data-testid="button-submit-comment"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-700/50">
                  {comments.map((comment, i) => (
                    <div key={i} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-700 text-cyan-400 text-xs">
                          {comment.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-white">{comment.name}</span>
                          <span className="text-slate-400 ml-2 text-xs">{comment.time}</span>
                        </p>
                        <p className="text-sm text-slate-300">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your HYPE Card
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG
                  value={shareUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                  data-testid="qr-code"
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-400">Scan to view HYPE card</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareLink}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  data-testid="button-copy-link"
                >
                  {copied ? <><Check className="h-4 w-4 mr-1" /> Copied!</> : <><Copy className="h-4 w-4 mr-1" /> Copy Link</>}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
