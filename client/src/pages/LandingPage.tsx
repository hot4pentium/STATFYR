import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import hypeCardImage from "@assets/Screenshot_2025-12-23_at_6.55.26_PM_1766534201003.png";
import logoImage from "@assets/red_logo-removebg-preview_1766535816909.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, CalendarClock, ClipboardList, BarChart3, 
  Trophy, Shield, Radio, Hand, Award, Bell, 
  Video, MessageSquare, Flame, Target, ChevronRight,
  Zap, Heart, Star
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, color, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={`h-full bg-gradient-to-br ${color} border-white/10 hover:border-white/30 transition-all hover:scale-105 hover:shadow-xl`}>
        <CardContent className="p-6">
          <div className="mb-4 p-3 rounded-xl bg-white/10 w-fit">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PlaymakerSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-white/10 hover:border-purple-500/30 transition-all hover:shadow-xl overflow-hidden">
        <CardContent className="p-3 h-full">
          <div className="h-full min-h-[140px] relative flex">
            <div className="w-7 bg-slate-800 rounded flex flex-col items-center gap-1.5 py-2 shrink-0">
              <div className="w-3 h-3 rounded bg-purple-500/50" />
              <div className="w-3 h-3 rounded-full bg-blue-500/50" />
              <div className="w-3 h-0.5 bg-green-500/50" />
              <div className="w-3 h-3 border border-yellow-500/50 rounded" />
              <div className="w-3 h-3 border border-red-500/50 rounded-full" />
            </div>
            <div className="flex-1 ml-2 border border-dashed border-white/20 rounded relative bg-slate-900/50">
              <svg className="w-full h-full" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet">
                <circle cx="40" cy="50" r="10" fill="#3b82f6" opacity="0.8" />
                <text x="40" y="54" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">1</text>
                <circle cx="70" cy="28" r="10" fill="#3b82f6" opacity="0.8" />
                <text x="70" y="32" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">2</text>
                <circle cx="70" cy="72" r="10" fill="#3b82f6" opacity="0.8" />
                <text x="70" y="76" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">3</text>
                <circle cx="120" cy="50" r="10" fill="#ef4444" opacity="0.8" />
                <circle cx="135" cy="25" r="10" fill="#ef4444" opacity="0.8" />
                <path d="M50 45 L62 33" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" fill="none" />
                <path d="M80 72 L108 55" stroke="#22c55e" strokeWidth="2" fill="none" markerEnd="url(#arrowGreen2)" />
                <defs>
                  <marker id="arrowGreen2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#22c55e" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GameDayLiveSection() {
  return (
    <motion.div 
      className="mt-12 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-red-500/20 to-orange-600/10 border-white/10 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-4 p-3 rounded-xl bg-white/10 w-fit">
                <Zap className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Game Day Live</h3>
              <p className="text-muted-foreground mb-4">
                Tap to cheer during live games! Every tap counts towards your season total and unlocks badges. Send shoutouts to your favorite athletes.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">🔥</div>
                  <div className="text-xs text-muted-foreground">Fire</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">💪</div>
                  <div className="text-xs text-muted-foreground">Strong</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">⭐</div>
                  <div className="text-xs text-muted-foreground">Star</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">❤️</div>
                  <div className="text-xs text-muted-foreground">Love</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-6 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2)_0%,transparent_70%)]" />
              <div className="text-sm text-red-400 font-bold mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                LIVE NOW
              </div>
              <motion.div 
                className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-red-500/40 border-4 border-red-400/50 cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Hand className="h-12 w-12 text-white" />
              </motion.div>
              <div className="text-lg font-bold mt-3 text-white">TAP TO CHEER!</div>
              <div className="text-xs text-muted-foreground mt-1">1,247 taps this game</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HypeCardBackMockup() {
  return (
    <div className="w-[180px] h-[280px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-blue-500/30 p-3 flex flex-col gap-2 shadow-2xl">
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="bg-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] font-bold text-green-400 mb-1">EVENTS</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[8px] text-white">vs Lions</span>
              <span className="text-[7px] text-muted-foreground ml-auto">Dec 28</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[8px] text-white">@ Eagles</span>
              <span className="text-[7px] text-muted-foreground ml-auto">Jan 4</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className="text-[8px] text-white">Practice</span>
              <span className="text-[7px] text-muted-foreground ml-auto">Jan 6</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] font-bold text-blue-400 mb-1">STATS</div>
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[8px]">
                <span className="text-white">Kills</span>
                <span className="text-green-400 font-bold">47</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[8px]">
                <span className="text-white">Digs</span>
                <span className="text-yellow-400 font-bold">32</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[8px]">
                <span className="text-white">Aces</span>
                <span className="text-cyan-400 font-bold">12</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="bg-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] font-bold text-yellow-400 mb-1">HIGHLIGHTS</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="aspect-video bg-slate-700 rounded overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-red-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[4px] border-l-slate-900 border-y-[2px] border-y-transparent ml-0.5" />
                </div>
              </div>
            </div>
            <div className="aspect-video bg-slate-700 rounded overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[4px] border-l-slate-900 border-y-[2px] border-y-transparent ml-0.5" />
                </div>
              </div>
            </div>
            <div className="aspect-video bg-slate-700 rounded overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-cyan-500/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[4px] border-l-slate-900 border-y-[2px] border-y-transparent ml-0.5" />
                </div>
              </div>
            </div>
            <div className="aspect-video bg-slate-700 rounded overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30" />
              <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white/70">+5</div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] font-bold text-red-400 mb-1">SHOUTOUTS</div>
          <div className="space-y-1">
            <div className="text-[8px] italic text-white/80">"Great hustle!"</div>
            <div className="text-[7px] text-muted-foreground">— Coach</div>
            <div className="flex gap-1 mt-1">
              <span className="text-[10px]">🔥</span>
              <span className="text-[10px]">💪</span>
              <span className="text-[10px]">⭐</span>
              <span className="text-[8px] text-muted-foreground">+12</span>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-[8px] text-muted-foreground border-t border-white/10 pt-1">
        TAP TO FLIP
      </div>
    </div>
  );
}

