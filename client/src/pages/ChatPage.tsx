import { useState, useEffect, useRef, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ArrowLeft, Bell, BellOff, Hash, Users, MessageSquare, Check, Mail, Settings } from "lucide-react";
import { Link } from "wouter";
import { useNotifications } from "@/lib/notificationContext";
import { useUser } from "@/lib/userContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatar?: string | null;
  email?: string;
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

interface DirectMessage {
  id: string;
  teamId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
  recipient: ChatUser;
}

interface Conversation {
  otherUser: ChatUser;
  lastMessage: DirectMessage;
  unreadCount: number;
}

interface NotificationPreferences {
  emailOnMessage: boolean;
  pushOnMessage: boolean;
  emailOnHype: boolean;
  pushOnHype: boolean;
}

const CHANNELS = ["general", "announcements", "tactics"];

export default function ChatPage() {
  const { notificationsEnabled, permissionDenied, enableNotifications } = useNotifications();
  const { user, currentTeam } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEnabling, setIsEnabling] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  const [chatMode, setChatMode] = useState<"channels" | "dm">("dm");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
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

  // Fetch notification preferences
  const { data: notifPrefs } = useQuery<NotificationPreferences>({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user");
      const res = await fetch(`/api/users/${user.id}/notification-preferences`);
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Update notification preferences
  const updatePrefsMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error("No user");
      const res = await fetch(`/api/users/${user.id}/notification-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
      toast({ title: "Preferences updated" });
    },
  });

  // Fetch conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["conversations", currentTeam?.id, user?.id],
    queryFn: async () => {
      if (!currentTeam?.id || !user?.id) return [];
      const res = await fetch(`/api/teams/${currentTeam.id}/conversations?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    enabled: !!currentTeam?.id && !!user?.id,
    refetchInterval: 10000,
  });

  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Update app badge when unread count changes
  useEffect(() => {
    if ('setAppBadge' in navigator && totalUnread >= 0) {
      if (totalUnread > 0) {
        navigator.setAppBadge(totalUnread).catch(() => {});
      } else {
        navigator.clearAppBadge?.().catch(() => {});
      }
    }
  }, [totalUnread]);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    await enableNotifications();
    setIsEnabling(false);
  };

  // Fetch team members with React Query
  const { data: teamMembersData = [] } = useQuery<TeamMember[]>({
    queryKey: ["team-members", currentTeam?.id],
    queryFn: async () => {
      if (!currentTeam?.id) return [];
      const res = await fetch(`/api/teams/${currentTeam.id}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
    enabled: !!currentTeam?.id,
    refetchInterval: 30000, // Refresh every 30 seconds to pick up new members
  });

  // Filter out current user from team members - compute directly from data
  const teamMembers = useMemo(() => {
    if (!teamMembersData || !user?.id) return [];
    return teamMembersData.filter((m: TeamMember) => m.userId !== user.id);
  }, [teamMembersData, user?.id]);

  // Fetch DM messages when conversation is selected
  useEffect(() => {
    if (!currentTeam || !user || !selectedConversation) return;
    
    const fetchDmMessages = async () => {
      try {
        const res = await fetch(
          `/api/teams/${currentTeam.id}/conversations/${selectedConversation}/messages?userId=${user.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setDmMessages(data);
          
          // Mark as read
          await fetch(`/api/teams/${currentTeam.id}/conversations/${selectedConversation}/read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          refetchConversations();
        }
      } catch (error) {
        console.error("Error fetching DM messages:", error);
      }
    };
    
    fetchDmMessages();
    const interval = setInterval(fetchDmMessages, 5000);
    return () => clearInterval(interval);
  }, [currentTeam, user, selectedConversation, refetchConversations]);

  // Fetch channel messages
  useEffect(() => {
    if (!currentTeam || chatMode !== "channels") return;
    
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
  }, [currentTeam, activeChannel, chatMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, dmMessages]);

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentTeam || !selectedConversation) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          recipientId: selectedConversation,
          content: newMessage.trim(),
        }),
      });
      
      if (res.ok) {
        const msg = await res.json();
        setDmMessages((prev) => [...prev, msg]);
        setNewMessage("");
        refetchConversations();
      } else {
        toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendChannelMessage = async (e: React.FormEvent) => {
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
        toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
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

  const getConversationUser = (userId: string) => {
    return conversations.find((c) => c.otherUser.id === userId)?.otherUser;
  };

  const startNewConversation = (memberId: string) => {
    setSelectedConversation(memberId);
  };

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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={getDashboardPath()}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">
                Messages
                {totalUnread > 0 && (
                  <span className="ml-2 text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{currentTeam.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-4 bg-card border-white/5">
            <h3 className="font-display font-bold uppercase text-sm mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email for new messages</p>
                  <p className="text-sm text-muted-foreground">Get an email when someone messages you</p>
                </div>
                <Switch
                  checked={notifPrefs?.emailOnMessage ?? true}
                  onCheckedChange={(checked) => updatePrefsMutation.mutate({ emailOnMessage: checked })}
                  data-testid="switch-email-message"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push for new messages</p>
                  <p className="text-sm text-muted-foreground">Get push notifications for messages</p>
                </div>
                <Switch
                  checked={notifPrefs?.pushOnMessage ?? true}
                  onCheckedChange={(checked) => updatePrefsMutation.mutate({ pushOnMessage: checked })}
                  data-testid="switch-push-message"
                />
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Sidebar - Conversations & Team Members */}
          <Card className={`bg-card border-white/5 flex flex-col ${selectedConversation && chatMode === 'dm' ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}>
            <Tabs value={chatMode} onValueChange={(v) => setChatMode(v as "channels" | "dm")} className="flex flex-col h-full">
              <TabsList className="grid w-full grid-cols-2 m-2">
                <TabsTrigger value="dm" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Direct
                  {totalUnread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="channels" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Channels
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dm" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    <p className="px-3 py-2 text-xs text-muted-foreground uppercase font-bold">Recent</p>
                    {conversations.map((conv) => (
                      <button
                        key={conv.otherUser.id}
                        onClick={() => setSelectedConversation(conv.otherUser.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                          selectedConversation === conv.otherUser.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-white/5 text-foreground"
                        }`}
                        data-testid={`conversation-${conv.otherUser.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          {conv.otherUser.avatar && <AvatarImage src={conv.otherUser.avatar} />}
                          <AvatarFallback>{getInitials(conv.otherUser.name || "?")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{conv.otherUser.name}</span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      </button>
                    ))}
                    
                    <p className="px-3 py-2 text-xs text-muted-foreground uppercase font-bold mt-4">Team Members</p>
                    {teamMembers.filter(m => !conversations.find(c => c.otherUser.id === m.userId)).map((member) => (
                      <button
                        key={member.userId}
                        onClick={() => startNewConversation(member.userId)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                          selectedConversation === member.userId
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-white/5 text-foreground"
                        }`}
                        data-testid={`member-${member.userId}`}
                      >
                        <Avatar className="h-8 w-8">
                          {member.user.avatar && <AvatarImage src={member.user.avatar} />}
                          <AvatarFallback>{getInitials(member.user.name || `${member.user.firstName} ${member.user.lastName}`)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{member.user.name || `${member.user.firstName} ${member.user.lastName}`}</span>
                          <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="channels" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
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
              </TabsContent>
            </Tabs>
          </Card>

          {/* Chat Area */}
          <Card className={`flex-1 bg-card border-white/5 flex-col overflow-hidden ${!selectedConversation && chatMode === 'dm' ? 'hidden md:flex' : 'flex'}`}>
            {chatMode === "dm" ? (
              <>
                {selectedConversation ? (
                  <>
                    {/* DM Header */}
                    <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-8 w-8">
                        {getConversationUser(selectedConversation)?.avatar && (
                          <AvatarImage src={getConversationUser(selectedConversation)!.avatar!} />
                        )}
                        <AvatarFallback>
                          {getInitials(getConversationUser(selectedConversation)?.name || 
                            teamMembers.find(m => m.userId === selectedConversation)?.user.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-display text-lg font-bold">
                        {getConversationUser(selectedConversation)?.name ||
                          teamMembers.find(m => m.userId === selectedConversation)?.user.name ||
                          teamMembers.find(m => m.userId === selectedConversation)?.user.firstName + " " + teamMembers.find(m => m.userId === selectedConversation)?.user.lastName}
                      </span>
                    </div>

                    {/* DM Messages */}
                    <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
                      {dmMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">No messages yet. Say hello!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dmMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${message.senderId === user?.id ? "flex-row-reverse" : ""}`}
                              data-testid={`dm-${message.id}`}
                            >
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                {message.sender?.avatar && <AvatarImage src={message.sender.avatar} />}
                                <AvatarFallback>{getInitials(message.sender?.name || "?")}</AvatarFallback>
                              </Avatar>
                              <div className={`flex-1 ${message.senderId === user?.id ? "text-right" : ""}`}>
                                <div className={`flex items-center gap-2 mb-1 ${message.senderId === user?.id ? "justify-end" : ""}`}>
                                  <span className="font-medium text-sm">
                                    {message.senderId === user?.id ? "You" : message.sender?.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
                                </div>
                                <div
                                  className={`inline-block p-3 rounded-lg text-sm max-w-[80%] ${
                                    message.senderId === user?.id
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

                    {/* DM Input */}
                    <form onSubmit={handleSendDM} className="p-4 bg-white/[0.02] border-t border-white/5">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="bg-background/50 border-white/10 focus-visible:ring-primary"
                          placeholder="Type a message..."
                          disabled={isSending}
                          data-testid="input-dm"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!newMessage.trim() || isSending}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid="button-send-dm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-display font-bold text-lg mb-2">Select a conversation</h3>
                      <p className="text-muted-foreground">Choose a team member to start messaging</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Channel Header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <span className="font-display text-lg font-bold uppercase">{activeChannel}</span>
                </div>

                {/* Channel Messages */}
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

                {/* Channel Input */}
                <form onSubmit={handleSendChannelMessage} className="p-4 bg-white/[0.02] border-t border-white/5">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="bg-background/50 border-white/10 focus-visible:ring-primary"
                      placeholder={`Message #${activeChannel}...`}
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
              </>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
