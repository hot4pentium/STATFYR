import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/userContext";
import { getActiveTheme } from "@/lib/api";

export function useBadgeTheme() {
  const { user } = useUser();
  const isSupporter = user?.role === "supporter";
  
  const { data: activeTheme } = useQuery<{ themeId: string } | null>({
    queryKey: ["supporter-theme", user?.id],
    queryFn: () => getActiveTheme(user!.id),
    enabled: !!user?.id && isSupporter,
  });

  useEffect(() => {
    const html = document.documentElement;
    
    if (activeTheme?.themeId) {
      html.setAttribute("data-badge-theme", activeTheme.themeId);
    } else {
      html.removeAttribute("data-badge-theme");
    }
    
    return () => {
      html.removeAttribute("data-badge-theme");
    };
  }, [activeTheme?.themeId]);

  return activeTheme?.themeId || null;
}
