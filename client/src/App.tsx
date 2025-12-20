import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import CoachDashboard from "@/pages/CoachDashboard";
import RosterPage from "@/pages/RosterPage";
import EventsPage from "@/pages/EventsPage";
import PlaybookPage from "@/pages/PlaybookPage";
import StatsPage from "@/pages/StatsPage";
import AthleteProfile from "@/pages/AthleteProfile";
import AthleteDashboard from "@/pages/AthleteDashboard";
import AthleteOnboarding from "@/pages/AthleteOnboarding";
import SupporterDashboard from "@/pages/SupporterDashboard";
import SupporterOnboarding from "@/pages/SupporterOnboarding";
import ChatPage from "@/pages/ChatPage";
import CoachSettings from "@/pages/CoachSettings";
import AthleteSettings from "@/pages/AthleteSettings";
import ShareableHypeCard from "@/pages/ShareableHypeCard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={CoachDashboard} />
      <Route path="/roster" component={RosterPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/playbook" component={PlaybookPage} />
      <Route path="/stats" component={StatsPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/settings" component={CoachSettings} />
      <Route path="/athlete/settings" component={AthleteSettings} />
      <Route path="/profile/me" component={AthleteProfile} />
      <Route path="/athlete/onboarding" component={AthleteOnboarding} />
      <Route path="/athlete/dashboard" component={AthleteDashboard} />
      <Route path="/supporter/onboarding" component={SupporterOnboarding} />
      <Route path="/supporter/dashboard" component={SupporterDashboard} />
      <Route path="/share/athlete/:id" component={ShareableHypeCard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
