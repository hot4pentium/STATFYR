import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Shield, User, Users, Clipboard, ArrowLeft } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { registerUser } from "@/lib/api";
import { useState } from "react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !validateForm()) return;

    setLoading(true);
    try {
      const username = `${selectedRole}_${Date.now()}`;
      const user = await registerUser({
        username,
        password: "demo123",
        role: selectedRole,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });
      setUser(user);
      
      if (selectedRole === 'coach') setLocation("/dashboard");
      else if (selectedRole === 'athlete') setLocation("/athlete/onboarding");
      else setLocation("/supporter/onboarding");
    } catch (error) {
      console.error("Registration failed:", error);
      setErrors({ submit: "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setFormData({ firstName: "", lastName: "", email: "" });
    setErrors({});
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'coach':
        return { icon: Clipboard, title: "Coach", description: "Manage roster, tactics & stats" };
      case 'athlete':
        return { icon: User, title: "Athlete", description: "View schedule & performance" };
      case 'supporter':
        return { icon: Users, title: "Supporter", description: "Follow team updates" };
      default:
        return { icon: User, title: "", description: "" };
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

        {!selectedRole ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">Select Your Role</CardTitle>
              <CardDescription className="text-center">Enter the locker room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                size="lg" 
                className="w-full h-16 text-lg justify-start px-6 bg-primary hover:bg-primary/90 text-primary-foreground group relative overflow-hidden"
                onClick={() => setSelectedRole('coach')}
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
                onClick={() => setSelectedRole('athlete')}
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
                onClick={() => setSelectedRole('supporter')}
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
        ) : (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  {(() => {
                    const info = getRoleInfo(selectedRole);
                    return <info.icon className="h-5 w-5 text-primary" />;
                  })()}
                  <span className="font-bold text-primary">{getRoleInfo(selectedRole).title}</span>
                </div>
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">Create Account</CardTitle>
              <CardDescription className="text-center">Enter your information to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className={errors.firstName ? "border-red-500" : ""}
                      data-testid="input-first-name"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Smith"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className={errors.lastName ? "border-red-500" : ""}
                      data-testid="input-last-name"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? "border-red-500" : ""}
                    data-testid="input-email"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                {errors.submit && (
                  <p className="text-sm text-red-500 text-center">{errors.submit}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-submit"
                >
                  {loading ? "Creating Account..." : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
