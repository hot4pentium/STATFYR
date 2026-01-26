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
  MessageCircle,
  Hand,
  Sparkles,
  ThumbsUp,
  ArrowRight,
  ChevronRight
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
          hasModal: true
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
          hasModal: true
        }
      ]
    },
    supporters: {
      color: "purple",
      icon: Heart,
      features: [
        {
          icon: Heart,
          title: "Manage Athletes",
          description: "Build your athlete's profile, even when their team is not connected to STATFYR.",
          hasModal: false
        },
        {
          icon: Zap,
          title: "Game Day Live",
          description: "Tap live for great plays during the game.",
          hasModal: true
        },
        {
          icon: MessageCircle,
          title: "Send Shoutouts",
          description: "Cheer on your athletes with personalized messages they'll see during games.",
          hasModal: true
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

  return (
    <div className="min-h-screen bg-black" style={{ background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #050505 100%)' }}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={statfyrLogo} alt="STATFYR" className="w-8 h-8" data-testid="img-logo" />
            <span className="text-xl font-bold tracking-tight text-white">STATF<span className="text-orange-500">Y</span>R</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors" data-testid="link-nav-features">Features</a>
            <a href="#roles" className="text-sm text-gray-300 hover:text-white transition-colors" data-testid="link-nav-roles">Roles</a>
            <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors" data-testid="link-nav-pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth" data-testid="link-login-header">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link href="/auth" data-testid="link-signup-header">
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Flame className="w-4 h-4" />
              <span>The Ultimate Sports Team Platform</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              Ignite Your Team's
              <span className="block text-orange-500">Full Potential</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-description">
              STATFYR brings coaches, athletes, and supporters together with powerful tools 
              for team management, live stat tracking, and game day engagement.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/auth" data-testid="link-hero-cta">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-12 text-base gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base" asChild data-testid="button-explore-features">
                <a href="#features">
                  Explore Features
                </a>
              </Button>
            </div>

            <div className="inline-flex items-center gap-3 text-sm text-gray-400" data-testid="text-coming-soon">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>iOS & Android Coming Soon</span>
              </div>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <div className="inline-flex items-center gap-2 text-orange-400 text-sm font-medium mb-4">
                <BarChart3 className="w-4 h-4" />
                STAT TRACKING
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Track Every Play With Precision
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Real-time stat tracking designed for coaches. Move players in and out of game, 
                track individual and team stats, and watch performance data come alive.
              </p>
              <ul className="space-y-4">
                {["Live game tracking", "Individual & team modes", "Sport-specific presets", "Season analytics"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-orange-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative" data-testid="card-feature-stattracker">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-white font-semibold">StatTracker</span>
                  <Badge className="ml-auto bg-green-500/20 text-green-400 border-0">Live</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Points", value: "24" },
                    { label: "Rebounds", value: "8" },
                    { label: "Assists", value: "6" }
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-gray-300">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="h-32 bg-white/5 rounded-xl flex items-end justify-around p-4">
                  {[60, 80, 45, 90, 70, 85, 55].map((height, i) => (
                    <div 
                      key={i} 
                      className="w-6 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="order-2 lg:order-1 relative" data-testid="card-feature-playmaker">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-white font-semibold">PlayMaker</span>
                </div>
                <div className="aspect-video bg-background rounded-xl border border-white/10 relative overflow-hidden">
                  <div className="absolute inset-4 border-2 border-white/20 rounded-lg">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/20 rounded-full" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-8 border-2 border-white/20 rounded" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-8 border-2 border-white/20 rounded" />
                  </div>
                  <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">1</div>
                  <div className="absolute top-1/2 left-1/3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">2</div>
                  <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">3</div>
                  <svg className="absolute inset-0 w-full h-full">
                    <path d="M90 80 Q120 100 130 130" stroke="rgba(249,115,22,0.5)" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                    <path d="M130 130 L160 110" stroke="rgba(249,115,22,0.5)" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                PLAYMAKER
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Design Plays That Win Games
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Interactive canvas-based play designer built for coaches. Create, save, and share 
                plays with your team. Access your playbook anytime, anywhere.
              </p>
              <ul className="space-y-4">
                {["Drag-and-drop play builder", "Multiple sport templates", "Share with team instantly", "Organize into playbooks"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-purple-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                GAME DAY LIVE
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Engage Your Supporters In Real-Time
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Supporters can tap live during games, send shoutouts, and earn badges. 
                Athletes feel the energy from the stands right on their device.
              </p>
              <ul className="space-y-4">
                {["Live tap engagement", "Personalized shoutouts", "Badge rewards system", "Guest access via QR"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white/80">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-cyan-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative" data-testid="card-feature-gamedaylive">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-white font-semibold">Game Day Live</span>
                  <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-0">Active</Badge>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Hand className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">HYPE Taps</div>
                      <div className="text-gray-300 text-sm">Tap to show support!</div>
                    </div>
                    <div className="text-3xl font-bold text-orange-400">127</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageCircle className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-300 text-sm">Latest Shoutout</span>
                    </div>
                    <p className="text-white">"Great hustle out there! Keep it up! 🔥"</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built For Every Role
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Whether you're leading the team, playing the game, or cheering from the sidelines
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Coaches",
                icon: Users,
                color: "blue",
                description: "Full control over team management, stats, playbooks, and season tracking.",
                features: ["Team roster management", "Live stat tracking", "PlayMaker canvas", "Season archives"]
              },
              {
                title: "Athletes",
                icon: TrendingUp,
                color: "green",
                description: "View your stats, access plays, and build your shareable HYPE card.",
                features: ["Personal HYPE Card", "Stats dashboard", "Playbook access", "Video highlights"]
              },
              {
                title: "Supporters",
                icon: Heart,
                color: "purple",
                description: "Follow your athletes, send shoutouts, and engage on game day.",
                features: ["Game Day Live", "Send shoutouts", "Earn badges", "Manage athletes"]
              }
            ].map((role) => (
              <Card 
                key={role.title}
                className="bg-white/5 border-white/10 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setActiveRoleModal(role.title)}
                data-testid={`card-role-${role.title.toLowerCase()}`}
              >
                <CardContent className="pt-8 pb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                    role.color === 'blue' ? 'bg-blue-500/20' : 
                    role.color === 'green' ? 'bg-green-500/20' : 'bg-purple-500/20'
                  }`}>
                    <role.icon className={`w-7 h-7 ${
                      role.color === 'blue' ? 'text-blue-400' : 
                      role.color === 'green' ? 'text-green-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                  <p className="text-gray-300 text-sm mb-6">{role.description}</p>
                  <ul className="space-y-2">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-orange-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-orange-400 text-sm font-medium group-hover:gap-3 transition-all">
                    View details
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Start free and upgrade when you're ready. Athletes are always free.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-blue-500/30" data-testid="card-pricing-coach">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white">Coach</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Badge className="bg-white/10 text-gray-300 border-0 mb-4">Free Tier</Badge>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Create team & manage roster
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Schedule events
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Team chat
                    </li>
                  </ul>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">$7.99</span>
                    <span className="text-gray-300">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      PlayMaker & Playbook
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Full StatTracker
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Season management
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Video highlights
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-green-500/30 relative" data-testid="card-pricing-athlete">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white border-0">Always Free</Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white">Athlete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Join team with code
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    View your stats
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Access playbook
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Connect with supporter
                  </li>
                </ul>
                <div className="border-t border-white/10 pt-6">
                  <Badge className="bg-purple-500/20 text-purple-400 border-0 mb-4">Via Supporter Pro</Badge>
                  <p className="text-xs text-gray-300 mb-3">Premium features unlock when your supporter upgrades:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Shareable HYPE Card
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Upload video highlights
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Extended profile
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-purple-500/30" data-testid="card-pricing-supporter">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-white">Supporter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Badge className="bg-white/10 text-gray-300 border-0 mb-4">Free Tier</Badge>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Follow team athletes
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Game Day Live engagement
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Send shoutouts
                    </li>
                  </ul>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold text-white">$5.99</span>
                    <span className="text-gray-300">/month</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Manage independent athletes
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Custom dashboard themes
                    </li>
                    <li className="flex items-center gap-2 text-white/90">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      Season history access
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-300 mt-10" data-testid="text-subscription-note">
            All subscriptions are managed through in-app purchases on the App Store or Google Play.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Smartphone className="w-5 h-5 text-orange-400" />
            <span className="text-gray-300 font-medium">Available on iOS & Android</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Ignite Your Team?
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Join coaches, athletes, and supporters who are already using STATFYR 
            to elevate their game day experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" data-testid="link-cta-bottom">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10 h-14 text-base gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <p className="text-gray-300 text-sm mt-6">iOS & Android app coming soon</p>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={statfyrLogo} alt="STATFYR" className="w-6 h-6" />
              <span className="font-bold text-white">STATF<span className="text-orange-500">Y</span>R</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-300">
              <a href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">Terms</a>
              <a href="/cookies" className="hover:text-white transition-colors" data-testid="link-cookies">Cookies</a>
              <a href="/contact" className="hover:text-white transition-colors" data-testid="link-contact">Contact</a>
            </div>
            <p className="text-sm text-gray-300">
              © {new Date().getFullYear()} STATFYR. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <Dialog open={activeRoleModal === "Coaches"} onOpenChange={(open) => !open && setActiveRoleModal(null)}>
        <DialogContent className="max-w-2xl bg-white/5 border-white/10" data-testid="dialog-coaches">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              Coach Dashboard
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Full control over your team's success
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {roleFeatures.coaches.features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-4 bg-white/10 rounded-xl">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeRoleModal === "Athletes"} onOpenChange={(open) => !open && setActiveRoleModal(null)}>
        <DialogContent className="max-w-2xl bg-white/5 border-white/10" data-testid="dialog-athletes">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              Athlete Dashboard
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Your personal sports hub
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {roleFeatures.athletes.features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-4 bg-white/10 rounded-xl">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeRoleModal === "Supporters"} onOpenChange={(open) => !open && setActiveRoleModal(null)}>
        <DialogContent className="max-w-2xl bg-white/5 border-white/10" data-testid="dialog-supporters">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-400" />
              </div>
              Supporter Dashboard
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Cheer on your favorite athletes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {roleFeatures.supporters.features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-4 bg-white/10 rounded-xl">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Live Stat Tracking"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-stattracking">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              Live Stat Tracking
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Real-time statistics for every play
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Track every stat as it happens with our intuitive stat tracking interface:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Move players in/out of game</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Sport-specific stat categories</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Individual and team modes</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Automatic stat calculations</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "PlayMaker"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-playmaker">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              PlayMaker
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Design winning plays with ease
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Create professional plays with our interactive canvas-based designer:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Drag-and-drop player positions</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Draw movement arrows and paths</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Multiple court/field templates</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Save and organize into playbooks</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Game Day Live"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-gamedaylive">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              Game Day Live
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Real-time supporter engagement
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Engage with your athletes during live games:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" />Tap to show support in real-time</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" />Watch the HYPE meter rise</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" />Earn badges for participation</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" />Guest access via QR code</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Send Shoutouts"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-shoutouts">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-orange-400" />
              </div>
              Shoutouts
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Send encouragement directly to athletes
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Your messages appear directly on athletes' devices during games:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Type personalized messages</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Athletes see shoutouts in real-time</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Build athlete confidence</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-400" />Review sent shoutouts later</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "HYPE Card"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-hypecard">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-green-400" />
              </div>
              HYPE Card
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Your shareable athlete profile
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Create a stunning digital profile to share:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Showcase your stats and highlights</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Custom profile photo and bio</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Share link with recruiters</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />QR code for easy sharing</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Personal Stats"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-personalstats">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-400" />
              </div>
              Personal Stats
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Track your performance over time
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>See all your stats in one place:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Game-by-game breakdown</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Season averages and totals</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Visual charts and graphs</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Track improvement over time</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Team Playbook"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-teamplaybook">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-green-400" />
              </div>
              Team Playbook
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Access your team's plays anytime
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Study your team's plays wherever you are:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />View all plays shared by coach</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Organized by category</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Study before games</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Understand your role in each play</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Video Highlights"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-videohighlights">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-green-400" />
              </div>
              Video Highlights
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Showcase your best moments
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Build your highlight reel:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Upload game clips</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Automatic video processing</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Share on your HYPE Card</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" />Perfect for recruiting</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Team Management"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-teammanagement">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              Team Management
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Organize your entire team
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Complete team management tools:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Create and manage rosters</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Generate team join codes</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Assign jersey numbers</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-400" />Set player positions</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeFeatureModal === "Earn Badges"} onOpenChange={(open) => !open && setActiveFeatureModal(null)}>
        <DialogContent className="max-w-lg bg-white/5 border-white/10" data-testid="dialog-earnbadges">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              Badge System
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Rewards for dedicated supporters
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-white/80">
            <p>Earn badges and unlock rewards:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Bronze, Silver, Gold, Legend tiers</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Unlock custom dashboard themes</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Show off your dedication</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" />Earn through game participation</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
