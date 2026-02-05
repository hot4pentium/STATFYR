import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useSearch } from "wouter";
import { Eye, EyeOff, LogOut, ArrowLeft } from "lucide-react";
import { useUser } from "@/lib/userContext";
import { loginUser, registerUser, getUserTeams } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, setUser, setCurrentTeam, isLoading: isUserLoading, logout } = useUser();
  const { setTheme, resolvedTheme } = useTheme();
  const previousTheme = useRef<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Force dark mode on auth pages, restore user preference when leaving
  useEffect(() => {
    previousTheme.current = resolvedTheme;
    setTheme("dark");
    
    return () => {
      if (previousTheme.current && previousTheme.current !== "dark") {
        setTheme(previousTheme.current);
      }
    };
  }, []);

  const searchParams = new URLSearchParams(searchString);
  const redirectTo = searchParams.get("redirect");

    
  // If user is already logged in (from userContext), redirect them to their dashboard
  useEffect(() => {
    console.log('[AuthPage] Redirect check - isUserLoading:', isUserLoading, 'user:', user?.email, 'role:', user?.role);
    if (user) {
      const targetPath = redirectTo || 
        (user.role === 'coach' ? '/dashboard' : 
         user.role === 'athlete' ? '/athlete/dashboard' : 
         '/supporter/dashboard');
      console.log('[AuthPage] Redirecting to:', targetPath);
      setLocation(targetPath);
    }
  }, [user, isUserLoading, redirectTo, setLocation]);
  
  const [isSignup, setIsSignup] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    birthDate: "",
    role: "" as "coach" | "athlete" | "supporter" | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateSignupForm = () => {
    const newErrors: Record<string, string> = {};
    if (!signupData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!signupData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!signupData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!signupData.password) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!signupData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    }
    if (!signupData.role) {
      newErrors.role = "Please select a role";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setLoading(true);
    try {
      const user = await registerUser({
        username: signupData.email.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        firstName: signupData.firstName.trim(),
        lastName: signupData.lastName.trim(),
        name: `${signupData.firstName.trim()} ${signupData.lastName.trim()}`,
        role: signupData.role,
        birthDate: signupData.birthDate,
      });
      setUser(user);
      
      // Redirect based on role
      if (user.role === 'coach') {
        setLocation("/dashboard");
      } else if (user.role === 'athlete') {
        setLocation("/athlete/dashboard");
      } else {
        setLocation("/supporter/dashboard");
      }
    } catch (error: any) {
      console.error("Signup failed:", error);
      const message = error?.message || "Failed to create account";
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-orange-500/10 via-background to-primary/5" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Back to landing page */}
      <div className="absolute top-4 left-4 z-20">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground gap-2 min-w-[44px] min-h-[44px]"
          onClick={() => setLocation("/")}
          data-testid="button-back-to-landing"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      {/* Logout button for stuck sessions */}
      {user && (
        <div className="absolute top-4 right-4 z-20">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-destructive gap-2 min-w-[44px] min-h-[44px]"
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-8">
            <img src="/logo.png" alt="STATFYR" className="h-12 w-12" />
            <h1 className="text-5xl tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              STATF<span className="text-orange-500">Y</span>R
            </h1>
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">
                {isSignup ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignup ? "Sign up to get started" : "Sign in with your account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSignup ? (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="John"
                        value={signupData.firstName}
                        onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                        className={errors.firstName ? "border-red-500" : ""}
                        data-testid="input-signup-firstname"
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Doe"
                        value={signupData.lastName}
                        onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                        className={errors.lastName ? "border-red-500" : ""}
                        data-testid="input-signup-lastname"
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="john@example.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                      className={errors.email ? "border-red-500" : ""}
                      data-testid="input-signup-email"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Choose a password"
                        value={signupData.password}
                        onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                        className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                        data-testid="input-signup-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="toggle-signup-password"
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Birth Date</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={signupData.birthDate.split('-')[1] || ''}
                        onValueChange={(month) => {
                          const [year, , day] = signupData.birthDate.split('-');
                          setSignupData(prev => ({ ...prev, birthDate: `${year || '2000'}-${month}-${day || '01'}` }));
                        }}
                      >
                        <SelectTrigger className={errors.birthDate ? "border-red-500" : ""} data-testid="select-birth-month">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                            <SelectItem key={m} value={String(i + 1).padStart(2, '0')}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={signupData.birthDate.split('-')[2] || ''}
                        onValueChange={(day) => {
                          const [year, month] = signupData.birthDate.split('-');
                          setSignupData(prev => ({ ...prev, birthDate: `${year || '2000'}-${month || '01'}-${day}` }));
                        }}
                      >
                        <SelectTrigger className={errors.birthDate ? "border-red-500" : ""} data-testid="select-birth-day">
                          <SelectValue placeholder="Day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={signupData.birthDate.split('-')[0] || ''}
                        onValueChange={(year) => {
                          const [, month, day] = signupData.birthDate.split('-');
                          setSignupData(prev => ({ ...prev, birthDate: `${year}-${month || '01'}-${day || '01'}` }));
                        }}
                      >
                        <SelectTrigger className={errors.birthDate ? "border-red-500" : ""} data-testid="select-birth-year">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {Array.from({ length: 100 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.birthDate && (
                      <p className="text-xs text-red-500">{errors.birthDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">I am a...</Label>
                    <Select
                      value={signupData.role}
                      onValueChange={(value: "coach" | "athlete" | "supporter") => setSignupData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger className={errors.role ? "border-red-500" : ""} data-testid="select-signup-role">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coach">Coach / Team Manager</SelectItem>
                        <SelectItem value="athlete">Athlete / Player</SelectItem>
                        <SelectItem value="supporter">Parent / Supporter</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-xs text-red-500">{errors.role}</p>
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
                    data-testid="button-signup-submit"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setIsSignup(false); setErrors({}); }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      data-testid="link-switch-to-login"
                    >
                      Already have an account? <span className="underline">Sign in</span>
                    </button>
                  </div>
                </form>
              ) : (
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
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="toggle-login-password"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setLocation("/forgot-password")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
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
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-google-login"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-apple-login"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Apple
                  </Button>
                </div>
                
                <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setIsSignup(true); setErrors({}); }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      data-testid="link-switch-to-signup"
                    >
                      New to STATFYR? <span className="underline">Create an account</span>
                    </button>
                  </div>
              </form>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
