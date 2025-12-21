import { Layout } from "@/components/layout/Layout";
import { PLAYS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Play, Share2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function PlaybookPage() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">PlayMaker</h1>
            <p className="text-muted-foreground">Design and distribute tactical plays.</p>
          </div>
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" />
            New Play
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLAYS.map((play) => (
            <Card key={play.id} className="bg-card border-white/5 hover:border-primary/50 transition-all group overflow-hidden cursor-pointer">
              {/* Mock Blackboard Preview */}
              <div className="h-48 bg-[#1a3c28] relative overflow-hidden border-b border-white/5 pattern-grid-lg">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                {/* Abstract tactic lines */}
                <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1">
                  <circle cx="50" cy="50" r="10" strokeDasharray="4 4" />
                  <line x1="10" y1="10" x2="40" y2="40" markerEnd="url(#arrow)" />
                  <path d="M 60 60 Q 75 40 90 60" strokeDasharray="2 2" />
                  <rect x="5" y="5" width="90" height="90" rx="2" strokeOpacity="0.2" />
                </svg>
                
                <div className="absolute top-2 right-2">
                   <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white border-white/10 hover:bg-black/70">{play.type}</Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                   <h3 className="font-display text-xl font-bold uppercase">{play.name}</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {play.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                   <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                     <Play className="mr-2 h-4 w-4" /> Run Simulation
                   </Button>
                   <Button size="icon" variant="outline" className="border-white/10 hover:bg-white/5">
                     <Share2 className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}

           {/* Empty State / Add New */}
           <Card className="bg-card/30 border-dashed border-white/10 hover:border-primary/50 transition-all flex items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-white/5">
              <div className="text-center">
                 <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-colors">
                    <Plus className="h-8 w-8" />
                 </div>
                 <h3 className="font-display text-xl font-bold uppercase text-muted-foreground">Create New Play</h3>
              </div>
           </Card>
        </div>
      </div>
    </Layout>
  );
}
