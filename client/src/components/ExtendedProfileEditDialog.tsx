import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Ruler, Weight, Trophy, GraduationCap, Instagram, Twitter, Youtube, Loader2, Check, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { useQueryClient } from "@tanstack/react-query";

interface ExtendedProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendedProfileEditDialog({ open, onOpenChange }: ExtendedProfileEditDialogProps) {
  const { user: contextUser, updateUser } = useUser();
  const { tier } = useEntitlements();
  const queryClient = useQueryClient();
  
  const isAthletePro = tier === 'athlete_pro' || tier === 'coach_pro';
  
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bio, setBio] = useState("");
  const [gpa, setGpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [teamAwards, setTeamAwards] = useState<string[]>([]);
  const [newAward, setNewAward] = useState("");
  const [socialLinks, setSocialLinks] = useState<{instagram?: string; twitter?: string; youtube?: string; tiktok?: string}>({});
  const [handedness, setHandedness] = useState("");
  const [footedness, setFootedness] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && contextUser) {
      setHeight((contextUser as any).height || "");
      setWeight((contextUser as any).weight || "");
      setBio((contextUser as any).bio || "");
      setGpa((contextUser as any).gpa || "");
      setGraduationYear((contextUser as any).graduationYear?.toString() || "");
      setTeamAwards((contextUser as any).teamAwards || []);
      setSocialLinks((contextUser as any).socialLinks || {});
      setHandedness((contextUser as any).handedness || "");
      setFootedness((contextUser as any).footedness || "");
      setFavoritePlayer((contextUser as any).favoritePlayer || "");
      setFavoriteTeam((contextUser as any).favoriteTeam || "");
    }
  }, [open, contextUser]);

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
    if (!contextUser || !isAthletePro) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${contextUser.id}?requesterId=${contextUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: height.trim() || null,
          weight: weight.trim() || null,
          bio: bio.trim() || null,
          gpa: gpa.trim() || null,
          graduationYear: graduationYear ? parseInt(graduationYear) : null,
          teamAwards: teamAwards.length > 0 ? teamAwards : null,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
          handedness: handedness.trim() || null,
          footedness: footedness.trim() || null,
          favoritePlayer: favoritePlayer.trim() || null,
          favoriteTeam: favoriteTeam.trim() || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save extended profile");

      const updatedUser = await response.json();
      updateUser({ ...contextUser, ...updatedUser });
      queryClient.invalidateQueries({ queryKey: ["/api/users", contextUser.id] });

      toast.success("Extended profile saved!");
      onOpenChange(false);
    } catch (error) {
      console.error("Extended profile save failed:", error);
      toast.error("Failed to save extended profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display font-bold uppercase tracking-wide">Edit Extended Profile</DialogTitle>
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
                  data-testid="dialog-input-height"
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
                  data-testid="dialog-input-weight"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider">Bio / About Me</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell supporters about yourself..."
                className="min-h-[80px] resize-none"
                data-testid="dialog-input-bio"
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
                      data-testid={`dialog-button-handedness-${option}`}
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
                      data-testid={`dialog-button-footedness-${option}`}
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
                  placeholder="e.g., 3.8"
                  className="h-10"
                  data-testid="dialog-input-gpa"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">Grad Year</Label>
                <Input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g., 2026"
                  className="h-10"
                  data-testid="dialog-input-graduation-year"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">Fav Player</Label>
                <Input
                  value={favoritePlayer}
                  onChange={(e) => setFavoritePlayer(e.target.value)}
                  placeholder="e.g., LeBron"
                  className="h-10"
                  data-testid="dialog-input-favorite-player"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider">Fav Team</Label>
                <Input
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  placeholder="e.g., Lakers"
                  className="h-10"
                  data-testid="dialog-input-favorite-team"
                />
              </div>
            </div>

            <div className="space-y-1.5 border-t pt-4">
              <Label className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                Team Awards
              </Label>
              {teamAwards.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {teamAwards.map((award, index) => (
                    <Badge 
                      key={index} 
                      className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 cursor-pointer hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-xs"
                      onClick={() => handleRemoveAward(index)}
                    >
                      {award} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newAward}
                  onChange={(e) => setNewAward(e.target.value)}
                  placeholder="Add an award"
                  className="h-10"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAward())}
                  data-testid="dialog-input-new-award"
                />
                <Button onClick={handleAddAward} variant="outline" size="icon" className="h-10 w-10" data-testid="dialog-button-add-award">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <Label className="text-xs font-medium uppercase tracking-wider">Social Links</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <Input
                    value={socialLinks.instagram || ""}
                    onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                    placeholder="Instagram"
                    className="h-9 text-sm"
                    data-testid="dialog-input-instagram"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <Input
                    value={socialLinks.twitter || ""}
                    onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                    placeholder="X/Twitter"
                    className="h-9 text-sm"
                    data-testid="dialog-input-twitter"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <Input
                    value={socialLinks.youtube || ""}
                    onChange={(e) => setSocialLinks({...socialLinks, youtube: e.target.value})}
                    placeholder="YouTube"
                    className="h-9 text-sm"
                    data-testid="dialog-input-youtube"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  <Input
                    value={socialLinks.tiktok || ""}
                    onChange={(e) => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                    placeholder="TikTok"
                    className="h-9 text-sm"
                    data-testid="dialog-input-tiktok"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-3 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" data-testid="dialog-button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1" data-testid="dialog-button-save">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
