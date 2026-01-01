import { useState, useMemo, useRef } from "react";
import { useUser } from "@/lib/userContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, ArrowLeft, Copy, ExternalLink, Loader2, Trash2, Video, Heart, MessageCircle, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { DashboardBackground } from "@/components/layout/DashboardBackground";
import { getAllTeamHighlights, requestVideoUpload, completeVideoUpload, type HighlightVideo } from "@/lib/api";
import { format } from "date-fns";

import clutchImg from "@assets/clutch_1766970267487.png";
import dominationImg from "@assets/domination_1766970267487.png";
import gamechangerImg from "@assets/gamechanger_1766970267487.png";
import highlightImg from "@assets/highlight_1766970267487.png";
import hustleImg from "@assets/hustle_1766970267487.png";
import lockedinImg from "@assets/lockedin_1766970267487.png";
import milestoneImg from "@assets/milestone_1766970267487.png";
import nextlevelImg from "@assets/nextlevel_1766970267487.png";
import unstoppableImg from "@assets/unstoppable_1766970267487.png";
import victoryImg from "@assets/victory_1766970267487.png";
import logoImage from "@assets/red_logo-removebg-preview_1766973716904.png";

const HYPE_TEMPLATES = [
  { id: "clutch", name: "Clutch Performance", image: clutchImg },
  { id: "domination", name: "Total Domination", image: dominationImg },
  { id: "gamechanger", name: "Game Changer", image: gamechangerImg },
  { id: "highlight", name: "Highlight Reel", image: highlightImg },
  { id: "hustle", name: "Pure Hustle", image: hustleImg },
  { id: "lockedin", name: "Locked In", image: lockedinImg },
  { id: "milestone", name: "Milestone Alert", image: milestoneImg },
  { id: "nextlevel", name: "Next Level", image: nextlevelImg },
  { id: "unstoppable", name: "Unstoppable", image: unstoppableImg },
  { id: "victory", name: "Victory!", image: victoryImg },
];

interface HypePost {
  id: string;
  athleteId: string;
  templateImage: string;
  message: string;
  highlightId: string | null;
  createdAt: string;
  highlight?: HighlightVideo;
}

interface ProfileComment {
  id: string;
  athleteId: string;
  visitorName: string;
  message: string;
  createdAt: string;
}

