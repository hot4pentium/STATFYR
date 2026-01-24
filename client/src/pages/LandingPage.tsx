import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Crown
} from "lucide-react";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";

export default function LandingPage() {
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
    <div className="min-h-screen bg-background dashboard-bg">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={statfyrLogo} alt="STATFYR" className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">STATF<span className="text-orange-500">Y</span>R</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/auth" data-testid="link-login-header">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </a>
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
    </div>
  );
}
