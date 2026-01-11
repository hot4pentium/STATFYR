import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { HypeHubHeader, HypeHubPillNav, HypeHubContent, HypeHubFollowSection, type HubSection } from "@/components/hub";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, ArrowLeft, Bell, BellOff, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@/lib/userContext";
import { useNotifications } from "@/lib/notificationContext";
import { getTeamEvents, getAllTeamHighlights, getTeamPlays, getTeamAggregateStats, getAthleteStats, type Event, type HighlightVideo, type Play, type ManagedAthlete } from "@/lib/api";
import { useManagedAthletesCache } from "@/hooks/useManagedAthletesCache";
import { toast } from "sonner";

export default function SupporterHypeHub() {
  const [, setLocation] = useLocation();
  const { user, currentTeam, logout } = useUser();
  const { notificationsEnabled, enableNotifications } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<HubSection>("hype");
  const [viewingAthlete, setViewingAthlete] = useState<ManagedAthlete | null>(null);

  useEffect(() => {
    if (!user || !currentTeam) {
      setLocation("/supporter/onboarding");
    }
  }, [user, currentTeam, setLocation]);

  const { data: managedAthletes = [] } = useManagedAthletesCache(user?.id);

  const { data: teamEvents = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "events"],
    queryFn: () => currentTeam ? getTeamEvents(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamHighlights = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: teamPlays = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "plays"],
    queryFn: () => currentTeam ? getTeamPlays(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const { data: aggregateStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "stats", "aggregate"],
    queryFn: () => currentTeam ? getTeamAggregateStats(currentTeam.id) : Promise.resolve({ games: 0, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0, statTotals: {} }),
    enabled: !!currentTeam,
  });

  const { data: athleteStats } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "athletes", viewingAthlete?.athlete.id, "stats"],
    queryFn: () => currentTeam && viewingAthlete ? getAthleteStats(currentTeam.id, viewingAthlete.athlete.id) : Promise.resolve({ gamesPlayed: 0, stats: {}, gameHistory: [], hotStreak: false, streakLength: 0 }),
    enabled: !!currentTeam && !!viewingAthlete,
  });

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return teamEvents.filter((e: Event) => new Date(e.date) >= now).slice(0, 5);
  }, [teamEvents]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleNavigateToChat = () => {
    setLocation("/chat");
  };

  const displayStats = viewingAthlete ? athleteStats : { stats: aggregateStats?.statTotals || {} };

  if (!user || !currentTeam) {
    return null;
  }

  return (
    <>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen pb-20">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-display font-bold text-lg">HYPE Hub</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={enableNotifications}
                data-testid="button-notifications"
              >
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
              </Button>
              <Link href="/supporter/settings">
                <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
          <HypeHubHeader
            name={viewingAthlete ? viewingAthlete.athlete.name : user.name || user.username}
            subtitle={viewingAthlete ? "Managed Athlete" : "Supporter"}
            avatarUrl={viewingAthlete ? viewingAthlete.athlete.avatar || undefined : user.avatar || undefined}
            games={aggregateStats?.games || 0}
            teamName={currentTeam.name}
            cheers={0}
            showFollowButton={false}
          />

          {managedAthletes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={!viewingAthlete ? "default" : "outline"}
                size="sm"
                onClick={() => setViewingAthlete(null)}
                className="rounded-full whitespace-nowrap"
                data-testid="button-view-self"
              >
                My Hub
              </Button>
              {managedAthletes.map((ma: ManagedAthlete) => (
                <Button
                  key={ma.athlete.id}
                  variant={viewingAthlete?.athlete.id === ma.athlete.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewingAthlete(ma)}
                  className="rounded-full whitespace-nowrap"
                  data-testid={`button-view-athlete-${ma.athlete.id}`}
                >
                  {ma.athlete.name}
                </Button>
              ))}
            </div>
          )}

          <HypeHubPillNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            availableSections={["hype", "stats", "highlights", "events", "playbook", "messenger"]}
          />

          <HypeHubContent
            section={activeSection}
            userRole="supporter"
            hypePosts={[]}
            stats={displayStats}
            highlights={teamHighlights}
            events={upcomingEvents}
            plays={teamPlays}
            onNavigateToChat={handleNavigateToChat}
          />

          <HypeHubFollowSection
            showFollowButton={false}
            commentsCount={0}
            likesCount={0}
          />
        </main>
      </div>
    </>
  );
}
