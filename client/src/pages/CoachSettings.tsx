import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Copy, Check, ArrowLeft, Crown } from "lucide-react";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { HibernateTeamDialog } from "@/components/HibernateTeamDialog";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';
import { useUser } from "@/lib/userContext";
import { useEntitlements } from "@/lib/entitlementsContext";
import { updateUser, updateTeam } from "@/lib/api";
import { TEAM_BADGES } from "@shared/badges";
import { TeamBadge } from "@/components/TeamBadge";

const SPORTS = [
  "Baseball",
  "Basketball",
  "Football",
  "Soccer", 
  "Volleyball",
];

const TEAM_COLORS = [
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Green", hex: "#22C55E" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Indigo", hex: "#6366F1" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Fuchsia", hex: "#D946EF" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Slate", hex: "#64748B" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Black", hex: "#1F2937" },
  { name: "Maroon", hex: "#7F1D1D" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Forest", hex: "#14532D" },
  { name: "Gold", hex: "#CA8A04" },
];

export default function CoachSettings() {
  const { user, setUser, currentTeam, setCurrentTeam } = useUser();
  const { tier, subscription } = useEntitlements();
  const [selectedBadge, setSelectedBadge] = useState(currentTeam?.badgeId || "");
  const [selectedColor, setSelectedColor] = useState(currentTeam?.teamColor || "");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentTeam?.badgeId) {
      setSelectedBadge(currentTeam.badgeId);
    }
    if (currentTeam?.teamColor) {
      setSelectedColor(currentTeam.teamColor);
    }
  }, [currentTeam?.badgeId, currentTeam?.teamColor]);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: ""
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    sport: "",
    season: ""
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || ""
      });
    }
  }, [user]);

  useEffect(() => {
    if (currentTeam) {
      setTeamForm({
        name: currentTeam.name || "",
        sport: currentTeam.sport || "Football",
        season: currentTeam.season || ""
      });
    }
  }, [currentTeam]);

  const teamCode = currentTeam?.code || "";
  const appVersion = "1.0.10";

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const updatedUser = await updateUser(user.id, {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        name: `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`
      });
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTeam = async () => {
    if (!currentTeam) return;
    
    setIsSaving(true);
    try {
      const updatedTeam = await updateTeam(currentTeam.id, {
        name: teamForm.name.trim(),
        sport: teamForm.sport,
        season: teamForm.season.trim()
      });
      setCurrentTeam(updatedTeam);
      toast.success("Team settings saved successfully!");
    } catch (error) {
      toast.error("Failed to update team settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBadge = async () => {
    if (!currentTeam) return;
    setIsSaving(true);
    try {
      const updatedTeam = await updateTeam(currentTeam.id, {
        badgeId: selectedBadge || null,
        teamColor: selectedColor || null
      });
      setCurrentTeam(updatedTeam);
      toast.success("Team badge and color updated successfully!");
    } catch (error) {
      toast.error("Failed to update team badge");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
    toast.success("Team code copied!");
    setTimeout(() => setCopied(false), 2000);
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
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/80 pointer-events-none" />
        
        <div className="relative z-20 space-y-6">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary via-primary/80 to-accent/40 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
            <div className="absolute -right-20 -top-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 p-8 md:p-12">
              <div className="flex items-start justify-between gap-6 mb-4">
                <Link href="/dashboard">
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
                  {currentTeam?.badgeId ? (
                    <TeamBadge badgeId={currentTeam.badgeId} size="lg" className="text-white" />
                  ) : (
                    <Shield className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tighter">Settings</h1>
                  <p className="text-white/80 text-sm md:text-base">Manage your profile and team settings</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card/50 border border-white/10 backdrop-blur-sm p-1">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="badge">Badge</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-sm font-medium uppercase tracking-wider">First Name</Label>
                      <Input
                        id="first-name"
                        data-testid="input-first-name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-sm font-medium uppercase tracking-wider">Last Name</Label>
                      <Input
                        id="last-name"
                        data-testid="input-last-name"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                        className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium uppercase tracking-wider">Email</Label>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      disabled
                      className="bg-background/50 border-white/10 h-11 opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    data-testid="button-save-profile" 
                    className="w-full md:w-auto shadow-lg shadow-primary/30"
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="team-name" className="text-sm font-medium uppercase tracking-wider">Team Name</Label>
                    <Input
                      id="team-name"
                      data-testid="input-team-name"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter team name"
                      className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sport" className="text-sm font-medium uppercase tracking-wider">Sport</Label>
                    <Select value={teamForm.sport} onValueChange={(value) => setTeamForm(prev => ({ ...prev, sport: value }))}>
                      <SelectTrigger data-testid="select-sport" className="bg-background/50 border-white/10 h-11">
                        <SelectValue placeholder="Select a sport" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPORTS.map((sport) => (
                          <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="season-label" className="text-sm font-medium uppercase tracking-wider">Season</Label>
                    <Input
                      id="season-label"
                      data-testid="input-season-label"
                      value={teamForm.season}
                      onChange={(e) => setTeamForm(prev => ({ ...prev, season: e.target.value }))}
                      placeholder="e.g., 2024-2025"
                      className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                    />
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-6">
                    <Label className="text-sm font-medium uppercase tracking-wider">Team Code</Label>
                    <p className="text-xs text-muted-foreground">Share this code with athletes and supporters to join your team</p>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={teamCode}
                          readOnly
                          data-testid="input-team-code"
                          className="bg-background/50 border-white/10 pr-12 h-11 font-mono font-bold"
                        />
                      </div>
                      <Button
                        onClick={copyToClipboard}
                        data-testid="button-copy-code"
                        variant="outline"
                        className="border-white/10 hover:bg-white/5"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveTeam} 
                    disabled={isSaving}
                    data-testid="button-save-team" 
                    className="w-full md:w-auto shadow-lg shadow-primary/30"
                  >
                    {isSaving ? "Saving..." : "Save Team Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="badge" className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Team Badge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Badge Preview */}
                  {selectedBadge && (
                    <div className="flex justify-center mb-4">
                      <div className="p-6 bg-background/50 rounded-xl border border-white/10">
                        <TeamBadge badgeId={selectedBadge} size="xl" teamColor={selectedColor || undefined} />
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">Select your team's badge design</p>
                  
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {TEAM_BADGES.map((badge) => (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge.id)}
                        data-testid={`button-badge-${badge.id}`}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedBadge === badge.id
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-white/10 bg-background/50 hover:border-white/20"
                        }`}
                      >
                        <div 
                          className="w-12 h-14 text-primary"
                          dangerouslySetInnerHTML={{ __html: badge.svg }}
                        />
                        <span className="text-xs font-medium text-center">{badge.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Team Color Picker */}
                  <div className="border-t border-white/10 pt-6">
                    <p className="text-sm text-muted-foreground mb-4">Choose your team color</p>
                    <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                      {TEAM_COLORS.map((color) => (
                        <button
                          key={color.hex}
                          onClick={() => setSelectedColor(color.hex)}
                          data-testid={`button-color-${color.name.toLowerCase()}`}
                          title={color.name}
                          className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                            selectedColor === color.hex
                              ? "border-white ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110"
                              : "border-white/20 hover:border-white/40 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                    {selectedColor && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Selected:</span>
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20" 
                          style={{ backgroundColor: selectedColor }} 
                        />
                        <span className="text-xs font-mono">{selectedColor}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setSelectedColor("")}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleSaveBadge} 
                    disabled={isSaving}
                    data-testid="button-save-badge" 
                    className="w-full md:w-auto shadow-lg shadow-primary/30"
                  >
                    {isSaving ? "Saving..." : "Save Badge & Color"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          <Card className="bg-card/80 backdrop-blur-sm border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className="font-semibold text-primary" data-testid="text-subscription-tier">
                  {tier === 'coach' ? 'Coach Pro' : 'Free'}
                </span>
              </div>
              {subscription && subscription.status === 'active' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Renews</span>
                  <span className="text-sm" data-testid="text-subscription-renewal">
                    {subscription.currentPeriodEnd 
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
              )}
              <Link href="/subscription">
                <Button variant="outline" size="sm" className="w-full mt-2" data-testid="button-manage-subscription">
                  {tier === 'coach' ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Button>
              </Link>
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

          {currentTeam && user && (
            <HibernateTeamDialog
              teamId={currentTeam.id}
              teamName={currentTeam.name}
              isHibernated={!!currentTeam.hibernatedAt}
              hibernationEndsAt={currentTeam.hibernationEndsAt}
              userId={user.id}
            />
          )}

          {user && (
            <DeleteAccountDialog
              userId={user.id}
              onLogout={() => {
                window.location.href = "/auth";
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
