import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield, ChevronDown, ChevronUp, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

type TeamMember = {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  jerseyNumber: string | null;
  position: string | null;
  user: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
  };
};

type Team = {
  id: string;
  name: string;
  code: string;
  sport: string | null;
  season: string | null;
  coachId: string;
  members: TeamMember[];
  coach: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
  } | null;
};

type User = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  role: string;
  avatar: string | null;
};

async function getAdminTeams(): Promise<Team[]> {
  const res = await fetch("/api/admin/teams");
  if (!res.ok) throw new Error("Failed to fetch teams");
  return res.json();
}

async function getAdminUsers(): Promise<User[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export default function AdminDashboard() {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"teams" | "users">("teams");

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/admin/teams"],
    queryFn: getAdminTeams,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getAdminUsers,
  });

  const toggleTeamExpanded = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.coach?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.coach?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "coach":
        return "bg-orange-500 text-white";
      case "athlete":
        return "bg-blue-500 text-white";
      case "supporter":
        return "bg-purple-500 text-white";
      case "staff":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-display font-bold tracking-wide">Admin Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "teams" ? "default" : "outline"}
              onClick={() => setActiveTab("teams")}
              data-testid="tab-teams"
            >
              <Users className="h-4 w-4 mr-2" />
              Teams ({teams.length})
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
              data-testid="tab-users"
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </Button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "teams" ? "Search teams..." : "Search users..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {activeTab === "teams" && (
          <div className="space-y-4">
            {teamsLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No teams match your search" : "No teams found"}
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Card key={team.id} className="overflow-hidden" data-testid={`card-team-${team.id}`}>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition"
                    onClick={() => toggleTeamExpanded(team.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="font-mono">
                              {team.code}
                            </Badge>
                            {team.sport && (
                              <Badge variant="secondary">{team.sport}</Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {team.members.length} members
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            Coach: {team.coach?.name || team.coach?.username || "Unknown"}
                          </div>
                          {team.coach?.email && (
                            <div className="text-muted-foreground">{team.coach.email}</div>
                          )}
                        </div>
                        {expandedTeams.has(team.id) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedTeams.has(team.id) && (
                    <CardContent className="border-t">
                      <div className="pt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Team Members
                        </h4>
                        {team.members.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No members yet</p>
                        ) : (
                          <div className="grid gap-2">
                            {team.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                data-testid={`member-${member.userId}`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.user.avatar || undefined} />
                                    <AvatarFallback>
                                      {(member.user.name || member.user.username).charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {member.user.name || member.user.username}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {member.user.email || member.user.username}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {member.jerseyNumber && (
                                    <Badge variant="outline">#{member.jerseyNumber}</Badge>
                                  )}
                                  {member.position && (
                                    <Badge variant="secondary">{member.position}</Badge>
                                  )}
                                  <Badge className={getRoleBadgeColor(member.role)}>
                                    {member.role}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "users" && (
          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? "No users match your search" : "No users found"}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition"
                      data-testid={`user-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {(user.name || user.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || user.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email || `@${user.username}`}
                          </div>
                        </div>
                      </div>
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
