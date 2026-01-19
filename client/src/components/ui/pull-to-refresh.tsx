import { useState, useRef, useCallback, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { hapticLight } from "@/lib/capacitor";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className = "",
  threshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const hapticFiredRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      hapticFiredRef.current = false;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPullingRef.current || startYRef.current === null || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(distance);
      
      if (distance >= threshold && !hapticFiredRef.current) {
        hapticFiredRef.current = true;
        hapticLight();
      }
    }
  }, [isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    
    isPullingRef.current = false;
    startYRef.current = null;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showIndicator && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center transition-transform duration-200"
          style={{ 
            top: `${Math.max(pullDistance - 40, 8)}px`,
            opacity: Math.min(progress * 2, 1)
          }}
        >
          <div className={`p-2 rounded-full bg-background shadow-lg border ${
            isRefreshing ? "animate-spin" : ""
          }`}>
            <RefreshCw 
              className={`h-5 w-5 text-orange-500 transition-transform duration-200`}
              style={{ 
                transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
              }}
            />
          </div>
        </div>
      )}
      
      <div 
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isPullingRef.current ? "none" : "transform 0.2s ease-out"
        }}
      >
        {children}
      </div>
    </div>
  );
}
