import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Copy, Check, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import generatedImage from '@assets/generated_images/minimal_tech_sports_background.png';

export default function CoachSettings() {
  const [teamName, setTeamName] = useState("Thunderbolts FC");
  const [seasonLabel, setSeasonLabel] = useState("2024-2025");
  const [selectedBadge, setSelectedBadge] = useState("shield");
  const [copied, setCopied] = useState(false);

  const teamCode = "TC-7B4K2M9X";
  const appVersion = "1.0.0";

  const handleSaveChanges = () => {
    toast.success("Team settings saved successfully!");
  };

  const handleSaveBadge = () => {
    toast.success("Team badge updated successfully!");
  };

  const badges = [
    { id: "shield", name: "Shield", icon: "🛡️" },
    { id: "crown", name: "Crown", icon: "👑" },
    { id: "thunder", name: "Thunder", icon: "⚡" },
    { id: "star", name: "Star", icon: "⭐" },
    { id: "fire", name: "Fire", icon: "🔥" },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamCode);
    setCopied(true);
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
                  <Shield className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-tighter">Team Settings</h1>
                  <p className="text-white/80 text-sm md:text-base">Manage your team information and preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 bg-card/50 border border-white/10 backdrop-blur-sm p-1 [&>*]:pl-[18px] [&>*]:pr-[18px]">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="badge">Badge</TabsTrigger>
              <TabsTrigger value="code">Team Code</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Team Name */}
                  <div className="space-y-2">
                    <Label htmlFor="team-name" className="text-sm font-medium uppercase tracking-wider">Team Name</Label>
                    <Input
                      id="team-name"
                      data-testid="input-team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                      className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                    />
                    <p className="text-xs text-muted-foreground">The name of your team displayed across the app</p>
                  </div>

                  {/* Season Label */}
                  <div className="space-y-2">
                    <Label htmlFor="season-label" className="text-sm font-medium uppercase tracking-wider">Season Label</Label>
                    <Input
                      id="season-label"
                      data-testid="input-season-label"
                      value={seasonLabel}
                      onChange={(e) => setSeasonLabel(e.target.value)}
                      placeholder="e.g., 2024-2025"
                      className="bg-background/50 border-white/10 focus:border-primary/50 h-11"
                    />
                    <p className="text-xs text-muted-foreground">Current season year or label</p>
                  </div>

                  <Button onClick={handleSaveChanges} data-testid="button-save" className="w-full md:w-auto shadow-lg shadow-primary/30">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badge Tab */}
            <TabsContent value="badge" className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Team Badge</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">Select your team's badge icon</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {badges.map((badge) => (
                      <button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge.id)}
                        data-testid={`button-badge-${badge.id}`}
                        className={`p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                          selectedBadge === badge.id
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-white/10 bg-background/50 hover:border-white/20"
                        }`}
                      >
                        <span className="text-4xl">{badge.icon}</span>
                        <span className="text-xs font-medium text-center">{badge.name}</span>
                      </button>
                    ))}
                  </div>

                  <Button onClick={handleSaveBadge} data-testid="button-save-badge" className="w-full md:w-auto shadow-lg shadow-primary/30">
                    Save Badge
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Code Tab */}
            <TabsContent value="code" className="space-y-6">
              <Card className="bg-card/80 backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-display font-bold uppercase tracking-wide">Team Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">Share this code with athletes and supporters to join your team</p>
                  
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

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-200">
                      💡 This code was generated when you created your team and is unique to your organization. Keep it safe and only share with authorized members.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
