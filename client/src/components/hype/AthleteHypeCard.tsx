import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Video, TrendingUp, Zap, Heart, MessageCircle, Send, Clock, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import fireLogo from "@/assets/statfyr-fire-logo.png";

type TabType = "events" | "highlights" | "stats" | "hypes";

interface AthleteHypeCardProps {
  athleteId: string;
  athleteName: string;
  avatarUrl?: string | null;
  teamName: string;
  teamBadgeUrl?: string | null;
  jerseyNumber?: string | null;
  position?: string | null;
  season?: string;
  badgeLevel?: string;
  cardNumber?: string;
  keyStats?: Array<{ label: string; value: string | number }>;
  hypeScore?: number;
  events?: Array<{ id: string; title: string; date: string; location?: string | null; type: string }>;
  highlights?: Array<{ id: string; title?: string | null; thumbnailKey?: string | null; thumbnail?: string | null }>;
  stats?: Record<string, any>;
  hypeCount?: number;
  likeCount?: number;
  commentCount?: number;
  comments?: Array<{ id: string; visitorName: string; message: string; createdAt: string }>;
  onLike?: (name: string) => void;
  onComment?: (name: string, message: string) => void;
  hasLiked?: boolean;
}

export function AthleteHypeCard({
  athleteId,
  athleteName,
  avatarUrl,
  teamName,
  teamBadgeUrl,
  jerseyNumber,
  position,
  season = "2024",
  badgeLevel = "RISING",
  cardNumber = "#000001",
  keyStats = [],
  hypeScore = 0,
  events = [],
  highlights = [],
  stats = {},
  hypeCount = 0,
  likeCount = 0,
  commentCount = 0,
  comments = [],
  onLike,
  onComment,
  hasLiked = false,
}: AthleteHypeCardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [commentMessage, setCommentMessage] = useState("");

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  const topStats = useMemo(() => {
    return Object.entries(stats).slice(0, 6).map(([key, value]) => {
      const displayValue = typeof value === 'object' && value !== null 
        ? (value.total ?? value.perGame ?? 0)
        : value;
      const displayName = typeof value === 'object' && value !== null && value.name
        ? value.name
        : key;
      return { key, name: displayName, value: displayValue };
    });
  }, [stats]);

  const handleLike = () => {
    if (!visitorName.trim()) return;
    onLike?.(visitorName.trim());
  };

  const handleComment = () => {
    if (!visitorName.trim() || !commentMessage.trim()) return;
    onComment?.(visitorName.trim(), commentMessage.trim());
    setCommentMessage("");
    setShowCommentForm(false);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "events", label: "Events", icon: <Calendar className="h-4 w-4" /> },
    { id: "highlights", label: "Highlights", icon: <Video className="h-4 w-4" /> },
    { id: "stats", label: "Stats", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "hypes", label: "Hypes", icon: <Zap className="h-4 w-4" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "events":
        return (
          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white text-sm">{event.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-400">
                      {event.type}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No upcoming events</p>
            )}
          </div>
        );

      case "highlights":
        return (
          <div className="grid grid-cols-2 gap-2">
            {highlights.length > 0 ? (
              highlights.slice(0, 6).map((highlight) => {
                const thumbnailUrl = highlight.thumbnailKey || highlight.thumbnail;
                return (
                  <div key={highlight.id} className="aspect-video bg-slate-800/50 rounded-lg overflow-hidden relative">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={highlight.title || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-6 w-6 text-slate-600" />
                      </div>
                    )}
                    {highlight.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                        <p className="text-[10px] text-white truncate">{highlight.title}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="col-span-2 text-center text-slate-500 py-8">No highlights yet</p>
            )}
          </div>
        );

      case "stats":
        return (
          <div className="grid grid-cols-2 gap-2">
            {topStats.length > 0 ? (
              topStats.map((stat) => (
                <div key={stat.key} className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{stat.value}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{stat.name}</p>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center text-slate-500 py-8">No stats recorded yet</p>
            )}
          </div>
        );

      case "hypes":
        return (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src={fireLogo} alt="Hype" className="h-8 w-8 drop-shadow-[0_0_8px_rgba(255,140,0,0.8)]" />
                <span className="text-3xl font-bold text-orange-400">{hypeCount}</span>
              </div>
              <p className="text-sm text-slate-400">Total Hypes Received</p>
            </div>
            <p className="text-center text-slate-500 text-sm">
              Send hypes during live games to support this athlete!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/50 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{badgeLevel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {teamBadgeUrl && <img src={teamBadgeUrl} alt="" className="h-4 w-4 rounded-sm object-cover" />}
            <span className="text-xs text-slate-400">{teamName}</span>
          </div>
        </div>

        <div className="relative aspect-[2/3] bg-gradient-to-b from-slate-800 to-slate-900">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={athleteName}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[150px] font-display font-bold text-slate-700">
                {athleteName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        <div className="relative -mt-24 px-4 pb-4 z-10">
          <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-display font-bold text-white">{athleteName}</h2>
                <p className="text-sm text-slate-400">
                  #{jerseyNumber || "00"} • {position || "Athlete"}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 text-xs">
                {season}
              </Badge>
            </div>

            {keyStats.length > 0 && (
              <div className="flex items-center justify-around py-3 border-y border-slate-700/50">
                {keyStats.slice(0, 3).map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl font-bold text-cyan-400">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 py-3">
              <Zap className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Hype Score</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(hypeScore, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-sm font-bold text-cyan-400">{hypeScore}</span>
            </div>

            <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  {tab.icon}
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={handleLike}
                disabled={hasLiked || !visitorName.trim()}
                className={`flex items-center gap-1.5 ${hasLiked ? "text-red-500" : "text-slate-400 hover:text-red-400"} transition-colors`}
                data-testid="button-like"
              >
                <Heart className={`h-5 w-5 ${hasLiked ? "fill-current" : ""}`} />
                <span className="text-sm font-medium">{likeCount}</span>
              </button>
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                data-testid="button-comment"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{commentCount}</span>
              </button>
            </div>

            <Input
              placeholder="Enter your name to interact..."
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="mb-3 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              data-testid="input-visitor-name"
            />

            <AnimatePresence>
              {showCommentForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentMessage}
                    onChange={(e) => setCommentMessage(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
                    data-testid="input-comment"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!commentMessage.trim() || !visitorName.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-submit-comment"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {comments.length > 0 && (
              <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                {comments.slice(0, 5).map((comment) => (
                  <div key={comment.id} className="bg-slate-800/30 rounded-lg p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{comment.visitorName}</span>
                      <span className="text-[10px] text-slate-500">
                        {format(new Date(comment.createdAt), "MMM d")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{comment.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-t border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">HYPE CARD™</span>
          <span className="text-[10px] text-slate-600">{cardNumber}</span>
        </div>
      </div>
    </div>
  );
}
