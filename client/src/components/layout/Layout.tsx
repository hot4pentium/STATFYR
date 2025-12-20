import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:ml-64 h-screen overflow-hidden flex flex-col">
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-sm md:text-lg font-medium text-muted-foreground">Season 2024-2025</h2>
          <div className="flex items-center gap-4">
            <div className="text-[10px] md:text-xs font-mono text-primary bg-primary/10 px-2 md:px-3 py-1 rounded-full animate-pulse whitespace-nowrap">
              LIVE: Practice in 2h
            </div>
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
