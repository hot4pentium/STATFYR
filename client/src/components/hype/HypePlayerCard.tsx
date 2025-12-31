import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import fireLogo from "@/assets/statfyr-fire-logo.png";

interface HypePlayerCardProps {
  athleteId: string;
  athleteName: string;
  avatarUrl?: string | null;
  jerseyNumber?: string | null;
  position?: string | null;
  hypeCount: number;
  onHype: (athleteId: string) => void;
  disabled?: boolean;
}

export function HypePlayerCard({
  athleteId,
  athleteName,
  avatarUrl,
  jerseyNumber,
  position,
  hypeCount,
  onHype,
  disabled = false,
}: HypePlayerCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingHypes, setFloatingHypes] = useState<number[]>([]);

  const handleTap = useCallback(() => {
    if (disabled) return;
    
    setIsAnimating(true);
    setFloatingHypes(prev => [...prev, Date.now()]);
    onHype(athleteId);
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [athleteId, onHype, disabled]);

  const removeFloatingHype = (id: number) => {
    setFloatingHypes(prev => prev.filter(h => h !== id));
  };

  return (
    <motion.div
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className="relative"
    >
      <Card
        className={`relative overflow-hidden p-4 cursor-pointer transition-all duration-200 ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg active:shadow-xl"
        } ${isAnimating ? "ring-2 ring-orange-500/50" : ""}`}
        onClick={handleTap}
        data-testid={`hype-card-${athleteId}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-muted">
              <AvatarImage src={avatarUrl || undefined} alt={athleteName} />
              <AvatarFallback className="text-lg font-bold">
                {jerseyNumber || athleteName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {jerseyNumber && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {jerseyNumber}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{athleteName}</p>
            {position && (
              <p className="text-xs text-muted-foreground">{position}</p>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <motion.div
              animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <img
                src={fireLogo}
                alt="Hype"
                className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(255,140,0,0.6)]"
              />
            </motion.div>
            <span className="text-sm font-bold text-orange-500">{hypeCount}</span>
          </div>
        </div>

        <AnimatePresence>
          {floatingHypes.map((id) => (
            <motion.div
              key={id}
              className="absolute pointer-events-none"
              style={{
                left: `${50 + (Math.random() - 0.5) * 30}%`,
                top: "50%",
              }}
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0.5, 1.2, 0.8],
                y: [0, -60, -100],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              onAnimationComplete={() => removeFloatingHype(id)}
            >
              <img
                src={fireLogo}
                alt=""
                className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(255,140,0,1)]"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
