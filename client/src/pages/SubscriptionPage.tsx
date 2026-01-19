import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { isNative } from "@/lib/capacitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Smartphone, Check, ArrowLeft, Apple, Play } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useUser();
  const { tier, subscription } = useEntitlements();
  const [, navigate] = useLocation();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const hasActiveSubscription = subscription && subscription.status === 'active';

  if (!isNative) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {hasActiveSubscription ? (
            <Card className="border-primary" data-testid="card-active-subscription">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                  <Crown className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">You're on {tier === 'coach' ? 'Coach' : tier === 'athlete' ? 'Athlete' : 'Supporter'} Pro!</CardTitle>
                <CardDescription>
                  Your subscription is active. Manage your subscription in the STATFYR app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Subscription renews</p>
                  <p className="font-semibold">
                    {subscription.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  To manage or cancel your subscription, open the STATFYR app on your mobile device.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="card-get-app">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-orange-500/10">
                  <Smartphone className="w-12 h-12 text-orange-500" />
                </div>
                <CardTitle className="text-2xl">Upgrade to Pro</CardTitle>
                <CardDescription>
                  Download the STATFYR app to subscribe and unlock premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-6">
                    This is the STATFYR companion website. To subscribe to Pro features, 
                    download our app from the App Store or Google Play.
                  </p>
                </div>

                <div className="grid gap-4">
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Crown className="w-5 h-5 text-blue-500" />
                        Coach Pro - $7.99/mo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          PlayMaker & Playbook
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Full StatTracker access
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Season management
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-green-500" />
                        Athlete Pro - $2.99/mo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Shareable HYPE Card
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Video highlights upload
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Extended profile
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-500" />
                        Supporter Pro - $5.99/mo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Manage independent athletes
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Custom dashboard themes
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Season history access
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    size="lg" 
                    className="w-full bg-black hover:bg-gray-800 text-white"
                    onClick={() => window.open('https://apps.apple.com/app/statfyr', '_blank')}
                    data-testid="button-app-store"
                  >
                    <Apple className="w-5 h-5 mr-2" />
                    Download on App Store
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.statfyr.app', '_blank')}
                    data-testid="button-play-store"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Get it on Google Play
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Already subscribed? Make sure you're logged in with the same account you used in the app.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-title">Upgrade to Pro</h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Unlock premium features
          </p>
        </div>

        {hasActiveSubscription ? (
          <Card className="border-primary" data-testid="card-current-subscription">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Current Plan
                </CardTitle>
                <Badge variant="default">
                  {tier === 'coach' ? 'Coach Pro' : tier === 'athlete' ? 'Athlete Pro' : 'Supporter Pro'}
                </Badge>
              </div>
              <CardDescription>
                Your subscription renews on {subscription.currentPeriodEnd 
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                  : 'N/A'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your subscription in your device's Settings app under Subscriptions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card data-testid="card-subscription-coming-soon">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 rounded-full bg-orange-500/10">
                <Star className="w-12 h-12 text-orange-500" />
              </div>
              <CardTitle>Pro Subscriptions Coming Soon</CardTitle>
              <CardDescription>
                In-app purchases are being set up. Check back soon to upgrade!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                We're finalizing our subscription options. You'll be able to upgrade directly 
                in the app soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
