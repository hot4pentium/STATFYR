import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Shield, TrendingUp, Heart, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { syncFirebaseUser } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useTheme } from "next-themes";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

const ROLES = [
  {
    id: "coach",
    title: "Coach",
    description: "Lead your team, track stats, and build plays",
    icon: Shield,
    color: "blue",
  },
  {
    id: "athlete",
    title: "Athlete",
    description: "Track your performance and showcase your skills",
    icon: TrendingUp,
    color: "green",
  },
  {
    id: "supporter",
    title: "Supporter",
    description: "Follow athletes and cheer them on",
    icon: Heart,
    color: "orange",
  },
];

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function RoleSelectionPage() {
  const [, setLocation] = useLocation();
  const { setUser, setCurrentTeam, clearRedirectNeedsRoleSelection } = useUser();
  const { setTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
      } else {
        setLocation("/auth");
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  const validateForm = (): string | null => {
    if (!selectedRole) {
      return "Please select your role";
    }
    if (!birthDate) {
      return "Please enter your date of birth";
    }
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }
    const age = calculateAge(date);
    if (age < 13) {
      return "You must be at least 13 years old to create an account";
    }
    if (age > 120) {
      return "Please enter a valid date of birth";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!firebaseUser) {
      setError("Please sign in first");
      setLocation("/auth");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await syncFirebaseUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: selectedRole!,
        birthDate: birthDate,
      });

      if ("needsRoleSelection" in result) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setUser(result);
      localStorage.setItem("user", JSON.stringify(result));
      clearRedirectNeedsRoleSelection();
      toast.success("Account created successfully!");

      if (selectedRole === "coach") {
        setLocation("/coach/onboarding");
      } else if (selectedRole === "athlete") {
        setLocation("/athlete/onboarding");
      } else {
        setLocation("/supporter/onboarding");
      }
    } catch (error: any) {
      console.error("Role selection failed:", error);
      const errorMessage = error?.message || "Failed to create account. Please try again.";
      if (errorMessage.includes("13 years old")) {
        setError("You must be at least 13 years old to create an account");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-orange-500/10 via-background to-primary/5" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={statfyrLogo} alt="STATFYR" className="h-10 w-10" />
          <h1 className="text-3xl tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            STATF<span className="text-orange-500">Y</span>R
          </h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl uppercase tracking-wide">Welcome!</CardTitle>
            <CardDescription>
              Tell us a bit about yourself to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a...</Label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-200
                        flex flex-col items-center gap-2 text-center
                        ${isSelected 
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                          : "border-border/50 hover:border-primary/50 hover:bg-card/80"
                        }
                      `}
                      data-testid={`button-role-${role.id}`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2">
                          <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                        </div>
                      )}
                      <div className={`
                        h-10 w-10 rounded-lg flex items-center justify-center
                        ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium">{role.title}</span>
                    </button>
                  );
                })}
              </div>
              {selectedRole && (
                <p className="text-xs text-muted-foreground text-center">
                  {ROLES.find(r => r.id === selectedRole)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-sm font-medium">
                Date of Birth
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  setError(null);
                }}
                max={new Date().toISOString().split('T')[0]}
                className={error && error.includes("13") ? "border-red-500" : ""}
                data-testid="input-birth-date"
              />
              <p className="text-xs text-muted-foreground">
                You must be at least 13 years old to use STATFYR
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              size="lg"
              className="w-full h-12 text-base shadow-lg shadow-primary/30"
              disabled={isSubmitting || !selectedRole || !birthDate}
              data-testid="button-continue"
            >
              {isSubmitting ? "Creating Account..." : "Continue"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              {" "}and{" "}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
