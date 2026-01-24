import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Flame, 
  Users, 
  BarChart3, 
  Video, 
  Trophy, 
  Smartphone,
  Shield,
  Zap,
  Check,
  Crown,
  Calendar,
  ClipboardList,
  Heart,
  Star,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

export default function LandingPage() {
  const [activeRoleModal, setActiveRoleModal] = useState<string | null>(null);
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);
  const roleFeatures = {
    coaches: {
      color: "blue",
      icon: Users,
      features: [
        {
          icon: Users,
          title: "Team Management",
          description: "Organize rosters, assign roles, and manage your entire team from one dashboard.",
          hasModal: true
        },
        {
          icon: BarChart3,
          title: "Live Stat Tracking",
          description: "Track game stats in real-time. Move players in and out of game for specific stat tracking.",
          hasModal: true
        },
        {
          icon: Shield,
          title: "PlayMaker",
          description: "Design and share plays with an interactive canvas-based play designer.",
          hasModal: true
        },
        {
          icon: Trophy,
          title: "Season Management",
          description: "Track records, archive seasons, and build your team's legacy over time.",
          hasModal: false
        }
      ]
    },
    athletes: {
      color: "green",
      icon: TrendingUp,
      features: [
        {
          icon: Star,
          title: "HYPE Card",
          description: "Build and share your personalized athlete profile with stats and highlights.",
          hasModal: false
        },
        {
          icon: BarChart3,
          title: "Personal Stats",
          description: "View your individual performance stats and track your progress over time.",
          hasModal: true
        },
        {
          icon: ClipboardList,
          title: "Team Playbook",
          description: "Access plays and strategies shared by your coach anytime.",
          hasModal: true
        },
        {
          icon: Video,
          title: "Video Highlights",
          description: "Showcase your best moments with personal highlight reels.",
          hasModal: false
        }
      ]
    },
    supporters: {
      color: "purple",
      icon: Heart,
      features: [
        {
          icon: Heart,
          title: "Follow Athletes",
          description: "Follow your favorite athletes and stay updated on their performance.",
          hasModal: false
        },
        {
          icon: Zap,
          title: "Game Day Live",
          description: "Engage in real-time during games with live shoutouts and HYPE features.",
          hasModal: true
        },
        {
          icon: MessageCircle,
          title: "Send Shoutouts",
          description: "Cheer on your athletes with personalized messages they'll see during games.",
          hasModal: false
        },
        {
          icon: Trophy,
          title: "Earn Badges",
          description: "Unlock badges and themes by supporting your athletes throughout the season.",
          hasModal: true
        }
      ]
    }
  };

  const roles = [
    {
      title: "Coaches",
      description: "Full control over team management, stats, playbooks, and season tracking.",
      color: "bg-blue-500"
    },
    {
      title: "Athletes", 
      description: "View your stats, access plays, and build your shareable HYPE card.",
      color: "bg-green-500"
    },
    {
      title: "Supporters",
      description: "Follow your athletes, send shoutouts, and engage on game day.",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background dashboard-bg">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={statfyrLogo} alt="STATFYR" className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">STATF<span className="text-orange-500">Y</span>R</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" data-testid="link-login-header">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Flame className="w-4 h-4" />
            The Ultimate Sports Team Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Ignite Your Team's
            <span className="text-orange-500"> Potential</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            STATFYR brings coaches, athletes, and supporters together with powerful tools 
            for team management, live stat tracking, and game day engagement.
          </p>
          
          <div className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm font-medium mb-6" data-testid="text-coming-soon-hero">
            <span className="text-muted-foreground">App Coming Soon to iOS & Android</span>
          </div>
          
          <div className="flex justify-center">
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="#features" data-testid="button-see-features">
                See Features
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
            Something For Everyone
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {roles.map((role) => (
              <Card 
                key={role.title} 
                className="text-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg" 
                data-testid={`card-role-${role.title.toLowerCase()}`}
                onClick={() => setActiveRoleModal(role.title)}
              >
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 ${role.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <p className="text-xs text-primary mt-3">Click to see example</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Plans for Every Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade in the app when you're ready for more.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-blue-500/30" data-testid="card-pricing-coach">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Coach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Free</Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Create team & manage roster
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Schedule events
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Team chat
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-500">Pro $7.99/mo</Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      PlayMaker & Playbook
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Full StatTracker
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Season management
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Video highlights
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/30" data-testid="card-pricing-athlete">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Athlete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Free</Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Join team with code
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      View your stats
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Access playbook
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-500">Pro $2.99/mo</Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Shareable HYPE Card
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Upload video highlights
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Extended profile
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30" data-testid="card-pricing-supporter">
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Supporter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Free</Badge>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Follow team athletes
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Game Day Live engagement
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Send shoutouts
                    </li>
                  </ul>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-500">Pro $5.99/mo</Badge>
                  </div>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Manage independent athletes
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Custom dashboard themes
                    </li>
                    <li className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      Season history access
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All subscriptions are managed through in-app purchases on the App Store or Google Play.
          </p>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tools For Everyone</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're leading the team, playing the game, or cheering from the sidelines - STATFYR has you covered.
            </p>
          </div>
          
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold">For Coaches</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {roleFeatures.coaches.features.map((feature, index) => {
                  const isEmphasized = feature.title === "Live Stat Tracking" || feature.title === "PlayMaker";
                  const overlapsLeft = feature.title === "Live Stat Tracking";
                  const overlapsRight = feature.title === "PlayMaker";
                  
                  return (
                    <Card 
                      key={feature.title} 
                      className={`transition-all border-blue-500/20 ${feature.hasModal ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'opacity-70'} ${isEmphasized ? 'relative z-10 shadow-xl ring-2 ring-orange-500/50 lg:-ml-3 lg:-mr-3 scale-[1.02] bg-gradient-to-br from-orange-500/10 to-transparent' : ''}`}
                      data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={feature.hasModal ? () => setActiveFeatureModal(feature.title) : undefined}
                    >
                      <CardContent className="pt-6">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                          <feature.icon className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className="font-semibold mb-2">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold">For Athletes</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roleFeatures.athletes.features.map((feature) => (
                  <Card 
                    key={feature.title} 
                    className={`transition-all border-green-500/20 ${feature.hasModal ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'opacity-80'}`}
                    data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={feature.hasModal ? () => setActiveFeatureModal(feature.title) : undefined}
                  >
                    <CardContent className="pt-6">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-5 h-5 text-green-500" />
                      </div>
                      <h4 className="font-semibold mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold">For Supporters</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roleFeatures.supporters.features.map((feature) => (
                  <Card 
                    key={feature.title} 
                    className={`transition-all border-purple-500/20 ${feature.hasModal ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'opacity-80'}`}
                    data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={feature.hasModal ? () => setActiveFeatureModal(feature.title) : undefined}
                  >
                    <CardContent className="pt-6">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                        <feature.icon className="w-5 h-5 text-purple-500" />
                      </div>
                      <h4 className="font-semibold mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="py-20 px-4 bg-gradient-to-b from-orange-500/10 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Smartphone className="w-6 h-6 text-orange-500" />
            <span className="font-medium">Available on iOS & Android</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Get the STATFYR App</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our mobile app is coming soon to the App Store and Google Play. 
            Sign up to be notified when we launch!
          </p>
          <div className="inline-flex items-center gap-2 bg-muted px-6 py-3 rounded-full text-sm font-medium" data-testid="text-coming-soon-cta">
            <span className="text-muted-foreground">iOS & Android Coming Soon</span>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={statfyrLogo} alt="STATFYR" className="w-6 h-6" />
              <span className="font-bold">STATF<span className="text-orange-500">Y</span>R</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground" data-testid="link-privacy">Privacy</a>
              <a href="/terms" className="hover:text-foreground" data-testid="link-terms">Terms</a>
              <a href="mailto:support@statfyr.com" className="hover:text-foreground" data-testid="link-contact">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} STATFYR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <Dialog open={activeRoleModal === "Coaches"} onOpenChange={(open) => !open && setActiveRoleModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Coach Dashboard
            </DialogTitle>
            <DialogDescription>
              Full control over your team's success
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Team Roster</span>
                  </div>
                  <p className="text-2xl font-bold">18</p>
                  <p className="text-xs text-muted-foreground">Active Players</p>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Next Event</span>
                  </div>
                  <p className="text-lg font-bold">Practice</p>
                  <p className="text-xs text-muted-foreground">Tomorrow 4:00 PM</p>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Season Record</span>
                </div>
                <p className="text-xl font-bold">12-3-1</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background rounded p-2 border text-center">
                  <ClipboardList className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                  <p className="text-xs">Playbook</p>
                </div>
                <div className="bg-background rounded p-2 border text-center">
                  <Video className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <p className="text-xs">Highlights</p>
                </div>
                <div className="bg-background rounded p-2 border text-center">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs">StatTracker</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Manage rosters, track stats, design plays, and lead your team to victory.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeRoleModal === "Athletes"} onOpenChange={(open) => !open && setActiveRoleModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Athlete Dashboard
            </DialogTitle>
            <DialogDescription>
              Your stats, your story, your spotlight
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  JD
                </div>
                <div>
                  <h4 className="font-bold text-lg">Jordan Davis</h4>
                  <p className="text-sm text-muted-foreground">#23 • Point Guard</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-muted-foreground ml-1">127 HYPE</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-background rounded-lg p-2 border text-center">
                  <p className="text-lg font-bold text-green-500">18.5</p>
                  <p className="text-xs text-muted-foreground">PPG</p>
                </div>
                <div className="bg-background rounded-lg p-2 border text-center">
                  <p className="text-lg font-bold text-blue-500">7.2</p>
                  <p className="text-xs text-muted-foreground">APG</p>
                </div>
                <div className="bg-background rounded-lg p-2 border text-center">
                  <p className="text-lg font-bold text-purple-500">4.1</p>
                  <p className="text-xs text-muted-foreground">RPG</p>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">HYPE Card</span>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Shareable</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Share your stats with college scouts and fans</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Track your performance, view team plays, and build your shareable athlete profile.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeRoleModal === "Supporters"} onOpenChange={(open) => !open && setActiveRoleModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Supporter Dashboard
            </DialogTitle>
            <DialogDescription>
              Cheer loud, engage live, be part of the team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div>
                  <h4 className="font-bold">Following</h4>
                  <p className="text-sm text-muted-foreground">Your athletes</p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-bold">JD</div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-bold">MK</div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-bold">+2</div>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Game Day Live</span>
                  <Badge className="bg-red-500 text-white text-xs ml-auto">LIVE</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Eagles vs Hawks • 3rd Quarter</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Heart className="w-3 h-3" /> Send HYPE
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <MessageCircle className="w-3 h-3" /> Shoutout
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background rounded p-2 border text-center">
                  <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <p className="text-lg font-bold">847</p>
                  <p className="text-xs text-muted-foreground">Total HYPE</p>
                </div>
                <div className="bg-background rounded p-2 border text-center">
                  <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                  <p className="text-lg font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Badges Earned</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Follow athletes, send live shoutouts, earn badges, and be the ultimate fan.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Team Management"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              Team Management
            </DialogTitle>
            <DialogDescription>
              Organize rosters, assign roles, and manage your entire team from one dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add team-management.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Live Stat Tracking"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              Live Stat Tracking
            </DialogTitle>
            <DialogDescription>
              Track game stats in real-time. Move players in and out of game for specific stat tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <img 
              src="/screenshots/live-stat-tracking.png" 
              alt="Live Stat Tracking interface showing game score and stat buttons" 
              className="w-full rounded-lg border"
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Video Highlights"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-green-500" />
              </div>
              Video Highlights
            </DialogTitle>
            <DialogDescription>
              Upload and share game highlights to showcase your team's best moments
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add video-highlights.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Season Management"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-blue-500" />
              </div>
              Season Management
            </DialogTitle>
            <DialogDescription>
              Track records, archive seasons, and build your team's legacy over time
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add season-management.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Game Day Live"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              Game Day Live
            </DialogTitle>
            <DialogDescription>
              Engage supporters with live shoutouts and interactive HYPE features
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add game-day-live.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "PlayMaker"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              PlayMaker
            </DialogTitle>
            <DialogDescription>
              Design and share plays with an interactive canvas-based play designer
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Pick & Roll Motion</h4>
                  <p className="text-xs text-muted-foreground">Basketball offense play</p>
                </div>
              </div>
              <img 
                src="/screenshots/playmaker-demo.png" 
                alt="Pick & Roll Motion play diagram" 
                className="w-full rounded-lg border"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Create unlimited plays with our intuitive drag-and-drop designer
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Personal Stats"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-500" />
              </div>
              Personal Stats
            </DialogTitle>
            <DialogDescription>
              View your individual performance stats and track your progress over time
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add personal-stats.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "HYPE Card"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-500" />
              </div>
              HYPE Card
            </DialogTitle>
            <DialogDescription>
              Build and share your personalized athlete profile with stats and highlights
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add hype-card.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Team Playbook"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-green-500" />
              </div>
              Team Playbook
            </DialogTitle>
            <DialogDescription>
              Access plays and strategies shared by your coach anytime
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add team-playbook.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Follow Athletes"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-500" />
              </div>
              Follow Athletes
            </DialogTitle>
            <DialogDescription>
              Follow your favorite athletes and stay updated on their performance
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add follow-athletes.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Send Shoutouts"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-500" />
              </div>
              Send Shoutouts
            </DialogTitle>
            <DialogDescription>
              Cheer on your athletes with personalized messages they'll see during games
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add send-shoutouts.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Earn Badges"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>
              Earn Badges
            </DialogTitle>
            <DialogDescription>
              Unlock badges and themes by supporting your athletes throughout the season
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
              <div className="text-center p-8">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Screenshot placeholder</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Add earn-badges.png to /client/public/screenshots/</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
