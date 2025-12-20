import { Layout } from "@/components/layout/Layout";
import { EVENTS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Plus, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function EventsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

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
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-foreground">Schedule</h1>
            <p className="text-muted-foreground">Games, practices, and team meetings.</p>
          </div>
          <Button size="lg" className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" />
            Add Event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Card className="bg-card border-white/5 sticky top-24">
               <CardContent className="p-4">
                 <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border border-white/5 w-full flex justify-center"
                  />
               </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
             <h3 className="text-lg font-display uppercase tracking-wide text-muted-foreground mb-4">Upcoming Events</h3>
             {EVENTS.map((event) => (
               <Card key={event.id} className="bg-card border-white/5 hover:border-primary/50 transition-all group overflow-hidden relative">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:bg-primary/80 transition-colors" />
                 <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                   <div className="flex flex-col items-center justify-center min-w-[80px] p-3 bg-background/50 rounded-lg border border-white/5">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{new Date(event.date).toLocaleString('default', {month: 'short'})}</span>
                      <span className="text-3xl font-display font-bold">{new Date(event.date).getDate()}</span>
                   </div>
                   
                   <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-muted-foreground border border-white/10">{event.type}</span>
                      </div>
                      <h4 className="text-xl font-bold text-foreground">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex items-center gap-1">
                           <MapPin className="h-4 w-4" />
                           {event.location}
                        </div>
                      </div>
                   </div>

                   <Button variant="outline" className="border-white/10 hover:bg-white/5 whitespace-nowrap">
                     Details
                   </Button>
                 </CardContent>
               </Card>
             ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
