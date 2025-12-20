import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Upload, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';

export default function AthleteSettings() {
  const [firstName, setFirstName] = useState("Marcus");
  const [lastName, setLastName] = useState("Rashford");
  const [avatarPreview, setAvatarPreview] = useState("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const email = "marcus.rashford@thunderbolts.com";
  const appVersion = "1.0.0";

  const handleSaveChanges = () => {
    toast.success("Profile settings saved successfully!");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      // Simulate upload delay
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarPreview(event.target?.result as string);
          setIsUploadingAvatar(false);
          toast.success("Avatar updated successfully!");
        };
        reader.readAsDataURL(file);
      }, 500);
    }
  };

  return (
    <Layout>
      <div 
        className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10"
        style={{
          backgroundImage: `url(${generatedImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 space-y-6">
          {/* Header */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="flex items-start justify-between gap-6 mb-4">
                <Link href="/athlete/dashboard">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/20 hover:bg-white/10 text-white"
                    data-testid="button-back-to-dashboard"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-start gap-6">
                <div className="h-16 w-16 md:h-20 md:w-20 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl">
                  <User className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tighter">Profile Settings</h1>
                  <p className="text-white/80 text-sm md:text-base">Manage your profile and preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* Avatar Section */}
            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Preview */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-accent shadow-lg flex-shrink-0">
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
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

            {/* Personal Information */}
            <Card className="bg-card/80 backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* First Name */}
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

                {/* Last Name */}
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

                {/* Email */}
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

                <Button onClick={handleSaveChanges} data-testid="button-save" className="w-full md:w-auto shadow-lg shadow-primary/30">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* App Info */}
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
    </Layout>
  );
}
