import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Shield, User, Users, Clipboard } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { registerUser } from "@/lib/api";
import { useState } from "react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (role: string) => {
    setLoading(true);
    try {
      const username = `${role}_${Date.now()}`;
      const user = await registerUser({
        username,
        password: "demo123",
        role,
        name: role === 'coach' ? 'Coach' : role === 'athlete' ? 'Athlete' : 'Supporter'
      });
      setUser(user);
      
      if (role === 'coach') setLocation("/dashboard");
      else if (role === 'athlete') setLocation("/athlete/onboarding");
      else setLocation("/supporter/onboarding");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="relative z-10 w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              <Shield className="text-primary-foreground h-7 w-7" />
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
              TEAM<span className="text-primary">PULSE</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            The elite performance management platform for modern sports teams. 
            Connect coaches, athletes, and supporters in one unified ecosystem.
          </p>
          <div className="flex gap-4 pt-4">
             <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-foreground">14</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Active Teams</span>
             </div>
             <div className="w-px h-12 bg-border mx-2" />
             <div className="flex flex-col">
                <span className="text-3xl font-display font-bold text-foreground">320+</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Athletes</span>
             </div>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">Select Your Role</CardTitle>
            <CardDescription className="text-center">Enter the locker room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              size="lg" 
              className="w-full h-16 text-lg justify-start px-6 bg-primary hover:bg-primary/90 text-primary-foreground group relative overflow-hidden"
              onClick={() => handleLogin('coach')}
              disabled={loading}
              data-testid="button-coach"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              <Clipboard className="mr-4 h-6 w-6" />
              <div className="flex flex-col items-start">
                <span className="font-bold">Coach</span>
                <span className="text-xs font-normal opacity-80">Manage roster, tactics & stats</span>
              </div>
            </Button>

            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full h-16 text-lg justify-start px-6 bg-secondary hover:bg-secondary/80 border border-white/5"
              onClick={() => handleLogin('athlete')}
              disabled={loading}
              data-testid="button-athlete"
            >
              <User className="mr-4 h-6 w-6" />
              <div className="flex flex-col items-start">
                <span className="font-bold">Athlete</span>
                <span className="text-xs font-normal opacity-80">View schedule & performance</span>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full h-16 text-lg justify-start px-6 border-white/10 hover:bg-white/5"
              onClick={() => handleLogin('supporter')}
              disabled={loading}
              data-testid="button-supporter"
            >
              <Users className="mr-4 h-6 w-6" />
              <div className="flex flex-col items-start">
                <span className="font-bold">Supporter</span>
                <span className="text-xs font-normal opacity-80">Follow team updates</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
