import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EVENTS, PLAYS, RECENT_CHATS } from "@/lib/mockData";
import { Activity, TrendingUp, Users, CalendarClock, ChevronRight, PlayCircle, BarChart3, ClipboardList, MessageSquare, Trophy, Shield, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { createTeam, getTeamMembers, getCoachTeams, type TeamMember } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function CoachDashboard() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, setCurrentTeam, logout } = useUser();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);

  const { data: coachTeams } = useQuery({
    queryKey: ["/api/coach", user?.id, "teams"],
    queryFn: () => user ? getCoachTeams(user.id) : Promise.resolve([]),
    enabled: !!user && !currentTeam,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "members"],
    queryFn: () => currentTeam ? getTeamMembers(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const createTeamMutation = useMutation({
    mutationFn: () => createTeam({
      name: "Thunderbolts FC",
      sport: "Football",
      division: "Premier Division",
      season: "2024-2025",
      coachId: user!.id
    }),
    onSuccess: (team) => {
      setCurrentTeam(team);
      toast.success(`Team created! Share code: ${team.code}`);
      queryClient.invalidateQueries({ queryKey: ["/api/coach"] });
    },
  });

  useEffect(() => {
    if (!user) {
      setLocation("/auth/coach");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (user && !currentTeam && coachTeams) {
      if (coachTeams.length > 0) {
        setCurrentTeam(coachTeams[0]);
      } else {
        createTeamMutation.mutate();
      }
    }
  }, [user, currentTeam, coachTeams]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const copyTeamCode = () => {
    if (currentTeam?.code) {
      navigator.clipboard.writeText(currentTeam.code);
      setCodeCopied(true);
      toast.success("Team code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const rosterMembers = teamMembers;
  const athletes = teamMembers.filter((m: TeamMember) => m.role === "athlete");

  useEffect(() => {
    if (selectedCard && contentRef.current) {
      // Scroll to content area when card is selected
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    }
  }, [selectedCard]);

  const quickActions = [
    { 
      name: "Roster", 
      id: "roster",
      icon: Users, 
      color: "from-blue-500/20 to-blue-600/20",
      description: "Manage squad"
    },
    { 
      name: "Events", 
      id: "events",
      icon: CalendarClock, 
      color: "from-purple-500/20 to-purple-600/20",
      description: "Schedule"
    },
    { 
      name: "Playbook", 
      id: "playbook",
      icon: ClipboardList, 
      color: "from-green-500/20 to-green-600/20",
      description: "Tactics"
    },
    { 
      name: "Stats", 
      id: "stats",
      icon: BarChart3, 
      color: "from-orange-500/20 to-orange-600/20",
      description: "Analytics"
    },
    { 
      name: "Chat", 
      id: "chat",
      icon: MessageSquare, 
      color: "from-pink-500/20 to-pink-600/20",
      description: "Messages"
    },
  ];

  const renderContent = () => {
    switch(selectedCard) {
      case "roster":
        return (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {rosterMembers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">No team members yet</p>
                <p className="text-sm">Share your team code with athletes to have them join!</p>
                {currentTeam?.code && (
                  <p className="mt-2 font-mono text-primary text-lg">{currentTeam.code}</p>
                )}
              </div>
            ) : (
              rosterMembers.map((member: TeamMember) => (
                <Card key={member.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-white/20">
                        <AvatarImage src={member.user.avatar || undefined} />
                        <AvatarFallback>{member.user.name?.[0] || "A"}</AvatarFallback>
                      </Avatar>
                      <div>
                        {member.role === "coach" ? (
                          <div className="font-bold text-foreground uppercase text-xs bg-primary/20 text-primary px-2 py-1 rounded mb-1">Coach</div>
                        ) : (
                          <div className="font-bold text-foreground">#{member.user.number || "00"}</div>
                        )}
                        <div className="text-sm font-bold text-primary">{member.user.name || member.user.username}</div>
                        <div className="text-xs text-muted-foreground">{member.role === "coach" ? "Head Coach" : (member.user.position || "Player")}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
      case "events":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-2">
            {EVENTS.map((event) => (
              <Card key={event.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all min-w-[300px]">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-white/10 border border-white/20">{event.type}</span>
                    </div>
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4" />
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
      case "playbook":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAYS.map((play) => (
              <Card key={play.id} className="bg-background/40 border-white/10 hover:border-primary/50 transition-all">
                <div className="h-24 bg-[#1a3c28]/50 relative overflow-hidden border-b border-white/5">
                  <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
                    <circle cx="50" cy="50" r="8" strokeDasharray="3 3" />
                    <line x1="20" y1="20" x2="35" y2="35" />
                    <path d="M 50 50 Q 65 35 80 50" strokeDasharray="2 2" />
                  </svg>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground">{play.name}</h3>
                    <div className="text-xs text-muted-foreground mb-2">{play.type}</div>
                    <div className="flex flex-wrap gap-1">
                      {play.tags.map(tag => (
                        <span key={tag} className="text-[9px] uppercase font-bold bg-white/10 px-2 py-1 rounded text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "stats":
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Avg Possession", value: "52%", subtext: "Season" },
              { label: "Goals / Game", value: "1.8", subtext: "Average" },
              { label: "Pass Accuracy", value: "84%", subtext: "Season" },
              { label: "xG Differential", value: "+3.2", subtext: "Advantage" },
              { label: "Clean Sheets", value: "6", subtext: "Games" },
              { label: "Yellow Cards", value: "18", subtext: "Total" },
              { label: "Red Cards", value: "1", subtext: "Total" },
              { label: "Win Rate", value: "78%", subtext: "Conversion" },
            ].map((stat, i) => (
              <Card key={i} className="bg-background/40 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-3xl font-display font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.subtext}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "chat":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-background/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Team Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 rounded bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition">
                  <div className="font-bold text-sm text-primary"># general</div>
                  <div className="text-xs text-muted-foreground">12 new messages</div>
                </div>
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer transition">
                  <div className="font-bold text-sm"># announcements</div>
                  <div className="text-xs text-muted-foreground">3 new messages</div>
                </div>
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer transition">
                  <div className="font-bold text-sm"># tactics</div>
                  <div className="text-xs text-muted-foreground">5 new messages</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Direct Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {athletes.slice(0, 3).map((member: TeamMember) => (
                  <div key={member.id} className="p-3 rounded hover:bg-white/5 cursor-pointer transition flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback>{member.user.name?.[0] || "A"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{member.user.name || member.user.username}</div>
                      <div className="text-xs text-muted-foreground truncate">Online now</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
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
        
        <div className="relative z-20 space-y-6">
          {/* Hero Banner */}
          <div ref={heroBannerRef} className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-6 flex-1">
                  <div className="h-20 w-20 md:h-28 md:w-28 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                    <Shield className="h-10 w-10 md:h-16 md:w-16 text-white" />
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <h1 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-tight">
                        {currentTeam?.name || "Thunderbolts FC"}
                      </h1>
                      <h2 className="text-lg md:text-2xl text-white/80 font-bold uppercase tracking-wide">{currentTeam?.sport || "Football"}</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <span className="text-sm font-bold text-white uppercase tracking-wider">{currentTeam?.season || "Season 2024-2025"}</span>
                      </div>
                      <div className="px-4 py-2 bg-accent/20 backdrop-blur-sm rounded-lg border border-accent/30">
                        <span className="text-sm font-bold text-accent-foreground uppercase tracking-wider">{currentTeam?.division || "Premier Division"}</span>
                      </div>
                      {currentTeam?.code && (
                        <button
                          onClick={copyTeamCode}
                          className="px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/30 flex items-center gap-2 hover:bg-green-500/30 transition-colors"
                          data-testid="button-copy-team-code"
                        >
                          <span className="text-sm font-bold text-green-300 uppercase tracking-wider font-mono">Code: {currentTeam.code}</span>
                          {codeCopied ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4 text-green-300" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#7d5e5e00]">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => setSelectedCard(selectedCard === action.id ? null : action.id)}
                className={`h-full p-4 rounded-lg border transition-all duration-200 backdrop-blur-sm group text-left ${
                  selectedCard === action.id
                    ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/20"
                    : `border-white/5 bg-gradient-to-br ${action.color} hover:border-white/20 hover:bg-white/5`
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                    <action.icon className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="font-bold text-sm md:text-base">{action.name}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Expanded Content Container */}
          {selectedCard && (
            <div ref={contentRef} className="relative rounded-xl overflow-hidden bg-card/50 border border-white/10 backdrop-blur-sm p-6 animate-in slide-in-from-top duration-300">
              <button
                onClick={() => {
                  setSelectedCard(null);
                  // Immediately scroll to hero banner when close button is clicked
                  setTimeout(() => {
                    if (heroBannerRef.current) {
                      heroBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

          {/* Stats Grid */}
          {!selectedCard && (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Win Rate</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">78%</div>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> 
                    <span className="text-green-500 font-medium">+12%</span> from last season
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Roster</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{athletes.length} / {teamMembers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-primary font-medium">{teamMembers.length} total members</span>
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Next Event</CardTitle>
                  <CalendarClock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-display font-bold truncate">Match vs. Eagles</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tomorrow at 2:00 PM
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-white/5 hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plays Ready</CardTitle>
                  <Clipboard className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold">{PLAYS.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 new added this week
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content (Hidden when card selected) */}
          {!selectedCard && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Roster Preview */}
              <Card className="col-span-2 border-white/5 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-display uppercase tracking-wide">Top Performers</CardTitle>
                  <Link href="/roster">
                    <Button variant="ghost" size="sm" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {athletes.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">No athletes yet. Share your team code to invite athletes!</p>
                        {currentTeam?.code && (
                          <p className="mt-2 font-mono text-primary">{currentTeam.code}</p>
                        )}
                      </div>
                    ) : (
                      athletes.slice(0, 3).map((member: TeamMember) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors border border-transparent hover:border-white/5 group">
                          <div className="flex items-center gap-4">
                            <div className="font-display text-xl font-bold text-muted-foreground w-8 text-center group-hover:text-primary transition-colors">
                              #{member.user.number || "00"}
                            </div>
                            <Avatar className="h-10 w-10 border border-white/10">
                              <AvatarImage src={member.user.avatar || undefined} />
                              <AvatarFallback>{member.user.name?.[0] || "A"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-foreground">{member.user.name || member.user.username}</div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">{member.user.position || "Player"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                             <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity / Chat */}
              <Card className="border-white/5 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-display uppercase tracking-wide">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-6">
                     {RECENT_CHATS.map(chat => (
                       <div key={chat.id} className="flex gap-3">
                         <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-bold text-foreground">{chat.user}</span>
                             <span className="text-xs text-muted-foreground">{chat.time}</span>
                           </div>
                           <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-br-lg rounded-bl-lg rounded-tr-lg border border-white/5">
                             {chat.message}
                           </p>
                         </div>
                       </div>
                     ))}
                     
                     <div className="pt-4 border-t border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Upcoming Events</h4>
                        {EVENTS.slice(0, 2).map(event => (
                          <div key={event.id} className="mb-3 p-3 rounded bg-accent/5 border border-accent/10 flex gap-3">
                            <div className="flex flex-col items-center justify-center px-2 border-r border-accent/10">
                               <span className="text-xs font-bold text-accent uppercase">{new Date(event.date).toLocaleString('default', {month: 'short'})}</span>
                               <span className="text-lg font-display font-bold text-foreground">{new Date(event.date).getDate()}</span>
                            </div>
                            <div>
                               <div className="font-bold text-sm text-foreground">{event.title}</div>
                               <div className="text-xs text-muted-foreground">{event.location}</div>
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Helper icon component since Clipboard is imported above
function Clipboard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}
