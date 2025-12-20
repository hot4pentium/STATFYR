import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ATHLETES, EVENTS, PLAYS, RECENT_CHATS } from "@/lib/mockData";
import { Activity, TrendingUp, Users, CalendarClock, ChevronRight, PlayCircle, BarChart3, ClipboardList, MessageSquare, Trophy, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';

export default function CoachDashboard() {
  const quickActions = [
    { 
      name: "Roster", 
      href: "/roster", 
      icon: Users, 
      color: "from-blue-500/20 to-blue-600/20",
      description: "Manage squad"
    },
    { 
      name: "Events", 
      href: "/events", 
      icon: CalendarClock, 
      color: "from-purple-500/20 to-purple-600/20",
      description: "Schedule"
    },
    { 
      name: "Playbook", 
      href: "/playbook", 
      icon: ClipboardList, 
      color: "from-green-500/20 to-green-600/20",
      description: "Tactics"
    },
    { 
      name: "Stats", 
      href: "/stats", 
      icon: BarChart3, 
      color: "from-orange-500/20 to-orange-600/20",
      description: "Analytics"
    },
    { 
      name: "Chat", 
      href: "/chat", 
      icon: MessageSquare, 
      color: "from-pink-500/20 to-pink-600/20",
      description: "Messages"
    },
  ];

  return (
    <Layout>
      <div 
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 space-y-8">
          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
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
                        Thunderbolts
                      </h1>
                      <h2 className="text-lg md:text-2xl text-white/80 font-bold uppercase tracking-wide">Football Club</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Season 2024-2025</span>
                      </div>
                      <div className="px-4 py-2 bg-accent/20 backdrop-blur-sm rounded-lg border border-accent/30">
                        <span className="text-sm font-bold text-accent-foreground uppercase tracking-wider">Premier Division</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex gap-2">
                  <Button size="lg" className="shadow-lg shadow-primary/30 flex-1 md:flex-none">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Practice Mode
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <div className={`h-full p-4 rounded-lg border border-white/5 bg-gradient-to-br ${action.color} hover:border-white/20 hover:bg-white/5 transition-all duration-200 cursor-pointer group backdrop-blur-sm`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                      <action.icon className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="font-bold text-sm md:text-base">{action.name}</div>
                      <div className="text-[10px] md:text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="text-3xl font-display font-bold">{ATHLETES.filter(a => a.status === 'Active').length} / {ATHLETES.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-orange-500 font-medium">1 Injured</span> (Luke Shaw)
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

          {/* Main Content Split */}
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
                  {ATHLETES.slice(0, 3).map((athlete) => (
                    <div key={athlete.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors border border-transparent hover:border-white/5 group">
                      <div className="flex items-center gap-4">
                        <div className="font-display text-xl font-bold text-muted-foreground w-8 text-center group-hover:text-primary transition-colors">
                          #{athlete.number}
                        </div>
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={athlete.avatar} />
                          <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-foreground">{athlete.name}</div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">{athlete.position}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                         <div>
                            <div className="text-xs text-muted-foreground uppercase">Goals</div>
                            <div className="font-mono font-bold text-primary">{athlete.stats.goals || 0}</div>
                         </div>
                         <div>
                            <div className="text-xs text-muted-foreground uppercase">Assists</div>
                            <div className="font-mono font-bold text-foreground">{athlete.stats.assists || 0}</div>
                         </div>
                         <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
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
