import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useSearch } from "wouter";
import { User, Users, Clipboard, ArrowLeft } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';
import { useUser } from "@/lib/userContext";
import { registerUser, loginUser, getUserTeams, syncFirebaseUser } from "@/lib/api";
import { useState, useEffect } from "react";
import { signInWithGoogle, signInWithApple, checkRedirectResult, type FirebaseUser } from "@/lib/firebase";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { setUser, setCurrentTeam } = useUser();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"select" | "signup" | "login">("select");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const searchParams = new URLSearchParams(searchString);
  const redirectTo = searchParams.get("redirect");
  const preselectedRole = searchParams.get("role");

  useEffect(() => {
    if (preselectedRole && (preselectedRole === "athlete" || preselectedRole === "supporter")) {
      setSelectedRole(preselectedRole);
      setAuthMode("signup");
    }
  }, [preselectedRole]);
  
  // Check for redirect result from social login on mobile
  useEffect(() => {
    async function handleRedirectResult() {
      const result = await checkRedirectResult();
      if (result.user) {
        await handleFirebaseUser(result.user);
      } else if (result.error) {
        setErrors({ submit: result.error });
      }
    }
    handleRedirectResult();
  }, []);
  
  const handleFirebaseUser = async (firebaseUser: FirebaseUser) => {
    setLoading(true);
    try {
      const user = await syncFirebaseUser({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: selectedRole || undefined,
      });
      setUser(user);
      
      // Fetch user's teams and set the first one as current
      try {
        const teams = await getUserTeams(user.id);
        if (teams.length > 0) {
          setCurrentTeam(teams[0]);
        }
      } catch (teamError) {
        console.log("No teams found for user");
      }
      
      // Redirect based on role
      if (redirectTo) {
        setLocation(redirectTo);
      } else if (user.role === 'coach') {
        setLocation("/dashboard");
      } else if (user.role === 'athlete') {
        setLocation("/athlete/dashboard");
      } else {
        setLocation("/supporter/dashboard");
      }
    } catch (error: any) {
      console.error("Firebase sync failed:", error);
      setErrors({ submit: error?.message || "Failed to sign in. Please try again." });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrors({});
    const result = await signInWithGoogle();
    if (result.user) {
      await handleFirebaseUser(result.user);
    } else if (result.error) {
      setErrors({ submit: result.error });
      setLoading(false);
    } else {
      // Redirect flow - loading will continue
    }
  };
  
  const handleAppleSignIn = async () => {
    setLoading(true);
    setErrors({});
    const result = await signInWithApple();
    if (result.user) {
      await handleFirebaseUser(result.user);
    } else if (result.error) {
      setErrors({ submit: result.error });
      setLoading(false);
    } else {
      // Redirect flow - loading will continue
    }
  };
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
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
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    if (!loginData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!loginData.password) {
      newErrors.password = "Password is required";
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
        password: formData.password,
        role: selectedRole,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      });
      setUser(user);
      
      if (redirectTo) {
        setLocation(redirectTo);
      } else if (selectedRole === 'coach') {
        setLocation("/coach/onboarding");
      } else if (selectedRole === 'athlete') {
        setLocation("/athlete/onboarding");
      } else {
        setLocation("/supporter/onboarding");
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      const message = error?.message || "Registration failed. Please try again.";
      if (message.includes("Email already exists")) {
        setErrors({ email: "This email is already registered. Try signing in instead." });
      } else if (message.includes("Username already exists")) {
        setErrors({ submit: "Registration failed. Please try again." });
      } else {
        setErrors({ submit: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const user = await loginUser(loginData.email.trim(), loginData.password);
      setUser(user);
      
      // Check if user must change password first
      if (user.mustChangePassword) {
        setLocation("/change-password");
        return;
      }
      
      // Fetch user's teams and set the first one as current
      try {
        const teams = await getUserTeams(user.id);
        if (teams.length > 0) {
          setCurrentTeam(teams[0]);
        }
      } catch (teamError) {
        console.log("No teams found for user");
      }
      
      if (redirectTo) {
        setLocation(redirectTo);
      } else if (user.role === 'coach') {
        setLocation("/dashboard");
      } else if (user.role === 'athlete') {
        setLocation("/athlete/dashboard");
      } else {
        setLocation("/supporter/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({ submit: "Invalid email or password. Please try again." });
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
    setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    setLoginData({ email: "", password: "" });
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
            <img src="/logo.png" alt="STATFYR" className="h-12 w-12" />
            <h1 className="text-5xl tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              STATF<span className="text-orange-500">Y</span>R
            </h1>
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
              <CardDescription className="text-center">Sign in with your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Social login buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-base border-white/20 hover:bg-white/5"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  data-testid="button-google-signin"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-base border-white/20 hover:bg-white/5"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  data-testid="button-apple-signin"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/50 px-2 text-muted-foreground">or with email</span>
                </div>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email Address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="john@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? "border-red-500" : ""}
                    data-testid="input-login-email"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className={errors.password ? "border-red-500" : ""}
                    data-testid="input-login-password"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
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
              <div className="flex items-center justify-center gap-2 mb-2">
                {(() => {
                  const info = getRoleInfo(selectedRole);
                  return <info.icon className="h-5 w-5 text-primary" />;
                })()}
                <span className="font-bold text-primary">{getRoleInfo(selectedRole).title}</span>
              </div>
              <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">Create Account</CardTitle>
              <CardDescription className="text-center">Choose how to sign up</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Social signup buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-base border-white/20 hover:bg-white/5"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  data-testid="button-google-signup"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full h-12 text-base border-white/20 hover:bg-white/5"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  data-testid="button-apple-signup"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Sign up with Apple
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card/50 px-2 text-muted-foreground">or with email</span>
                </div>
              </div>
              
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
                    <p className="text-xs text-red-500">
                      {errors.email.includes("already registered") ? (
                        <>
                          This email is already registered.{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setLoginData(prev => ({ ...prev, email: formData.email }));
                              setAuthMode("login");
                              setErrors({});
                            }}
                            className="text-primary hover:underline font-medium"
                            data-testid="link-signin-from-error"
                          >
                            Sign in instead
                          </button>
                        </>
                      ) : (
                        errors.email
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={errors.password ? "border-red-500" : ""}
                    data-testid="input-password"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    data-testid="input-confirm-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword}</p>
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
                  {loading ? "Creating Account..." : "Create Account"}
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
