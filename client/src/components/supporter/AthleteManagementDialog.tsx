import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Link2, ChevronRight, ArrowLeft, Heart, Sparkles } from "lucide-react";
import { AthleteCodeClaimDialog } from "./AthleteCodeClaimDialog";
import { useUser } from "@/lib/userContext";

interface AthleteManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAthleteAdded?: () => void;
}

type ConnectionPath = "team-follower" | "independent" | "claim-code" | null;

export function AthleteManagementDialog({ open, onOpenChange, onAthleteAdded }: AthleteManagementDialogProps) {
  const [selectedPath, setSelectedPath] = useState<ConnectionPath>(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const { user } = useUser();
  const [, setLocation] = useLocation();

  const handleBack = () => setSelectedPath(null);
  
  const handleClose = () => {
    setSelectedPath(null);
    onOpenChange(false);
  };

  const connectionPaths = [
    {
      id: "team-follower" as const,
      title: "Follow a Team",
      icon: Users,
      badge: "Fan Mode",
      badgeVariant: "secondary" as const,
      description: "Support your athlete's team and cheer them on during games",
      features: [
        "View team schedule and events",
        "Participate in Game Day Live sessions",
        "Send shoutouts and taps during games",
        "View team stats and standings",
      ],
      note: "Best for extended family, friends, and team supporters who want to cheer on the whole team.",
      action: () => {
        handleClose();
      },
      actionLabel: "Join a Team",
      comingSoon: true,
    },
    {
      id: "independent" as const,
      title: "Add Your Athlete",
      icon: UserPlus,
      badge: "Parent Mode",
      badgeVariant: "default" as const,
      description: "Create a profile for your child and track their sports journey",
      features: [
        "Create and manage your athlete's profile",
        "Track stats and record game performances",
        "Upload highlight videos and photos",
        "Share their shareable athlete profile",
        "Manage their schedule and events",
      ],
      note: "Perfect for parents of young athletes who may not have their own account or aren't on a team using STATFYR yet.",
      action: () => {
        handleClose();
        setLocation("/supporter/settings?section=athletes");
      },
      actionLabel: "Add Athlete Profile",
    },
    {
      id: "claim-code" as const,
      title: "Connect via Code",
      icon: Link2,
      badge: "HYPE Mode",
      badgeVariant: "default" as const,
      description: "Link with your athlete who already has a STATFYR account",
      features: [
        "Unlock HYPE features for your athlete",
        "Send shoutouts and hype during games",
        "Upload highlights to their profile",
        "View their stats and game history",
        "Access their shareable athlete profile",
      ],
      note: "Your athlete shares their unique code from their Settings page. Only one supporter can claim each athlete's code.",
      action: () => {
        setShowClaimDialog(true);
        handleClose();
      },
      actionLabel: "Enter Athlete Code",
    },
  ];

  const renderMainView = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-muted-foreground">
          Choose how you'd like to connect with and support athletes in STATFYR.
        </p>
      </div>

      <div className="grid gap-4">
        {connectionPaths.map((path) => (
          <Card 
            key={path.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
              path.comingSoon ? 'opacity-60' : ''
            }`}
            onClick={() => !path.comingSoon && setSelectedPath(path.id)}
            data-testid={`card-${path.id}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <path.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {path.title}
                      <Badge variant={path.badgeVariant} className="text-xs">
                        {path.badge}
                      </Badge>
                      {path.comingSoon && (
                        <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
                {!path.comingSoon && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription>{path.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDetailView = (path: typeof connectionPaths[number]) => (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBack}
        className="mb-2"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to options
      </Button>

      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <path.icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            {path.title}
            <Badge variant={path.badgeVariant}>{path.badge}</Badge>
          </h3>
          <p className="text-muted-foreground">{path.description}</p>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          What you can do:
        </h4>
        <ul className="space-y-2">
          {path.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Note:</strong> {path.note}
        </p>
      </div>

      <Button 
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        onClick={path.action}
        data-testid={`button-${path.id}-action`}
      >
        {path.actionLabel}
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );

  const selectedPathData = connectionPaths.find(p => p.id === selectedPath);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-athlete-management">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {selectedPath ? selectedPathData?.title : "Connect with Athletes"}
            </DialogTitle>
            <DialogDescription>
              {selectedPath 
                ? "Learn more about this connection option"
                : "Choose the best way to support your athletes"
              }
            </DialogDescription>
          </DialogHeader>

          {selectedPath && selectedPathData 
            ? renderDetailView(selectedPathData)
            : renderMainView()
          }
        </DialogContent>
      </Dialog>

      <AthleteCodeClaimDialog
        open={showClaimDialog}
        onOpenChange={setShowClaimDialog}
        userId={user?.id}
        onSuccess={() => {
          onAthleteAdded?.();
        }}
      />
    </>
  );
}
