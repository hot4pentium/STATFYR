import { useEffect, useRef } from "react";
import { setBadgeCount, clearBadge, isNative } from "@/lib/capacitor";

export function useAppBadge(unreadCount: number) {
  const previousCount = useRef<number>(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isNative) return;

    if (unreadCount === previousCount.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (unreadCount > 0) {
        setBadgeCount(unreadCount);
      } else {
        clearBadge();
      }
      previousCount.current = unreadCount;
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [unreadCount]);
}
