import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Upload, ArrowLeft, LogOut, Settings, Loader2, Check, Users, Plus, Camera, Crown, Ruler, Weight, Trophy, GraduationCap, Instagram, Twitter, Youtube, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { joinTeamByCode, getUserTeams } from "@/lib/api";
import { useEntitlements } from "@/lib/entitlementsContext";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { isNative } from "@/lib/capacitor";

export default function AthleteSettings() {
  const { user: contextUser, updateUser } = useUser();
  const { tier } = useEntitlements();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [teamCode, setTeamCode] = useState("");
  const [isJoiningTeam, setIsJoiningTeam] = useState(false);
  
  // Extended profile fields (Athlete Pro)
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bio, setBio] = useState("");
  const [gpa, setGpa] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [teamAwards, setTeamAwards] = useState<string[]>([]);
  const [newAward, setNewAward] = useState("");
  const [socialLinks, setSocialLinks] = useState<{instagram?: string; twitter?: string; youtube?: string; tiktok?: string}>({});
  const [isSavingExtended, setIsSavingExtended] = useState(false);
  const [showExtendedSaved, setShowExtendedSaved] = useState(false);
  
  const isAthletePro = tier === 'athlete_pro' || tier === 'coach_pro';

  const appVersion = "1.0.10";

  const handlePhotoSave = async (dataUrl: string) => {
    if (!contextUser) return;
    setAvatarPreview(dataUrl);
    setIsUploadingAvatar(true);
    
    try {
      const response = await fetch(`/api/users/${contextUser.id}?requesterId=${contextUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: dataUrl }),
      });

      if (!response.ok) throw new Error("Failed to save avatar");

      const updatedUser = await response.json();
      updateUser({ ...contextUser, ...updatedUser });
      toast.success("Avatar saved!");
    } catch (error) {
      console.error("Avatar save failed:", error);
      toast.error("Failed to save avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const { isCapturing, handleNativePhoto, handleFileInput } = useNativeCamera({
    onPhotoTaken: handlePhotoSave,
  });

  const { data: userTeams = [] } = useQuery({
    queryKey: ["/api/users", contextUser?.id, "teams"],
    queryFn: () => contextUser ? getUserTeams(contextUser.id) : Promise.resolve([]),
    enabled: !!contextUser,
  });

  const handleJoinTeam = async () => {
    if (!contextUser || !teamCode.trim()) {
      toast.error("Please enter a team code");
      return;
    }

    setIsJoiningTeam(true);
    try {
      await joinTeamByCode(contextUser.id, teamCode.trim().toUpperCase(), "athlete");
      toast.success("Successfully joined the team!");
      setTeamCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/users", contextUser.id, "teams"] });
    } catch (error: any) {
      console.error("Failed to join team:", error);
      toast.error(error.message || "Failed to join team. Please check the code and try again.");
    } finally {
      setIsJoiningTeam(false);
    }
  };

  useEffect(() => {
    if (contextUser) {
      setFirstName(contextUser.firstName || "");
      setLastName(contextUser.lastName || "");
      setEmail(contextUser.email || "");
      setAvatarPreview(contextUser.avatar || null);
      // Extended profile fields
      setHeight((contextUser as any).height || "");
      setWeight((contextUser as any).weight || "");
      setBio((contextUser as any).bio || "");
      setGpa((contextUser as any).gpa || "");
      setGraduationYear((contextUser as any).graduationYear?.toString() || "");
      setTeamAwards((contextUser as any).teamAwards || []);
      setSocialLinks((contextUser as any).socialLinks || {});
    }
  }, [contextUser]);

  const handleSaveChanges = async () => {
    if (!contextUser) {
      toast.error("User not found. Please log in again.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${contextUser.id}?requesterId=${contextUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          avatar: avatarPreview,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      const updatedUser = await response.json();
      updateUser({ ...contextUser, ...updatedUser });

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      toast.success("Profile settings saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && contextUser) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const avatarData = event.target?.result as string;
        setAvatarPreview(avatarData);
        
        try {
          const response = await fetch(`/api/users/${contextUser.id}?requesterId=${contextUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: avatarData }),
          });

          if (!response.ok) {
            throw new Error("Failed to save avatar");
          }

          const updatedUser = await response.json();
          updateUser({ ...contextUser, ...updatedUser });
          toast.success("Avatar saved!");
        } catch (error) {
          console.error("Avatar save failed:", error);
          toast.error("Failed to save avatar. Please try again.");
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.onerror = () => {
        setIsUploadingAvatar(false);
        toast.error("Failed to load image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveExtendedProfile = async () => {
    if (!contextUser) return;
    
    setIsSavingExtended(true);
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
        }),
      });

      if (!response.ok) throw new Error("Failed to save extended profile");

      const updatedUser = await response.json();
      updateUser({ ...contextUser, ...updatedUser });

      setShowExtendedSaved(true);
      setTimeout(() => setShowExtendedSaved(false), 2000);
      toast.success("Extended profile saved!");
    } catch (error) {
      console.error("Extended profile save failed:", error);
      toast.error("Failed to save extended profile.");
    } finally {
      setIsSavingExtended(false);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-full px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/athlete/dashboard">
            <Button
              variant="outline"
              size="icon"
              className="border-white/20 hover:bg-white/10"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/athlete/settings">
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 hover:bg-white/10"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 hover:bg-white/10"
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div 
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 space-y-6 max-w-full px-4 md:px-8 py-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 backdrop-blur-md rounded-lg border border-primary/30 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tighter">Profile Settings</h1>
                <p className="text-white/80 text-sm md:text-base">Manage your profile and preferences</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-accent shadow-lg flex-shrink-0 bg-background/50 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4 w-full md:w-auto">
                    <Label htmlFor="avatar-upload" className="text-sm font-medium uppercase tracking-wider">Upload Photo</Label>
                    <div className="flex gap-2">
                      {isNative && (
                        <Button
                          disabled={isUploadingAvatar || isCapturing}
                          variant="outline"
                          className="border-white/10 hover:bg-white/5"
                          onClick={handleNativePhoto}
                          data-testid="button-take-photo"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          {isCapturing ? "Capturing..." : "Take Photo"}
                        </Button>
                      )}
                      <div className="relative">
                        <input
                          id="avatar-upload"
                          data-testid="input-avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileInput(e)}
                          disabled={isUploadingAvatar || isCapturing}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Button
                          disabled={isUploadingAvatar || isCapturing}
                          variant="outline"
                          className="border-white/10 hover:bg-white/5"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                          data-testid="button-upload-avatar"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {isUploadingAvatar ? "Saving..." : "Choose Photo"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-sm font-medium uppercase tracking-wider">First Name</Label>
                  <Input
                    id="first-name"
                    data-testid="input-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-sm font-medium uppercase tracking-wider">Last Name</Label>
                  <Input
                    id="last-name"
                    data-testid="input-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                  />
                </div>

                <div className="space-y-2 border-t border-white/10 pt-6">
                  <Label className="text-sm font-medium uppercase tracking-wider">Email Address</Label>
                  <Input
                    value={email}
                    readOnly
                    data-testid="input-email"
                    className="bg-background/50 border-white/10 h-11 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Your signup email cannot be changed</p>
                </div>

                <Button 
                  onClick={handleSaveChanges} 
                  disabled={isSaving || showSaved}
                  data-testid="button-save" 
                  className={`w-full md:w-auto shadow-lg shadow-primary/30 transition-all ${showSaved ? 'bg-green-600 hover:bg-green-600' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : showSaved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Extended Profile Section - Athlete Pro */}
          <Card className={`bg-card/80 backdrop-blur-sm border-white/5 ${!isAthletePro ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display font-bold uppercase tracking-wide flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Extended Profile
                </CardTitle>
                {isAthletePro ? (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Pro Feature
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground">
                    Upgrade to Pro
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isAthletePro 
                  ? "Showcase additional details on your shareable HYPE Card" 
                  : "Upgrade to Athlete Pro to unlock extended profile features"}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAthletePro ? (
                <div className="text-center py-6">
                  <Crown className="h-12 w-12 text-yellow-500/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Extended profile is available with Athlete Pro</p>
                  <Link href="/subscription">
                    <Button variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-primary" />
                        Height
                      </Label>
                      <Input
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g., 5'10 or 178cm"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                        data-testid="input-height"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                        <Weight className="h-4 w-4 text-primary" />
                        Weight
                      </Label>
                      <Input
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g., 165 lbs or 75kg"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                        data-testid="input-weight"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium uppercase tracking-wider">Bio / About Me</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell supporters about yourself..."
                      className="bg-background/50 border-white/10 focus:border-primary/50 min-h-[100px]"
                      data-testid="input-bio"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        GPA
                      </Label>
                      <Input
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="e.g., 3.8"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                        data-testid="input-gpa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium uppercase tracking-wider">Graduation Year</Label>
                      <Input
                        type="number"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="e.g., 2026"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                        data-testid="input-graduation-year"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-6">
                    <Label className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Team Awards
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {teamAwards.map((award, index) => (
                        <Badge 
                          key={index} 
                          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 cursor-pointer hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                          onClick={() => handleRemoveAward(index)}
                        >
                          {award} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newAward}
                        onChange={(e) => setNewAward(e.target.value)}
                        placeholder="Add an award (e.g., MVP 2024)"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAward()}
                        data-testid="input-new-award"
                      />
                      <Button onClick={handleAddAward} variant="outline" className="border-white/10 hover:bg-white/5" data-testid="button-add-award">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <Label className="text-sm font-medium uppercase tracking-wider">Social Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-pink-500 flex-shrink-0" />
                        <Input
                          value={socialLinks.instagram || ""}
                          onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                          placeholder="Instagram username"
                          className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                          data-testid="input-instagram"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Twitter className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <Input
                          value={socialLinks.twitter || ""}
                          onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                          placeholder="X/Twitter handle"
                          className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                          data-testid="input-twitter"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <Input
                          value={socialLinks.youtube || ""}
                          onChange={(e) => setSocialLinks({...socialLinks, youtube: e.target.value})}
                          placeholder="YouTube channel"
                          className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                          data-testid="input-youtube"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                        </svg>
                        <Input
                          value={socialLinks.tiktok || ""}
                          onChange={(e) => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                          placeholder="TikTok username"
                          className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                          data-testid="input-tiktok"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveExtendedProfile} 
                    disabled={isSavingExtended || showExtendedSaved}
                    data-testid="button-save-extended"
                    className={`w-full md:w-auto shadow-lg shadow-yellow-500/30 transition-all ${showExtendedSaved ? 'bg-green-600 hover:bg-green-600' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                  >
                    {isSavingExtended ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : showExtendedSaved ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Save Extended Profile
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-display font-bold uppercase tracking-wide flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                My Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {userTeams.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium uppercase tracking-wider">Current Teams</Label>
                  <div className="space-y-2">
                    {userTeams.map((team: any) => (
                      <div key={team.id} className="flex items-center gap-3 p-3 bg-background/50 rounded-lg border border-white/10">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{team.name}</p>
                          <p className="text-xs text-muted-foreground">{team.sport}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-white/10 pt-6">
                <Label htmlFor="team-code" className="text-sm font-medium uppercase tracking-wider">Join Another Team</Label>
                <p className="text-xs text-muted-foreground mb-2">Enter a team code to join an additional team</p>
                <div className="flex gap-2">
                  <Input
                    id="team-code"
                    data-testid="input-team-code"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="bg-background/50 border-white/10 focus:border-primary/50 h-11 font-mono uppercase tracking-widest text-center"
                  />
                  <Button
                    onClick={handleJoinTeam}
                    disabled={isJoiningTeam || teamCode.length < 6}
                    data-testid="button-join-team"
                    className="shadow-lg shadow-primary/30"
                  >
                    {isJoiningTeam ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Join
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">App Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">App Version</span>
                <span data-testid="text-app-version" className="font-mono font-bold text-primary">{appVersion}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
