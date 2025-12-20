import { Layout } from "@/components/layout/Layout";
import { RECENT_CHATS, ATHLETES } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function ChatPage() {
  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">Team Chat</h1>
            <p className="text-sm text-muted-foreground">Connect with your squad</p>
          </div>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Contacts List */}
          <Card className="w-80 bg-card border-white/5 flex flex-col hidden md:flex">
            <CardHeader className="p-4 border-b border-white/5">
               <CardTitle className="font-display uppercase tracking-wide text-lg">Channels</CardTitle>
               <Input placeholder="Search teammates..." className="bg-background/50 border-white/10 mt-2" />
            </CardHeader>
            <ScrollArea className="flex-1">
               <div className="p-2 space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary cursor-pointer">
                     <span className="font-bold"># general</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground">
                     <span className="font-bold"># announcements</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer text-muted-foreground">
                     <span className="font-bold"># tactics</span>
                  </div>

                  <div className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground mt-4">Direct Messages</div>
                  {ATHLETES.map(athlete => (
                     <div key={athlete.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer group">
                        <div className="relative">
                           <Avatar className="h-8 w-8">
                              <AvatarImage src={athlete.avatar} />
                              <AvatarFallback>{athlete.name[0]}</AvatarFallback>
                           </Avatar>
                           <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${athlete.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <div className="text-sm font-bold truncate group-hover:text-primary transition-colors">{athlete.name}</div>
                           <div className="text-xs text-muted-foreground truncate">Online</div>
                        </div>
                     </div>
                  ))}
               </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 bg-card border-white/5 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                   <span className="font-display text-lg md:text-xl font-bold uppercase"># General</span>
                   <span className="text-xs md:text-sm text-muted-foreground">| Team Announcements</span>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                   <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                </div>
             </div>

             <ScrollArea className="flex-1 p-4 md:p-6">
                <div className="space-y-6">
                   {/* Mock messages */}
                   <div className="flex gap-4">
                      <Avatar>
                         <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" />
                         <AvatarFallback>CC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                         <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary">Coach Carter</span>
                            <span className="text-xs text-muted-foreground">10:00 AM</span>
                         </div>
                         <p className="text-sm">Team, great intensity at practice yesterday. Let's keep that energy for the match against the Eagles.</p>
                      </div>
                   </div>

                   {RECENT_CHATS.map(chat => (
                      <div key={chat.id} className="flex gap-4">
                         <Avatar>
                            <AvatarFallback>{chat.user[0]}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="font-bold">{chat.user}</span>
                               <span className="text-xs text-muted-foreground">{chat.time}</span>
                            </div>
                            <p className="text-sm">{chat.message}</p>
                         </div>
                      </div>
                   ))}
                   
                   <div className="flex gap-4 flex-row-reverse">
                      <Avatar>
                         <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-right">
                         <div className="flex items-center gap-2 mb-1 justify-end">
                            <span className="font-bold">You</span>
                            <span className="text-xs text-muted-foreground">Just now</span>
                         </div>
                         <div className="inline-block bg-primary text-primary-foreground p-3 rounded-l-lg rounded-tr-lg text-sm text-left">
                            Is the bus leaving from the main gate?
                         </div>
                      </div>
                   </div>

                </div>
             </ScrollArea>

             <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <div className="flex gap-2">
                   <Input className="bg-background/50 border-white/10 focus-visible:ring-primary" placeholder="Type a message..." />
                   <Button size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Send className="h-4 w-4" />
                   </Button>
                </div>
             </div>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
