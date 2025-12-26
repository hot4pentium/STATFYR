import { TeamBadge } from "@/components/TeamBadge";
import { Trophy, Shield } from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  sport: string;
  season?: string | null;
  badgeId?: string | null;
}

interface TeamHeroCardProps {
  team: TeamData;
  wins?: number;
  losses?: number;
  ties?: number;
  showSeason?: boolean;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
}

export function TeamHeroCard({ 
  team, 
  wins = 0, 
  losses = 0, 
  ties = 0, 
  showSeason = true,
  rightSlot,
  bottomSlot 
}: TeamHeroCardProps) {
  const totalGames = wins + losses + ties;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 shadow-xl" data-testid="team-hero-card">
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      <div className="absolute -right-20 -top-20 h-64 w-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-teal-400/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 flex-1">
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 md:h-24 md:w-24 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl">
                {team.badgeId ? (
                  <TeamBadge badgeId={team.badgeId} size="xl" className="text-white" />
                ) : (
                  <Shield className="h-10 w-10 md:h-12 md:w-12 text-white" />
                )}
              </div>
              
              <div className="md:hidden px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center gap-2">
                {totalGames > 0 ? (
                  <>
                    <span className="text-xs font-bold text-green-300">{wins}W</span>
                    <span className="text-white/40 text-xs">-</span>
                    <span className="text-xs font-bold text-red-300">{losses}L</span>
                    {ties > 0 && (
                      <>
                        <span className="text-white/40 text-xs">-</span>
                        <span className="text-xs font-bold text-yellow-300">{ties}T</span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-white/70">No games</span>
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-2xl md:text-4xl font-display font-bold text-white uppercase tracking-tight leading-tight" data-testid="text-team-name">
                {team.name}
              </h1>
              
              {showSeason && (
                <p className="text-sm md:text-base text-white/80 font-medium">
                  {team.sport} <span className="text-white/60">•</span> {team.season || "Season 2024-2025"}
                </p>
              )}
              
              <div className="hidden md:flex items-center gap-3 pt-1">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center gap-3">
                  <Trophy className="h-4 w-4 text-yellow-300" />
                  {totalGames > 0 ? (
                    <>
                      <span className="text-sm font-bold text-green-300">{wins}W</span>
                      <span className="text-white/40">-</span>
                      <span className="text-sm font-bold text-red-300">{losses}L</span>
                      {ties > 0 && (
                        <>
                          <span className="text-white/40">-</span>
                          <span className="text-sm font-bold text-yellow-300">{ties}T</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-white/70">No games yet</span>
                  )}
                </div>
                
                {bottomSlot}
              </div>
              
              <div className="md:hidden flex justify-center">
                {bottomSlot}
              </div>
            </div>
          </div>
          
          {rightSlot && (
            <div className="flex-shrink-0">
              {rightSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
