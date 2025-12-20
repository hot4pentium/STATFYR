import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ATHLETES, EVENTS, TEAM_NAME } from "@/lib/mockData";
import { Calendar, TrendingUp, Trophy, Activity, Clock, MapPin, MessageSquare, BarChart3, ClipboardList, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useRef, useEffect } from "react";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';

export default function AthleteDashboard() {
  // Mock logged in athlete
  const athlete = ATHLETES[0];
  const nextEvent = EVENTS[0];
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);

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
                <p className="text-3xl font-display font-bold">{athlete.stats?.goals || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Assists</p>
                <p className="text-3xl font-display font-bold">{athlete.stats?.assists || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Games</p>
                <p className="text-3xl font-display font-bold">{athlete.stats?.games || 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/40 border-white/10">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Rating</p>
                <p className="text-3xl font-display font-bold text-accent">8.5</p>
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
          {/* Hero Banner + HYPE Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero Banner */}
            <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
              <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-6 flex-1">
                    <Avatar className="h-24 w-24 border-4 border-white/20 shadow-xl">
                      <AvatarImage src={athlete.avatar} />
                      <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tighter leading-tight">
                          {athlete.name}
                        </h1>
                        <h2 className="text-lg md:text-xl text-white/80 font-bold uppercase tracking-wide">{athlete.position}</h2>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">#{athlete.number}</Badge>
                        <Badge className={athlete.status === 'Active' ? 'bg-green-500/30 text-green-200 border-0' : 'bg-orange-500/30 text-orange-200 border-0'}>
                          {athlete.status}
                        </Badge>
                        <div className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{TEAM_NAME}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* HYPE Card - Sports Trading Card Style */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Card Background */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
                
                {/* Card Content */}
                <div className="relative p-4 space-y-4 h-full flex flex-col justify-between">
                  {/* Top - Title */}
                  <div className="text-center">
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold uppercase tracking-wider rounded-full mb-2">
                      HYPE Card
                    </div>
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-tighter">{athlete.name}</h3>
                    <p className="text-xs text-accent font-bold uppercase tracking-wider">{athlete.position}</p>
                  </div>

                  {/* Middle - Player Image/Avatar */}
                  <div className="relative mx-auto">
                    <div className="w-28 h-28 rounded-lg overflow-hidden border-2 border-accent shadow-lg">
                      <img src={athlete.avatar} alt={athlete.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-accent to-primary rounded-lg p-2 shadow-lg">
                      <span className="text-white font-display font-bold text-lg">#{athlete.number}</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center backdrop-blur-sm hover:bg-white/10 transition">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goals</p>
                      <p className="text-lg font-display font-bold text-primary">{athlete.stats?.goals || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center backdrop-blur-sm hover:bg-white/10 transition">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Assists</p>
                      <p className="text-lg font-display font-bold text-accent">{athlete.stats?.assists || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center backdrop-blur-sm hover:bg-white/10 transition">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rating</p>
                      <p className="text-lg font-display font-bold text-green-400">8.5</p>
                    </div>
                  </div>

                  {/* Bottom - Status */}
                  <div className="border-t border-white/10 pt-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Season Status</p>
                    <p className="text-sm font-bold uppercase tracking-wider">
                      <span className={athlete.status === 'Active' ? 'text-green-400' : 'text-orange-400'}>
                        {athlete.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Goals</CardTitle>
                <Trophy className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{athlete.stats?.goals || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">This season</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Assists</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{athlete.stats?.assists || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Team contribution</p>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearances</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">{athlete.stats?.games || 0}</div>
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
    </Layout>
  );
}
