import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Moon, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface HibernateTeamDialogProps {
  teamId: string;
  teamName: string;
  isHibernated: boolean;
  hibernationEndsAt?: Date | null;
  userId: string;
}

export function HibernateTeamDialog({ teamId, teamName, isHibernated, hibernationEndsAt, userId }: HibernateTeamDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleHibernate = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/hibernate`, {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to hibernate team");
      }

      const result = await response.json();
      toast.success("Team hibernated", {
        description: "Your team is now paused. Billing has stopped.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/coach"] });
    } catch (error: any) {
      console.error("Failed to hibernate team:", error);
      toast.error(error.message || "Failed to hibernate team");
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
    }
  };

  const handleReactivate = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/reactivate`, {
        method: "POST",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reactivate team");
      }

      const result = await response.json();
      toast.success("Team reactivated", {
        description: "Your team is now active again. Billing will resume.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId] });
      queryClient.invalidateQueries({ queryKey: ["/api/coach"] });
    } catch (error: any) {
      console.error("Failed to reactivate team:", error);
      toast.error(error.message || "Failed to reactivate team");
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
    }
  };

  const daysRemaining = hibernationEndsAt 
    ? Math.max(0, Math.ceil((new Date(hibernationEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 60;

  if (isHibernated) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Team Hibernating
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{teamName}</strong> is currently hibernating.
            </p>
            <p className="text-sm text-amber-400">
              {daysRemaining} days remaining to reactivate
            </p>
            <p className="text-sm text-muted-foreground">
              If not reactivated, the team will be permanently deleted.
            </p>
          </div>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-reactivate-team"
              >
                <Play className="h-4 w-4 mr-2" />
                Reactivate Team
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-500" />
                  Reactivate Team?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>Ready to bring <strong>{teamName}</strong> back?</p>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <p><strong>What happens next:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your team will be active again immediately</li>
                      <li>All team members regain access</li>
                      <li>Billing will resume</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReactivate}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-confirm-reactivate-team"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    "Yes, Reactivate"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-amber-500/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Team Hibernation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Need to take a break? Hibernate your team during the off-season:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Subscription billing stops immediately</li>
            <li>Team members can't access the team</li>
            <li>All data is preserved for 60 days</li>
            <li>Reactivate anytime within 60 days</li>
          </ul>
          <p className="text-sm text-red-400 mt-3">
            After 60 days, the team will be permanently deleted.
          </p>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline"
              className="w-full border-amber-500/30 hover:bg-amber-500/10"
              data-testid="button-hibernate-team"
            >
              <Moon className="h-4 w-4 mr-2" />
              Hibernate Team
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-amber-500" />
                Hibernate Team?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>Are you sure you want to hibernate <strong>{teamName}</strong>?</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>What happens next:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your subscription billing will stop immediately</li>
                    <li>Team members won't be able to access the team</li>
                    <li>All data (stats, events, roster) will be preserved</li>
                    <li>You have 60 days to reactivate</li>
                  </ul>
                  <p className="text-red-400 mt-2">
                    After 60 days, the team will be permanently deleted.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleHibernate}
                disabled={isProcessing}
                className="bg-amber-600 hover:bg-amber-700"
                data-testid="button-confirm-hibernate-team"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Hibernating...
                  </>
                ) : (
                  "Yes, Hibernate Team"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
