import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "./lib/userContext";
import { PWAProvider } from "./lib/pwaContext";
import { NotificationProvider } from "./lib/notificationContext";
import { EntitlementsProvider } from "./lib/entitlementsContext";
import { useEffect } from "react";
import { setupKeyboard, addAppStateListener, addAppUrlOpenListener } from "@/lib/capacitor";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import CoachDashboard from "@/pages/CoachDashboard";
import UnifiedDashboard from "@/pages/UnifiedDashboard";
import RosterPage from "@/pages/RosterPage";
import EventsPage from "@/pages/EventsPage";
import PlaybookPage from "@/pages/PlaybookPage";
import StatsPage from "@/pages/StatsPage";
import AthleteProfile from "@/pages/AthleteProfile";
import AthleteOnboarding from "@/pages/AthleteOnboarding";
import CoachOnboarding from "@/pages/CoachOnboarding";
import SupporterDashboard from "@/pages/SupporterDashboard";
import SupporterOnboarding from "@/pages/SupporterOnboarding";
import ChatPage from "@/pages/ChatPage";
import CoachSettings from "@/pages/CoachSettings";
import AthleteSettings from "@/pages/AthleteSettings";
import SupporterSettings from "@/pages/SupporterSettings";
import ShareableHypeCard from "@/pages/ShareableHypeCard";
import StatTrackerPage from "@/pages/StatTrackerPage";
import SupporterGameLive from "@/pages/SupporterGameLive";
import SupporterSessionLive from "@/pages/SupporterSessionLive";
import AthleteProfileNew from "@/pages/AthleteProfileNew";
import AdminDashboard from "@/pages/AdminDashboard";
import ChangePassword from "@/pages/ChangePassword";
import HypeManager from "@/pages/HypeManager";
import SuperAdminPanel from "@/pages/SuperAdminPanel";
import RoleCapabilitiesPDF from "@/pages/RoleCapabilitiesPDF";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import TestPage from "@/pages/TestPage";
import SupporterHypeHub from "@/pages/SupporterHypeHub";
import AthleteHypeCardPage from "@/pages/AthleteHypeCardPage";
import JoinTeamPage from "@/pages/JoinTeamPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import PlayEditorPage from "@/pages/PlayEditorPage";
import ThemeGallery from "@/pages/ThemeGallery";
import SeasonHistoryPage from "@/pages/SeasonHistoryPage";
import SupporterSeasonHistoryPage from "@/pages/SupporterSeasonHistoryPage";
import LandingPage from "@/pages/LandingPage";

function Router() {
  // Handle Replit internal iframe paths - treat them as root
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/__replco')) {
    window.history.replaceState({}, '', '/');
  }
  
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/dashboard" component={UnifiedDashboard} />
      <Route path="/coach" component={UnifiedDashboard} />
      <Route path="/coach/dashboard" component={UnifiedDashboard} />
      <Route path="/roster" component={RosterPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/playbook" component={PlaybookPage} />
      <Route path="/playbook/:playId" component={PlayEditorPage} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/settings" component={CoachSettings} />
      <Route path="/athlete/settings" component={AthleteSettings} />
      <Route path="/profile/me" component={AthleteProfile} />
      <Route path="/athlete" component={UnifiedDashboard} />
      <Route path="/athlete/onboarding" component={AthleteOnboarding} />
      <Route path="/athlete/dashboard" component={UnifiedDashboard} />
      <Route path="/athlete/profile" component={AthleteProfileNew} />
      <Route path="/coach/onboarding" component={CoachOnboarding} />
      <Route path="/supporter" component={SupporterDashboard} />
      <Route path="/supporter/onboarding" component={SupporterOnboarding} />
      <Route path="/supporter/dashboard" component={SupporterDashboard} />
      <Route path="/supporter/settings" component={SupporterSettings} />
      <Route path="/supporter/hub" component={SupporterHypeHub} />
      <Route path="/supporter/game/:gameId" component={SupporterGameLive} />
      <Route path="/supporter/live/:sessionId" component={SupporterSessionLive} />
      <Route path="/supporter/themes" component={ThemeGallery} />
      <Route path="/supporter/hype-portal" component={SupporterHypeHub} />
      <Route path="/supporter/hype-card" component={AthleteHypeCardPage} />
      <Route path="/share/athlete/:id" component={ShareableHypeCard} />
      <Route path="/share/athlete/:id/post/:postId" component={ShareableHypeCard} />
      <Route path="/hype/:id" component={ShareableHypeCard} />
      <Route path="/stattracker" component={StatTrackerPage} />
      <Route path="/stat-tracker" component={StatTrackerPage} />
      <Route path="/stattracker/:gameId" component={StatTrackerPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/super-admin" component={SuperAdminPanel} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/athlete/hype-portal" component={HypeManager} />
      <Route path="/athlete/hype-card" component={AthleteHypeCardPage} />
      <Route path="/role-capabilities" component={RoleCapabilitiesPDF} />
      <Route path="/join" component={JoinTeamPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/subscription/success" component={SubscriptionPage} />
      <Route path="/subscription/cancel" component={SubscriptionPage} />
      <Route path="/team/:teamId/season-history" component={SeasonHistoryPage} />
      <Route path="/supporter/season-history/:athleteId" component={SupporterSeasonHistoryPage} />
      <Route path="/test" component={TestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    if (window.hideSplashScreen) {
      window.hideSplashScreen();
    }
    
    setupKeyboard();
    
    const removeAppStateListener = addAppStateListener((state) => {
      if (state === "active") {
        document.body.classList.remove("app-background");
      } else {
        document.body.classList.add("app-background");
      }
    });
    
    const removeUrlOpenListener = addAppUrlOpenListener((url) => {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        if (path.startsWith('/athlete/') || path.startsWith('/hype/')) {
          window.location.href = path;
        } else if (path.startsWith('/team/') || path.startsWith('/invite/')) {
          window.location.href = '/join' + urlObj.search;
        } else if (path.startsWith('/dashboard')) {
          window.location.href = '/dashboard';
        } else if (path) {
          window.location.href = path;
        }
      } catch (error) {
        console.error('Failed to handle deep link:', error);
      }
    });
    
    return () => {
      removeAppStateListener();
      removeUrlOpenListener();
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="statfyr-theme">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <EntitlementsProvider>
            <PWAProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <ImpersonationBanner />
                  <Toaster />
                  <SonnerToaster position="top-center" richColors duration={2300} />
                  <Router />
                </TooltipProvider>
              </NotificationProvider>
            </PWAProvider>
          </EntitlementsProvider>
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
