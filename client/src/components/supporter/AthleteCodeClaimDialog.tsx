import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AthleteCodeClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (athlete: { id: string; name: string }) => void;
}

export function AthleteCodeClaimDialog({ open, onOpenChange, onSuccess }: AthleteCodeClaimDialogProps) {
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: async (athleteCode: string) => {
      const res = await fetch("/api/supporter/claim-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: athleteCode }),
        credentials: "include",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to connect with athlete");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Connected with athlete!");
      queryClient.invalidateQueries({ queryKey: ["/api/supporter/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setCode("");
      onOpenChange(false);
      onSuccess?.(data.athlete);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      claimMutation.mutate(code.trim().toUpperCase());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-claim-athlete">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Connect with Your Athlete
          </DialogTitle>
          <DialogDescription>
            Enter the unique code from your athlete to unlock HYPE features like Game Day Live interactions, shoutouts, and more.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="athlete-code">Athlete Code</Label>
            <Input
              id="athlete-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="font-mono text-lg tracking-wider text-center uppercase"
              maxLength={10}
              data-testid="input-athlete-code"
            />
            <p className="text-xs text-muted-foreground">
              Ask your athlete to share their code from their Settings page.
            </p>
          </div>

          {claimMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{claimMutation.error.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-claim"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!code.trim() || claimMutation.isPending}
              data-testid="button-submit-claim"
            >
              {claimMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
