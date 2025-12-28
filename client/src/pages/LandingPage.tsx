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
  Wifi, WifiOff, Home, Plus
} from "lucide-react";

const SUPPORTED_SPORTS = ["Baseball", "Basketball", "Football", "Soccer", "Volleyball"];

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-3xl p-6 shadow-[inset_0_2px_20px_rgba(0,0,0,0.08)] hover:shadow-[inset_0_4px_30px_rgba(0,0,0,0.12)] transition-all duration-300"
    >
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
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
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
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

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const [currentSportIndex, setCurrentSportIndex] = useState(0);

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSportIndex((prev) => (prev + 1) % SUPPORTED_SPORTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const goToAuth = () => setLocation("/auth");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-red-200/30 rounded-full blur-3xl" />
        
        <div className="relative z-10 container mx-auto px-6 text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-4 mb-8">
              <img src={logoImage} alt="STATFYR Logo" className="h-20 w-20 drop-shadow-lg" />
              <h1 className="text-6xl md:text-8xl tracking-tight text-gray-900" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                STATF<span className="text-orange-500">Y</span>R
              </h1>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The complete team management app for <span className="text-orange-500 font-bold">coaches</span>, <span className="text-gray-900 font-bold">athletes</span>, and <span className="text-red-500 font-bold">supporters</span>.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-lg shadow-orange-500/30" 
              onClick={goToAuth} 
              data-testid="button-get-started"
            >
              Get Started Free
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-7 rounded-2xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-see-features"
            >
              Learn More
            </Button>
          </motion.div>

          <motion.div 
            className="mt-16 flex justify-center gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500">Free</div>
              <div className="text-sm text-gray-500">To Get Started</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">Live</div>
              <div className="text-sm text-gray-500">Game Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-500 h-10 overflow-hidden">
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
      </section>

      {/* PWA Install Section */}
      <section className="py-24 bg-gradient-to-b from-white to-orange-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
              <Smartphone className="h-4 w-4" />
              Progressive Web App
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Add STATF<span className="text-orange-500">Y</span>R to Your Home Screen
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get the full app experience without downloading from an app store. Works on any device, even offline!
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Device Mockups - Mobile in front, Tablet and PC in back */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative h-[450px] flex items-center justify-center"
              >
                {/* PC Monitor - Background Left */}
                <div className="absolute left-0 top-0 transform scale-[0.6] origin-top-left opacity-60">
                  <div className="bg-gray-800 rounded-2xl p-2 shadow-xl">
                    <div className="bg-gradient-to-b from-orange-50 to-white rounded-xl w-[280px] h-[180px] overflow-hidden">
                      <div className="h-4 bg-gray-200 flex items-center px-2 gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <img src={logoImage} alt="STATFYR" className="h-6 w-6" />
                          <span className="text-xs font-bold text-gray-900">STATFYR</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-100 rounded p-2 h-16" />
                          <div className="bg-orange-100 rounded p-2 h-16" />
                          <div className="bg-green-100 rounded p-2 h-16" />
                        </div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-b-lg mt-1" />
                  </div>
                  <div className="w-16 h-12 bg-gray-700 mx-auto rounded-b-lg" />
                  <div className="w-24 h-2 bg-gray-600 mx-auto rounded-full" />
                </div>

                {/* Tablet - Background Right */}
                <div className="absolute right-0 top-8 transform scale-[0.7] origin-top-right opacity-70">
                  <div className="bg-gray-800 rounded-[1.5rem] p-2 shadow-xl">
                    <div className="bg-gradient-to-b from-orange-50 to-white rounded-[1.2rem] w-[200px] h-[280px] overflow-hidden">
                      <div className="h-4 bg-gray-900 rounded-t-[1.2rem]" />
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <img src={logoImage} alt="STATFYR" className="h-8 w-8" />
                          <div>
                            <div className="text-xs font-bold text-gray-900">STATFYR</div>
                            <div className="text-[8px] text-gray-500">Dashboard</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white rounded-lg p-2 shadow-sm">
                            <div className="text-[8px] text-orange-500 font-medium">ROSTER</div>
                            <div className="text-[10px] font-bold text-gray-900">15 Players</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 shadow-sm">
                            <div className="text-[8px] text-blue-500 font-medium">SCHEDULE</div>
                            <div className="text-[10px] font-bold text-gray-900">8 Games</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Phone - Foreground Center */}
                <div className="relative z-10">
                  <div className="bg-white rounded-[3rem] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-gray-200 max-w-[240px]">
                    <div className="bg-gradient-to-b from-orange-50 to-white rounded-[2.5rem] overflow-hidden">
                      <div className="h-6 bg-gray-900 rounded-t-[2.5rem] flex items-center justify-center">
                        <div className="w-16 h-4 bg-gray-800 rounded-full" />
                      </div>
                      <div className="p-4 min-h-[340px]">
                        <div className="flex items-center gap-3 mb-5">
                          <img src={logoImage} alt="STATFYR" className="h-10 w-10" />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">STATFYR</div>
                            <div className="text-[10px] text-gray-500">Team Management</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white rounded-xl p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                            <div className="text-[10px] text-orange-500 font-medium mb-1">NEXT GAME</div>
                            <div className="font-bold text-gray-900 text-sm">vs Eagles</div>
                            <div className="text-xs text-gray-500">Tomorrow, 6:00 PM</div>
                          </div>
                          <div className="bg-white rounded-xl p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
                            <div className="text-[10px] text-green-500 font-medium mb-1">TEAM RECORD</div>
                            <div className="font-bold text-gray-900 text-sm">8-2</div>
                            <div className="text-xs text-gray-500">Season 2024</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-2 shadow-lg z-20">
                    <Home className="h-5 w-5 text-white" />
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
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <WifiOff className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Works Offline</div>
                      <div className="text-sm text-gray-600">Access your team data even without internet</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Coaches */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
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
              description="Real-time messaging with channels for announcements, tactics, and general chat."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Athletes */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 rounded-full px-4 py-2 text-sm font-medium mb-4">
              <Trophy className="h-4 w-4" />
              For Athletes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Track Your Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See your stats, share your highlights, and stay connected with your team.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Trophy className="h-6 w-6 text-yellow-500" />}
              title="Personal Stats"
              description="View your performance across all games. Track your progress and celebrate your wins."
              delay={0}
            />
            <FeatureCard
              icon={<CalendarClock className="h-6 w-6 text-blue-500" />}
              title="Team Schedule"
              description="Never miss a game or practice. See all upcoming events with location and time details."
              delay={0.1}
            />
            <FeatureCard
              icon={<Award className="h-6 w-6 text-purple-500" />}
              title="Hype Card"
              description="Your shareable athlete profile with stats, highlights, and team info."
              delay={0.2}
            />
            <FeatureCard
              icon={<Target className="h-6 w-6 text-red-500" />}
              title="Starting Lineups"
              description="See when you're starting and your position for upcoming games."
              delay={0.3}
            />
            <FeatureCard
              icon={<Video className="h-6 w-6 text-cyan-500" />}
              title="Highlight Reel"
              description="Watch team highlights and share your best moments with friends and family."
              delay={0.4}
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6 text-green-500" />}
              title="Push Notifications"
              description="Get notified about games, practices, and important team updates."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Supporters */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
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

      {/* Game Day Live Section */}
      <section className="py-24 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="grid md:grid-cols-2">
                <div className="p-10 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 rounded-full px-4 py-2 text-sm font-medium mb-4 w-fit">
                    <Radio className="h-4 w-4" />
                    Game Day Live
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Real-Time Fan Engagement
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Tap to cheer during live games! Every tap counts towards your season total and unlocks badges. Send shoutouts to your favorite athletes.
                  </p>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-3xl">🔥</div>
                      <div className="text-xs text-gray-500">Fire</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl">💪</div>
                      <div className="text-xs text-gray-500">Strong</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl">⭐</div>
                      <div className="text-xs text-gray-500">Star</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl">❤️</div>
                      <div className="text-xs text-gray-500">Love</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.3)_0%,transparent_70%)]" />
                  <div className="text-sm text-red-400 font-bold mb-4 flex items-center gap-2 relative z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE NOW
                  </div>
                  <motion.div 
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 border-4 border-white/20 cursor-pointer relative z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Hand className="h-14 w-14 text-white" />
                  </motion.div>
                  <div className="text-xl font-bold mt-4 text-white relative z-10">TAP TO CHEER!</div>
                  <div className="text-sm text-gray-400 mt-1 relative z-10">1,247 taps this game</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-500 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Team?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Join thousands of coaches, athletes, and supporters already using STATFYR.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 gap-2 bg-white text-orange-500 hover:bg-gray-100 rounded-2xl shadow-lg" 
              onClick={goToAuth}
              data-testid="button-cta-get-started"
            >
              Get Started Free
              <ChevronRight className="h-5 w-5" />
            </Button>
            <p className="text-white/60 mt-4 text-sm">
              No credit card required. Add to home screen for the best experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="STATFYR" className="h-8 w-8" />
              <span className="text-white font-bold">STATF<span className="text-orange-500">Y</span>R</span>
            </div>
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} STATFYR. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
