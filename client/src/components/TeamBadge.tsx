import { getBadgeById } from "@shared/badges";
import { useMemo } from "react";

interface TeamBadgeProps {
  badgeId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackInitials?: string;
}

const sizeClasses = {
  sm: "w-6 h-7",
  md: "w-10 h-12",
  lg: "w-14 h-16",
  xl: "w-20 h-24"
};

export function TeamBadge({ badgeId, size = "md", className = "", fallbackInitials }: TeamBadgeProps) {
  const badge = badgeId ? getBadgeById(badgeId) : null;
  
  const styledSvg = useMemo(() => {
    if (!badge) return "";
    return badge.svg.replace('<svg', '<svg style="width:100%;height:100%"');
  }, [badge]);
  
  if (!badge) {
    if (fallbackInitials) {
      return (
        <div className={`${sizeClasses[size]} bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold ${className}`}>
          {fallbackInitials.slice(0, 2).toUpperCase()}
        </div>
      );
    }
    return null;
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${className}`}
      dangerouslySetInnerHTML={{ __html: styledSvg }}
    />
  );
}
