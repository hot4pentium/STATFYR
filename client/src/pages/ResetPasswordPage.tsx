import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <XCircle className="h-16 w-16 text-red-500" />
            <p className="text-center text-muted-foreground">
              Invalid or missing reset token. Please request a new password reset link.
            </p>
            <Button
              onClick={() => setLocation("/forgot-password")}
              data-testid="button-request-new-link"
            >
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${generatedImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      
      <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">
            {success ? "Password Reset!" : "Set New Password"}
          </CardTitle>
          <CardDescription className="text-center">
            {success 
              ? "Your password has been updated successfully"
              : "Enter your new password below"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4" data-testid="reset-success">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-muted-foreground">
                You can now log in with your new password.
              </p>
              <Button
                onClick={() => setLocation("/auth")}
                className="mt-4"
                data-testid="button-go-to-login"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="toggle-new-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    data-testid="input-confirm-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
                data-testid="button-reset-password"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
