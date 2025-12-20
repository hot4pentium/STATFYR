import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Upload, ArrowLeft, LogOut, Settings, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";

export default function AthleteSettings() {
  const { user: contextUser, setUser } = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const appVersion = "1.0.0";

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
      const response = await fetch(`/api/users/${contextUser.id}`, {
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
      setUser({ ...contextUser, ...updatedUser });

      toast.success("Profile settings saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
        setIsUploadingAvatar(false);
        toast.success("Avatar updated! Click Save to keep changes.");
      };
      reader.onerror = () => {
        setIsUploadingAvatar(false);
        toast.error("Failed to load image");
      };
      reader.readAsDataURL(file);
    }
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
                  disabled={isSaving}
                  data-testid="button-save" 
                  className="w-full md:w-auto shadow-lg shadow-primary/30"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
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
    </div>
  );
}
