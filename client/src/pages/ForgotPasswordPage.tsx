import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import generatedImage from '@assets/generated_images/abstract_sports_tactical_background.png';

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }
      
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={() => setLocation("/auth")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 self-start"
            data-testid="link-back-to-login"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </button>
          <CardTitle className="font-display text-2xl uppercase tracking-wide text-center">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center">
            {submitted 
              ? "Check your email for reset instructions"
              : "Enter your email to receive a password reset link"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4" data-testid="reset-email-sent">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you'll receive an email with a link to reset your password.
              </p>
              <p className="text-center text-sm text-muted-foreground">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
              <Button
                variant="outline"
                onClick={() => setLocation("/auth")}
                className="mt-4"
                data-testid="button-return-to-login"
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 ${error ? "border-red-500" : ""}`}
                    data-testid="input-forgot-email"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
                data-testid="button-send-reset"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
