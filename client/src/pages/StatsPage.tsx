import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from "recharts";
import { Activity, Trophy, TrendingUp, Target } from "lucide-react";

const PERFORMANCE_DATA = [
  { game: 'G1', goals: 2, possession: 45, xG: 1.2 },
  { game: 'G2', goals: 1, possession: 55, xG: 0.8 },
  { game: 'G3', goals: 3, possession: 60, xG: 2.5 },
  { game: 'G4', goals: 0, possession: 40, xG: 0.5 },
  { game: 'G5', goals: 2, possession: 52, xG: 1.8 },
  { game: 'G6', goals: 4, possession: 65, xG: 3.2 },
  { game: 'G7', goals: 1, possession: 48, xG: 1.1 },
];

const PLAYER_COMPARISON_DATA = [
  { name: 'Rashford', speed: 90, shooting: 85, passing: 75, defense: 40 },
  { name: 'Fernandes', speed: 75, shooting: 82, passing: 92, defense: 60 },
  { name: 'Shaw', speed: 82, shooting: 60, passing: 80, defense: 85 },
];

export default function StatsPage() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
           <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">Performance Analytics</h1>
           <p className="text-muted-foreground">Deep dive into team metrics and player development.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { title: 'Avg Possession', value: '52%', icon: Activity, color: 'text-primary' },
             { title: 'Goals / Game', value: '1.8', icon: Trophy, color: 'text-yellow-500' },
             { title: 'Pass Accuracy', value: '84%', icon: Target, color: 'text-green-500' },
             { title: 'xG Diff', value: '+3.2', icon: TrendingUp, color: 'text-blue-400' },
           ].map((stat, i) => (
             <Card key={i} className="bg-card border-white/5">
                <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-xs uppercase font-bold text-muted-foreground">{stat.title}</span>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                   </div>
                   <div className="text-3xl font-display font-bold">{stat.value}</div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="bg-card border-white/5">
             <CardHeader>
               <CardTitle className="font-display uppercase tracking-wide">Season Trend: Goals vs xG</CardTitle>
             </CardHeader>
             <CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={PERFORMANCE_DATA}>
                   <defs>
                     <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorxG" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                   <XAxis dataKey="game" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                      itemStyle={{ color: 'white' }}
                   />
                   <Legend />
                   <Area type="monotone" dataKey="goals" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorGoals)" strokeWidth={3} />
                   <Area type="monotone" dataKey="xG" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorxG)" strokeWidth={3} />
                 </AreaChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>

           <Card className="bg-card border-white/5">
             <CardHeader>
               <CardTitle className="font-display uppercase tracking-wide">Player Attributes Comparison</CardTitle>
             </CardHeader>
             <CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={PLAYER_COMPARISON_DATA} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.8)" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                    <Legend />
                    <Bar dataKey="speed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="shooting" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
        </div>
      </div>
    </Layout>
  );
}
