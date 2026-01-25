import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Heart, Hand, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestGameDayLive() {
  const [, params] = useRoute("/game-day/guest/:token");
  const token = params?.token || "";
  
  const [localTapCount, setLocalTapCount] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef<number>(0);

  const { data: sessionData, isLoading, error } = useQuery({
    queryKey: ["/api/game-day/join-as-guest", token],
    queryFn: async () => {
      const res = await fetch("/api/game-day/join-as-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join session");
      }
      
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const sendTaps = useCallback(async (count: number) => {
    if (!token || count === 0) return;
    
    try {
      const res = await fetch(`/api/game-day/guest/${token}/tap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tapCount: count }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTotalTaps(data.guestTapCount || 0);
      }
    } catch (err) {
      console.error("Failed to send taps:", err);
    }
  }, [token]);

  const handleTap = useCallback(() => {
    if (!sessionData?.success) return;

    setIsTapping(true);
    setLocalTapCount((prev) => prev + 1);
    tapCountRef.current += 1;

    if (tapCountRef.current >= 10) {
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 600);
    }

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      setIsTapping(false);
      if (tapCountRef.current > 0) {
        sendTaps(tapCountRef.current);
        tapCountRef.current = 0;
      }
    }, 500);
  }, [sessionData?.success, sendTaps]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <>
        <DashboardBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium">Joining Game Day Live...</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !sessionData?.success) {
    return (
      <>
        <DashboardBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Unable to Join</h2>
              <p className="text-muted-foreground">
                {(error as Error)?.message || "This invite link has expired or is invalid."}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 text-center">
            <h1 className="font-display font-bold text-lg text-primary">
              {sessionData.teamName || "Game Day Live"}
            </h1>
            <p className="text-xs text-muted-foreground">Tap to cheer!</p>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-8">
                <AnimatePresence>
                  {showFireworks && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Sparkles className="h-24 w-24 text-yellow-300" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  className={`w-full aspect-square max-w-[200px] mx-auto rounded-full flex flex-col items-center justify-center shadow-2xl transition-all ${
                    isTapping
                      ? "bg-white/30 backdrop-blur-sm"
                      : "bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleTap();
                  }}
                  onClick={handleTap}
                  data-testid="button-guest-tap"
                >
                  <Hand className="h-16 w-16 text-white mb-2" />
                  <span className="text-4xl font-bold text-white">
                    {localTapCount}
                  </span>
                  <span className="text-white/80 text-sm">TAPS</span>
                </motion.button>
              </div>

              <div className="p-6 text-center">
                <div className="flex justify-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-orange-500">
                    <Flame className="h-5 w-5" />
                    <span className="font-bold">{localTapCount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-pink-500">
                    <Heart className="h-5 w-5" />
                    <span className="text-sm text-muted-foreground">Keep tapping!</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Your taps are being counted toward the team total!
                </p>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="text-center p-4 text-xs text-muted-foreground">
          Powered by STATFYR
        </footer>
      </div>
    </>
  );
}
