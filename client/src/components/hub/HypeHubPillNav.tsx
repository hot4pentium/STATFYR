import { Flame, BarChart3, Video, CalendarDays, BookOpen, MessageSquare } from "lucide-react";

export type HubSection = "hype" | "stats" | "highlights" | "events" | "playbook" | "messenger";

interface HypeHubPillNavProps {
  activeSection: HubSection;
  onSectionChange: (section: HubSection) => void;
  availableSections?: HubSection[];
}

const sectionConfig: Record<HubSection, { label: string; icon: React.ReactNode; color: string }> = {
  hype: { label: "Hype", icon: <Flame className="h-4 w-4" />, color: "from-orange-500 to-red-500" },
  stats: { label: "Stats", icon: <BarChart3 className="h-4 w-4" />, color: "from-green-500 to-emerald-500" },
  highlights: { label: "Highlights", icon: <Video className="h-4 w-4" />, color: "from-purple-500 to-violet-500" },
  events: { label: "Events", icon: <CalendarDays className="h-4 w-4" />, color: "from-blue-500 to-cyan-500" },
  playbook: { label: "Playbook", icon: <BookOpen className="h-4 w-4" />, color: "from-amber-500 to-yellow-500" },
  messenger: { label: "Chat", icon: <MessageSquare className="h-4 w-4" />, color: "from-pink-500 to-rose-500" },
};

export function HypeHubPillNav({
  activeSection,
  onSectionChange,
  availableSections = ["hype", "stats", "highlights", "events", "playbook", "messenger"],
}: HypeHubPillNavProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {availableSections.map((section) => {
        const config = sectionConfig[section];
        const isActive = activeSection === section;
        return (
          <button
            key={section}
            onClick={() => onSectionChange(section)}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-full text-sm font-medium transition-all ${
              isActive
                ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
            data-testid={`pill-${section}`}
          >
            {config.icon}
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
