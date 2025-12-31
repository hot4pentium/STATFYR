import { getBadgeById } from "@shared/badges";
import { useMemo } from "react";

interface TeamBadgeProps {
  badgeId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackInitials?: string;
  teamColor?: string | null;
}

const sizeClasses = {
  sm: "w-6 h-7",
  md: "w-10 h-12",
  lg: "w-14 h-16",
  xl: "w-20 h-24"
};

function hexToHueRotate(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return h * 360;
}

export function TeamBadge({ badgeId, size = "md", className = "", fallbackInitials, teamColor }: TeamBadgeProps) {
  const badge = badgeId ? getBadgeById(badgeId) : null;
  
  const styledSvg = useMemo(() => {
    if (!badge) return "";
    return badge.svg.replace('<svg', '<svg style="width:100%;height:100%"');
  }, [badge]);

  const colorFilter = useMemo(() => {
    if (!teamColor) return undefined;
    const hue = hexToHueRotate(teamColor);
    return `grayscale(100%) sepia(100%) saturate(400%) hue-rotate(${hue - 50}deg) brightness(1.0)`;
  }, [teamColor]);
  
  if (!badge) {
    if (fallbackInitials) {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold ${className}`}
          style={{ 
            backgroundColor: teamColor ? `${teamColor}33` : undefined,
            color: teamColor || undefined
          }}
        >
          {fallbackInitials.slice(0, 2).toUpperCase()}
        </div>
      );
    }
    return null;
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${className}`}
      style={{ filter: colorFilter }}
      dangerouslySetInnerHTML={{ __html: styledSvg }}
    />
  );
}
