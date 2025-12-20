import { Layout } from "@/components/layout/Layout";
import { ATHLETES, EVENTS, TEAM_NAME } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Ticket, MapPin, Trophy } from "lucide-react";

export default function SupporterDashboard() {
  const nextMatch = EVENTS.find(e => e.type === 'Match') || EVENTS[0];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden bg-primary/10 border border-white/5 p-8 md:p-12 text-center md:text-left">
           <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-primary/20" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                 <Badge className="mb-4 bg-accent text-accent-foreground border-none">Next Match</Badge>
                 <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter text-foreground mb-2">
                    {TEAM_NAME} <span className="text-muted-foreground">vs</span> Eagles
                 </h1>
                 <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Tomorrow, 2:00 PM</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> City Stadium</div>
                 </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px]">
                 <Button size="lg" className="w-full font-bold text-lg h-14 shadow-lg shadow-primary/25">
                    <Ticket className="mr-2 h-5 w-5" /> Get Tickets
                 </Button>
                 <Button variant="outline" size="lg" className="w-full">
                    Match Preview
                 </Button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Team News / Feed */}
           <div className="md:col-span-2 space-y-6">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Team Updates</h2>
              
              <Card className="bg-card border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                 <div className="h-48 bg-muted relative overflow-hidden">
                    <img 
                       src="https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=800" 
                       alt="Training" 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                       <Badge className="mb-2 bg-primary">News</Badge>
                       <h3 className="text-xl font-bold text-white">Final preparations underway for the derby</h3>
                    </div>
                 </div>
                 <CardContent className="p-4">
                    <p className="text-muted-foreground">The squad is looking sharp ahead of the big game. Coach Carter emphasizes focus and discipline.</p>
                 </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card className="bg-card border-white/5">
                    <CardHeader>
                       <CardTitle className="text-lg">League Table</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 pb-4">
                       {[1, 2, 3, 4, 5].map((pos) => (
                          <div key={pos} className={`flex items-center justify-between px-4 py-2 ${pos === 2 ? 'bg-primary/10 border-l-2 border-primary' : ''}`}>
                             <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-muted-foreground w-4">{pos}</span>
                                <span className={`font-bold ${pos === 2 ? 'text-primary' : ''}`}>{pos === 2 ? TEAM_NAME : `Team ${String.fromCharCode(64+pos)}`}</span>
                             </div>
                             <span className="font-mono text-sm font-bold">2{6-pos}</span>
                          </div>
                       ))}
                    </CardContent>
                 </Card>

                 <Card className="bg-card border-white/5">
                    <CardHeader>
                       <CardTitle className="text-lg">Shop</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-8">
                       <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                       <p className="text-muted-foreground mb-4">New season kit available now.</p>
                       <Button variant="secondary" className="w-full">Visit Store</Button>
                    </CardContent>
                 </Card>
              </div>
           </div>

           {/* Quick Roster Access */}
           <div className="space-y-6">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight">Meet the Squad</h2>
              <Card className="bg-card border-white/5">
                 <CardHeader>
                    <CardDescription>Fan Favorites</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    {ATHLETES.slice(0, 4).map(athlete => (
                       <div key={athlete.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors cursor-pointer">
                          <Avatar>
                             <AvatarImage src={athlete.avatar} />
                             <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                             <div className="font-bold truncate">{athlete.name}</div>
                             <div className="text-xs text-muted-foreground">{athlete.position}</div>
                          </div>
                          <div className="text-xl font-display font-bold text-muted-foreground/50">#{athlete.number}</div>
                       </div>
                    ))}
                    <Button variant="ghost" className="w-full mt-2">View Full Roster</Button>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}

function Badge({className, variant = "default", ...props}: any) {
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variant === 'secondary' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' : variant === 'outline' ? 'text-foreground' : 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'} ${className}`} {...props} />
  )
}
