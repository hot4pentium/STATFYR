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
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  userId: string;
  onLogout: () => void;
}

export function DeleteAccountDialog({ userId, onLogout }: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      const result = await response.json();
      toast.success("Account deletion scheduled", {
        description: "You will be logged out now. Your data will be permanently deleted in 30 days.",
      });
      
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-red-500/20">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-red-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Deleting your account will:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Disable your login immediately</li>
            <li>Keep your data for 30 days</li>
            <li>Permanently delete all data after 30 days</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            You can reactivate your account within 30 days by logging in again.
          </p>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              data-testid="button-delete-account"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>Are you sure you want to delete your account?</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <p><strong>What happens next:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your account will be disabled immediately</li>
                    <li>Your data will be kept for 30 days</li>
                    <li>After 30 days, all your data will be permanently deleted</li>
                  </ul>
                  <p className="text-green-600 dark:text-green-400 mt-2">
                    You can reactivate by logging in within 30 days.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete-account"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
