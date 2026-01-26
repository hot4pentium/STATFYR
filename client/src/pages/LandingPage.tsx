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
  Tablet,
  Monitor,
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
  ChevronRight,
  Expand,
  X
} from "lucide-react";
import statfyrLogo from "@/assets/statfyr-fire-logo.png";
import hypeCardPreview from "@/assets/hype-card-preview.png";
import stattrackerPreview from "@/assets/stattracker-preview.png";
import livetapsPreview from "@/assets/livetaps-preview.png";
import dashboardPreview from "@/assets/dashboard-preview.png";
import shoutoutsPreview from "@/assets/shoutouts-preview.png";
import landingBg from "@/assets/landing-bg.png";

export default function LandingPage() {
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);

  const toggleFlip = (cardId: string) => {
    setFlippedCard(flippedCard === cardId ? null : cardId);
  };

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
    <div className="min-h-screen" style={{ 
      backgroundImage: `url(${landingBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
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

      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-36 md:w-72 h-36 md:h-72 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-7xl font-bold tracking-tight text-white mb-4 md:mb-6 leading-[1.1]">
              Ignite Your Team's
              <span className="block text-orange-500">Full Potential</span>
            </h1>
            
            <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2" data-testid="text-hero-description">
              STATFYR brings coaches, athletes, and supporters together with powerful tools 
              for team management, live stat tracking, and game day engagement.
            </p>
            
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs md:text-sm text-gray-400" data-testid="text-coming-soon">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 md:w-4 md:h-4" />
                <span>iOS & Android Coming Soon</span>
              </div>
              <span className="hidden sm:block w-1 h-1 bg-white/20 rounded-full" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="container mx-auto max-w-3xl px-8 py-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/50" />
          <img src={statfyrLogo} alt="STATFYR" className="w-8 h-8" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/50" />
        </div>
      </div>

      <section id="features" className="py-16 md:py-24 px-4 md:px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-5xl font-bold text-white mb-3 md:mb-4">
              Built For Everyone On Your Team
            </h2>
            <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto px-2">
              Whether you're leading the team, playing the game, or cheering from the sidelines
            </p>
          </div>

          {/* Roles Container - Horizontal Layout with Flip Cards */}
          <div className="max-w-5xl mx-auto grid grid-cols-3 gap-2 md:gap-6 px-2 md:px-0">
            {/* Coach Flip Card */}
            <div className="relative h-[280px] md:h-[320px]" style={{ perspective: '1000px' }} data-testid="card-role-coach">
              <div 
                className={`relative w-full h-full transition-transform duration-500 ${flippedCard === 'coach' ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-900/70 rounded-xl md:rounded-2xl border border-blue-500/30 p-3 md:p-5 backdrop-blur-sm [backface-visibility:hidden] flex flex-col">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-white mb-3">COACHES</h3>
                  <ul className="space-y-1 md:space-y-2 flex-1">
                    {["Create & manage rosters", "Track stats in real-time", "Design plays with PlayMaker", "Schedule games & practices"].map((item) => (
                      <li key={item} className="flex items-center gap-1.5 md:gap-2 text-gray-200 text-[10px] md:text-sm">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-blue-400 flex-shrink-0" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => toggleFlip('coach')}
                    className="text-blue-400 text-xs md:text-sm hover:text-blue-300 transition-colors mt-3"
                    data-testid="button-expand-coach"
                  >
                    More...
                  </button>
                </div>
                {/* Back - Pricing */}
                <div className="absolute inset-0 bg-white/5 rounded-xl md:rounded-2xl border border-blue-500/30 p-3 md:p-5 backdrop-blur-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <button 
                    onClick={() => toggleFlip('coach')}
                    className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                  </button>
                  <div className="flex flex-col items-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white">Coach</h3>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-400 mb-1">Free features:</p>
                  <ul className="space-y-0.5 mb-2">
                    {["Create team", "Manage rosters", "Schedule events", "Team chat"].map((item) => (
                      <li key={item} className="flex items-center gap-1 text-gray-300 text-[9px] md:text-[11px]">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-2">
                    <span className="text-base md:text-lg font-bold text-white">$7.99</span>
                    <span className="text-[10px] text-gray-400">/mo</span>
                  </div>
                  <ul className="space-y-0.5">
                    {["PlayMaker", "StatTracker", "Season history"].map((item) => (
                      <li key={item} className="flex items-center gap-1 text-white/90 text-[9px] md:text-[11px]">
                        <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Athlete Flip Card */}
            <div className="relative h-[280px] md:h-[320px]" style={{ perspective: '1000px' }} data-testid="card-role-athlete">
              <div 
                className={`relative w-full h-full transition-transform duration-500 ${flippedCard === 'athlete' ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-900/70 rounded-xl md:rounded-2xl border border-green-500/30 p-3 md:p-5 backdrop-blur-sm [backface-visibility:hidden] flex flex-col">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-white mb-3">ATHLETES</h3>
                  <ul className="space-y-1 md:space-y-2 flex-1">
                    {["Chat with team", "View your stats", "Access team playbook", "Receive shoutouts"].map((item) => (
                      <li key={item} className="flex items-center gap-1.5 md:gap-2 text-gray-200 text-[10px] md:text-sm">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => toggleFlip('athlete')}
                    className="text-green-400 text-xs md:text-sm hover:text-green-300 transition-colors mt-3"
                    data-testid="button-expand-athlete"
                  >
                    More...
                  </button>
                </div>
                {/* Back - Pricing */}
                <div className="absolute inset-0 bg-white/5 rounded-xl md:rounded-2xl border border-green-500/30 p-3 md:p-5 backdrop-blur-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <button 
                    onClick={() => toggleFlip('athlete')}
                    className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  </button>
                  <div className="flex flex-col items-center mb-2">
                    <Badge className="bg-green-500 text-white border-0 text-[8px] md:text-[10px] px-2 py-0.5 mb-1">Always Free</Badge>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white">Athlete</h3>
                    <div className="mt-1">
                      <span className="text-base md:text-lg font-bold text-green-400">$0</span>
                      <span className="text-[10px] text-gray-400"> forever</span>
                    </div>
                  </div>
                  <ul className="space-y-0.5">
                    {["Chat with team", "View your stats", "Access playbook", "Receive shoutouts", "HYPE Card*", "Video highlights*"].map((item) => (
                      <li key={item} className="flex items-center gap-1 text-gray-300 text-[9px] md:text-[11px]">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[7px] md:text-[9px] text-gray-500 mt-1">*Requires Supporter Pro</p>
                </div>
              </div>
            </div>

            {/* Supporter Flip Card */}
            <div className="relative h-[280px] md:h-[320px]" style={{ perspective: '1000px' }} data-testid="card-role-supporter">
              <div 
                className={`relative w-full h-full transition-transform duration-500 ${flippedCard === 'supporter' ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-gray-900/70 rounded-xl md:rounded-2xl border border-purple-500/30 p-3 md:p-5 backdrop-blur-sm [backface-visibility:hidden] flex flex-col">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-white mb-3">SUPPORTERS</h3>
                  <ul className="space-y-1 md:space-y-2 flex-1">
                    {["Send shoutouts", "Tap to support", "Earn badges", "Manage athletes"].map((item) => (
                      <li key={item} className="flex items-center gap-1.5 md:gap-2 text-gray-200 text-[10px] md:text-sm">
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => toggleFlip('supporter')}
                    className="text-purple-400 text-xs md:text-sm hover:text-purple-300 transition-colors mt-3"
                    data-testid="button-expand-supporter"
                  >
                    More...
                  </button>
                </div>
                {/* Back - Pricing */}
                <div className="absolute inset-0 bg-white/5 rounded-xl md:rounded-2xl border border-purple-500/30 p-3 md:p-5 backdrop-blur-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <button 
                    onClick={() => toggleFlip('supporter')}
                    className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                  </button>
                  <div className="flex flex-col items-center mb-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-1">
                      <Heart className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-white">Supporter</h3>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-gray-400 mb-1">Free features:</p>
                  <ul className="space-y-0.5 mb-2">
                    {["Follow team", "Game Day Live", "Send shoutouts", "HYPE Taps"].map((item) => (
                      <li key={item} className="flex items-center gap-1 text-gray-300 text-[9px] md:text-[11px]">
                        <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-2">
                    <span className="text-base md:text-lg font-bold text-white">$5.99</span>
                    <span className="text-[10px] text-gray-400">/mo</span>
                  </div>
                  <ul className="space-y-0.5">
                    {["Manage athletes", "Themes & badges", "Season history"].map((item) => (
                      <li key={item} className="flex items-center gap-1 text-white/90 text-[9px] md:text-[11px]">
                        <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="flex items-center gap-4 my-8 md:my-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/50" />
            <img src={statfyrLogo} alt="STATFYR" className="w-8 h-8" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/50" />
          </div>

          {/* Platform Section */}
          <div className="flex flex-col max-w-2xl mx-auto mt-12">
            <div className="relative flex items-center justify-start py-8 md:py-10 px-4 md:px-6 rounded-2xl bg-gradient-to-bl from-orange-950 via-orange-900/80 to-black/60 border border-orange-500/30" data-testid="card-platform">
              <div className="rounded-xl overflow-hidden border border-orange-500/30 shadow-xl w-[50%] md:w-[45%] ml-0">
                <img 
                  src={dashboardPreview} 
                  alt="Dashboard Preview" 
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-2 md:right-3 bg-black rounded-xl border border-orange-500/40 p-3 md:p-4 shadow-2xl w-auto max-w-[200px] md:max-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-white">Works Everywhere</h3>
                    <p className="text-xs text-gray-400">One app, all your devices</p>
                  </div>
                </div>
                <div className="flex justify-around items-center py-4 mb-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                      <Smartphone className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-300">Phone</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                      <Tablet className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-300">Tablet</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/30">
                      <Monitor className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
                    </div>
                    <span className="text-[10px] md:text-xs text-gray-300">Desktop</span>
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-gray-400 border-t border-white/10 pt-2">
                  Access your dashboard from any device, anytime
                </p>
              </div>
            </div>
          </div>
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
