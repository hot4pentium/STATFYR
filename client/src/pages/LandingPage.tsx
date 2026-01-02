import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import logoImage from "@assets/red_logo-removebg-preview_1766535816909.png";
import dashboardScreenshot from "@assets/Screenshot_2026-01-01_at_9.48.07_PM_1767322113880.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, CalendarClock, ClipboardList, BarChart3, 
  Trophy, Shield, Radio, Hand, Award, Bell, 
  Video, MessageSquare, Target, ChevronRight,
  Zap, Heart, Star, Smartphone, Download, Share,
  Wifi, WifiOff, Home, Plus, Sparkles, ArrowRight,
  Check, Info
} from "lucide-react";


interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
  variant?: "light" | "dark" | "glass";
}

function FeatureCard({ icon, title, description, delay = 0, variant = "light" }: FeatureCardProps) {
  const baseClasses = "rounded-3xl p-6 transition-all duration-500 group";
  const variantClasses = {
    light: "bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1",
    dark: "bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:-translate-y-1",
    glass: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.1)] hover:bg-white/20 hover:-translate-y-1"
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <div className={`mb-4 p-3 rounded-2xl w-fit transition-transform duration-300 group-hover:scale-110 ${
        variant === "dark" || variant === "glass" 
          ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20" 
          : "bg-gradient-to-br from-emerald-100 to-emerald-50"
      }`}>
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-2 ${variant === "dark" || variant === "glass" ? "text-white" : "text-gray-900"}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${variant === "dark" || variant === "glass" ? "text-gray-400" : "text-gray-600"}`}>
        {description}
      </p>
    </motion.div>
  );
}

function PWAStep({ number, icon, title, description }: { number: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: number * 0.15 }}
      className="flex items-start gap-4"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h4 className="font-bold text-[#8d97a8]">{title}</h4>
        </div>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

function FloatingShape({ className }: { className: string; delay?: number }) {
  return <div className={className} />;
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const [showPWAModal, setShowPWAModal] = useState(false);

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  const goToAuth = () => setLocation("/auth");

  return (
    <div className="min-h-screen bg-gray-950 overflow-x-hidden">
      
      {/* Hero Section - Dark with animated gradient */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.25),rgba(0,0,0,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_100%,rgba(59,130,246,0.2),rgba(0,0,0,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_50%,rgba(6,182,212,0.15),rgba(0,0,0,0))]" />
        </div>
        
        {/* Floating geometric shapes */}
        <FloatingShape 
          className="absolute top-20 right-[20%] w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-2xl"
          delay={0}
        />
        <FloatingShape 
          className="absolute bottom-32 left-[10%] w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500/15 to-transparent blur-3xl"
          delay={2}
        />
        <FloatingShape 
          className="absolute top-1/2 right-[5%] w-40 h-40 rounded-3xl bg-gradient-to-br from-cyan-400/10 to-emerald-400/10 blur-xl rotate-12"
          delay={1}
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 container mx-auto px-6 text-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <img 
                src={logoImage} 
                alt="STATFYR Logo" 
                className="h-20 w-20 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              />
              <h1 className="text-6xl md:text-8xl tracking-tight text-white" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                STATF<span className="text-orange-500">Y</span>R
              </h1>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            The complete team management app for{" "}
            <span className="text-emerald-400 font-semibold">coaches</span>,{" "}
            <span className="text-white font-semibold">athletes</span>, and{" "}
            <span className="text-blue-400 font-semibold">supporters</span>.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button 
              onClick={goToAuth}
              className="group text-lg px-10 py-5 gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30 font-medium inline-flex items-center justify-center hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105" 
              data-testid="button-get-started"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-lg px-10 py-5 rounded-2xl border border-white/20 text-white font-medium bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all duration-300"
              data-testid="button-see-features"
            >
              Learn More
            </button>
          </motion.div>

          <motion.div 
            className="flex justify-center gap-8 md:gap-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">Free</div>
              <div className="text-sm text-gray-500">To Get Started</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">Live</div>
              <div className="text-sm text-gray-500">Game Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">5+</div>
              <div className="text-sm text-gray-500">Sports Supported</div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* PWA Install Section - Gradient transition */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(16,185,129,0.08),transparent)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 rounded-full px-4 py-2 text-sm font-medium border border-emerald-500/20">
                <Smartphone className="h-4 w-4" />
                Progressive Web App
              </div>
              <button 
                onClick={() => setShowPWAModal(true)}
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                data-testid="button-pwa-learn-more"
              >
                <Info className="h-4 w-4" />
                Learn More
              </button>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Add STATF<span className="text-orange-500">Y</span>R to Your Home Screen
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get the full app experience without downloading from an app store. Works on any device, even offline!
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Device Mockup */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative h-[560px] flex items-center justify-center"
              >
                {/* Phone mockup with real screenshot */}
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-[3rem] blur-2xl" />
                  <div className="relative bg-gray-800 rounded-[3rem] p-2 shadow-2xl border border-white/10">
                    <div className="rounded-[2.5rem] overflow-hidden">
                      <img 
                        src={dashboardScreenshot} 
                        alt="STATFYR Coach Dashboard" 
                        className="w-[260px] h-[520px] object-contain bg-gray-900 rounded-[2.5rem]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Install Steps */}
              <div className="space-y-6">
                <PWAStep
                  number={1}
                  icon={<Share className="h-5 w-5 text-gray-400" />}
                  title="Tap Share"
                  description="On iOS, tap the share button in Safari. On Android, tap the menu button in Chrome."
                />
                <PWAStep
                  number={2}
                  icon={<Plus className="h-5 w-5 text-gray-400" />}
                  title="Add to Home Screen"
                  description="Select 'Add to Home Screen' from the menu options."
                />
                <PWAStep
                  number={3}
                  icon={<Smartphone className="h-5 w-5 text-gray-400" />}
                  title="Launch Like an App"
                  description="Open STATFYR directly from your home screen. No browser needed!"
                />

                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Coaches (Light theme with gradient bg) */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-100 to-white" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-950 to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-40 right-0 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
              <ClipboardList className="h-4 w-4" />
              For Coaches
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Lead
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your team, track stats, design plays, and communicate - all in one place.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Users className="h-6 w-6 text-blue-500" />}
              title="Team Roster"
              description="Manage your entire team with jersey numbers, positions, and contact info all in one place."
              delay={0}
            />
            <FeatureCard
              icon={<CalendarClock className="h-6 w-6 text-green-500" />}
              title="Smart Scheduling"
              description="Create games, practices, and events with automatic drink and snack duty assignments."
              delay={0.1}
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-orange-500" />}
              title="StatTracker"
              description="Track live game statistics by player or team. See trends, ratios, and performance over time."
              delay={0.2}
            />
            <FeatureCard
              icon={<Video className="h-6 w-6 text-cyan-500" />}
              title="Video Highlights"
              description="Upload and share team highlights. Automatic video processing and thumbnail generation."
              delay={0.3}
            />
            <FeatureCard
              icon={<ClipboardList className="h-6 w-6 text-purple-500" />}
              title="PlayMaker"
              description="Draw and design plays with our interactive canvas. Share plays with your team."
              delay={0.4}
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6 text-pink-500" />}
              title="Team Chat"
              description="In-app messaging with channels for announcements, tactics, and general chat."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Athletes (Dark theme) */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 rounded-full px-4 py-2 text-sm font-medium mb-4 border border-cyan-500/20">
              <Trophy className="h-4 w-4" />
              For Athletes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Track Your Journey
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See your stats, share your highlights, and stay connected with your team.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Trophy className="h-6 w-6 text-yellow-400" />}
              title="Personal Stats"
              description="View your performance across all games. Track your progress and celebrate your wins."
              delay={0}
              variant="dark"
            />
            <FeatureCard
              icon={<CalendarClock className="h-6 w-6 text-blue-400" />}
              title="Team Schedule"
              description="Never miss a game or practice. See all upcoming events with location and time details."
              delay={0.1}
              variant="dark"
            />
            <FeatureCard
              icon={<Award className="h-6 w-6 text-purple-400" />}
              title="Hype Card"
              description="Your shareable athlete profile with stats, highlights, and team info."
              delay={0.2}
              variant="dark"
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 text-red-400" />}
              title="Starting Lineups"
              description="See when you're starting and your position for upcoming games."
              delay={0.3}
              variant="dark"
            />
            <FeatureCard
              icon={<Video className="h-6 w-6 text-cyan-400" />}
              title="Highlight Reel"
              description="Watch team highlights and share your best moments with friends and family."
              delay={0.4}
              variant="dark"
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6 text-green-400" />}
              title="Push Notifications"
              description="Get notified about games, practices, and important team updates."
              delay={0.5}
              variant="dark"
            />
          </div>
        </div>
      </section>

      {/* Features Section - Supporters (Gradient mesh) */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-200/40 to-transparent rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
              <Heart className="h-4 w-4" />
              For Supporters
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cheer From Anywhere
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Can't be at the game? Show your support with live taps, shoutouts, and earn badges!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Hand className="h-6 w-6 text-orange-500" />}
              title="Live Taps"
              description="Tap to cheer during live games. Every tap adds to your season total and earns badges."
              delay={0}
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6 text-red-500" />}
              title="Send Shoutouts"
              description="Send quick cheers to individual athletes during games. Show them you're watching!"
              delay={0.1}
            />
            <FeatureCard
              icon={<Award className="h-6 w-6 text-yellow-500" />}
              title="Earn Badges"
              description="Unlock Bronze, Silver, Gold, and Legend badges as you rack up taps throughout the season."
              delay={0.2}
            />
            <FeatureCard
              icon={<Star className="h-6 w-6 text-purple-500" />}
              title="Theme Unlocks"
              description="Each badge unlocks a new dashboard theme. Show off your dedication with custom styles."
              delay={0.3}
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6 text-blue-500" />}
              title="Game Notifications"
              description="Get notified when games go live so you never miss a chance to cheer."
              delay={0.4}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-green-500" />}
              title="Managed Athletes"
              description="Parents can create and manage athlete profiles for younger players."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Game Day Live Section - Dark with glow effects */}
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_70%)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="grid md:grid-cols-2">
                <div className="p-10 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 rounded-full px-4 py-2 text-sm font-medium mb-4 w-fit border border-emerald-500/20">
                    <Radio className="h-4 w-4" />
                    Game Day Live
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Live Taps During Games
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Send live taps during games to show your support! Every tap counts towards your season total and unlocks exclusive badges.
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                      <div className="text-2xl font-bold text-emerald-400">1,247</div>
                      <div className="text-xs text-gray-500">Taps This Game</div>
                    </div>
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                      <div className="text-2xl font-bold text-yellow-400">Gold</div>
                      <div className="text-xs text-gray-500">Badge Earned</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-black p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[350px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.4)_0%,transparent_60%)]" />
                  <div className="text-sm text-emerald-400 font-bold mb-4 flex items-center gap-2 relative z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                    LIVE NOW
                  </div>
                  <motion.div 
                    className="w-36 h-36 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50 border-4 border-white/20 cursor-pointer relative z-10"
                    whileHover={{ scale: 1.1, boxShadow: "0 0 60px rgba(16,185,129,0.6)" }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ boxShadow: ["0 0 30px rgba(16,185,129,0.4)", "0 0 50px rgba(16,185,129,0.6)", "0 0 30px rgba(16,185,129,0.4)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Hand className="h-16 w-16 text-white" />
                  </motion.div>
                  <div className="text-xl font-bold mt-4 text-white relative z-10">SEND A TAP!</div>
                  <div className="text-sm text-gray-400 mt-1 relative z-10">Show your support live</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Vibrant gradient with particles */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-cyan-500 to-blue-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Floating orbs */}
        <FloatingShape className="absolute top-10 left-[10%] w-32 h-32 rounded-full bg-white/10 blur-xl" delay={0} />
        <FloatingShape className="absolute bottom-10 right-[15%] w-48 h-48 rounded-full bg-white/10 blur-2xl" delay={1} />
        <FloatingShape className="absolute top-1/2 right-[30%] w-24 h-24 rounded-full bg-white/15 blur-lg" delay={2} />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Transform<br />Your Team?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Join thousands of coaches, athletes, and supporters already using STATFYR.
            </p>
            <button 
              className="group text-lg px-12 py-6 gap-3 bg-white text-emerald-600 hover:bg-gray-100 rounded-2xl shadow-2xl font-bold inline-flex items-center justify-center transition-all duration-300 hover:scale-105" 
              onClick={goToAuth}
              data-testid="button-cta-get-started"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-white/60 mt-6 text-sm">
              No credit card required. Add to home screen for the best experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimal dark */}
      <footer className="py-12 bg-gray-950 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="STATFYR" className="h-10 w-10" />
              <span className="text-xl text-white font-bold">STATF<span className="text-orange-500">Y</span>R</span>
            </div>
            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} STATFYR. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* PWA Learn More Modal */}
      <Dialog open={showPWAModal} onOpenChange={setShowPWAModal}>
        <DialogContent className="max-w-2xl bg-gray-900 border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Why We Built a Progressive Web App</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-gray-300">
            <p>
              Our team management platform works right in your browser—no app store required. Install it on your phone or tablet in seconds and get the same fast, reliable experience as a native app, but with instant updates and zero download hassles.
            </p>
            
            <div>
              <h4 className="font-semibold text-white mb-3">What does this mean for you?</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Instant access:</span>{" "}
                    <span>No waiting for app store downloads or updates</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Works everywhere:</span>{" "}
                    <span>iPhone, Android, tablet, or desktop—one app fits all</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Always current:</span>{" "}
                    <span>New features arrive automatically, no manual updates needed</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Lightweight:</span>{" "}
                    <span>Takes up minimal space on your device</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">Secure:</span>{" "}
                    <span>Built with the same technology that powers modern web banking</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Comparison Table */}
            <div>
              <h4 className="font-semibold text-white mb-3">PWA vs Traditional App Store Apps</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 font-semibold text-white">Feature</th>
                      <th className="text-left py-2 pr-4 font-semibold text-emerald-400">Our PWA</th>
                      <th className="text-left py-2 font-semibold text-gray-400">Traditional Apps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Installation</td>
                      <td className="py-2 pr-4 text-gray-300">Add to home screen in 10 seconds</td>
                      <td className="py-2 text-gray-400">Download from app store, wait for install</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Updates</td>
                      <td className="py-2 pr-4 text-gray-300">Automatic, instant</td>
                      <td className="py-2 text-gray-400">Manual approval process, user must update</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Storage space</td>
                      <td className="py-2 pr-4 text-gray-300">Minimal (~5-10 MB)</td>
                      <td className="py-2 text-gray-400">Often 50-200+ MB</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Availability</td>
                      <td className="py-2 pr-4 text-gray-300">Works on any device with a browser</td>
                      <td className="py-2 text-gray-400">Separate builds for iOS/Android</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Offline access</td>
                      <td className="py-2 pr-4 text-emerald-400">Core features work offline</td>
                      <td className="py-2 text-gray-400">Works offline</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Home screen icon</td>
                      <td className="py-2 pr-4 text-emerald-400">Looks like any other app</td>
                      <td className="py-2 text-gray-400">Native app icon</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Cost to you</td>
                      <td className="py-2 pr-4 text-gray-300">Free, no app store fees</td>
                      <td className="py-2 text-gray-400">Free (we absorb the costs)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium text-white">Notifications</td>
                      <td className="py-2 pr-4 text-gray-300">Push notifications</td>
                      <td className="py-2 text-gray-400">Push notifications</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Installation Instructions */}
            <div>
              <h4 className="font-semibold text-white mb-4">How to Install (It's Easy!)</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-white mb-2">On iPhone/iPad:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300 ml-2">
                    <li>Open this site in Safari</li>
                    <li>Tap the Share button (square with arrow)</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right</li>
                    <li>Done! Find the app icon on your home screen</li>
                  </ol>
                </div>
                
                <div>
                  <h5 className="font-medium text-white mb-2">On Android:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300 ml-2">
                    <li>Open this site in Chrome</li>
                    <li>Tap the three dots menu (top right)</li>
                    <li>Tap "Add to Home Screen" or "Install App"</li>
                    <li>Tap "Install"</li>
                    <li>Done! Find the app icon in your app drawer</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
