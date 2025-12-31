import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Download, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import fireLogo from "@/assets/statfyr-fire-logo.png";
import { useToast } from "@/hooks/use-toast";

interface AthleteHypeSummaryProps {
  athleteId: string;
  athleteName: string;
  avatarUrl?: string | null;
  teamName: string;
  teamBadgeUrl?: string | null;
  eventName: string;
  eventDate: string;
  eventHypeCount: number;
  seasonHypeTotal: number;
  onShare?: () => void;
}

export function AthleteHypeSummary({
  athleteId,
  athleteName,
  avatarUrl,
  teamName,
  teamBadgeUrl,
  eventName,
  eventDate,
  eventHypeCount,
  seasonHypeTotal,
  onShare,
}: AthleteHypeSummaryProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareUrl = `${window.location.origin}/share/athlete/${athleteId}`;
      const shareData = {
        title: `${athleteName} - HYPE Summary`,
        text: `I received ${eventHypeCount} hypes at ${eventName}! Check out my STATFYR profile.`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        toast({
          title: "Copied to clipboard!",
          description: "Share link copied - paste it anywhere to share your hype summary.",
        });
      }
      onShare?.();
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast({
          title: "Sharing failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <Flame className="h-5 w-5" />
          Game Day HYPE Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">{eventName} - {eventDate}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-orange-300 dark:border-orange-700">
            <AvatarImage src={avatarUrl || undefined} alt={athleteName} />
            <AvatarFallback className="text-xl font-bold bg-orange-100 dark:bg-orange-900">
              {athleteName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold">{athleteName}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {teamBadgeUrl && (
                <img src={teamBadgeUrl} alt="" className="h-4 w-4 rounded-sm object-cover" />
              )}
              {teamName}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-background rounded-xl p-4 text-center shadow-sm"
          >
            <div className="flex justify-center mb-2">
              <img
                src={fireLogo}
                alt="Hype"
                className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(255,140,0,0.8)]"
              />
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {eventHypeCount}
            </p>
            <p className="text-xs text-muted-foreground">Game Hypes</p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-background rounded-xl p-4 text-center shadow-sm"
          >
            <div className="flex justify-center mb-2">
              <div className="relative">
                <img
                  src={fireLogo}
                  alt="Total"
                  className="h-10 w-10 object-contain"
                />
                <span className="absolute -top-1 -right-1 text-xs font-bold bg-orange-500 text-white rounded-full h-4 w-4 flex items-center justify-center">
                  +
                </span>
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {seasonHypeTotal}
            </p>
            <p className="text-xs text-muted-foreground">Season Total</p>
          </motion.div>
        </div>

        <Button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
          size="lg"
          data-testid="button-fyr-share"
        >
          <Share2 className="h-5 w-5 mr-2" />
          {isSharing ? "Sharing..." : "FYR It Out!"}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Share your hype summary with friends and family
        </p>
      </CardContent>
    </Card>
  );
}
