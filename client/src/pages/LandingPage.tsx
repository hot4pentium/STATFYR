import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import logoImage from "@assets/red_logo-removebg-preview_1766535816909.png";
import { Button } from "@/components/ui/button";
import { 
  Users, CalendarClock, ClipboardList, BarChart3, 
  Trophy, Shield, Radio, Hand, Award, Bell, 
  Video, MessageSquare, Target, ChevronRight,
  Zap, Heart, Star, Smartphone, Download, Share,
  Wifi, WifiOff, Home, Plus, Sparkles, ArrowRight
} from "lucide-react";

const SUPPORTED_SPORTS = ["Baseball", "Basketball", "Football", "Soccer", "Volleyball"];

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
          ? "bg-gradient-to-br from-orange-500/20 to-red-500/20" 
          : "bg-gradient-to-br from-orange-100 to-orange-50"
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
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h4 className="font-bold text-gray-900">{title}</h4>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

function FloatingShape({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const [currentSportIndex, setCurrentSportIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSportIndex((prev) => (prev + 1) % SUPPORTED_SPORTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const goToAuth = () => setLocation("/auth");

  return (
    <div className="min-h-screen bg-gray-950 overflow-x-hidden">
      
      {/* Hero Section - Dark with animated gradient */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.3),rgba(0,0,0,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_100%,rgba(239,68,68,0.2),rgba(0,0,0,0))]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_50%,rgba(249,115,22,0.15),rgba(0,0,0,0))]" />
        </div>
        
        {/* Floating geometric shapes */}
        <FloatingShape 
          className="absolute top-20 right-[20%] w-64 h-64 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-2xl"
          delay={0}
        />
        <FloatingShape 
          className="absolute bottom-32 left-[10%] w-80 h-80 rounded-full bg-gradient-to-tr from-red-500/15 to-transparent blur-3xl"
          delay={2}
        />
        <FloatingShape 
          className="absolute top-1/2 right-[5%] w-40 h-40 rounded-3xl bg-gradient-to-br from-orange-400/10 to-red-400/10 blur-xl rotate-12"
          delay={1}
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Interactive glow following mouse */}
        <div 
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 blur-3xl pointer-events-none transition-all duration-300"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
        
        <div className="relative z-10 container mx-auto px-6 text-center py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2 text-sm text-white/80 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="h-4 w-4 text-orange-400" />
              The Future of Team Management
            </motion.div>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <motion.img 
                src={logoImage} 
                alt="STATFYR Logo" 
                className="h-20 w-20 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <h1 className="text-6xl md:text-8xl tracking-tight text-white" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                STATF<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Y</span>R
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
            <span className="text-orange-400 font-semibold">coaches</span>,{" "}
            <span className="text-white font-semibold">athletes</span>, and{" "}
            <span className="text-red-400 font-semibold">supporters</span>.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button 
              onClick={goToAuth}
              className="group text-lg px-10 py-5 gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-lg shadow-orange-500/30 font-medium inline-flex items-center justify-center hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105" 
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
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">Free</div>
              <div className="text-sm text-gray-500">To Get Started</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">Live</div>
              <div className="text-sm text-gray-500">Game Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 h-10 overflow-hidden">
                <motion.div
                  key={currentSportIndex}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {SUPPORTED_SPORTS[currentSportIndex]}
                </motion.div>
              </div>
              <div className="text-sm text-gray-500">Multi-Sport Support</div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <motion.div 
              className="w-1.5 h-1.5 rounded-full bg-orange-400"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* PWA Install Section - Gradient transition */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(249,115,22,0.08),transparent)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 rounded-full px-4 py-2 text-sm font-medium mb-4 border border-orange-500/20">
              <Smartphone className="h-4 w-4" />
              Progressive Web App
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Add STATF<span className="text-orange-400">Y</span>R to Your Home Screen
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
                className="relative h-[450px] flex items-center justify-center"
              >
                {/* Phone mockup with real screenshot */}
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-[3rem] blur-2xl" />
                  <div className="relative bg-gray-800 rounded-[3rem] p-2 shadow-2xl border border-white/10">
                    <div className="rounded-[2.5rem] overflow-hidden">
                      <img 
                        src="/attached_assets/Screenshot_2026-01-01_at_9.48.07_PM_1767322113880.png" 
                        alt="STATFYR Coach Dashboard" 
                        className="w-[240px] h-auto rounded-[2.5rem]"
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

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-xl">
                      <WifiOff className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Works Offline</div>
                      <div className="text-sm text-gray-400">Access your team data even without internet</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Coaches (Light theme with gradient bg) */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50" />
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-950 to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-40 right-0 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-red-200/30 rounded-full blur-3xl" />
        
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(249,115,22,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 rounded-full px-4 py-2 text-sm font-medium mb-4 border border-orange-500/20">
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
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-red-200/50 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/40 to-transparent rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15),transparent_70%)]" />
        
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
                  <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 rounded-full px-4 py-2 text-sm font-medium mb-4 w-fit border border-red-500/20">
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
                      <div className="text-2xl font-bold text-orange-400">1,247</div>
                      <div className="text-xs text-gray-500">Taps This Game</div>
                    </div>
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                      <div className="text-2xl font-bold text-yellow-400">Gold</div>
                      <div className="text-xs text-gray-500">Badge Earned</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-black p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[350px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.4)_0%,transparent_60%)]" />
                  <div className="text-sm text-red-400 font-bold mb-4 flex items-center gap-2 relative z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                    LIVE NOW
                  </div>
                  <motion.div 
                    className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/50 border-4 border-white/20 cursor-pointer relative z-10"
                    whileHover={{ scale: 1.1, boxShadow: "0 0 60px rgba(239,68,68,0.6)" }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ boxShadow: ["0 0 30px rgba(239,68,68,0.4)", "0 0 50px rgba(239,68,68,0.6)", "0 0 30px rgba(239,68,68,0.4)"] }}
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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600" />
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
              className="group text-lg px-12 py-6 gap-3 bg-white text-orange-500 hover:bg-gray-100 rounded-2xl shadow-2xl font-bold inline-flex items-center justify-center transition-all duration-300 hover:scale-105" 
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
              <span className="text-xl text-white font-bold">STATF<span className="text-orange-400">Y</span>R</span>
            </div>
            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} STATFYR. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
