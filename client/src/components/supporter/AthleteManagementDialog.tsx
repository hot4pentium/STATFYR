import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Link2, ChevronRight, ArrowLeft, Heart, Sparkles, Loader2, Lock, Crown } from "lucide-react";
import { AthleteCodeClaimDialog } from "./AthleteCodeClaimDialog";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { createManagedAthlete, joinTeamByCode } from "@/lib/api";
import { toast } from "sonner";

interface AthleteManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAthleteAdded?: () => void;
  managedAthletesCount?: number;
}

type ConnectionPath = "team-follower" | "independent" | "claim-code" | null;
type ViewState = "main" | "detail" | "add-form" | "join-team-form";

const SPORTS_LIST = ["Basketball", "Baseball", "Football", "Soccer", "Volleyball"];

export function AthleteManagementDialog({ open, onOpenChange, onAthleteAdded, managedAthletesCount = 0 }: AthleteManagementDialogProps) {
  const [selectedPath, setSelectedPath] = useState<ConnectionPath>(null);
  const [viewState, setViewState] = useState<ViewState>("main");
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const { user } = useUser();
  const { entitlements } = useEntitlements();
  const [, setLocation] = useLocation();
  
  const hasReachedAthleteLimit = managedAthletesCount >= entitlements.maxManagedAthletes;

  // Add athlete form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Join team form state
  const [teamCode, setTeamCode] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setSport("");
    setPosition("");
    setJerseyNumber("");
    setTeamCode("");
  };

  const handleBack = () => {
    if (viewState === "add-form" || viewState === "join-team-form") {
      setViewState("detail");
    } else {
      setSelectedPath(null);
      setViewState("main");
    }
  };
  
  const handleClose = () => {
    setSelectedPath(null);
    setViewState("main");
    resetForm();
    onOpenChange(false);
  };

  const handleJoinTeam = async () => {
    if (!user) {
      toast.error("Please log in to join a team.");
      return;
    }

    if (!teamCode.trim()) {
      toast.error("Please enter a team code.");
      return;
    }

    setIsJoiningTeam(true);
    try {
      const result = await joinTeamByCode(teamCode.trim().toUpperCase(), user.id, "supporter");
      toast.success(`You've joined ${result.team?.name || "the team"} as a supporter!`);
      resetForm();
      onAthleteAdded?.();
      handleClose();
    } catch (error: any) {
      console.error("Failed to join team:", error);
      toast.error(error.message || "Invalid team code. Please check and try again.");
    } finally {
      setIsJoiningTeam(false);
    }
  };

  const handleAddAthlete = async () => {
    if (!user) {
      toast.error("Please log in to add an athlete.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter first and last name.");
      return;
    }

    if (!sport) {
      toast.error("Please select a sport.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createManagedAthlete(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        sport: sport,
        position: position.trim() || undefined,
        number: jerseyNumber.trim() || undefined,
      });
      
      const athleteName = result.athlete?.name || `${firstName} ${lastName}`;
      toast.success(`${athleteName} has been added as your athlete!`);
      resetForm();
      onAthleteAdded?.();
      handleClose();
    } catch (error: any) {
      console.error("Failed to add athlete:", error);
      if (error.limitReached && error.requiresUpgrade) {
        toast.error("You've reached the limit of 1 managed athlete. Upgrade to Supporter Pro for unlimited athletes!", {
          action: {
            label: "Upgrade",
            onClick: () => {
              handleClose();
              setLocation("/subscription");
            },
          },
          duration: 8000,
        });
      } else {
        toast.error(error.message || "Failed to add athlete. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
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
        setViewState("join-team-form");
      },
      actionLabel: "Enter Team Code",
    },
    {
      id: "independent" as const,
      title: "Add Your Athlete",
      icon: UserPlus,
      badge: hasReachedAthleteLimit ? "Upgrade Required" : "Parent Mode",
      badgeVariant: hasReachedAthleteLimit ? "secondary" as const : "default" as const,
      description: hasReachedAthleteLimit 
        ? "You've reached your athlete limit. Upgrade to Pro for unlimited athletes."
        : "Create a profile for your child and track their sports journey",
      features: hasReachedAthleteLimit ? [
        "Upgrade to manage unlimited athletes",
        "Video uploads for all your athletes",
        "Extended profile editing",
      ] : [
        "Create and manage your athlete's profile",
        "Track stats and record game performances",
        "Upload highlight videos and photos",
        "Share their shareable athlete profile",
        "Manage their schedule and events",
      ],
      note: hasReachedAthleteLimit 
        ? undefined
        : "Perfect for parents of young athletes who may not have their own account or aren't on a team using STATFYR yet.",
      action: () => {
        if (hasReachedAthleteLimit) {
          setLocation("/subscription");
          handleClose();
        } else {
          setViewState("add-form");
        }
      },
      actionLabel: hasReachedAthleteLimit ? "Upgrade to Pro" : "Add Athlete Profile",
    },
    {
      id: "claim-code" as const,
      title: "Connect via Code",
      icon: Link2,
      badge: hasReachedAthleteLimit ? "Upgrade Required" : "HYPE Mode",
      badgeVariant: hasReachedAthleteLimit ? "secondary" as const : "default" as const,
      description: hasReachedAthleteLimit 
        ? "You've reached your athlete limit. Upgrade to Pro for unlimited athletes."
        : "Link with your athlete who already has a STATFYR account",
      features: hasReachedAthleteLimit ? [
        "Upgrade to manage unlimited athletes",
        "Video uploads for all your athletes",
        "Extended profile editing",
      ] : [
        "Unlock HYPE features for your athlete",
        "Send shoutouts and hype during games",
        "Upload highlights to their profile",
        "View their stats and game history",
        "Access their shareable athlete profile",
      ],
      note: hasReachedAthleteLimit 
        ? undefined
        : "Your athlete shares their unique code from their Settings page. Only one supporter can claim each athlete's code.",
      action: () => {
        if (hasReachedAthleteLimit) {
          setLocation("/subscription");
          handleClose();
        } else {
          setShowClaimDialog(true);
          handleClose();
        }
      },
      actionLabel: hasReachedAthleteLimit ? "Upgrade to Pro" : "Enter Athlete Code",
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
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => {
              setSelectedPath(path.id);
              setViewState("detail");
            }}
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
                    </CardTitle>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
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

  const renderJoinTeamForm = () => (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBack}
        className="mb-2"
        data-testid="button-back-team-form"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Follow a Team</h3>
          <p className="text-muted-foreground text-sm">Enter the team's code to join as a supporter</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="teamCode">Team Code *</Label>
          <Input
            id="teamCode"
            placeholder="Enter team code (e.g., ABC123)"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            className="text-center text-lg tracking-widest font-mono"
            maxLength={10}
            data-testid="input-team-code"
          />
          <p className="text-xs text-muted-foreground text-center">
            Ask your athlete's coach for the team code
          </p>
        </div>
      </div>

      <Button 
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        onClick={handleJoinTeam}
        disabled={isJoiningTeam || !teamCode.trim()}
        data-testid="button-submit-team-code"
      >
        {isJoiningTeam ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <Users className="h-4 w-4 mr-2" />
            Join Team
          </>
        )}
      </Button>
    </div>
  );

  const renderAddAthleteForm = () => (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleBack}
        className="mb-2"
        data-testid="button-back-form"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Add Your Athlete</h3>
          <p className="text-muted-foreground text-sm">Create a profile for your child</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              data-testid="input-first-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              data-testid="input-last-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sport">Sport *</Label>
          <Select value={sport} onValueChange={setSport}>
            <SelectTrigger data-testid="select-sport">
              <SelectValue placeholder="Select a sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORTS_LIST.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="position">Position (optional)</Label>
            <Input
              id="position"
              placeholder="e.g., Point Guard"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              data-testid="input-position"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jerseyNumber">Jersey # (optional)</Label>
            <Input
              id="jerseyNumber"
              placeholder="e.g., 23"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              data-testid="input-jersey-number"
            />
          </div>
        </div>
      </div>

      <Button 
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        onClick={handleAddAthlete}
        disabled={isSubmitting || !firstName.trim() || !lastName.trim() || !sport}
        data-testid="button-submit-athlete"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Athlete
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        You can add more details like photo and profile info after creation.
      </p>
    </div>
  );

  const selectedPathData = connectionPaths.find(p => p.id === selectedPath);

  const getDialogTitle = () => {
    if (viewState === "add-form") return "Add Your Athlete";
    if (viewState === "join-team-form") return "Follow a Team";
    if (viewState === "detail" && selectedPathData) return selectedPathData.title;
    return "Connect with Athletes";
  };

  const getDialogDescription = () => {
    if (viewState === "add-form") return "Enter your athlete's information";
    if (viewState === "join-team-form") return "Enter the team code to join";
    if (viewState === "detail") return "Learn more about this connection option";
    return "Choose the best way to support your athletes";
  };

  const renderCurrentView = () => {
    switch (viewState) {
      case "add-form":
        return renderAddAthleteForm();
      case "join-team-form":
        return renderJoinTeamForm();
      case "detail":
        return selectedPathData ? renderDetailView(selectedPathData) : renderMainView();
      default:
        return renderMainView();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-athlete-management">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>

          {renderCurrentView()}
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
