import { Layout } from "@/components/layout/Layout";
import { ATHLETES, EVENTS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ShieldCheck, HeartPulse } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AthleteProfile() {
  // Mock logged in athlete
  const athlete = ATHLETES[0]; 

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Profile Header */}
        <div className="relative h-48 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background to-transparent flex items-end gap-6">
             <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
               <AvatarImage src={athlete.avatar} />
               <AvatarFallback>MR</AvatarFallback>
             </Avatar>
             <div className="mb-2">
               <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-display font-bold text-foreground">{athlete.name}</h1>
                 <Badge className="bg-primary text-primary-foreground hover:bg-primary">#{athlete.number}</Badge>
               </div>
               <p className="text-muted-foreground font-medium">{athlete.position} • {athlete.status}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Physical */}
          <div className="space-y-6">
             <Card className="bg-card border-white/5">
               <CardHeader>
                 <CardTitle className="font-display uppercase tracking-wide">Season Stats</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Goals Target</span>
                      <span className="font-bold">{athlete.stats.goals || 0} / 20</span>
                    </div>
                    <Progress value={((athlete.stats.goals || 0) / 20) * 100} className="h-2" />
                 </div>
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Assists</span>
                      <span className="font-bold">{athlete.stats.assists || 0}</span>
                    </div>
                    <Progress value={60} className="h-2 bg-muted" />
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-background/50 p-3 rounded border border-white/5 text-center">
                       <div className="text-xs uppercase text-muted-foreground mb-1">Appearances</div>
                       <div className="text-2xl font-display font-bold">{athlete.stats.games || 0}</div>
                    </div>
                    <div className="bg-background/50 p-3 rounded border border-white/5 text-center">
                       <div className="text-xs uppercase text-muted-foreground mb-1">MOM Awards</div>
                       <div className="text-2xl font-display font-bold text-accent">3</div>
                    </div>
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-card border-white/5">
                <CardHeader>
                   <CardTitle className="font-display uppercase tracking-wide flex items-center gap-2">
                      <HeartPulse className="h-5 w-5 text-red-500" /> Physical Status
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <span className="font-bold text-green-500">Match Fit</span>
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                         <span>Fatigue Level</span>
                         <span>Low</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 w-[20%]"></div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* Middle/Right: Schedule & Team Info */}
          <div className="lg:col-span-2 space-y-6">
             <Card className="bg-card border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                   <CardTitle className="font-display uppercase tracking-wide">My Schedule</CardTitle>
                   <Button variant="outline" size="sm">Sync Calendar</Button>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      {EVENTS.map(event => (
                         <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-white/5 hover:border-primary/50 transition-colors">
                            <div className="flex flex-col items-center justify-center h-12 w-12 bg-primary/10 text-primary rounded-lg">
                               <Calendar className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                               <h4 className="font-bold">{event.title}</h4>
                               <p className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                            <Badge variant="secondary" className="uppercase text-[10px]">{event.type}</Badge>
                         </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             <Card className="bg-card border-white/5">
                <CardHeader>
                   <CardTitle className="font-display uppercase tracking-wide">Coach Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="italic text-muted-foreground mb-2">"Great work on the high press drills today. Keep focusing on that transition speed."</p>
                      <div className="flex items-center gap-2 mt-4">
                         <Avatar className="h-6 w-6">
                            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" />
                            <AvatarFallback>CC</AvatarFallback>
                         </Avatar>
                         <span className="text-xs font-bold text-primary">Coach Carter</span>
                         <span className="text-xs text-muted-foreground">• 2 hours ago</span>
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
