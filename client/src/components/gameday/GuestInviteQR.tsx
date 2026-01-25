import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Share2, Users, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface GuestInviteQRProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuestInviteQR({ sessionId, open, onOpenChange }: GuestInviteQRProps) {
  const [copied, setCopied] = useState(false);
  const [inviteData, setInviteData] = useState<{
    guestToken: string;
    expiresAt: string;
    inviteUrl: string;
  } | null>(null);

  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/live-sessions/${sessionId}/invite-guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate invite");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setInviteData({
        guestToken: data.guestToken,
        expiresAt: data.expiresAt,
        inviteUrl: data.inviteUrl,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !inviteData) {
      generateInviteMutation.mutate();
    }
    onOpenChange(isOpen);
  };

  const fullInviteUrl = inviteData 
    ? `${window.location.origin}${inviteData.inviteUrl}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullInviteUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Game Day Live!",
          text: "Scan this to cheer with us!",
          url: fullInviteUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const expiresAt = inviteData ? new Date(inviteData.expiresAt) : null;
  const expiresIn = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000)) : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-guest-invite">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Invite Family to Join
          </DialogTitle>
          <DialogDescription>
            Share this QR code with family members so they can tap along with you!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          {generateInviteMutation.isPending ? (
            <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inviteData ? (
            <>
              <div className="p-4 bg-white rounded-xl shadow-md">
                <QRCodeSVG 
                  value={fullInviteUrl}
                  size={180}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Expires in {expiresIn} minutes
              </p>

              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyLink}
                  data-testid="button-copy-invite"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </>
                  )}
                </Button>
                
                <Button
                  className="flex-1"
                  onClick={handleShare}
                  data-testid="button-share-invite"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Tap to generate an invite QR code
            </div>
          )}
        </div>

        <div className="text-xs text-center text-muted-foreground border-t pt-4">
          Guest taps will be added to your total for leaderboard rankings.
        </div>
      </DialogContent>
    </Dialog>
  );
}
