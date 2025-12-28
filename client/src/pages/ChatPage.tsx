import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, ArrowLeft, Bell, BellOff, Hash, Users, MessageSquare, Check } from "lucide-react";
import { Link } from "wouter";
import { useNotifications } from "@/lib/notificationContext";
import { useUser } from "@/lib/userContext";
import { useToast } from "@/hooks/use-toast";

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatar?: string | null;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

interface ChatMessage {
  id: string;
  teamId: string;
  userId: string;
  content: string;
  channel: string;
  createdAt: string;
  user: ChatUser;
}

const CHANNELS = ["general", "announcements", "tactics"];

export default function ChatPage() {
  const { notificationsEnabled, permissionDenied, enableNotifications } = useNotifications();
  const { user, currentTeam } = useUser();
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const isCoach = user?.role === "coach";
  
  const getDashboardPath = () => {
    switch (user?.role) {
      case "coach": return "/dashboard";
      case "athlete": return "/athlete/dashboard";
      case "supporter": return "/supporter/dashboard";
      default: return "/";
    }
  };

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    await enableNotifications();
    setIsEnabling(false);
  };

  // Fetch team members
  useEffect(() => {
    if (!currentTeam) return;
    
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teams/${currentTeam.id}/members`);
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data.filter((m: TeamMember) => m.userId !== user?.id));
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };
    
    fetchMembers();
  }, [currentTeam, user?.id]);

  // Fetch messages when channel or team changes
  useEffect(() => {
    if (!currentTeam) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/teams/${currentTeam.id}/chat/${activeChannel}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [currentTeam, activeChannel]);

  // Set up WebSocket connection
  useEffect(() => {
    if (!currentTeam || !user) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat?teamId=${currentTeam.id}&userId=${user.id}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log("WebSocket connected");
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_message" && message.data.channel === activeChannel) {
          setMessages((prev) => [...prev, message.data]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    return () => {
      ws.close();
    };
  }, [currentTeam, activeChannel, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentTeam) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/chat/${activeChannel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: newMessage.trim(),
          recipients: selectedMembers.size > 0 ? Array.from(selectedMembers) : undefined,
        }),
      });
      
      if (res.ok) {
        setNewMessage("");
        if (selectedMembers.size > 0) {
          toast({
            title: "Message sent",
            description: `Sent to ${selectedMembers.size} member${selectedMembers.size > 1 ? "s" : ""}`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    setSelectedMembers(new Set(teamMembers.map((m) => m.userId)));
  };

  const selectCoachesStaff = () => {
    const coaches = teamMembers.filter((m) => m.role === "coach" || m.role === "staff");
    setSelectedMembers(new Set(coaches.map((m) => m.userId)));
  };

  const clearSelection = () => {
    setSelectedMembers(new Set());
  };

  // Gate chat access behind notification permission
  if (!notificationsEnabled) {
    return (
      <Layout>
        <div className="h-[calc(100vh-140px)] flex items-center justify-center">
          <Card className="w-full max-w-md text-center p-8">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {permissionDenied ? (
                <BellOff className="h-8 w-8 text-destructive" />
              ) : (
                <Bell className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl mb-4">
              {permissionDenied ? "Notifications Blocked" : "Enable Notifications"}
            </CardTitle>
            <p className="text-muted-foreground mb-6">
              {permissionDenied 
                ? "You've blocked notifications for this site. To use chat, please enable notifications in your browser settings and refresh the page."
                : "To participate in team chat, you need to enable notifications. This ensures you never miss important messages from your team."
              }
            </p>
            {!permissionDenied && (
              <Button 
                onClick={handleEnableNotifications} 
                disabled={isEnabling}
                className="w-full"
                data-testid="button-enable-notifications"
              >
                <Bell className="mr-2 h-4 w-4" />
                {isEnabling ? "Enabling..." : "Enable Notifications"}
              </Button>
            )}
            <Link href={getDashboardPath()}>
              <Button variant="ghost" className="w-full mt-2" data-testid="button-go-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!currentTeam) {
    return (
      <Layout>
        <div className="h-[calc(100vh-140px)] flex items-center justify-center">
          <Card className="w-full max-w-md text-center p-8">
            <CardTitle className="text-2xl mb-4">No Team Selected</CardTitle>
            <p className="text-muted-foreground mb-6">
              Please join or select a team to access team chat.
            </p>
            <Link href={getDashboardPath()}>
              <Button variant="ghost" className="w-full" data-testid="button-go-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-3">
          <Link href={getDashboardPath()}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">Team Chat</h1>
            <p className="text-sm text-muted-foreground">{currentTeam.name}</p>
          </div>
        </div>

        {/* Horizontal Coach Chat Card */}
        {isCoach && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase text-sm">Quick Message</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedMembers.size > 0 
                      ? `${selectedMembers.size} member${selectedMembers.size > 1 ? "s" : ""} selected`
                      : "Select recipients below"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  className="border-primary/30 hover:bg-primary/10"
                  data-testid="button-select-all"
                >
                  <Users className="h-4 w-4 mr-1" />
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectCoachesStaff}
                  className="border-primary/30 hover:bg-primary/10"
                  data-testid="button-select-coaches"
                >
                  Coach/Staff
                </Button>
                {selectedMembers.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-muted-foreground"
                    data-testid="button-clear-selection"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant={showMemberSelector ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowMemberSelector(!showMemberSelector)}
                  className="border-primary/30"
                  data-testid="button-toggle-members"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {showMemberSelector ? "Hide" : "Select Members"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Member Selector Panel */}
        {(showMemberSelector || !isCoach) && (
          <Card className="bg-card border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold uppercase text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Recipients
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  data-testid="button-select-all-panel"
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectCoachesStaff}
                  data-testid="button-select-coaches-panel"
                >
                  Coach/Staff
                </Button>
                {selectedMembers.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    data-testid="button-clear-panel"
                  >
                    Clear ({selectedMembers.size})
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="max-h-40">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {teamMembers.map((member) => (
                  <label
                    key={member.userId}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMembers.has(member.userId)
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                    data-testid={`member-select-${member.userId}`}
                  >
                    <Checkbox
                      checked={selectedMembers.has(member.userId)}
                      onCheckedChange={() => toggleMember(member.userId)}
                    />
                    <Avatar className="h-6 w-6">
                      {member.user.avatar && <AvatarImage src={member.user.avatar} />}
                      <AvatarFallback className="text-xs">
                        {getInitials(member.user.name || `${member.user.firstName} ${member.user.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.name || `${member.user.firstName} ${member.user.lastName}`}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    {selectedMembers.has(member.userId) && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Channels List */}
          <Card className="w-64 bg-card border-white/5 flex-col hidden md:flex">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-display uppercase tracking-wide text-sm font-bold">Channels</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {CHANNELS.map((channel) => (
                  <button
                    key={channel}
                    onClick={() => setActiveChannel(channel)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                      activeChannel === channel
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-white/5 text-muted-foreground"
                    }`}
                    data-testid={`channel-${channel}`}
                  >
                    <Hash className="h-4 w-4" />
                    <span className="font-medium">{channel}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="flex-1 bg-card border-white/5 flex flex-col overflow-hidden">
            {/* Channel Header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <span className="font-display text-lg font-bold uppercase">{activeChannel}</span>
              
              {/* Selected members indicator */}
              {selectedMembers.size > 0 && (
                <div className="ml-auto flex items-center gap-2 text-sm text-primary">
                  <Users className="h-4 w-4" />
                  <span>Sending to {selectedMembers.size} member{selectedMembers.size > 1 ? "s" : ""}</span>
                </div>
              )}
              
              {/* Mobile channel selector */}
              <div className={`md:hidden ${selectedMembers.size > 0 ? "" : "ml-auto"}`}>
                <select
                  value={activeChannel}
                  onChange={(e) => setActiveChannel(e.target.value)}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-sm"
                  data-testid="select-channel-mobile"
                >
                  {CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      #{channel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.userId === user?.id ? "flex-row-reverse" : ""}`}
                      data-testid={`message-${message.id}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {message.user.avatar && <AvatarImage src={message.user.avatar} />}
                        <AvatarFallback>{getInitials(message.user.name || `${message.user.firstName} ${message.user.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.userId === user?.id ? "text-right" : ""}`}>
                        <div className={`flex items-center gap-2 mb-1 ${message.userId === user?.id ? "justify-end" : ""}`}>
                          <span className="font-medium text-sm">
                            {message.userId === user?.id ? "You" : message.user.name || `${message.user.firstName} ${message.user.lastName}`}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
                        </div>
                        <div
                          className={`inline-block p-3 rounded-lg text-sm max-w-[80%] ${
                            message.userId === user?.id
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-white/5 rounded-tl-none"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white/[0.02] border-t border-white/5">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  placeholder={selectedMembers.size > 0 ? `Message ${selectedMembers.size} selected member${selectedMembers.size > 1 ? "s" : ""}...` : `Message #${activeChannel}...`}
                  disabled={isSending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || isSending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
