import { useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Flame, 
  Users, 
  BarChart3, 
  Video, 
  Trophy, 
  Smartphone,
  ChevronRight,
  Star,
  Shield,
  Zap
} from "lucide-react";

export default function LandingPage() {
  const { user } = useUser();
  const [, navigate] = useLocation();

  if (user) {
    navigate("/dashboard");
    return null;
  }

  const features = [
    {
      icon: Users,
      title: "Team Management",
      description: "Organize rosters, assign roles, and manage your entire team from one dashboard."
    },
    {
      icon: BarChart3,
      title: "Live Stat Tracking",
      description: "Track game stats in real-time with our intuitive StatTracker for any sport."
    },
    {
      icon: Video,
      title: "Video Highlights",
      description: "Upload and share game highlights to showcase your team's best moments."
    },
    {
      icon: Trophy,
      title: "Season Management",
      description: "Track records, archive seasons, and build your team's legacy over time."
    },
    {
      icon: Zap,
      title: "Game Day Live",
      description: "Engage supporters with live shoutouts and interactive HYPE features."
    },
    {
      icon: Shield,
      title: "PlayMaker",
      description: "Design and share plays with an interactive canvas-based play designer."
    }
  ];

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold tracking-tight">STATFYR</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")} data-testid="button-login">
              Log In
            </Button>
            <Button onClick={() => navigate("/auth")} data-testid="button-get-started">
              Get Started
            </Button>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={() => navigate("/auth")} data-testid="button-start-free">
              Start Free
              <ChevronRight className="w-4 h-4" />
            </Button>
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
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {roles.map((role) => (
              <Card key={role.title} className="text-center" data-testid={`card-role-${role.title.toLowerCase()}`}>
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 ${role.color} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything Your Team Needs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From practice to game day, STATFYR has the tools to help your team succeed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-orange-500/10 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Smartphone className="w-6 h-6 text-orange-500" />
            <span className="font-medium">Available on iOS & Android</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Get the STATFYR App</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Download our mobile app for the best experience. Access all features, 
            get push notifications, and manage your team on the go.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white gap-2"
              onClick={() => window.open('https://apps.apple.com/app/statfyr', '_blank')}
              data-testid="button-app-store"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={() => window.open('https://play.google.com/store/apps/details?id=com.statfyr.app', '_blank')}
              data-testid="button-play-store"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
          <blockquote className="text-xl italic mb-4" data-testid="text-testimonial">
            "STATFYR transformed how we manage our team. The live stat tracking 
            and game day features keep our supporters engaged like never before."
          </blockquote>
          <p className="text-muted-foreground" data-testid="text-testimonial-author">— Youth Basketball Coach</p>
        </div>
      </section>

      <section className="py-20 px-4 bg-orange-500 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ignite Your Team?</h2>
          <p className="text-orange-100 mb-8 max-w-xl mx-auto">
            Join thousands of teams already using STATFYR to track stats, 
            manage rosters, and engage their supporters.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2"
            onClick={() => navigate("/auth")}
            data-testid="button-join-free"
          >
            Join Free Today
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <span className="font-bold">STATFYR</span>
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
    </div>
  );
}
