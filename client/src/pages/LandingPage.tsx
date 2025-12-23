import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  image?: React.ReactNode;
  narrow?: boolean;
}

function FeatureCard({ icon, title, description, color, delay = 0, image, narrow }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={narrow ? "max-w-xs mx-auto" : ""}
    >
      <Card className={`h-full bg-gradient-to-br ${color} border-white/10 hover:border-white/30 transition-all hover:scale-105 hover:shadow-xl`}>
        <CardContent className="p-6">
          {image && (
            <div className="mb-4 rounded-lg overflow-hidden border border-white/10">
              {image}
            </div>
          )}
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

function PlaybookCanvasMockup() {
  return (
    <div className="bg-slate-900 p-3 h-32 relative">
      <div className="absolute left-2 top-2 bottom-2 w-8 bg-slate-800 rounded flex flex-col items-center gap-2 py-2">
        <div className="w-4 h-4 rounded bg-purple-500/50" />
        <div className="w-4 h-4 rounded-full bg-blue-500/50" />
        <div className="w-4 h-0.5 bg-green-500/50" />
        <div className="w-4 h-4 border border-yellow-500/50 rounded" />
      </div>
      <div className="ml-10 h-full border border-dashed border-white/20 rounded relative">
        <svg className="w-full h-full" viewBox="0 0 200 80">
          <circle cx="40" cy="40" r="8" fill="#3b82f6" opacity="0.7" />
          <circle cx="80" cy="25" r="8" fill="#3b82f6" opacity="0.7" />
          <circle cx="80" cy="55" r="8" fill="#3b82f6" opacity="0.7" />
          <circle cx="140" cy="40" r="8" fill="#ef4444" opacity="0.7" />
          <circle cx="160" cy="20" r="8" fill="#ef4444" opacity="0.7" />
          <path d="M48 40 L72 28" stroke="#22c55e" strokeWidth="2" strokeDasharray="4" fill="none" />
          <path d="M88 55 L132 42" stroke="#22c55e" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#22c55e" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
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
    icon: <ClipboardList className="h-6 w-6 text-purple-400" />,
    title: "Playbook Designer",
    description: "Draw and design plays with our interactive canvas. Save, categorize, and share with your team.",
    color: "from-purple-500/20 to-purple-600/10",
    image: <PlaybookCanvasMockup />,
    narrow: true
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

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"coaches" | "athletes" | "supporters">("coaches");

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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Flame className="h-12 w-12 text-primary animate-pulse" />
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase">
                STAT<span className="text-primary">Fy</span>R
              </h1>
            </div>
          </motion.div>
          
          <motion.h2 
            className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Fuel Your Team's Fire
          </motion.h2>
          
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
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">All</div>
              <div className="text-sm">Sports Supported</div>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </div>
        </motion.div>
      </motion.section>

      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {getFeatures().map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  delay={index * 0.1}
                  image={feature.image}
                  narrow={feature.narrow}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-orange-500/20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        
        <div className="relative z-10 container mx-auto px-6">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Game Day Live
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The heart of STATFyR. Coaches go live during games, and supporters can tap, cheer, and send shoutouts in real-time — no matter where they are.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <motion.div 
                className="text-center p-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
                  <Radio className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Coach Goes Live</h3>
                <p className="text-muted-foreground text-sm">One tap starts the session 15 minutes before game time</p>
              </motion.div>
              
              <motion.div 
                className="text-center p-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-20 h-20 rounded-full bg-orange-500/20 border-2 border-orange-500/50 flex items-center justify-center mx-auto mb-4">
                  <Hand className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Supporters Tap</h3>
                <p className="text-muted-foreground text-sm">Every tap counts toward badges and season totals</p>
              </motion.div>
              
              <motion.div 
                className="text-center p-6"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Unlock Rewards</h3>
                <p className="text-muted-foreground text-sm">Bronze, Silver, Gold, and Legend badges await</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/10" />
        
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
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-bold">STATFyR</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} STATFyR. Fuel Your Team's Fire.
          </p>
        </div>
      </footer>
    </div>
  );
}
