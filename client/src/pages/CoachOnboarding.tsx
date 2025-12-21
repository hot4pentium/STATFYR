import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { createTeam, deleteUser } from "@/lib/api";

const SPORTS = [
  "Baseball",
  "Basketball",
  "Football",
  "Soccer",
  "Volleyball"
];

export default function CoachOnboarding() {
  const [, setLocation] = useLocation();
  const { user, setUser, setCurrentTeam } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    sport: "",
    teamName: "",
    season: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.sport) {
      newErrors.sport = "Please select a sport";
    }
    if (!formData.teamName.trim()) {
      newErrors.teamName = "Team name is required";
    }
    if (!formData.season.trim()) {
      newErrors.season = "Season is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBackToLogin = async () => {
    if (!user) {
      setLocation("/");
      return;
    }

    setIsExiting(true);
    try {
      await deleteUser(user.id);
      setUser(null);
      setCurrentTeam(null);
      toast.success("Account cancelled. You can sign up again anytime.");
      setLocation("/");
    } catch (error) {
      console.error("Failed to cancel account:", error);
      toast.error("Failed to cancel. Please try again.");
    } finally {
      setIsExiting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!user) {
      toast.error("Please log in first");
      setLocation("/");
      return;
    }

    setIsSubmitting(true);
    try {
      const team = await createTeam({
        name: formData.teamName.trim(),
        sport: formData.sport,
        season: formData.season.trim(),
        coachId: user.id
      });
      setCurrentTeam(team);

      setIsComplete(true);
      toast.success("Team created successfully!");
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Onboarding failed:", error);
      toast.error("Failed to complete setup. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                <Shield className="text-primary-foreground h-9 w-9" />
              </div>
            </div>
            <CardTitle className="font-display text-2xl uppercase tracking-wide">Set Up Your Team</CardTitle>
            <CardDescription>
              Create your team to get started
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!isComplete ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Select value={formData.sport} onValueChange={(value) => setFormData(prev => ({ ...prev, sport: value }))}>
                    <SelectTrigger className={errors.sport ? "border-red-500" : ""} data-testid="select-coach-sport">
                      <SelectValue placeholder="Select a sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((sport) => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sport && (
                    <p className="text-xs text-red-500">{errors.sport}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g., Thunderbolts FC"
                    value={formData.teamName}
                    onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                    className={errors.teamName ? "border-red-500" : ""}
                    data-testid="input-coach-team-name"
                  />
                  {errors.teamName && (
                    <p className="text-xs text-red-500">{errors.teamName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    placeholder="e.g., 2024-2025"
                    value={formData.season}
                    onChange={(e) => setFormData(prev => ({ ...prev, season: e.target.value }))}
                    className={errors.season ? "border-red-500" : ""}
                    data-testid="input-coach-season"
                  />
                  {errors.season && (
                    <p className="text-xs text-red-500">{errors.season}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base shadow-lg shadow-primary/30"
                  disabled={isSubmitting || isExiting}
                  data-testid="button-complete-setup"
                >
                  {isSubmitting ? "Creating Team..." : "Complete Setup"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={handleBackToLogin}
                  disabled={isSubmitting || isExiting}
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {isExiting ? "Cancelling..." : "Back to Login"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-bold uppercase">Team Created!</h3>
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
