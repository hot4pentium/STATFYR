import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface HypeHubFollowSectionProps {
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  showFollowButton?: boolean;
  commentsCount?: number;
  likesCount?: number;
  onLike?: () => void;
  onComment?: (message: string) => void;
  hasLiked?: boolean;
  visitorName?: string;
  onVisitorNameChange?: (name: string) => void;
}

export function HypeHubFollowSection({
  isFollowing = false,
  onFollow,
  onUnfollow,
  showFollowButton = true,
  commentsCount = 0,
  likesCount = 0,
  onLike,
  onComment,
  hasLiked = false,
  visitorName = "",
  onVisitorNameChange,
}: HypeHubFollowSectionProps) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleSubmitComment = () => {
    if (commentText.trim() && onComment) {
      onComment(commentText.trim());
      setCommentText("");
      setShowCommentForm(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {showFollowButton && (
        <Card className="bg-card border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Follow Athlete</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3">
              <Button
                onClick={isFollowing ? onUnfollow : onFollow}
                className={`w-full rounded-lg ${
                  isFollowing 
                    ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                data-testid="button-follow-section"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isFollowing ? "Following" : "Follow Athlete"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Get notified about new hype & highlights
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Comments</span>
              <span className="text-muted-foreground">({commentsCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className={`h-5 w-5 ${hasLiked ? "text-red-500 fill-red-500" : "text-muted-foreground"}`} />
              <span className="font-medium">Likes</span>
              <span className="text-muted-foreground">({likesCount})</span>
            </div>
          </div>

          {onVisitorNameChange && !visitorName && (
            <Input
              placeholder="Your name"
              value={visitorName}
              onChange={(e) => onVisitorNameChange(e.target.value)}
              className="mb-3"
              data-testid="input-visitor-name"
            />
          )}

          <div className="flex gap-2">
            <Button
              onClick={onLike}
              disabled={hasLiked || !visitorName}
              variant={hasLiked ? "secondary" : "default"}
              className={`flex-1 ${hasLiked ? "bg-red-500/20 text-red-500" : ""}`}
              data-testid="button-like"
            >
              <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
              {hasLiked ? "Liked!" : "Like"}
            </Button>
            <Button
              onClick={() => setShowCommentForm(!showCommentForm)}
              variant="outline"
              className="flex-1"
              data-testid="button-toggle-comment"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>

          {showCommentForm && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Type your comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none"
                rows={3}
                data-testid="textarea-comment"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || !visitorName}
                className="w-full"
                data-testid="button-submit-comment"
              >
                Post Comment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
