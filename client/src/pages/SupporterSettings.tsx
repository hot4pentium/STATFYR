import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Upload, ArrowLeft, LogOut, Settings, Loader2, Check, UserPlus, Trash2, Camera, Pencil } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getManagedAthletes, createManagedAthlete, deleteManagedAthlete, type ManagedAthlete } from "@/lib/api";

export default function SupporterSettings() {
  const { user: contextUser, updateUser } = useUser();
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

  const appVersion = "1.0.1";

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

    if (!athleteTeamCode.trim() || !athleteFirstName.trim() || !athleteLastName.trim()) {
      toast.error("Please fill in all fields: team code, first name, and last name.");
      return;
    }

    setIsAddingAthlete(true);
    try {
      const result = await createManagedAthlete(contextUser.id, {
        teamCode: athleteTeamCode.trim().toUpperCase(),
        firstName: athleteFirstName.trim(),
        lastName: athleteLastName.trim(),
      });
      
      toast.success(`${result.athlete.name} has been added to ${result.team.name}!`);
      setAthleteTeamCode("");
      setAthleteFirstName("");
      setAthleteLastName("");
      refetchManagedAthletes();
    } catch (error: any) {
      console.error("Failed to add athlete:", error);
      toast.error(error.message || "Failed to add athlete. Please check the team code and try again.");
    } finally {
      setIsAddingAthlete(false);
    }
  };

  const handleDeleteManagedAthlete = async (managed: ManagedAthlete) => {
    try {
      await deleteManagedAthlete(managed.id);
      toast.success(`${managed.athlete.name} has been removed.`);
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

    setUploadingAthleteId(selectedAthleteForUpload.athlete.id);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Avatar = event.target?.result as string;
      try {
        const response = await fetch(`/api/users/${selectedAthleteForUpload.athlete.id}?requesterId=${contextUser?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64Avatar }),
        });

        if (!response.ok) {
          throw new Error("Failed to update avatar");
        }

        toast.success(`${selectedAthleteForUpload.athlete.name}'s photo updated!`);
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
    setEditFirstName(managed.athlete.firstName || "");
    setEditLastName(managed.athlete.lastName || "");
    setEditAvatarPreview(managed.athlete.avatar || null);
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

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/users/${editingAthlete.athlete.id}?requesterId=${contextUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          name: `${editFirstName.trim()} ${editLastName.trim()}`,
          avatar: editAvatarPreview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error(errorData.error || "You don't have permission to edit this athlete");
        }
        throw new Error(errorData.error || "Failed to update athlete");
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
                    <div className="relative">
                      <input
                        id="avatar-upload"
                        data-testid="input-avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button
                        disabled={isUploadingAvatar}
                        variant="outline"
                        className="w-full md:w-auto border-white/10 hover:bg-white/5"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                        data-testid="button-upload-avatar"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploadingAvatar ? "Uploading..." : "Choose Photo"}
                      </Button>
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
                    {managedAthletes.map((managed) => (
                      <div 
                        key={managed.id} 
                        className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-white/10 cursor-pointer hover:bg-background/50 transition-colors"
                        data-testid={`managed-athlete-${managed.id}`}
                        onClick={() => handleEditAthleteClick(managed)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            {managed.athlete.avatar ? (
                              <img 
                                src={managed.athlete.avatar} 
                                alt={managed.athlete.name || ""} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{managed.athlete.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {managed.athlete.position || "Athlete"}
                              {managed.athlete.number && ` • #${managed.athlete.number}`}
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
                    ))}
                  </div>
                )}

                <div className="space-y-4 p-4 bg-background/30 rounded-lg border border-white/10">
                  <h4 className="text-sm font-medium uppercase tracking-wider">Add New Athlete</h4>
                  
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

                  <Button 
                    onClick={handleAddAthlete}
                    disabled={isAddingAthlete || !athleteTeamCode || !athleteFirstName || !athleteLastName}
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
                        Add Athlete to Team
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
                onChange={handleEditAvatarChange}
                className="hidden"
                data-testid="input-edit-athlete-avatar"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => editAvatarInputRef.current?.click()}
                data-testid="button-change-athlete-photo"
              >
                <Upload className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>

            <div className="space-y-4">
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
