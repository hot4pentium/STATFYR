import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Share2 } from "lucide-react";

interface HypeHubHeaderProps {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  games?: number;
  teamName?: string;
  cheers?: number;
  onFollow?: () => void;
  onShare?: () => void;
  isFollowing?: boolean;
  showFollowButton?: boolean;
}

export function HypeHubHeader({
  name,
  subtitle,
  avatarUrl,
  games = 0,
  teamName,
  cheers = 0,
  onFollow,
  onShare,
  isFollowing = false,
  showFollowButton = true,
}: HypeHubHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-amber-300 p-6 pb-8">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-3 border-white/50 shadow-xl">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-display font-bold text-white uppercase tracking-wide">
                {name}
              </h1>
              {subtitle && (
                <p className="text-white/80 text-sm">{subtitle}</p>
              )}
            </div>
          </div>
          {teamName && (
            <div className="flex flex-col items-center gap-1 bg-white/20 rounded-xl px-4 py-2">
              <span className="text-2xl">🏆</span>
              <span className="font-medium text-white text-sm text-center">{teamName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showFollowButton && (
            <Button
              onClick={onFollow}
              className={`flex-1 ${
                isFollowing
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-white/90 hover:bg-white text-gray-800"
              } rounded-full font-medium`}
              data-testid="button-hub-follow"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          {onShare && (
            <Button
              onClick={onShare}
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3"
              data-testid="button-hub-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
