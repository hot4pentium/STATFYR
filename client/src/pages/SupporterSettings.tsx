import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Upload, ArrowLeft, LogOut, Settings, Loader2, Check, UserPlus, Trash2, Camera, Pencil } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getManagedAthletes, createManagedAthlete, deleteManagedAthlete, type ManagedAthlete } from "@/lib/api";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { isNative } from "@/lib/capacitor";

export default function SupporterSettings() {
  const [, setLocation] = useLocation();
  const { user: contextUser, updateUser, currentTeam } = useUser();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const [athleteTeamCode, setAthleteTeamCode] = useState("");
  const [athleteFirstName, setAthleteFirstName] = useState("");
  const [athleteLastName, setAthleteLastName] = useState("");
  const [athleteSport, setAthleteSport] = useState("");
  const [athletePosition, setAthletePosition] = useState("");
  const [athleteNumber, setAthleteNumber] = useState("");
  const [isIndependentAthleteMode, setIsIndependentAthleteMode] = useState(false);
  const [isAddingAthlete, setIsAddingAthlete] = useState(false);
  const [uploadingAthleteId, setUploadingAthleteId] = useState<string | null>(null);
  const athleteAvatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedAthleteForUpload, setSelectedAthleteForUpload] = useState<ManagedAthlete | null>(null);
  
  const [editingAthlete, setEditingAthlete] = useState<ManagedAthlete | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editHandedness, setEditHandedness] = useState<string>("");
  const [editFootedness, setEditFootedness] = useState<string>("");
  const [editGpa, setEditGpa] = useState("");
  const [editGraduationYear, setEditGraduationYear] = useState("");
  const [editFavoritePlayer, setEditFavoritePlayer] = useState("");
  const [editFavoriteTeam, setEditFavoriteTeam] = useState("");

  // Format height with feet and inches symbols (e.g., 5'10")
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

  const handleEditHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length <= 3) {
      setEditHeight(formatHeight(value));
    }
  };

  const handleEditWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/[^0-9]/g, '');
    if (digits) {
      setEditWeight(digits + " lbs");
    } else {
      setEditWeight('');
    }
  };

  const appVersion = "1.0.10";

  const handleProfilePhotoSave = async (dataUrl: string) => {
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

  const { isCapturing: isCapturingProfile, handleNativePhoto: handleProfileNativePhoto, handleFileInput: handleProfileFileInput } = useNativeCamera({
    onPhotoTaken: handleProfilePhotoSave,
  });

  const handleEditPhotoTaken = (dataUrl: string) => {
    setEditAvatarPreview(dataUrl);
  };

  const { isCapturing: isCapturingEdit, handleNativePhoto: handleEditNativePhoto, handleFileInput: handleEditFileInput } = useNativeCamera({
    onPhotoTaken: handleEditPhotoTaken,
  });

  const { data: managedAthletes = [], refetch: refetchManagedAthletes } = useQuery({
    queryKey: ["/api/users", contextUser?.id, "managed-athletes"],
    queryFn: () => contextUser ? getManagedAthletes(contextUser.id) : Promise.resolve([]),
    enabled: !!contextUser,
  });

  useEffect(() => {
    if (contextUser) {
      setFirstName(contextUser.firstName || "");
      setLastName(contextUser.lastName || "");
      setEmail(contextUser.email || "");
      setAvatarPreview(contextUser.avatar || null);
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

  const handleAddAthlete = async () => {
    if (!contextUser) {
      toast.error("User not found. Please log in again.");
      return;
    }

    if (!athleteFirstName.trim() || !athleteLastName.trim()) {
      toast.error("Please fill in first name and last name.");
      return;
    }

    if (!isIndependentAthleteMode && !athleteTeamCode.trim()) {
      toast.error("Please enter a team code or switch to independent mode.");
      return;
    }

    if (isIndependentAthleteMode && !athleteSport.trim()) {
      toast.error("Please select a sport for independent athletes.");
      return;
    }

    setIsAddingAthlete(true);
    try {
      const result = await createManagedAthlete(contextUser.id, {
        teamCode: isIndependentAthleteMode ? undefined : athleteTeamCode.trim().toUpperCase(),
        firstName: athleteFirstName.trim(),
        lastName: athleteLastName.trim(),
        sport: isIndependentAthleteMode ? athleteSport.trim() : undefined,
        position: isIndependentAthleteMode ? athletePosition.trim() : undefined,
        number: isIndependentAthleteMode ? athleteNumber.trim() : undefined,
      });
      
      const athleteName = result.athlete?.name || `${athleteFirstName} ${athleteLastName}`;
      if (isIndependentAthleteMode) {
        toast.success(`${athleteName} has been added as an independent athlete!`);
      } else {
        toast.success(`${athleteName} has been added to ${result.team?.name || 'the team'}!`);
      }
      setAthleteTeamCode("");
      setAthleteFirstName("");
      setAthleteLastName("");
      setAthleteSport("");
      setAthletePosition("");
      setAthleteNumber("");
      refetchManagedAthletes();
    } catch (error: any) {
      console.error("Failed to add athlete:", error);
      if (error.limitReached && error.requiresUpgrade) {
        toast.error("You've reached the limit of 1 managed athlete. Upgrade to Supporter Pro for unlimited athletes!", {
          action: {
            label: "Upgrade",
            onClick: () => setLocation("/subscription"),
          },
          duration: 8000,
        });
      } else {
        toast.error(error.message || "Failed to add athlete. Please try again.");
      }
    } finally {
      setIsAddingAthlete(false);
    }
  };

  const handleDeleteManagedAthlete = async (managed: ManagedAthlete) => {
    try {
      await deleteManagedAthlete(managed.id);
      const athleteName = managed.athlete?.name || managed.athleteName || "Athlete";
      toast.success(`${athleteName} has been removed.`);
      refetchManagedAthletes();
    } catch (error) {
      console.error("Failed to remove athlete:", error);
      toast.error("Failed to remove athlete.");
    }
  };

  const handleAthleteAvatarClick = (managed: ManagedAthlete) => {
    setSelectedAthleteForUpload(managed);
    athleteAvatarInputRef.current?.click();
  };

  const handleAthleteAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAthleteForUpload) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const isLinkedAthlete = !!selectedAthleteForUpload.athleteId;
    const athleteId = selectedAthleteForUpload.athleteId || selectedAthleteForUpload.id;
    const athleteName = selectedAthleteForUpload.athlete?.name || selectedAthleteForUpload.athleteName || "Athlete";
    
    setUploadingAthleteId(athleteId);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Avatar = event.target?.result as string;
      try {
        if (isLinkedAthlete) {
          const response = await fetch(`/api/users/${selectedAthleteForUpload.athleteId}?requesterId=${contextUser?.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: base64Avatar }),
          });
          if (!response.ok) throw new Error("Failed to update avatar");
        } else {
          const response = await fetch(`/api/supporter/managed-athletes/${selectedAthleteForUpload.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-user-id": contextUser?.id || "" },
            body: JSON.stringify({ profileImageUrl: base64Avatar }),
          });
          if (!response.ok) throw new Error("Failed to update avatar");
        }

        toast.success(`${athleteName}'s photo updated!`);
        refetchManagedAthletes();
      } catch (error) {
        console.error("Failed to update athlete avatar:", error);
        toast.error("Failed to update photo. Please try again.");
      } finally {
        setUploadingAthleteId(null);
        setSelectedAthleteForUpload(null);
        if (athleteAvatarInputRef.current) {
          athleteAvatarInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
      setUploadingAthleteId(null);
      setSelectedAthleteForUpload(null);
      toast.error("Failed to load image");
    };
    reader.readAsDataURL(file);
  };

  const handleEditAthleteClick = (managed: ManagedAthlete) => {
    setEditingAthlete(managed);
    if (managed.athlete) {
      setEditFirstName(managed.athlete.firstName || "");
      setEditLastName(managed.athlete.lastName || "");
      setEditAvatarPreview(managed.athlete.avatar || null);
      setEditHeight((managed.athlete as any).height || "");
      setEditWeight((managed.athlete as any).weight || "");
      setEditHandedness((managed.athlete as any).handedness || "");
      setEditFootedness((managed.athlete as any).footedness || "");
      setEditGpa((managed.athlete as any).gpa || "");
      setEditGraduationYear((managed.athlete as any).graduationYear?.toString() || "");
      setEditFavoritePlayer((managed.athlete as any).favoritePlayer || "");
      setEditFavoriteTeam((managed.athlete as any).favoriteTeam || "");
    } else {
      const nameParts = (managed.athleteName || "").split(" ");
      setEditFirstName(nameParts[0] || "");
      setEditLastName(nameParts.slice(1).join(" ") || "");
      setEditAvatarPreview(managed.profileImageUrl || null);
      setEditHeight((managed as any).height || "");
      setEditWeight((managed as any).weight || "");
      setEditHandedness((managed as any).handedness || "");
      setEditFootedness((managed as any).footedness || "");
      setEditGpa((managed as any).gpa || "");
      setEditGraduationYear((managed as any).graduationYear?.toString() || "");
      setEditFavoritePlayer((managed as any).favoritePlayer || "");
      setEditFavoriteTeam((managed as any).favoriteTeam || "");
    }
  };

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditAvatarPreview(event.target?.result as string);
      };
      reader.onerror = () => {
        toast.error("Failed to load image");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAthleteEdit = async () => {
    if (!editingAthlete || !contextUser) return;
    
    if (!editFirstName.trim() || !editLastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    const isLinkedAthlete = !!editingAthlete.athleteId;

    setIsSavingEdit(true);
    try {
      if (isLinkedAthlete) {
        const response = await fetch(`/api/users/${editingAthlete.athleteId}?requesterId=${contextUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: editFirstName.trim(),
            lastName: editLastName.trim(),
            name: `${editFirstName.trim()} ${editLastName.trim()}`,
            avatar: editAvatarPreview,
            height: editHeight.trim() || null,
            weight: editWeight.trim() || null,
            handedness: editHandedness || null,
            footedness: editFootedness || null,
            gpa: editGpa.trim() || null,
            graduationYear: editGraduationYear ? parseInt(editGraduationYear) : null,
            favoritePlayer: editFavoritePlayer.trim() || null,
            favoriteTeam: editFavoriteTeam.trim() || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 403) {
            throw new Error(errorData.error || "You don't have permission to edit this athlete");
          }
          throw new Error(errorData.error || "Failed to update athlete");
        }
      } else {
        const response = await fetch(`/api/supporter/managed-athletes/${editingAthlete.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-user-id": contextUser.id },
          body: JSON.stringify({
            athleteName: `${editFirstName.trim()} ${editLastName.trim()}`,
            profileImageUrl: editAvatarPreview,
            height: editHeight.trim() || null,
            weight: editWeight.trim() || null,
            handedness: editHandedness || null,
            footedness: editFootedness || null,
            gpa: editGpa.trim() || null,
            graduationYear: editGraduationYear ? parseInt(editGraduationYear) : null,
            favoritePlayer: editFavoritePlayer.trim() || null,
            favoriteTeam: editFavoriteTeam.trim() || null,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update athlete");
        }
      }

      toast.success(`${editFirstName.trim()} ${editLastName.trim()}'s profile updated!`);
      setEditingAthlete(null);
      refetchManagedAthletes();
    } catch (error: any) {
      console.error("Failed to update athlete:", error);
      toast.error(error.message || "Failed to update athlete. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-full px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/supporter/dashboard">
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
            <Link href="/supporter/settings">
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
                          disabled={isUploadingAvatar || isCapturingProfile}
                          variant="outline"
                          className="border-white/10 hover:bg-white/5"
                          onClick={handleProfileNativePhoto}
                          data-testid="button-take-photo"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          {isCapturingProfile ? "Capturing..." : "Take Photo"}
                        </Button>
                      )}
                      <div className="relative">
                        <input
                          id="avatar-upload"
                          data-testid="input-avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleProfileFileInput(e)}
                          disabled={isUploadingAvatar || isCapturingProfile}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Button
                          disabled={isUploadingAvatar || isCapturingProfile}
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

            {/* Join a Team - Only show for independent supporters */}
            {!currentTeam && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Join a Team
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Connect with your athlete's coach to see team events, roster, and playbook</p>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setLocation("/supporter/onboarding?step=team-code")}
                    className="w-full"
                    data-testid="button-join-team-settings"
                  >
                    I Have a Team Code
                  </Button>
                </CardContent>
              </Card>
            )}

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

            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold uppercase tracking-wide flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Manage Athletes
                </CardTitle>
                <p className="text-sm text-muted-foreground">Add and track athletes who can't manage their own profile</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {managedAthletes.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wider">Your Managed Athletes</h4>
                    <input
                      type="file"
                      ref={athleteAvatarInputRef}
                      accept="image/*"
                      onChange={handleAthleteAvatarChange}
                      className="hidden"
                      data-testid="input-athlete-avatar-upload"
                    />
                    {managedAthletes.map((managed) => {
                      const athleteName = managed.athlete?.name || managed.athleteName || "Athlete";
                      const athleteAvatar = managed.athlete?.avatar || managed.profileImageUrl;
                      const athletePosition = managed.athlete?.position || managed.position;
                      const athleteNumber = managed.athlete?.number || managed.number;
                      
                      return (
                        <div 
                          key={managed.id} 
                          className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/10 cursor-pointer hover:bg-background/50 transition-colors"
                          data-testid={`managed-athlete-${managed.id}`}
                          onClick={() => handleEditAthleteClick(managed)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                              {athleteAvatar ? (
                                <img 
                                  src={athleteAvatar} 
                                  alt={athleteName} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{athleteName}</p>
                              <p className="text-xs text-muted-foreground">
                                {athletePosition || "Athlete"}
                                {athleteNumber && ` • #${athleteNumber}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleEditAthleteClick(managed); }}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              data-testid={`button-edit-athlete-${managed.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleDeleteManagedAthlete(managed); }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              data-testid={`button-remove-athlete-${managed.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-4 p-4 bg-background/30 rounded-lg border border-white/10">
                  <h4 className="text-sm font-medium uppercase tracking-wider">Add New Athlete</h4>
                  
                  <div className="flex gap-2 p-1 bg-background/50 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsIndependentAthleteMode(false)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        !isIndependentAthleteMode 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="button-team-athlete-mode"
                    >
                      Join Team
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsIndependentAthleteMode(true)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        isIndependentAthleteMode 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid="button-independent-athlete-mode"
                    >
                      Independent
                    </button>
                  </div>

                  {!isIndependentAthleteMode && (
                    <div className="space-y-2">
                      <Label htmlFor="athlete-team-code" className="text-sm font-medium">Team Code</Label>
                      <Input
                        id="athlete-team-code"
                        data-testid="input-athlete-team-code"
                        value={athleteTeamCode}
                        onChange={(e) => setAthleteTeamCode(e.target.value.toUpperCase())}
                        placeholder="Enter 6-character team code"
                        maxLength={6}
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11 uppercase"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="athlete-first-name" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="athlete-first-name"
                        data-testid="input-athlete-first-name"
                        value={athleteFirstName}
                        onChange={(e) => setAthleteFirstName(e.target.value)}
                        placeholder="First name"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="athlete-last-name" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="athlete-last-name"
                        data-testid="input-athlete-last-name"
                        value={athleteLastName}
                        onChange={(e) => setAthleteLastName(e.target.value)}
                        placeholder="Last name"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                  </div>

                  {isIndependentAthleteMode && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="athlete-sport" className="text-sm font-medium">Sport</Label>
                        <select
                          id="athlete-sport"
                          data-testid="select-athlete-sport"
                          value={athleteSport}
                          onChange={(e) => setAthleteSport(e.target.value)}
                          className="w-full bg-background/50 border border-white/10 focus:border-primary/50 h-11 rounded-md px-3 text-sm"
                        >
                          <option value="">Select a sport</option>
                          <option value="Baseball">Baseball</option>
                          <option value="Basketball">Basketball</option>
                          <option value="Football">Football</option>
                          <option value="Soccer">Soccer</option>
                          <option value="Volleyball">Volleyball</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="athlete-position" className="text-sm font-medium">Position (Optional)</Label>
                          <Input
                            id="athlete-position"
                            data-testid="input-athlete-position"
                            value={athletePosition}
                            onChange={(e) => setAthletePosition(e.target.value)}
                            placeholder="e.g. Forward"
                            className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="athlete-number" className="text-sm font-medium">Number (Optional)</Label>
                          <Input
                            id="athlete-number"
                            data-testid="input-athlete-number"
                            value={athleteNumber}
                            onChange={(e) => setAthleteNumber(e.target.value)}
                            placeholder="e.g. 10"
                            className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Button 
                    onClick={handleAddAthlete}
                    disabled={isAddingAthlete || !athleteFirstName || !athleteLastName || (!isIndependentAthleteMode && !athleteTeamCode) || (isIndependentAthleteMode && !athleteSport)}
                    data-testid="button-add-athlete"
                    className="w-full"
                  >
                    {isAddingAthlete ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {isIndependentAthleteMode ? "Add Independent Athlete" : "Add Athlete to Team"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

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

      <Dialog open={!!editingAthlete} onOpenChange={(open) => !open && setEditingAthlete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-bold uppercase tracking-wide">
              Edit Athlete Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer group"
                onClick={() => editAvatarInputRef.current?.click()}
              >
                {editAvatarPreview ? (
                  <img 
                    src={editAvatarPreview} 
                    alt="Athlete avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={editAvatarInputRef}
                accept="image/*"
                onChange={(e) => handleEditFileInput(e)}
                className="hidden"
                data-testid="input-edit-athlete-avatar"
              />
              <div className="flex gap-2">
                {isNative && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditNativePhoto}
                    disabled={isCapturingEdit}
                    data-testid="button-take-athlete-photo"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {isCapturingEdit ? "Capturing..." : "Take Photo"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editAvatarInputRef.current?.click()}
                  disabled={isCapturingEdit}
                  data-testid="button-change-athlete-photo"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Photo
                </Button>
              </div>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name" className="text-sm font-medium">First Name</Label>
                <Input
                  id="edit-first-name"
                  data-testid="input-edit-first-name"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                  className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="edit-last-name"
                  data-testid="input-edit-last-name"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                  className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                />
              </div>
              
              {/* Show extended profile for all managed athletes */}
              {editingAthlete && (
                <>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Extended Profile</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-height" className="text-sm font-medium">Height</Label>
                      <Input
                        id="edit-height"
                        data-testid="input-edit-height"
                        value={editHeight}
                        onChange={handleEditHeightChange}
                        placeholder="5'10&quot;"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-weight" className="text-sm font-medium">Weight</Label>
                      <Input
                        id="edit-weight"
                        data-testid="input-edit-weight"
                        value={editWeight}
                        onChange={handleEditWeightChange}
                        placeholder="165 lbs"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Handedness</Label>
                    <div className="flex gap-2">
                      {["left", "right", "ambidextrous"].map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={editHandedness === option ? "default" : "outline"}
                          size="sm"
                          className="flex-1 capitalize"
                          onClick={() => setEditHandedness(editHandedness === option ? "" : option)}
                          data-testid={`button-handedness-${option}`}
                        >
                          {option === "ambidextrous" ? "Both" : option}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Footedness</Label>
                    <div className="flex gap-2">
                      {["left", "right", "both"].map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={editFootedness === option ? "default" : "outline"}
                          size="sm"
                          className="flex-1 capitalize"
                          onClick={() => setEditFootedness(editFootedness === option ? "" : option)}
                          data-testid={`button-footedness-${option}`}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-gpa" className="text-sm font-medium">GPA</Label>
                      <Input
                        id="edit-gpa"
                        data-testid="input-edit-gpa"
                        value={editGpa}
                        onChange={(e) => setEditGpa(e.target.value)}
                        placeholder="e.g., 3.5"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-grad-year" className="text-sm font-medium">Grad Year</Label>
                      <Input
                        id="edit-grad-year"
                        data-testid="input-edit-grad-year"
                        type="number"
                        value={editGraduationYear}
                        onChange={(e) => setEditGraduationYear(e.target.value)}
                        placeholder="e.g., 2026"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-favorite-player" className="text-sm font-medium">Favorite Player</Label>
                      <Input
                        id="edit-favorite-player"
                        data-testid="input-edit-favorite-player"
                        value={editFavoritePlayer}
                        onChange={(e) => setEditFavoritePlayer(e.target.value)}
                        placeholder="e.g., LeBron James"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-favorite-team" className="text-sm font-medium">Favorite Team</Label>
                      <Input
                        id="edit-favorite-team"
                        data-testid="input-edit-favorite-team"
                        value={editFavoriteTeam}
                        onChange={(e) => setEditFavoriteTeam(e.target.value)}
                        placeholder="e.g., Lakers"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingAthlete(null)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveAthleteEdit}
                disabled={isSavingEdit || !editFirstName.trim() || !editLastName.trim()}
                data-testid="button-save-athlete-edit"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
