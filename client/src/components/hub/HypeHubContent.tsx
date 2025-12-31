import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Heart, MessageCircle, Rocket, Video, Calendar, TrendingUp, BookOpen, Send } from "lucide-react";
import type { HubSection } from "./HypeHubPillNav";

interface HypeHubContentProps {
  section: HubSection;
  userRole: "athlete" | "supporter" | "coach" | "staff" | "recipient";
  hypePosts?: any[];
  stats?: any;
  highlights?: any[];
  events?: any[];
  plays?: any[];
  onAddHype?: () => void;
  onNavigateToChat?: () => void;
}

export function HypeHubContent({
  section,
  userRole,
  hypePosts = [],
  stats,
  highlights = [],
  events = [],
  plays = [],
  onAddHype,
  onNavigateToChat,
}: HypeHubContentProps) {
  const isRecipient = userRole === "recipient";
  const canEditPlaybook = userRole === "coach" || userRole === "staff";

  const renderHypeSection = () => (
    <div className="space-y-4">
      {hypePosts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <div className="text-5xl">🚀</div>
          <h3 className="text-xl font-bold">No hype yet</h3>
          <p className="text-muted-foreground">
            {isRecipient ? "Be the first to hype this athlete." : "Share your first hype post!"}
          </p>
          {onAddHype && (
            <Button 
              onClick={onAddHype}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full px-8"
              data-testid="button-add-hype"
            >
              <Flame className="h-4 w-4 mr-2" />
              Add Hype
            </Button>
          )}
        </div>
      ) : (
        <>
          {onAddHype && (
            <Button 
              onClick={onAddHype}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full"
              data-testid="button-add-hype"
            >
              <Flame className="h-4 w-4 mr-2" />
              Add Hype
            </Button>
          )}
          <div className="space-y-3">
            {hypePosts.map((post: any) => (
              <Card key={post.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                      <Flame className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{post.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.senderName} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderStatsSection = () => (
    <div className="space-y-4">
      {stats && Object.keys(stats.stats || {}).length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(stats.stats || {}).map(([key, value]: [string, any]) => {
            const displayValue = typeof value === 'object' && value !== null 
              ? (value.total ?? value.perGame ?? 0)
              : value;
            const displayName = typeof value === 'object' && value !== null && value.name
              ? value.name
              : key;
            return (
              <Card key={key} className="bg-card border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{displayValue}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{displayName}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold">No stats yet</h3>
          <p className="text-muted-foreground">Stats will appear after games are tracked.</p>
        </div>
      )}
    </div>
  );

  const renderHighlightsSection = () => (
    <div className="space-y-4">
      {highlights.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {highlights.map((highlight: any) => (
            <Card key={highlight.id} className="bg-card border-border/50 overflow-hidden">
              <div className="aspect-video bg-black/20 relative">
                {highlight.thumbnailKey ? (
                  <img src={highlight.thumbnailKey} alt={highlight.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{highlight.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold">No highlights yet</h3>
          <p className="text-muted-foreground">Video highlights will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderEventsSection = () => (
    <div className="space-y-4">
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map((event: any) => (
            <Card key={event.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()} • {event.location || "TBD"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold">No events yet</h3>
          <p className="text-muted-foreground">Upcoming events will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderPlaybookSection = () => (
    <div className="space-y-4">
      {plays.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {plays.map((play: any) => (
            <Card key={play.id} className="bg-card border-border/50 overflow-hidden">
              <div className="aspect-square bg-black/20 relative">
                {play.thumbnailData ? (
                  <img src={play.thumbnailData} alt={play.name} className="w-full h-full object-contain bg-white dark:bg-gray-900" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{play.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold">No plays yet</h3>
          <p className="text-muted-foreground">
            {canEditPlaybook ? "Create plays in the playbook editor." : "Team plays will appear here."}
          </p>
        </div>
      )}
    </div>
  );

  const renderMessengerSection = () => (
    <div className="space-y-4">
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-bold">Team Chat</h3>
        <p className="text-muted-foreground mb-4">Connect with your team.</p>
        {onNavigateToChat && (
          <Button 
            onClick={onNavigateToChat}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full px-8"
            data-testid="button-open-chat"
          >
            <Send className="h-4 w-4 mr-2" />
            Open Chat
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {section === "hype" && renderHypeSection()}
      {section === "stats" && renderStatsSection()}
      {section === "highlights" && renderHighlightsSection()}
      {section === "events" && renderEventsSection()}
      {section === "playbook" && renderPlaybookSection()}
      {section === "messenger" && renderMessengerSection()}
    </div>
  );
}
