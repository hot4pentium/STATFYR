import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EVENTS } from "@/lib/mockData";
import { Calendar, TrendingUp, Trophy, Activity, Clock, MapPin, MessageSquare, BarChart3, ClipboardList, X, Repeat2, Settings, LogOut, Share2, Moon, Sun, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { getTeamMembers, type TeamMember } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function AthleteDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout } = useUser();
  const nextEvent = EVENTS[0];
  
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const athletes = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "athlete"), [teamMembers]);
  const coaches = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "coach"), [teamMembers]);
  const supporters = useMemo(() => teamMembers.filter((m: TeamMember) => m.role === "supporter"), [teamMembers]);
  
  const [rosterTab, setRosterTab] = useState<"all" | "athletes" | "coach" | "supporters">("all");
  const filteredRosterMembers = useMemo(() => {
    switch (rosterTab) {
      case "athletes": return athletes;
      case "coach": return coaches;
      case "supporters": return supporters;
      default: return teamMembers;
    }
  }, [rosterTab, teamMembers, athletes, coaches, supporters]);

  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isHypeCardFlipped, setIsHypeCardFlipped] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCardFlipped, setIsModalCardFlipped] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !currentTeam) {
      setLocation("/athlete/onboarding");
    }
  }, [user, currentTeam, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/athlete/${user?.id || 1}` : '';

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Share link copied!");
  };
  const contentRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);
  const hypeCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCard && contentRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    }
  }, [selectedCard]);

  const quickActions = [
    { 
      name: "Schedule", 
      id: "schedule",
      icon: Calendar, 
      color: "from-blue-500/20 to-blue-600/20",
      description: "Your matches"
    },
    { 
      name: "Stats", 
      id: "stats",
      icon: BarChart3, 
      color: "from-orange-500/20 to-orange-600/20",
      description: "Performance"
    },
    { 
      name: "Playbook", 
      id: "playbook",
      icon: ClipboardList, 
      color: "from-green-500/20 to-green-600/20",
      description: "Tactics"
    },
    { 
      name: "Chat", 
      id: "chat",
      icon: MessageSquare, 
      color: "from-pink-500/20 to-pink-600/20",
      description: "Messages"
    },
    { 
      name: "Highlights", 
      id: "highlights",
      icon: Trophy, 
      color: "from-yellow-500/20 to-yellow-600/20",
      description: "Match moments"
    },
    { 
      name: "Roster", 
      id: "roster",
      icon: Activity, 
      color: "from-purple-500/20 to-purple-600/20",
      description: "Team players"
    },
  ];

  const renderContent = () => {
    switch(selectedCard) {
      case "schedule":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EVENTS.map((event) => (
              <Card key={event.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/10 border border-white/20">{event.type}</span>
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs">{event.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "stats":
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Goals</p>
                <p className="text-3xl font-display font-bold">0</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Assists</p>
                <p className="text-3xl font-display font-bold">0</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Games</p>
                <p className="text-3xl font-display font-bold">0</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Rating</p>
                <p className="text-3xl font-display font-bold text-accent">-</p>
              </CardContent>
            </Card>
          </div>
        );
      case "playbook":
        return (
          <div className="p-4 bg-background/40 border border-white/10 rounded-lg">
            <h4 className="font-bold mb-3">Team Tactics</h4>
            <div className="space-y-2 text-sm">
              <p>📋 High Press Alpha - Aggressive full-field defense strategy</p>
              <p>⚡ Counter Attack Z - Fast-break offensive plays</p>
              <p>🎯 Corner Setup 1 - Near-post set piece tactics</p>
            </div>
          </div>
        );
      case "chat":
        return (
          <div className="space-y-3">
            <div className="p-3 bg-background/40 border border-white/10 rounded-lg">
              <p className="text-sm font-bold">Coach Carter</p>
              <p className="text-xs text-muted-foreground">Great performance last match! See you at practice.</p>
            </div>
            <div className="p-3 bg-background/40 border border-white/10 rounded-lg">
              <p className="text-sm font-bold">Team Group</p>
              <p className="text-xs text-muted-foreground">Practice moved to 5 PM today.</p>
            </div>
          </div>
        );
      case "highlights":
        return (
          <div className="space-y-4">
            <div className="bg-background/50 border border-white/5 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">▶</div>
                <p className="text-sm text-muted-foreground">Latest Match Highlights</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Winning Goal vs Eagles</p>
                  <p className="text-xs text-muted-foreground">Oct 18 • 45:32</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Assist - Team Goal</p>
                  <p className="text-xs text-muted-foreground">Oct 18 • 67:15</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Defensive Play</p>
                  <p className="text-xs text-muted-foreground">Oct 18 • 28:44</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "roster":
        return (
          <div className="space-y-4">
            <Tabs value={rosterTab} onValueChange={(v) => setRosterTab(v as typeof rosterTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-background/40">
                <TabsTrigger value="all" data-testid="tab-all">All ({teamMembers.length})</TabsTrigger>
                <TabsTrigger value="athletes" data-testid="tab-athletes">Athletes ({athletes.length})</TabsTrigger>
                <TabsTrigger value="coach" data-testid="tab-coach">Coach ({coaches.length})</TabsTrigger>
                <TabsTrigger value="supporters" data-testid="tab-supporters">Supporters ({supporters.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filteredRosterMembers.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-bold">No {rosterTab === "all" ? "teammates" : rosterTab} yet</p>
                  <p className="text-sm">Members will appear here once they join the team.</p>
                </div>
              ) : (
                filteredRosterMembers.map((member: TeamMember) => (
                  <Card key={member.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all">
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center text-center gap-2">
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                          <AvatarImage src={member.user.avatar || undefined} alt={member.user.name || ""} />
                          <AvatarFallback>{member.user.name?.split(' ').map(n => n[0]).join('') || "A"}</AvatarFallback>
                        </Avatar>
                        <div>
                          {member.role === "coach" ? (
                            <div className="font-bold uppercase text-[10px] bg-primary/20 text-primary px-2 py-1 rounded mb-1">Coach</div>
                          ) : member.role === "supporter" ? (
                            <div className="font-bold uppercase text-[10px] bg-accent/20 text-accent px-2 py-1 rounded mb-1">Fan</div>
                          ) : (
                            <div className="font-bold text-sm">#{member.user.number || "00"}</div>
                          )}
                          <p className="text-xs font-bold text-primary truncate max-w-[70px]">{member.user.name || member.user.username}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {member.role === "coach" ? "Head Coach" : member.role === "supporter" ? "Supporter" : (member.user.position || "Player")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-full px-4 md:px-8 py-4 flex items-center justify-end gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 border border-white/20 rounded-lg hover:bg-white/10 transition"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
          <Link href="/athlete/settings">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>
      <div 
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 max-w-full px-4 md:px-8 py-8">
          {/* HYPE Card & Quick Navigation Grid */}
          <div ref={hypeCardRef} className="grid grid-cols-[280px_1fr] gap-4 mb-6 items-center">
            {/* HYPE Card - Sports Trading Card Style with Flip */}
            <div className="w-60 space-y-2">
              {/* Share Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
                  data-testid="button-share-card"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                
                {/* Share Menu */}
                {showShareMenu && (
                  <div className="absolute mt-10 border border-white/10 rounded-lg p-3 backdrop-blur-sm space-y-2 z-50 bg-[#000000f2]">
                    <div className="text-xs font-semibold text-white mb-2">Share HYPE Card</div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 font-mono"
                        data-testid="input-share-url"
                      />
                      <button
                        onClick={copyShareLink}
                        className="bg-primary hover:bg-primary/80 text-white px-3 py-1 rounded text-xs font-semibold transition"
                        data-testid="button-copy-share"
                      >
                        {copied ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)} style={{ perspective: '1000px' }}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div 
                className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isHypeCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s ease-in-out'
                }}
              >
                {/* Card Background */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                
                {/* Front of Card */}
                {!isHypeCardFlipped ? (
                  <div className="relative w-full h-96 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                    {/* Full Image Background */}
                    <img src={user?.avatar || ""} alt={user?.name || ""} className="absolute inset-0 w-full h-full object-contain" />
                    
                    {/* Gradient Overlays for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                    
                    {/* Top Left - Name Overlay */}
                    <div className="absolute top-0 left-0 p-4 text-left">
                      <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{user?.name || user?.username}</h3>
                      <p className="text-[10px] text-white/90 uppercase mt-1 tracking-wider drop-shadow-md font-semibold">{currentTeam?.name || "Team"}</p>
                    </div>

                    {/* Bottom Left - Position */}
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="text-sm font-bold text-accent uppercase tracking-wider drop-shadow-lg">{user?.position || "Player"}</p>
                    </div>

                    {/* Bottom Right - Number */}
                    <div className="absolute bottom-0 right-0 p-4">
                      <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-3 shadow-lg">
                        <span className="text-white font-display font-bold text-2xl drop-shadow">#{user?.number || "00"}</span>
                      </div>
                    </div>

                    {/* Right Center - HYPE Card Text (Vertical) */}
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2">
                      <div className="flex flex-row items-center gap-1 -rotate-90 whitespace-nowrap origin-center">
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                        <div className="w-0.5 h-2 bg-white/60"></div>
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Back of Card - Four Quadrants */
                  (<div className="relative w-full h-96 overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                    <div className="relative w-full h-full p-3 grid grid-cols-2 gap-2">
                      {/* Top Left - Events */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-accent font-bold uppercase tracking-widest mb-2">Events</p>
                        <div className="space-y-1 text-[9px] text-white/70 flex-1 overflow-y-auto">
                          {EVENTS.slice(0, 2).map((event) => (
                            <div key={event.id} className="line-clamp-2">
                              <span className="font-semibold text-white">{event.type}</span>
                              <div className="text-[8px]">{new Date(event.date).toLocaleDateString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Right - Stats with Bars */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-primary font-bold uppercase tracking-widest mb-2">Stats</p>
                        <div className="space-y-2 flex-1">
                          <div>
                            <div className="flex justify-between items-end gap-1 mb-1">
                              <span className="text-[8px] text-white/70">Goals</span>
                              <span className="text-[9px] font-bold text-primary">0</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{width: "0%"}}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-end gap-1 mb-1">
                              <span className="text-[8px] text-white/70">Assists</span>
                              <span className="text-[9px] font-bold text-accent">0</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{width: "0%"}}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Left - Highlights */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-green-400 font-bold uppercase tracking-widest mb-2">Highlights</p>
                        <div className="space-y-1 text-[9px] text-white/70 flex-1">
                          <div>⚡ Crucial goal</div>
                          <div>✨ MVP award</div>
                          <div>🎯 Key assist</div>
                        </div>
                      </div>

                      {/* Bottom Right - Shoutouts */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 overflow-hidden flex flex-col">
                        <p className="text-[8px] text-orange-400 font-bold uppercase tracking-widest mb-2">Shoutouts</p>
                        <div className="text-[8px] text-white/70 italic flex-1">
                          <p className="line-clamp-3">"Excellent form lately!"</p>
                          <p className="text-[7px] mt-1 text-white/50">— Coach</p>
                        </div>
                      </div>
                    </div>
                  </div>)
                )}
              </div>
            </div>
            
            {/* Tap to Flip Bar */}
            <button
              onClick={() => setIsHypeCardFlipped(!isHypeCardFlipped)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
              data-testid="button-tap-to-flip"
            >
              <p className="text-xs text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
            </button>
            </div>

            {/* Quick Navigation - Icons Only */}
            <div className="w-full h-60">
              <div className="grid grid-cols-2 gap-2 h-full">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
                    className={`h-full rounded-lg border transition-all duration-200 backdrop-blur-sm group flex items-center justify-center ${
                      selectedCard === action.id
                        ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/20"
                        : `border-white/5 bg-gradient-to-br ${action.color} hover:border-white/20 hover:bg-white/5`
                    }`}
                  >
                    <div className="p-3 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                      <action.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HYPE Card Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-24" onClick={() => setIsModalOpen(false)}>
              <div className="relative w-80" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute -top-12 right-0 p-2 text-white hover:text-white/70 transition"
                  data-testid="button-close-modal"
                >
                  <X className="h-8 w-8" />
                </button>

                {/* Enlarged Card */}
                <div className="w-full space-y-4">
                  <div className="relative group" style={{ perspective: '1000px' }}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
                    <div 
                      className="relative w-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: isModalCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.6s ease-in-out',
                        aspectRatio: '9/16'
                      }}
                    >
                      {/* Card Background */}
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                      
                      {/* Front of Card */}
                      {!isModalCardFlipped ? (
                        <div className="relative w-full h-full overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                          {/* Full Image Background */}
                          <img src={user?.avatar || ""} alt={user?.name || ""} className="absolute inset-0 w-full h-full object-contain" />
                          
                          {/* Gradient Overlays for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                          
                          {/* Top Left - Name Overlay */}
                          <div className="absolute top-0 left-0 p-6 text-left">
                            <h3 className="text-4xl font-display font-bold text-white uppercase tracking-tighter drop-shadow-lg leading-tight">{user?.name || user?.username}</h3>
                            <p className="text-sm text-white/90 uppercase mt-2 tracking-wider drop-shadow-md font-semibold">{currentTeam?.name || "Team"}</p>
                          </div>

                          {/* Bottom Left - Position */}
                          <div className="absolute bottom-0 left-0 p-6">
                            <p className="text-lg font-bold text-accent uppercase tracking-wider drop-shadow-lg">{user?.position || "Player"}</p>
                          </div>

                          {/* Bottom Right - Number */}
                          <div className="absolute bottom-0 right-0 p-6">
                            <div className="bg-gradient-to-r from-accent to-primary rounded-lg p-4 shadow-lg">
                              <span className="text-white font-display font-bold text-4xl drop-shadow">#{user?.number || "00"}</span>
                            </div>
                          </div>

                          {/* Right Center - HYPE Card Text (Vertical) */}
                          <div className="absolute right-1 top-1/2 -translate-y-1/2">
                            <div className="flex flex-row items-center gap-2 -rotate-90 whitespace-nowrap origin-center">
                              <span className="text-sm text-white font-bold uppercase tracking-widest drop-shadow-lg">HYPE</span>
                              <div className="w-1 h-3 bg-white/60"></div>
                              <span className="text-sm text-white font-bold uppercase tracking-widest drop-shadow-lg">CARD</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Back of Card - Four Quadrants */
                        <div className="relative w-full h-full overflow-hidden" style={{ transform: 'scaleX(-1)', backfaceVisibility: 'hidden' }}>
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black" />
                          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                          
                          <div className="relative w-full h-full p-6 grid grid-cols-2 gap-3">
                            {/* Top Left - Events */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                              <p className="text-sm text-accent font-bold uppercase tracking-widest mb-3">Events</p>
                              <div className="space-y-2 text-sm text-white/70 flex-1 overflow-y-auto">
                                {EVENTS.slice(0, 2).map((event) => (
                                  <div key={event.id}>
                                    <span className="font-semibold text-white">{event.type}</span>
                                    <div className="text-xs">{new Date(event.date).toLocaleDateString()}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Top Right - Stats with Bars */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                              <p className="text-sm text-primary font-bold uppercase tracking-widest mb-3">Stats</p>
                              <div className="space-y-3 flex-1">
                                <div>
                                  <div className="flex justify-between items-end gap-2 mb-1">
                                    <span className="text-xs text-white/70">Goals</span>
                                    <span className="text-sm font-bold text-primary">0</span>
                                  </div>
                                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{width: "0%"}}></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between items-end gap-2 mb-1">
                                    <span className="text-xs text-white/70">Assists</span>
                                    <span className="text-sm font-bold text-accent">0</span>
                                  </div>
                                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent" style={{width: "0%"}}></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Left - Highlights */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                              <p className="text-sm text-green-400 font-bold uppercase tracking-widest mb-3">Highlights</p>
                              <div className="space-y-2 text-sm text-white/70 flex-1">
                                <div>⚡ Crucial goal</div>
                                <div>✨ MVP award</div>
                                <div>🎯 Key assist</div>
                              </div>
                            </div>

                            {/* Bottom Right - Shoutouts */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 overflow-hidden flex flex-col">
                              <p className="text-sm text-orange-400 font-bold uppercase tracking-widest mb-3">Shoutouts</p>
                              <div className="text-sm text-white/70 italic flex-1">
                                <p className="line-clamp-4">"Excellent form lately!"</p>
                                <p className="text-xs mt-2 text-white/50">— Coach</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tap to Flip Bar */}
                  <button
                    onClick={() => setIsModalCardFlipped(!isModalCardFlipped)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 text-center backdrop-blur-sm hover:bg-white/10 transition cursor-pointer"
                    data-testid="button-modal-tap-to-flip"
                  >
                    <p className="text-sm text-white/70 font-medium uppercase tracking-wide">Tap to Flip</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Content Container */}
          {selectedCard && (
            <div ref={contentRef} className="relative rounded-xl overflow-hidden bg-card/50 border border-white/10 backdrop-blur-sm p-6 animate-in slide-in-from-top duration-300 mb-6">
              <button
                onClick={() => {
                  setSelectedCard(null);
                  setTimeout(() => {
                    if (hypeCardRef.current) {
                      hypeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 50);
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-display font-bold uppercase tracking-wide mb-6">
                {quickActions.find(a => a.id === selectedCard)?.name}
              </h3>
              <div className="overflow-x-auto">
                {renderContent()}
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Goals</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">This season</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assists</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">Team contribution</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearances</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">Games played</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rating</CardTitle>
                <Trophy className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-accent">8.5</div>
                <p className="text-xs text-muted-foreground mt-1">Average</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Next Match */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Next Match</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/20 border border-primary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Team Practice</p>
                    <p className="text-lg font-bold text-foreground">{nextEvent.title}</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Oct 25 • 5:00 PM</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{nextEvent.location}</span>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">Add to Calendar</Button>
                </CardContent>
              </Card>

              {/* Training Goals */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Goals This Week</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Speed & Agility</span>
                      <span className="font-bold">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Shooting Accuracy</span>
                      <span className="font-bold">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Passing Precision</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Overview */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background/50 border border-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase mb-2">This Week</p>
                      <p className="text-2xl font-display font-bold">2 Games</p>
                      <p className="text-xs text-green-400 mt-1">Played full 90 min</p>
                    </div>
                    <div className="p-4 bg-background/50 border border-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground uppercase mb-2">Last Match</p>
                      <p className="text-2xl font-display font-bold text-accent">7.8</p>
                      <p className="text-xs text-muted-foreground mt-1">Player rating</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold uppercase text-sm tracking-wide">Recent Achievements</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div>
                          <p className="text-sm font-medium">Man of the Match</p>
                          <p className="text-xs text-muted-foreground">Oct 18 vs Eagles</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div>
                          <p className="text-sm font-medium">5-Game Streak</p>
                          <p className="text-xs text-muted-foreground">Consecutive starts</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                        <div>
                          <p className="text-sm font-medium">Top Scorer</p>
                          <p className="text-xs text-muted-foreground">12 goals this season</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coach Messages */}
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Coach Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-200 mb-3">
                      "Great performance last match! Work on your positioning in the box. See you at practice."
                    </p>
                    <p className="text-xs text-muted-foreground">Coach Carter • 2 hours ago</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
