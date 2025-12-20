import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Shield, User, Users, Clipboard, ArrowLeft } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { registerUser, loginUser } from "@/lib/api";
import { useState } from "react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"select" | "signup" | "login">("select");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSignupForm = () => {
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

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    if (!loginData.email.trim()) {
      newErrors.email = "Email is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !validateSignupForm()) return;

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const user = await loginUser(loginData.email.trim(), "demo123");
      setUser(user);
      
      if (user.role === 'coach') setLocation("/dashboard");
      else if (user.role === 'athlete') setLocation("/athlete/dashboard");
      else setLocation("/supporter/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({ submit: "No account found with that email. Try signing up instead." });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (authMode === "signup" && selectedRole) {
      setSelectedRole(null);
    } else {
      setAuthMode("select");
      setSelectedRole(null);
    }
    setFormData({ firstName: "", lastName: "", email: "" });
    setLoginData({ email: "" });
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

  const selectRoleForSignup = (role: string) => {
    setSelectedRole(role);
    setAuthMode("signup");
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

        {authMode === "select" && (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">Get Started</CardTitle>
              <CardDescription className="text-center">New or returning user?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setAuthMode("login")}
                data-testid="button-login-option"
              >
                Sign In
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/50 px-2 text-muted-foreground">or create new account</span>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full h-16 text-lg justify-start px-6 border-white/10 hover:bg-white/5"
                onClick={() => selectRoleForSignup('coach')}
                disabled={loading}
                data-testid="button-coach"
              >
                <Clipboard className="mr-4 h-6 w-6" />
                <div className="flex flex-col items-start">
                  <span className="font-bold">Coach</span>
                  <span className="text-xs font-normal opacity-80">Manage roster, tactics & stats</span>
                </div>
              </Button>

              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-16 text-lg justify-start px-6 border-white/10 hover:bg-white/5"
                onClick={() => selectRoleForSignup('athlete')}
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
                onClick={() => selectRoleForSignup('supporter')}
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
        )}

        {authMode === "login" && (
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
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">Sign in with your email</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="john@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ email: e.target.value })}
                    className={errors.email ? "border-red-500" : ""}
                    data-testid="input-login-email"
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
                  data-testid="button-login-submit"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => setAuthMode("select")}
                    className="text-primary hover:underline"
                    data-testid="link-signup"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {authMode === "signup" && selectedRole && (
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
              <form onSubmit={handleSignup} className="space-y-4">
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
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-primary hover:underline"
                    data-testid="link-login"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
