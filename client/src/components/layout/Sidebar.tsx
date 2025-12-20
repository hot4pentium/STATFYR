import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { NAVIGATION, TEAM_NAME, ROLES } from "@/lib/mockData";
import { Shield, LogOut, User, Trophy, Calendar, Home, MessageSquare, ClipboardList, Users, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();

  // Determine current role based on URL path (Mock logic)
  let currentRole = ROLES.COACH;
  if (location.startsWith("/profile")) currentRole = ROLES.ATHLETE;
  if (location.startsWith("/supporter")) currentRole = ROLES.SUPPORTER;

  // Define role-specific navigation
  const coachLinks = NAVIGATION;
  
  const athleteLinks = [
    { name: "My Profile", href: "/profile/me", icon: User },
    { name: "Schedule", href: "/events", icon: Calendar },
    { name: "Team Stats", href: "/stats", icon: Trophy },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Settings", href: "/athlete/settings", icon: Settings },
  ];

  const supporterLinks = [
    { name: "Home", href: "/supporter/dashboard", icon: Home },
    { name: "Schedule", href: "/events", icon: Calendar },
    { name: "Roster", href: "/roster", icon: Users },
  ];

  const links = currentRole === ROLES.ATHLETE ? athleteLinks : 
                currentRole === ROLES.SUPPORTER ? supporterLinks : 
                coachLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50 transform transition-transform duration-300 lg:translate-x-0",
        !isOpen && "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="text-primary-foreground h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-lg md:text-xl font-bold tracking-tight text-sidebar-primary-foreground">
                TEAMPULSE
              </h1>
              <p className="text-[10px] md:text-xs text-sidebar-foreground uppercase tracking-wider">{TEAM_NAME}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {links.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-sidebar-primary/10 text-sidebar-primary border-r-2 border-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={onClose}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                  <span className="hidden md:inline">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors mb-2">
            <Avatar className="h-8 w-8 border border-sidebar-border flex-shrink-0">
              <AvatarImage src={currentRole === ROLES.COACH ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" : undefined} />
              <AvatarFallback>{currentRole === ROLES.COACH ? 'CC' : currentRole === ROLES.ATHLETE ? 'MR' : 'SP'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden hidden md:block">
              <p className="text-sm font-medium text-sidebar-primary-foreground truncate capitalize">
                 {currentRole === ROLES.COACH ? "Coach Carter" : currentRole === ROLES.ATHLETE ? "Marcus Rashford" : "Supporter"}
              </p>
              <p className="text-xs text-sidebar-foreground truncate capitalize">{currentRole}</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full justify-start text-xs md:text-sm text-sidebar-foreground hover:text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-accent">
              <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
