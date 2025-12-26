import { TeamBadge } from "@/components/TeamBadge";
import { Trophy, Shield, Star, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TeamData {
  id: string;
  name: string;
  sport: string;
  season?: string | null;
  badgeId?: string | null;
  code?: string;
}

interface TeamHeroCardProps {
  team: TeamData;
  wins?: number;
  losses?: number;
  ties?: number;
  showCode?: boolean;
  actionSlot?: React.ReactNode;
}

export function TeamHeroCard({ 
  team, 
  wins = 0, 
  losses = 0, 
  ties = 0, 
  showCode = false,
  actionSlot
}: TeamHeroCardProps) {
  const [copied, setCopied] = useState(false);
  const totalGames = wins + losses + ties;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    } catch {
      return false;
    }
  };

  const handleCopyCode = async () => {
    if (!team.code) return;
    const success = await copyToClipboard(team.code);
    if (success) {
      setCopied(true);
      toast.success("Team code copied!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Could not copy code");
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden mb-6 shadow-2xl" style={{ aspectRatio: "3/4" }} data-testid="team-hero-card">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-600 via-teal-500 to-teal-400" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* Decorative elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-cyan-400/20 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col">
        {/* Main content area */}
        <div className="relative flex-1 flex flex-col items-center justify-center">
          {/* Large Team Badge */}
          <div className="h-32 w-32 md:h-40 md:w-40 bg-white/15 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-2xl mb-4">
            {team.badgeId ? (
              <TeamBadge badgeId={team.badgeId} size="xl" className="text-white scale-150" />
            ) : (
              <Shield className="h-16 w-16 md:h-20 md:w-20 text-white" />
            )}
          </div>
          
          {/* Win Rate Badge */}
          <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center gap-2 mb-2">
            {totalGames > 0 ? (
              <>
                <Trophy className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-bold text-white">{winRate}% Win Rate</span>
              </>
            ) : (
              <span className="text-sm text-white/80">No games yet</span>
            )}
          </div>
        </div>
        
        {/* Gradient overlay for text readability at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Bottom Info Section */}
        <div className="relative z-10 p-6 text-white">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-1 drop-shadow-lg uppercase tracking-tight text-center" data-testid="text-team-name">
            {team.name}
          </h2>
          <p className="text-white/80 text-sm mb-4 drop-shadow text-center">
            {team.sport} • {team.season || "2024-2025"}
          </p>

          {/* Quick Stats Row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 text-center border-r border-white/20 py-2">
              <div className="text-2xl font-bold text-green-300">{wins}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">Wins</div>
            </div>
            <div className="flex-1 text-center border-r border-white/20 py-2">
              <div className="text-2xl font-bold text-red-300">{losses}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">Losses</div>
            </div>
            <div className="flex-1 text-center py-2">
              <div className="text-2xl font-bold text-yellow-300">{ties}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">Ties</div>
            </div>
          </div>

          {/* Team Code or Action Slot */}
          {showCode && team.code ? (
            <button 
              onClick={handleCopyCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-all"
              data-testid="button-copy-team-code"
            >
              <span className="font-mono font-bold text-lg tracking-widest">{team.code}</span>
              {copied ? (
                <Check className="h-5 w-5 text-green-300" />
              ) : (
                <Copy className="h-5 w-5 text-white/70" />
              )}
            </button>
          ) : actionSlot ? (
            <div className="w-full">
              {actionSlot}
            </div>
          ) : null}
        </div>
      </div>

      {/* Sport Badge - Top Left */}
      <div className="absolute top-4 left-4">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
          <Star className="h-4 w-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{team.sport}</span>
        </div>
      </div>

      {/* Season Badge - Top Right */}
      <div className="absolute top-4 right-4">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-sm font-bold text-slate-800">{team.season || "2024-25"}</span>
        </div>
      </div>
    </div>
  );
}