function HypeCardSection() {
  return (
    <motion.div 
      className="mt-12 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border-white/10 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-4 p-3 rounded-xl bg-white/10 w-fit">
                <Award className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Hype Card</h3>
              <p className="text-muted-foreground mb-4">
                Share your journey with anyone. Always have your best stuff ready to share. The coach and team staff can track your stats for you. Team supporters will uplift your game with Shoutouts during gameplay. You supply the highlights and your HYPE Card is set.
              </p>
            </div>
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-4 min-h-[200px] flex items-center justify-center gap-4">
              <img 
                src={hypeCardImage} 
                alt="Hype Card Front - Kim Allen #30 Setter" 
                className="h-[280px] w-auto rounded-xl shadow-2xl border border-white/10"
              />
              <HypeCardBackMockup />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const coachFeatures = [
  {
    icon: <Users className="h-6 w-6 text-blue-400" />,
    title: "Team Roster",
    description: "Manage your entire team with jersey numbers, positions, and contact info all in one place.",
    color: "from-blue-500/20 to-blue-600/10"
  },
  {
    icon: <CalendarClock className="h-6 w-6 text-green-400" />,
    title: "Smart Scheduling",
    description: "Create games, practices, and events with automatic drink and snack duty assignments.",
    color: "from-green-500/20 to-green-600/10"
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-orange-400" />,
    title: "StatTracker",
    description: "Track live game statistics by player or team. See trends, ratios, and performance over time.",
    color: "from-orange-500/20 to-orange-600/10"
  },
  {
    icon: <Video className="h-6 w-6 text-cyan-400" />,
    title: "Video Highlights",
    description: "Upload and share team highlights. Automatic video processing and thumbnail generation.",
    color: "from-cyan-500/20 to-cyan-600/10"
  },
  {
    icon: <ClipboardList className="h-6 w-6 text-purple-400" />,
    title: "PlayMaker",
    description: "Draw and design plays with our interactive canvas. Share plays with your team.",
    color: "from-purple-500/20 to-purple-600/10"
  }
];

const athleteFeatures = [
  {
    icon: <Trophy className="h-6 w-6 text-yellow-400" />,
    title: "Personal Stats",
    description: "View your performance across all games. Track your progress and celebrate your wins.",
    color: "from-yellow-500/20 to-yellow-600/10"
  },
  {
    icon: <CalendarClock className="h-6 w-6 text-blue-400" />,
    title: "Team Schedule",
    description: "Never miss a game or practice. See all upcoming events with location and time details.",
    color: "from-blue-500/20 to-blue-600/10"
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-green-400" />,
    title: "Team Chat",
    description: "Stay connected with your teammates and coaches. Real-time messaging for the whole team.",
    color: "from-green-500/20 to-green-600/10"
  },
  {
    icon: <Target className="h-6 w-6 text-purple-400" />,
    title: "Starting Lineups",
    description: "See when you're starting and your position for upcoming games.",
    color: "from-purple-500/20 to-purple-600/10"
  },
  {
    icon: <Video className="h-6 w-6 text-orange-400" />,
    title: "Highlight Reel",
    description: "Watch team highlights and share your best moments with friends and family.",
    color: "from-orange-500/20 to-orange-600/10"
  },
  {
    icon: <Shield className="h-6 w-6 text-cyan-400" />,
    title: "Player Card",
    description: "Get your own shareable player card with stats, photo, and team info.",
    color: "from-cyan-500/20 to-cyan-600/10"
  }
];

const supporterFeatures = [
  {
    icon: <Hand className="h-6 w-6 text-orange-400" />,
    title: "Live Taps",
    description: "Tap to cheer during live games. Every tap adds to your season total and earns badges.",
    color: "from-orange-500/20 to-orange-600/10"
  },
  {
    icon: <Heart className="h-6 w-6 text-red-400" />,
    title: "Send Shoutouts",
    description: "Send quick cheers to individual athletes during games. Show them you're watching!",
    color: "from-red-500/20 to-red-600/10"
  },
  {
    icon: <Award className="h-6 w-6 text-yellow-400" />,
    title: "Earn Badges",
    description: "Unlock Bronze, Silver, Gold, and Legend badges as you rack up taps throughout the season.",
    color: "from-yellow-500/20 to-yellow-600/10"
  },
  {
    icon: <Star className="h-6 w-6 text-purple-400" />,
    title: "Theme Unlocks",
    description: "Each badge unlocks a new dashboard theme. Show off your dedication with custom styles.",
    color: "from-purple-500/20 to-purple-600/10"
  },
  {
    icon: <Bell className="h-6 w-6 text-blue-400" />,
    title: "Game Notifications",
    description: "Get notified when games go live so you never miss a chance to cheer.",
    color: "from-blue-500/20 to-blue-600/10"
  },
  {
    icon: <Users className="h-6 w-6 text-green-400" />,
    title: "Managed Athletes",
    description: "Parents can create and manage athlete profiles for younger players.",
    color: "from-green-500/20 to-green-600/10"
  }
];

const SUPPORTED_SPORTS = ["Baseball", "Basketball", "Football", "Soccer", "Volleyball"];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"coaches" | "athletes" | "supporters">("coaches");
  const [currentSportIndex, setCurrentSportIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSportIndex((prev) => (prev + 1) % SUPPORTED_SPORTS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const goToAuth = () => setLocation("/auth");

  const getFeatures = () => {
    switch (activeTab) {
      case "coaches": return coachFeatures;
      case "athletes": return athleteFeatures;
      case "supporters": return supporterFeatures;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <motion.section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src={logoImage} alt="STATyR Logo" className="h-16 w-16" />
              <h1 className="text-5xl md:text-7xl tracking-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                STAT<span className="text-orange-500">y</span>R
              </h1>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            The complete platform for <span className="text-primary font-bold">coaches</span>, <span className="text-accent font-bold">athletes</span>, and <span className="text-orange-400 font-bold">supporters</span> to connect, compete, and celebrate together.
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button size="lg" className="text-lg px-8 py-6 gap-2 bg-primary hover:bg-primary/90" onClick={goToAuth} data-testid="button-get-started">
              Get Started
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-see-features"
            >
              See Features
            </Button>
          </motion.div>
          
          <motion.div 
            className="mt-16 flex justify-center gap-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm">Free to Start</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">Live</div>
              <div className="text-sm">Game Engagement</div>
            </div>
            <div className="text-center w-32">
              <div className="text-2xl font-bold text-orange-400 h-10 flex items-center justify-center relative">
                {SUPPORTED_SPORTS.map((sport, index) => (
                  <span
                    key={sport}
                    className="absolute transition-opacity duration-700 ease-in-out"
                    style={{ opacity: index === currentSportIndex ? 1 : 0 }}
                  >
                    {sport}
                  </span>
                ))}
              </div>
              <div className="text-sm">Sports Supported</div>
            </div>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            className="mt-12 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { duration: 0.8, delay: 1.2 },
              y: { repeat: Infinity, duration: 2 }
            }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-1">
              <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Graphic Section Divider - Chevron Pattern */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-zinc-900" />
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <polygon 
            points="0,100 50,60 100,100" 
            className="fill-zinc-900"
          />
          <polygon 
            points="0,100 50,70 100,100" 
            className="fill-orange-500/20"
          />
          <polygon 
            points="0,100 50,80 100,100" 
            className="fill-orange-500/10"
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-orange-500/50 via-orange-500 to-orange-500/50 shadow-lg shadow-orange-500/50" />
        </div>
      </div>

      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900/50 to-black" />
        
        <div className="relative z-10 container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for <span className="text-primary">Everyone</span> on the Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're calling the plays, making them, or cheering from the sidelines — STATFyR has you covered.
            </p>
          </motion.div>

          <motion.div 
            className="flex justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full max-w-md">
              <TabsList className="grid grid-cols-3 w-full h-14">
                <TabsTrigger value="coaches" className="text-base gap-2 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-coaches">
                  <Shield className="h-4 w-4" />
                  Coaches
                </TabsTrigger>
                <TabsTrigger value="athletes" className="text-base gap-2 data-[state=active]:bg-accent data-[state=active]:text-white" data-testid="tab-athletes">
                  <Trophy className="h-4 w-4" />
                  Athletes
                </TabsTrigger>
                <TabsTrigger value="supporters" className="text-base gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-supporters">
                  <Heart className="h-4 w-4" />
                  Supporters
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFeatures().map((feature, index) => (
                  <FeatureCard
                    key={feature.title}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    color={feature.color}
                    delay={index * 0.1}
                  />
                ))}
                {activeTab === "coaches" && <PlaymakerSection />}
              </div>
              {activeTab === "athletes" && <HypeCardSection />}
              {activeTab === "supporters" && <GameDayLiveSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-orange-500/10" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to <span className="text-primary">Ignite</span> Your Team?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Join thousands of teams already using STATFyR to connect, compete, and celebrate together.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button size="lg" className="flex-1 h-16 text-lg gap-3 bg-primary hover:bg-primary/90" onClick={goToAuth} data-testid="button-signup-coach">
              <Shield className="h-6 w-6" />
              I'm a Coach
            </Button>
            <Button size="lg" className="flex-1 h-16 text-lg gap-3 bg-accent hover:bg-accent/90" onClick={goToAuth} data-testid="button-signup-athlete">
              <Trophy className="h-6 w-6" />
              I'm an Athlete
            </Button>
            <Button size="lg" className="flex-1 h-16 text-lg gap-3 bg-orange-500 hover:bg-orange-600" onClick={goToAuth} data-testid="button-signup-supporter">
              <Heart className="h-6 w-6" />
              I'm a Supporter
            </Button>
          </motion.div>
        </div>
      </section>
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logoImage} alt="STATyR Logo" className="h-6 w-6" />
            <span className="font-bold" style={{ fontFamily: "'Archivo Black', sans-serif" }}>STAT<span className="text-orange-500">y</span>R</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} STATFyR. Fuel Your Team's Fire.
          </p>
        </div>
      </footer>
    </div>
  );
}
