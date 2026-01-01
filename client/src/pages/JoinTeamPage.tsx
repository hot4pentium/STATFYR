import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, useSearch } from "wouter";
import { Shield, Users, Trophy } from "lucide-react";
import { useUser } from "@/lib/userContext";

export default function JoinTeamPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const code = searchParams.get("code") || "";
  const { user } = useUser();

  const handleRoleSelect = (role: "athlete" | "supporter") => {
    const onboardingPath = role === "athlete" 
      ? `/athlete/onboarding?code=${code}` 
      : `/supporter/onboarding?code=${code}`;
    
    if (user) {
      setLocation(onboardingPath);
    } else {
      setLocation(`/auth?redirect=${encodeURIComponent(onboardingPath)}&role=${role}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur border-white/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl uppercase tracking-wide">Join Team</CardTitle>
          <CardDescription>
            {code ? (
              <>Team code: <span className="font-mono font-bold">{code}</span></>
            ) : (
              "Choose how you'd like to join"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={() => handleRoleSelect("athlete")}
            className="w-full h-16 text-lg"
            variant="default"
            data-testid="button-join-athlete"
          >
            <Trophy className="h-5 w-5 mr-3" />
            Join as Athlete
          </Button>
          
          <Button
            onClick={() => handleRoleSelect("supporter")}
            className="w-full h-16 text-lg"
            variant="outline"
            data-testid="button-join-supporter"
          >
            <Users className="h-5 w-5 mr-3" />
            Join as Supporter
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-4">
            Athletes are team members who play. Supporters are fans, parents, or staff who follow the team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
