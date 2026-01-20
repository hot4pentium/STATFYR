import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ruler, Weight, Trophy, GraduationCap, Loader2, Check, Plus, X, Lock, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { ManagedAthlete } from "@/lib/api";

interface ManagedAthleteExtendedProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managedAthlete: ManagedAthlete | null;
  onSaved?: () => void;
}

export function ManagedAthleteExtendedProfileDialog({ 
  open, 
  onOpenChange, 
  managedAthlete,
  onSaved 
}: ManagedAthleteExtendedProfileDialogProps) {
  const { user: contextUser } = useUser();
  const { entitlements, tier } = useEntitlements();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const canEdit = entitlements.canEditExtendedProfile;
  
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bio, setBio] = useState("");
  const [gpa, setGpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [teamAwards, setTeamAwards] = useState<string[]>([]);
  const [newAward, setNewAward] = useState("");
  const [handedness, setHandedness] = useState("");
  const [footedness, setFootedness] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && managedAthlete) {
      const athlete = managedAthlete.athlete as any;
      const ma = managedAthlete as any;
      
      setHeight(athlete?.height || ma?.height || "");
      setWeight(athlete?.weight || ma?.weight || "");
      setBio(athlete?.bio || ma?.bio || "");
      setGpa(athlete?.gpa || ma?.gpa || "");
      setGraduationYear((athlete?.graduationYear || ma?.graduationYear)?.toString() || "");
      setTeamAwards(athlete?.teamAwards || ma?.teamAwards || []);
      setHandedness(athlete?.handedness || ma?.handedness || "");
      setFootedness(athlete?.footedness || ma?.footedness || "");
      setFavoritePlayer(athlete?.favoritePlayer || ma?.favoritePlayer || "");
      setFavoriteTeam(athlete?.favoriteTeam || ma?.favoriteTeam || "");
    }
  }, [open, managedAthlete]);

  const formatHeight = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.length === 1) return digits + "'";
    if (digits.length >= 2) {
      const feet = digits[0];
      const inches = digits.slice(1, 3);
      return `${feet}'${inches}"`;
    }
    return value;
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length <= 3) {
      setHeight(formatHeight(value));
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/[^0-9]/g, '');
    if (digits) {
      setWeight(digits + " lbs");
    } else {
      setWeight('');
    }
  };

  const handleAddAward = () => {
    if (newAward.trim()) {
      setTeamAwards([...teamAwards, newAward.trim()]);
      setNewAward("");
    }
  };

  const handleRemoveAward = (index: number) => {
    setTeamAwards(teamAwards.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!contextUser || !managedAthlete || !canEdit) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/supporter/managed-athletes/${managedAthlete.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": contextUser.id,
        },
        body: JSON.stringify({
          height: height.trim() || null,
          weight: weight.trim() || null,
          bio: bio.trim() || null,
          gpa: gpa.trim() || null,
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          teamAwards: teamAwards.length > 0 ? teamAwards : null,
          handedness: handedness.trim() || null,
          footedness: footedness.trim() || null,
          favoritePlayer: favoritePlayer.trim() || null,
          favoriteTeam: favoriteTeam.trim() || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save extended profile");

      queryClient.invalidateQueries({ queryKey: ["/api/supporter/managed-athletes"] });

      toast.success("Extended profile saved!");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Extended profile save failed:", error);
      toast.error("Failed to save extended profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const athleteName = managedAthlete?.athlete?.firstName 
    ? `${managedAthlete.athlete.firstName} ${managedAthlete.athlete.lastName || ''}`.trim()
    : managedAthlete?.athleteName || "Athlete";

  if (!canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold uppercase tracking-wide flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-500" />
              Extended Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Supporter Pro Feature</h3>
              <p className="text-muted-foreground text-sm">
                Upgrade to Supporter Pro to edit extended profile details like height, weight, GPA, awards, and more for {athleteName}.
              </p>
            </div>
            <Button 
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                setLocation("/subscription");
              }}
              data-testid="button-upgrade-extended-profile"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Supporter Pro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display font-bold uppercase tracking-wide">
            Edit Extended Profile for {athleteName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
          <div className="space-y-5 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-primary" />
                  Height
                </Label>
                <Input
                  value={height}
                  onChange={handleHeightChange}
                  placeholder="5'10&quot;"
                  className="h-10"
                  data-testid="managed-dialog-input-height"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Weight className="h-3.5 w-3.5 text-primary" />
                  Weight
                </Label>
                <Input
                  value={weight}
                  onChange={handleWeightChange}
                  placeholder="165 lbs"
                  className="h-10"
                  data-testid="managed-dialog-input-weight"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider">Bio / About</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell supporters about this athlete..."
                className="min-h-[80px] resize-none"
                data-testid="managed-dialog-input-bio"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">✋ Handedness</Label>
                <div className="flex gap-1">
                  {["left", "right", "ambidextrous"].map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={handedness === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHandedness(option)}
                      className={`flex-1 capitalize text-xs px-2 ${handedness === option ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid={`managed-dialog-button-handedness-${option}`}
                    >
                      {option === "ambidextrous" ? "Both" : option}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">🦶 Footedness</Label>
                <div className="flex gap-1">
                  {["left", "right", "both"].map((option) => (
                    <Button
                      key={option}
                      type="button"
                      variant={footedness === option ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFootedness(option)}
                      className={`flex-1 capitalize text-xs px-2 ${footedness === option ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid={`managed-dialog-button-footedness-${option}`}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  GPA
                </Label>
                <Input
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="3.5"
                  className="h-10"
                  data-testid="managed-dialog-input-gpa"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">Graduation Year</Label>
                <Input
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="2026"
                  className="h-10"
                  data-testid="managed-dialog-input-graduation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">Favorite Player</Label>
                <Input
                  value={favoritePlayer}
                  onChange={(e) => setFavoritePlayer(e.target.value)}
                  placeholder="LeBron James"
                  className="h-10"
                  data-testid="managed-dialog-input-favorite-player"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">Favorite Team</Label>
                <Input
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  placeholder="Lakers"
                  className="h-10"
                  data-testid="managed-dialog-input-favorite-team"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Team Awards
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {teamAwards.map((award, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="gap-1 pr-1 text-xs"
                  >
                    {award}
                    <button 
                      onClick={() => handleRemoveAward(index)}
                      className="hover:text-destructive transition-colors"
                      data-testid={`managed-dialog-remove-award-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAward}
                  onChange={(e) => setNewAward(e.target.value)}
                  placeholder="Add an award..."
                  className="h-9 flex-1 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAward())}
                  data-testid="managed-dialog-input-new-award"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddAward}
                  className="h-9 px-3"
                  data-testid="managed-dialog-button-add-award"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/30">
          <Button 
            onClick={handleSave} 
            className="w-full gap-2"
            disabled={isSaving}
            data-testid="managed-dialog-button-save"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Extended Profile
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
