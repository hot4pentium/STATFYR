import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';

export default function AthleteOnboarding() {
  const [, setLocation] = useLocation();
  const [teamCode, setTeamCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinedTeam, setJoinedTeam] = useState(false);

  const handleJoinTeam = () => {
    if (!teamCode.trim()) {
      toast.error("Please enter a team code");
      return;
    }

    // Mock validation - accept any code for mockup
    if (teamCode.length < 4) {
      toast.error("Invalid team code");
      return;
    }

    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      setJoinedTeam(true);
      toast.success(`Successfully joined team with code: ${teamCode}`);
      setTimeout(() => {
        setLocation("/athlete/dashboard");
      }, 1500);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !joinedTeam) {
      handleJoinTeam();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Back Button */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                <Shield className="text-primary-foreground h-9 w-9" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl uppercase tracking-wide">Join Your Team</CardTitle>
            <CardDescription>
              Enter your team code to get started as an athlete
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!joinedTeam ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="team-code" className="text-sm font-medium uppercase tracking-wider">
                    Team Code
                  </Label>
                  <Input
                    id="team-code"
                    data-testid="input-athlete-team-code"
                    type="text"
                    placeholder="e.g., TC-7B4K2M9X"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    disabled={isJoining}
                    className="bg-background/50 border-white/10 focus:border-primary/50 h-12 font-mono font-bold text-center text-lg tracking-widest placeholder:tracking-normal"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Ask your coach for your team's unique code
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full h-12 text-base shadow-lg shadow-primary/30"
                  onClick={handleJoinTeam}
                  disabled={isJoining}
                  data-testid="button-join-team"
                >
                  {isJoining ? "Joining..." : "Join Team"}
                </Button>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-200">
                    💡 You'll need a valid team code from your coach to join. Don't have one? Contact your team administrator.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Welcome to the Team!</h3>
                  <p className="text-sm text-muted-foreground">
                    You've successfully joined. Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
