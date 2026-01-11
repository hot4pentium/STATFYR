import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Users, Shield, Eye, Trash2, ArrowLeft, Loader2, ChevronRight, CreditCard, Crown, MessageSquare, Send, Bell } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import {
  adminSearchUsers,
  adminGetUserWithTeams,
  adminUpdateTeamMember,
  adminRemoveTeamMember,
  adminDeleteTeam,
  adminStartImpersonation,
  adminGetAllTeams,
  adminGetAllSubscriptions,
  adminUpdateUserSubscription,
  adminSendBroadcast,
  adminSendSupportMessage,
  type AdminUser,
  type AdminTeamMember,
  type Team,
  type UserWithSubscription,
} from "@/lib/api";

interface TeamWithMembers extends Team {
  members: Array<{
    id: string;
    userId: string;
    teamId: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      role: string;
    };
  }>;
  memberCount: number;
}

export default function SuperAdminPanel() {
  const { user, setUser, setImpersonating, setOriginalAdmin } = useUser();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userTeams, setUserTeams] = useState<AdminTeamMember[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [editingMember, setEditingMember] = useState<{ memberId: string; teamId: string; userId: string; role: string; userName: string; teamName: string } | null>(null);
  const [editRole, setEditRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [editingSubscription, setEditingSubscription] = useState<UserWithSubscription | null>(null);
  const [newTier, setNewTier] = useState("");
  
  // Messaging state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [supportUserId, setSupportUserId] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  const { data: teams = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useQuery({
    queryKey: ["admin-teams", user?.id],
    queryFn: () => adminGetAllTeams(user!.id),
    enabled: !!user?.isSuperAdmin,
  });

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions, refetch: refetchSubscriptions } = useQuery({
    queryKey: ["admin-subscriptions", user?.id],
    queryFn: () => adminGetAllSubscriptions(user!.id),
    enabled: !!user?.isSuperAdmin,
  });

  if (!user?.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have super admin privileges.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error("Search query must be at least 2 characters");
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await adminSearchUsers(searchQuery, user.id);
      setSearchResults(results);
      setSelectedUser(null);
      setUserTeams([]);
    } catch (error: any) {
      toast.error(error.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (selectedUser: AdminUser) => {
    setIsLoadingUser(true);
    try {
      const result = await adminGetUserWithTeams(selectedUser.id, user.id);
      setSelectedUser(result.user);
      setUserTeams(result.teams);
    } catch (error: any) {
      toast.error(error.message || "Failed to load user details");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleImpersonate = async (targetUser: AdminUser) => {
    try {
      const { targetUser: impersonatedUser } = await adminStartImpersonation(targetUser.id, user.id);
      setOriginalAdmin(user);
      setUser(impersonatedUser as any);
      setImpersonating(true);
      toast.success(`Now viewing as ${impersonatedUser.firstName} ${impersonatedUser.lastName}`);
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Failed to start impersonation");
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    
    setIsSaving(true);
    try {
      await adminUpdateTeamMember(editingMember.memberId, { role: editRole }, user.id);
      toast.success("Member role updated");
      setEditingMember(null);
      refetchTeams();
      if (selectedUser) {
        const result = await adminGetUserWithTeams(selectedUser.id, user.id);
        setUserTeams(result.teams);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string, userName: string, teamName: string) => {
    if (!confirm(`Remove ${userName} from ${teamName}?`)) return;
    
    try {
      await adminRemoveTeamMember(memberId, user.id);
      toast.success("Member removed from team");
      refetchTeams();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const handleDeleteTeam = async (team: TeamWithMembers) => {
    if (!confirm(`Are you sure you want to delete the team "${team.name}" with ${team.memberCount} members? This will permanently remove all team data including events, highlights, stats, and members. This action cannot be undone.`)) return;
    
    try {
      await adminDeleteTeam(team.id, user.id);
      toast.success(`Team "${team.name}" deleted successfully`);
      setSelectedTeam(null);
      refetchTeams();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete team");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "coach": return "bg-blue-500";
      case "staff": return "bg-purple-500";
      case "athlete": return "bg-green-500";
      case "supporter": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "coach": return "bg-orange-500";
      case "athlete": return "bg-blue-500";
      case "supporter": return "bg-purple-500";
      case "free": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "coach": return "Coach Pro";
      case "athlete": return "Athlete Pro";
      case "supporter": return "Supporter Pro";
      case "free": return "Free";
      default: return tier;
    }
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription || !newTier) return;
    
    setIsSaving(true);
    try {
      await adminUpdateUserSubscription(editingSubscription.user.id, { tier: newTier }, user.id);
      toast.success(`Subscription updated to ${getTierLabel(newTier)}`);
      setEditingSubscription(null);
      setNewTier("");
      refetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub: UserWithSubscription) => {
    const searchLower = subscriptionSearch.toLowerCase();
    const tier = sub.subscription?.tier || 'free';
    return (
      sub.user.firstName?.toLowerCase().includes(searchLower) ||
      sub.user.lastName?.toLowerCase().includes(searchLower) ||
      sub.user.email?.toLowerCase().includes(searchLower) ||
      tier.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Super Admin Panel</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="teams" data-testid="tab-teams">
              <Users className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Search className="h-4 w-4 mr-2" />
              User Search
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="messaging" data-testid="tab-messaging">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messaging
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Teams ({(teams as TeamWithMembers[]).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingTeams ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {(teams as TeamWithMembers[]).map((team) => (
                        <div
                          key={team.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedTeam?.id === team.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedTeam(team)}
                          data-testid={`team-row-${team.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{team.name}</p>
                              <p className="text-sm text-muted-foreground">{team.sport}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{team.memberCount} members</Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTeam(team);
                                }}
                                data-testid={`button-delete-team-${team.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(teams as TeamWithMembers[]).length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No teams found</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedTeam ? `${selectedTeam.name} Members` : "Team Members"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTeam ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {selectedTeam.members.map((member) => (
                        <div
                          key={member.id}
                          className="p-3 rounded-lg border bg-muted/30"
                          data-testid={`member-row-${member.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              {member.user.avatar ? (
                                <img src={member.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member.user.firstName} {member.user.lastName}</p>
                              <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                            </div>
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleImpersonate(member.user as AdminUser)}
                              data-testid={`button-impersonate-${member.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View As
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMember({
                                  memberId: member.id,
                                  teamId: member.teamId,
                                  userId: member.userId,
                                  role: member.role,
                                  userName: `${member.user.firstName} ${member.user.lastName}`,
                                  teamName: selectedTeam.name,
                                });
                                setEditRole(member.role);
                              }}
                              data-testid={`button-edit-${member.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveTeamMember(
                                member.id, 
                                `${member.user.firstName} ${member.user.lastName}`,
                                selectedTeam.name
                              )}
                              data-testid={`button-remove-${member.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {selectedTeam.members.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No members in this team</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a team to view members</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    User Search
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      data-testid="input-admin-search"
                    />
                    <Button onClick={handleSearch} disabled={isSearching} data-testid="button-admin-search">
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUser?.id === result.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                        }`}
                        onClick={() => handleSelectUser(result)}
                        data-testid={`user-result-${result.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {result.avatar ? (
                              <img src={result.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.firstName} {result.lastName}</p>
                            <p className="text-sm text-muted-foreground truncate">{result.email}</p>
                          </div>
                          <Badge className={getRoleBadgeColor(result.role)}>
                            {result.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && searchQuery && !isSearching && (
                      <p className="text-center text-muted-foreground py-4">No users found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingUser ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedUser ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                          {selectedUser.avatar ? (
                            <img src={selectedUser.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                          <p className="text-muted-foreground">{selectedUser.email}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getRoleBadgeColor(selectedUser.role)}>{selectedUser.role}</Badge>
                            {selectedUser.isSuperAdmin && <Badge className="bg-red-500">Super Admin</Badge>}
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleImpersonate(selectedUser)}
                        data-testid="button-impersonate"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View as This User
                      </Button>

                      <Separator />

                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Team Memberships ({userTeams.length})
                        </h4>
                        <div className="space-y-2">
                          {userTeams.map((membership) => (
                            <div
                              key={membership.id}
                              className="p-3 rounded-lg border bg-muted/50"
                              data-testid={`membership-${membership.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{membership.team.name}</p>
                                  <p className="text-sm text-muted-foreground">{membership.team.sport}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getRoleBadgeColor(membership.role)}>
                                    {membership.role}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingMember({
                                        memberId: membership.id,
                                        teamId: membership.team.id,
                                        userId: selectedUser.id,
                                        role: membership.role,
                                        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
                                        teamName: membership.team.name,
                                      });
                                      setEditRole(membership.role);
                                    }}
                                    data-testid={`button-edit-member-${membership.id}`}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveTeamMember(
                                      membership.id,
                                      `${selectedUser.firstName} ${selectedUser.lastName}`,
                                      membership.team.name
                                    )}
                                    data-testid={`button-remove-member-${membership.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {userTeams.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">No team memberships</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a user to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  User Subscriptions ({subscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, email, or tier..."
                    value={subscriptionSearch}
                    onChange={(e) => setSubscriptionSearch(e.target.value)}
                    data-testid="input-subscription-search"
                  />
                </div>

                {isLoadingSubscriptions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredSubscriptions.map((item: UserWithSubscription) => (
                      <div
                        key={item.user.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        data-testid={`subscription-row-${item.user.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              {item.user.avatar ? (
                                <img src={item.user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.user.firstName} {item.user.lastName}</p>
                              <p className="text-sm text-muted-foreground truncate">{item.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge className={getTierBadgeColor(item.subscription?.tier || 'free')}>
                                {getTierLabel(item.subscription?.tier || 'free')}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {(item.subscription?.status || 'active') === 'active' ? 'Active' : item.subscription?.status}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSubscription(item);
                                setNewTier(item.subscription?.tier || 'free');
                              }}
                              data-testid={`button-edit-subscription-${item.user.id}`}
                            >
                              Change Tier
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredSubscriptions.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No users found</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messaging" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Broadcast to All Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="broadcast-title">Title (Optional)</Label>
                    <Input
                      id="broadcast-title"
                      placeholder="STATFYR Announcement"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      data-testid="input-broadcast-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="broadcast-message">Message *</Label>
                    <Textarea
                      id="broadcast-message"
                      placeholder="Enter your announcement message..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={4}
                      data-testid="input-broadcast-message"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send-push"
                      checked={sendPush}
                      onCheckedChange={(checked) => setSendPush(checked === true)}
                      data-testid="checkbox-send-push"
                    />
                    <Label htmlFor="send-push" className="cursor-pointer">
                      Send push notification
                    </Label>
                  </div>
                  <Button
                    onClick={async () => {
                      if (!broadcastMessage.trim()) {
                        toast.error("Message is required");
                        return;
                      }
                      setIsSendingBroadcast(true);
                      try {
                        const result = await adminSendBroadcast(
                          {
                            title: broadcastTitle || "STATFYR Announcement",
                            message: broadcastMessage,
                            sendPush,
                          },
                          user.id
                        );
                        toast.success(`Broadcast sent to ${result.recipientCount} users`);
                        setBroadcastTitle("");
                        setBroadcastMessage("");
                      } catch (error: any) {
                        toast.error(error.message || "Failed to send broadcast");
                      } finally {
                        setIsSendingBroadcast(false);
                      }
                    }}
                    disabled={isSendingBroadcast || !broadcastMessage.trim()}
                    className="w-full"
                    data-testid="button-send-broadcast"
                  >
                    {isSendingBroadcast ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Broadcast
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Direct Support Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="support-user">User ID or Email</Label>
                    <Input
                      id="support-user"
                      placeholder="Enter user ID or search..."
                      value={supportUserId}
                      onChange={(e) => setSupportUserId(e.target.value)}
                      data-testid="input-support-user"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the User Search tab to find user IDs
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="support-message">Message *</Label>
                    <Textarea
                      id="support-message"
                      placeholder="Enter your support message..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={4}
                      data-testid="input-support-message"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      if (!supportUserId.trim() || !supportMessage.trim()) {
                        toast.error("User ID and message are required");
                        return;
                      }
                      setIsSendingSupport(true);
                      try {
                        await adminSendSupportMessage(
                          supportUserId,
                          { message: supportMessage, sendPush: true },
                          user.id
                        );
                        toast.success("Support message sent");
                        setSupportUserId("");
                        setSupportMessage("");
                      } catch (error: any) {
                        toast.error(error.message || "Failed to send message");
                      } finally {
                        setIsSendingSupport(false);
                      }
                    }}
                    disabled={isSendingSupport || !supportUserId.trim() || !supportMessage.trim()}
                    className="w-full"
                    data-testid="button-send-support"
                  >
                    {isSendingSupport ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Support Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Subscription Tier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <p className="text-muted-foreground">
                  {editingSubscription?.user.firstName} {editingSubscription?.user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{editingSubscription?.user.email}</p>
              </div>
              <div>
                <Label>Current Tier</Label>
                <div className="mt-1">
                  <Badge className={getTierBadgeColor(editingSubscription?.subscription.tier || 'free')}>
                    {getTierLabel(editingSubscription?.subscription.tier || 'free')}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>New Tier</Label>
                <Select value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger data-testid="select-subscription-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="coach">Coach Pro ($9.99/mo)</SelectItem>
                    <SelectItem value="athlete">Athlete Pro ($2.99/mo)</SelectItem>
                    <SelectItem value="supporter">Supporter Pro ($5.99/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingSubscription(null)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateSubscription} 
                  disabled={isSaving || !newTier} 
                  className="flex-1" 
                  data-testid="button-save-subscription"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Tier"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Membership</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <p className="text-muted-foreground">{editingMember?.userName}</p>
              </div>
              <div>
                <Label>Team</Label>
                <p className="text-muted-foreground">{editingMember?.teamName}</p>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger data-testid="select-member-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="supporter">Supporter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingMember(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleUpdateMember} disabled={isSaving} className="flex-1" data-testid="button-save-member">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
