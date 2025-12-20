import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-64 h-screen overflow-hidden flex flex-col">
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
          <h2 className="text-lg font-medium text-muted-foreground">Season 2024-2025</h2>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full animate-pulse">
              LIVE: Practice in 2h
            </div>
          </div>
        </header>
        <ScrollArea className="flex-1 p-8">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
