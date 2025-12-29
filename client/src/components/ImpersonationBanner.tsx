import { useUser } from "@/lib/userContext";
import { Button } from "@/components/ui/button";
import { Eye, XCircle, Loader2 } from "lucide-react";
import { adminStopImpersonation } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

export default function ImpersonationBanner() {
  const { user, isImpersonating, originalAdmin, setUser, setImpersonating, setOriginalAdmin } = useUser();
  const [isExiting, setIsExiting] = useState(false);

  if (!isImpersonating || !originalAdmin) {
    return null;
  }

  const handleExitImpersonation = async () => {
    setIsExiting(true);
    try {
      await adminStopImpersonation(originalAdmin.id);
    } catch (error) {
      console.error("Failed to end impersonation session on server:", error);
    }
    setUser(originalAdmin);
    setImpersonating(false);
    setOriginalAdmin(null);
    toast.success("Returned to your admin account");
    window.location.href = "/super-admin";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">
            Viewing as: <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExitImpersonation}
          disabled={isExiting}
          className="bg-white/90 hover:bg-white text-black border-black/20"
          data-testid="button-exit-impersonation"
        >
          {isExiting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-1" />
          )}
          Exit View Mode
        </Button>
      </div>
    </div>
  );
}