export default function HypeManager() {
  const { user, currentTeam } = useUser();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<typeof HYPE_TEMPLATES[0] | null>(null);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [isFyring, setIsFyring] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/athlete/${user?.id}` : "";

  const { data: followerData } = useQuery({
    queryKey: ["/api/athletes", user?.id, "followers", "count"],
    queryFn: async () => {
      if (!user) return { count: 0 };
      const res = await fetch(`/api/athletes/${user.id}/followers/count`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
  });

  const { data: engagementData } = useQuery({
    queryKey: ["/api/athletes", user?.id, "engagement"],
    queryFn: async () => {
      if (!user) return { likes: 0, comments: 0 };
      const res = await fetch(`/api/athletes/${user.id}/engagement`);
      if (!res.ok) return { likes: 0, comments: 0 };
      return res.json();
    },
    enabled: !!user,
  });

  const { data: profileComments = [] } = useQuery<ProfileComment[]>({
    queryKey: ["/api/athletes", user?.id, "profile-comments"],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/athletes/${user.id}/profile-comments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const { data: hypePosts = [], refetch: refetchPosts } = useQuery<HypePost[]>({
    queryKey: ["/api/athletes", user?.id, "hype-posts"],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/athletes/${user.id}/hype-posts`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const { data: highlights = [] } = useQuery({
    queryKey: ["/api/teams", currentTeam?.id, "highlights", "all"],
    queryFn: () => currentTeam ? getAllTeamHighlights(currentTeam.id) : Promise.resolve([]),
    enabled: !!currentTeam,
  });

  const processedHighlights = useMemo(() => {
    return highlights.filter((h: HighlightVideo) => h.status === "completed" && h.publicUrl);
  }, [highlights]);

  const createPostMutation = useMutation({
    mutationFn: async (data: { templateImage: string; message: string; highlightId?: string }) => {
      const res = await fetch("/api/hype-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: user?.id,
          templateImage: data.templateImage,
          message: data.message,
          highlightId: data.highlightId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create HYPE post");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("HYPE post created! Followers have been notified.");
      setShowPostDialog(false);
      setSelectedTemplate(null);
      setPostMessage("");
      setSelectedHighlightId(null);
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", user?.id, "followers", "count"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/hype-posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete HYPE post");
      return res.json();
    },
    onSuccess: () => {
      toast.success("HYPE post deleted");
      refetchPosts();
    },
    onError: () => {
      toast.error("Failed to delete HYPE post");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/athletes/${user?.id}/profile-comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Comment deleted");
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", user?.id, "profile-comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", user?.id, "engagement"] });
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const handleFYR = async () => {
    if (!user?.id) {
      console.log("[FYR] No user ID");
      toast.error("Please log in first");
      return;
    }

    console.log("[FYR] Starting FYR request for user:", user.id);
    setIsFyring(true);
    try {
      const res = await fetch(`/api/athletes/${user.id}/fyr?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${user.name || user.username} just sent a FYR!`,
          body: "Check out their HYPE card now!",
        }),
      });

      console.log("[FYR] Response status:", res.status);
      const data = await res.json();
      console.log("[FYR] Response data:", JSON.stringify(data));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send FYR");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/athletes", user.id, "followers", "count"] });

      if (data.successCount > 0) {
        console.log("[FYR] Success! Sent to", data.successCount, "followers");
        toast.success(`FYR sent to ${data.successCount} follower${data.successCount > 1 ? "s" : ""}!`);
      } else if (data.failureCount > 0) {
        console.log("[FYR] Failure count:", data.failureCount);
        toast.error(`Failed to send notifications. ${data.failureCount} failed.`);
      } else {
        console.log("[FYR] No followers found");
        toast.info("No followers to notify yet. Share your HYPE card link!");
      }
    } catch (error: any) {
      console.error("[FYR] Error:", error);
      toast.error(error.message || "Failed to send FYR");
    } finally {
      setIsFyring(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleTemplateClick = (template: typeof HYPE_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setShowPostDialog(true);
    setPostMessage("");
    setSelectedHighlightId(null);
    setUploadedVideoId(null);
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTeam || !user) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Video must be less than 100MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus("Preparing upload...");

    try {
      const { uploadURL, videoId } = await requestVideoUpload(
        currentTeam.id,
        user.id,
        file.name,
        file.size,
        file.type
      );

      setUploadProgress(10);
      setUploadStatus("Uploading video...");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 70) + 10;
            setUploadProgress(Math.min(percentComplete, 80));
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setUploadProgress(85);
      setUploadStatus("Processing video...");

      await completeVideoUpload(videoId);

      setUploadProgress(100);
      setUploadStatus("Complete!");
      setUploadedVideoId(videoId);
      setSelectedHighlightId(videoId);
      
      queryClient.invalidateQueries({ queryKey: ["/api/teams", currentTeam.id, "highlights", "all"] });
      
      toast.success("Video uploaded!", {
        description: "Your video is being processed and will appear in the gallery.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearUploadedVideo = () => {
    setUploadedVideoId(null);
    setSelectedHighlightId(null);
  };

  const handlePostSubmit = () => {
    if (!selectedTemplate || !postMessage.trim()) {
      toast.error("Please enter a message for your HYPE post");
      return;
    }

    createPostMutation.mutate({
      templateImage: selectedTemplate.id,
      message: postMessage.trim(),
      highlightId: selectedHighlightId || undefined,
    });
  };

  const getTemplateImage = (templateId: string) => {
    return HYPE_TEMPLATES.find(t => t.id === templateId)?.image || clutchImg;
  };

  const athleteName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || user?.username || "Athlete";

  const initials = athleteName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  if (!user) return null;

  return (
    <>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen text-white">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Link href="/athlete/dashboard">
              <Button variant="ghost" size="sm" className="text-[#121010] hover:bg-white/10" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="font-bold text-[#141414]" data-testid="text-page-title">
              <span className="font-marker text-[24px] text-orange-500">HYPE</span>
              <span className="font-display text-[21px]"> Portal</span>
            </h1>
            <div className="w-20" />
          </div>

          <div className="mb-6 flex gap-3">
            <Card className="flex-1 bg-gradient-to-br from-orange-900/50 to-zinc-900 border-orange-700/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Button
                  onClick={handleFYR}
                  disabled={isFyring || !followerData?.count}
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold"
                  data-testid="button-fyr"
                >
                  {isFyring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><img src={logoImage} alt="STATFYR" className="h-4 w-4 mr-1 object-contain" /> FYR IT!</>
                  )}
                </Button>
                <span className="text-xs text-[#fcfcfc]">
                  Sends a message to your followers that your HYPE Card has been updated.
                </span>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 border-zinc-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-red-400">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-sm font-semibold">{engagementData?.likes || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-semibold">{engagementData?.comments || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {profileComments.length > 0 && (
            <Card className="bg-zinc-900/80 border-zinc-700 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-cyan-400" />
                  Fan Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(showAllComments ? profileComments : profileComments.slice(0, 3)).map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                      data-testid={`comment-${comment.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-cyan-400 text-sm">{comment.visitorName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">
                            {format(new Date(comment.createdAt), "MMM d, yyyy")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                            className="h-6 w-6 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                            data-testid={`button-delete-comment-${comment.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-white text-sm">{comment.message}</p>
                    </div>
                  ))}
                  {!showAllComments && profileComments.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllComments(true)}
                      className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      data-testid="button-see-more-comments"
                    >
                      See More ({profileComments.length - 3} more)
                    </Button>
                  )}
                  {showAllComments && profileComments.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllComments(false)}
                      className="w-full text-zinc-400 hover:text-zinc-300 hover:bg-zinc-500/10"
                      data-testid="button-show-less-comments"
                    >
                      Show Less
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-zinc-900/80 border-zinc-700 mb-8">
            <CardHeader>
              <CardTitle className="text-xl text-white">Create a HYPE Post</CardTitle>
              <p className="text-sm text-zinc-400">
                Select a template to create a shareable HYPE post. Your followers will be notified!
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {HYPE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateClick(template)}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-500 transition-all"
                    data-testid={`template-${template.id}`}
                  >
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium text-center px-2">
                        {template.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {hypePosts.length > 0 && (
            <Card className="bg-zinc-900/80 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">Your HYPE Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hypePosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                      data-testid={`hype-post-${post.id}`}
                    >
                      <img
                        src={getTemplateImage(post.templateImage)}
                        alt="Template"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm mb-1">{post.message}</p>
                        <p className="text-xs text-zinc-500">
                          {format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {post.highlight && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-orange-400">
                            <Video className="h-3 w-3" />
                            <span>{post.highlight.title || "Highlight attached"}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePostMutation.mutate(post.id)}
                        disabled={deletePostMutation.isPending}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                        data-testid={`button-delete-post-${post.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <img src={logoImage} alt="STATFYR" className="h-5 w-5 object-contain" />
              Create HYPE Post
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedTemplate.image}
                  alt={selectedTemplate.name}
                  className="w-48 h-48 object-cover rounded-lg border-2 border-orange-500"
                />
              </div>
              <p className="text-center text-sm text-zinc-400">{selectedTemplate.name}</p>

              <div className="space-y-2">
                <Label className="text-white">Your Message</Label>
                <Textarea
                  value={postMessage}
                  onChange={(e) => setPostMessage(e.target.value)}
                  placeholder="What's your HYPE about? (e.g., 'Just hit 20 points in tonight's game!')"
                  className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
                  rows={3}
                  data-testid="input-post-message"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Attach a Video (optional)</Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={isUploading}
                  data-testid="input-video-upload"
                />

                {isUploading ? (
                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2">
                    <div className="flex items-center gap-2 text-orange-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{uploadStatus}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : uploadedVideoId ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-green-600/50">
                    <div className="flex items-center gap-2 text-green-400">
                      <Video className="h-4 w-4" />
                      <span className="text-sm">Video uploaded (processing...)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedVideo}
                      className="h-6 w-6 p-0 text-zinc-400 hover:text-red-400"
                      data-testid="button-clear-video"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {processedHighlights.length > 0 && (
                      <Select
                        value={selectedHighlightId || "none"}
                        onValueChange={(val) => setSelectedHighlightId(val === "none" ? null : val)}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white" data-testid="select-highlight">
                          <SelectValue placeholder="Choose from gallery..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="none" className="text-zinc-400">No video</SelectItem>
                          {processedHighlights.map((h: HighlightVideo) => (
                            <SelectItem key={h.id} value={h.id} className="text-white">
                              {h.title || "Untitled highlight"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {processedHighlights.length > 0 && (
                        <span className="text-xs text-zinc-500">or</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-zinc-600 text-zinc-300 hover:text-white gap-2"
                        data-testid="button-upload-new-video"
                      >
                        <Upload className="h-4 w-4" />
                        Upload New Video
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500">Max 100MB - Will be added to team gallery</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPostDialog(false)}
              className="border-zinc-600 text-zinc-300"
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostSubmit}
              disabled={createPostMutation.isPending || !postMessage.trim()}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              data-testid="button-create-post"
            >
              {createPostMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Posting...</>
              ) : (
                <><img src={logoImage} alt="STATFYR" className="h-4 w-4 mr-2 object-contain" /> Post HYPE</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
