import { ThemeToggle } from "./ThemeToggle";
import { DashboardBackground } from "./DashboardBackground";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@/lib/userContext";
import { usePWA } from "@/lib/pwaContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [, setLocation] = useLocation();
  const { currentTeam, logout } = useUser();
  const { updateAvailable, applyUpdate } = usePWA();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const html = document.documentElement;
    
    if (savedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex relative">
      <DashboardBackground />
      <main className="flex-1 h-screen overflow-hidden flex flex-col">
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between gap-4">
          <h2 className="text-sm md:text-lg font-medium text-muted-foreground">
            {currentTeam?.name || "TeamPulse"} - {currentTeam?.season || "Season 2024-2025"}
          </h2>
          <div className="flex items-center gap-3">
            {updateAvailable && (
              <Button
                variant="outline"
                size="icon"
                className="border-amber-500 dark:border-amber-400 text-amber-500 dark:text-amber-400 hover:bg-amber-500/10 animate-pulse"
                onClick={applyUpdate}
                data-testid="button-pwa-update"
                title="Update available - click to refresh"
              >
                <AlertCircle className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggle />
            <Link href="/settings">
              <Button 
                variant="outline" 
                size="icon"
                className="border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="icon"
              className="border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
