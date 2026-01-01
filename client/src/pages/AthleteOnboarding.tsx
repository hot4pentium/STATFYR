import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useSearch } from "wouter";
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { joinTeamByCode } from "@/lib/api";

export default function AthleteOnboarding() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, setCurrentTeam } = useUser();
  const [teamCode, setTeamCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinedTeam, setJoinedTeam] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const code = params.get("code");
    if (code) {
      setTeamCode(code);
    }
  }, [searchString]);

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      toast.error("Please enter a team code");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      setLocation("/");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinTeamByCode(teamCode, user.id, "athlete");
      setCurrentTeam(result.team);
      setJoinedTeam(true);
      toast.success(`Successfully joined ${result.team.name}!`);
      setTimeout(() => {
        setLocation("/athlete/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Invalid team code. Please check and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !joinedTeam) {
      handleJoinTeam();
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

      <div className="relative z-10 w-full max-w-md px-4">
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
                    placeholder="e.g., ABC123"
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
                    You'll need a valid team code from your coach to join. Don't have one? Contact your team administrator.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-bold uppercase">Team Joined!</h3>
                  <p className="text-muted-foreground text-sm">
                    Redirecting to your dashboard...
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
