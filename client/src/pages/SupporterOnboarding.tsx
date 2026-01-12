import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useSearch } from "wouter";
import { Shield, ArrowLeft, CheckCircle, Users, User, UserPlus, LogOut, Check, X, Crown, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { joinTeamByCode } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type OnboardingStep = "choice" | "team-code" | "athlete-code" | "manage-independently" | "success";

const SPORTS = ["Football", "Basketball", "Baseball", "Soccer", "Volleyball", "Other"];
const POSITIONS: Record<string, string[]> = {
  Football: ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"],
  Basketball: ["PG", "SG", "SF", "PF", "C"],
  Baseball: ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"],
  Soccer: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"],
  Volleyball: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero"],
  Other: ["Player"],
};

export default function SupporterOnboarding() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, setCurrentTeam, logout } = useUser();
  const [step, setStep] = useState<OnboardingStep>("choice");
  const [teamCode, setTeamCode] = useState("");
  const [athleteCode, setAthleteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  const [athleteName, setAthleteName] = useState("");
  const [athleteSport, setAthleteSport] = useState("");
  const [athletePosition, setAthletePosition] = useState("");
  const [athleteNumber, setAthleteNumber] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const code = params.get("code");
    if (code) {
      setTeamCode(code);
      setStep("team-code");
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
      const result = await joinTeamByCode(teamCode, user.id, "supporter");
      setCurrentTeam(result.team);
      setStep("success");
      toast.success(`Successfully joined ${result.team.name}!`);
      setTimeout(() => {
        setLocation("/supporter/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Invalid team code. Please check and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleFollowAthlete = async () => {
    if (!athleteCode.trim()) {
      toast.error("Please enter an athlete code");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      setLocation("/");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch("/api/supporter/follow-by-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ code: athleteCode }),
      });

      if (!response.ok) {
        throw new Error("Invalid athlete code");
      }

      const result = await response.json();
      setStep("success");
      toast.success(`Now following ${result.athlete.name}!`);
      setTimeout(() => {
        setLocation("/supporter/dashboard");
      }, 1500);
    } catch (error) {
      toast.error("Invalid athlete code. Please check and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateManagedAthlete = async () => {
    if (!athleteName.trim()) {
      toast.error("Please enter the athlete's name");
      return;
    }
    if (!athleteSport) {
      toast.error("Please select a sport");
      return;
    }

    if (!user) {
      toast.error("Please log in first");
      setLocation("/");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/supporter/managed-athletes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          supporterId: user.id,
          athleteName: athleteName.trim(),
          sport: athleteSport,
          position: athletePosition || null,
          number: athleteNumber || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast.error("Your session has expired. Please log out and log back in.");
          return;
        }
        throw new Error(errorData.error || "Failed to create athlete");
      }

      const result = await response.json();
      setStep("success");
      toast.success(`${athleteName} has been added!`);
      setTimeout(() => {
        setLocation("/supporter/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to create athlete. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      action();
    }
  };

  const renderChoiceStep = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Shield className="text-primary-foreground h-9 w-9" />
          </div>
        </div>
        <CardTitle className="font-display text-2xl uppercase tracking-wide">How would you like to start?</CardTitle>
        <CardDescription>
          Choose how you want to follow and support athletes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
          onClick={() => setStep("team-code")}
          data-testid="button-choice-team-code"
        >
          <Users className="h-6 w-6 text-primary" />
          <span className="font-semibold">I have a team code</span>
          <span className="text-xs text-muted-foreground">Join a team as a supporter</span>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
          onClick={() => setStep("athlete-code")}
          data-testid="button-choice-athlete-code"
        >
          <User className="h-6 w-6 text-primary" />
          <span className="font-semibold">I have an athlete code</span>
          <span className="text-xs text-muted-foreground">Follow a specific athlete</span>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
          onClick={() => setStep("manage-independently")}
          data-testid="button-choice-manage-independently"
        >
          <UserPlus className="h-6 w-6 text-primary" />
          <span className="font-semibold">Manage my athlete</span>
          <span className="text-xs text-muted-foreground">Track stats without a team/coach</span>
        </Button>

        <Collapsible open={showComparison} onOpenChange={setShowComparison}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground gap-2">
              {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Compare options & pricing
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="rounded-lg border border-border/50 bg-card/30 overflow-hidden">
              <div className="grid grid-cols-4 text-xs">
                <div className="p-2 font-medium border-b border-border/50 bg-muted/30">Feature</div>
                <div className="p-2 text-center border-b border-l border-border/50 bg-muted/30">
                  <Users className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                  <span className="font-medium">Team</span>
                </div>
                <div className="p-2 text-center border-b border-l border-border/50 bg-muted/30">
                  <User className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                  <span className="font-medium">Athlete</span>
                </div>
                <div className="p-2 text-center border-b border-l border-border/50 bg-muted/30">
                  <UserPlus className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                  <span className="font-medium">Manage</span>
                </div>
                
                <div className="p-2 border-b border-border/30 text-muted-foreground">View schedule</div>
                <div className="p-2 text-center border-b border-l border-border/30"><Check className="h-4 w-4 mx-auto text-green-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><Check className="h-4 w-4 mx-auto text-green-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><Check className="h-4 w-4 mx-auto text-green-500" /></div>
                
                <div className="p-2 border-b border-border/30 text-muted-foreground">View roster</div>
                <div className="p-2 text-center border-b border-l border-border/30"><Check className="h-4 w-4 mx-auto text-green-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><X className="h-4 w-4 mx-auto text-muted-foreground/50" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><X className="h-4 w-4 mx-auto text-muted-foreground/50" /></div>
                
                <div className="p-2 border-b border-border/30 text-muted-foreground">Game Day Live</div>
                <div className="p-2 text-center border-b border-l border-border/30"><Check className="h-4 w-4 mx-auto text-green-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><X className="h-4 w-4 mx-auto text-muted-foreground/50" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><X className="h-4 w-4 mx-auto text-muted-foreground/50" /></div>
                
                <div className="p-2 border-b border-border/30 text-muted-foreground">Team chat</div>
                <div className="p-2 text-center border-b border-l border-border/30"><Check className="h-4 w-4 mx-auto text-green-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><X className="h-4 w-4 mx-auto text-muted-foreground/50" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><X className="h-4 w-4 mx-auto text-muted-foreground/50" /></div>
                
                <div className="p-2 border-b border-border/30 text-muted-foreground">Track stats</div>
                <div className="p-2 text-center border-b border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                
                <div className="p-2 border-b border-border/30 text-muted-foreground">Upload highlights</div>
                <div className="p-2 text-center border-b border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                <div className="p-2 text-center border-b border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                
                <div className="p-2 text-muted-foreground">Cross-team follow</div>
                <div className="p-2 text-center border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                <div className="p-2 text-center border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
                <div className="p-2 text-center border-l border-border/30"><Crown className="h-4 w-4 mx-auto text-yellow-500" /></div>
              </div>
              
              <div className="p-3 bg-muted/20 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs mb-2">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-muted-foreground">Free</span>
                  <span className="mx-2 text-border">|</span>
                  <Crown className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-muted-foreground">Supporter Pro ($5.99/mo)</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  All options are free to start. Upgrade anytime to unlock premium features.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </>
  );

  const renderTeamCodeStep = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Users className="text-primary-foreground h-9 w-9" />
          </div>
        </div>
        <CardTitle className="font-display text-2xl uppercase tracking-wide">Join a Team</CardTitle>
        <CardDescription>
          Enter your team code to follow as a supporter
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="team-code" className="text-sm font-medium uppercase tracking-wider">
            Team Code
          </Label>
          <Input
            id="team-code"
            data-testid="input-supporter-team-code"
            type="text"
            placeholder="e.g., ABC123"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => handleKeyPress(e, handleJoinTeam)}
            disabled={isJoining}
            className="bg-background/50 border-white/10 focus:border-primary/50 h-12 font-mono font-bold text-center text-lg tracking-widest placeholder:tracking-normal"
          />
          <p className="text-xs text-muted-foreground text-center">
            Ask your team for their unique team code
          </p>
        </div>

        <Button 
          size="lg" 
          className="w-full h-12 text-base shadow-lg shadow-primary/30"
          onClick={handleJoinTeam}
          disabled={isJoining}
          data-testid="button-follow-team"
        >
          {isJoining ? "Joining..." : "Follow Team"}
        </Button>

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => setStep("choice")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to options
        </Button>
      </CardContent>
    </>
  );

  const renderAthleteCodeStep = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <User className="text-primary-foreground h-9 w-9" />
          </div>
        </div>
        <CardTitle className="font-display text-2xl uppercase tracking-wide">Follow an Athlete</CardTitle>
        <CardDescription>
          Enter an athlete's share code to follow them
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="athlete-code" className="text-sm font-medium uppercase tracking-wider">
            Athlete Code
          </Label>
          <Input
            id="athlete-code"
            data-testid="input-athlete-code"
            type="text"
            placeholder="e.g., ATH123"
            value={athleteCode}
            onChange={(e) => setAthleteCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => handleKeyPress(e, handleFollowAthlete)}
            disabled={isJoining}
            className="bg-background/50 border-white/10 focus:border-primary/50 h-12 font-mono font-bold text-center text-lg tracking-widest placeholder:tracking-normal"
          />
          <p className="text-xs text-muted-foreground text-center">
            Ask the athlete for their unique share code
          </p>
        </div>

        <Button 
          size="lg" 
          className="w-full h-12 text-base shadow-lg shadow-primary/30"
          onClick={handleFollowAthlete}
          disabled={isJoining}
          data-testid="button-follow-athlete"
        >
          {isJoining ? "Following..." : "Follow Athlete"}
        </Button>

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => setStep("choice")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to options
        </Button>
      </CardContent>
    </>
  );

  const renderManageIndependentlyStep = () => (
    <>
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <UserPlus className="text-primary-foreground h-9 w-9" />
          </div>
        </div>
        <CardTitle className="font-display text-2xl uppercase tracking-wide">Add Your Athlete</CardTitle>
        <CardDescription>
          Track stats and manage your athlete independently
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="athlete-name" className="text-sm font-medium uppercase tracking-wider">
            Athlete Name
          </Label>
          <Input
            id="athlete-name"
            data-testid="input-managed-athlete-name"
            type="text"
            placeholder="e.g., John Smith"
            value={athleteName}
            onChange={(e) => setAthleteName(e.target.value)}
            disabled={isCreating}
            className="bg-background/50 border-white/10 focus:border-primary/50 h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium uppercase tracking-wider">Sport</Label>
          <Select value={athleteSport} onValueChange={(value) => { setAthleteSport(value); setAthletePosition(""); }}>
            <SelectTrigger className="bg-background/50 border-white/10 h-12" data-testid="select-managed-athlete-sport">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORTS.map((sport) => (
                <SelectItem key={sport} value={sport}>{sport}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {athleteSport && (
          <div className="space-y-2">
            <Label className="text-sm font-medium uppercase tracking-wider">Position (optional)</Label>
            <Select value={athletePosition} onValueChange={setAthletePosition}>
              <SelectTrigger className="bg-background/50 border-white/10 h-12" data-testid="select-managed-athlete-position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS[athleteSport]?.map((pos) => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="athlete-number" className="text-sm font-medium uppercase tracking-wider">
            Jersey Number (optional)
          </Label>
          <Input
            id="athlete-number"
            data-testid="input-managed-athlete-number"
            type="text"
            placeholder="e.g., 23"
            value={athleteNumber}
            onChange={(e) => setAthleteNumber(e.target.value)}
            disabled={isCreating}
            className="bg-background/50 border-white/10 focus:border-primary/50 h-12 w-24"
          />
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-200">
            You'll be able to create events, track stats, and manage their profile without needing a team or coach.
          </p>
        </div>

        <Button 
          size="lg" 
          className="w-full h-12 text-base shadow-lg shadow-primary/30"
          onClick={handleCreateManagedAthlete}
          disabled={isCreating || !athleteName.trim() || !athleteSport}
          data-testid="button-create-managed-athlete"
        >
          {isCreating ? "Creating..." : "Add Athlete"}
        </Button>

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => setStep("choice")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to options
        </Button>
      </CardContent>
    </>
  );

  const renderSuccessStep = () => (
    <CardContent>
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-xl font-bold uppercase">Success!</h3>
          <p className="text-muted-foreground text-sm">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    </CardContent>
  );

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
        {step !== "success" && (
          <div className="mb-8 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground gap-2"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-destructive gap-2"
                onClick={async () => {
                  await logout();
                  setLocation("/");
                }}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        )}

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          {step === "choice" && renderChoiceStep()}
          {step === "team-code" && renderTeamCodeStep()}
          {step === "athlete-code" && renderAthleteCodeStep()}
          {step === "manage-independently" && renderManageIndependentlyStep()}
          {step === "success" && renderSuccessStep()}
        </Card>
      </div>
    </div>
  );
}
