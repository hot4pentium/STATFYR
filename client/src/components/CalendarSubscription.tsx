import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getCalendarToken, regenerateCalendarToken } from "@/lib/api";

interface CalendarSubscriptionProps {
  userId: string;
}

export function CalendarSubscription({ userId }: CalendarSubscriptionProps) {
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGetCalendarUrl = async () => {
    setIsLoading(true);
    try {
      const result = await getCalendarToken(userId);
      setCalendarUrl(result.calendarUrl);
    } catch (error) {
      toast.error("Failed to get calendar URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateUrl = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateCalendarToken(userId);
      setCalendarUrl(result.calendarUrl);
      toast.success("Calendar URL regenerated. Old URL no longer works.");
    } catch (error) {
      toast.error("Failed to regenerate calendar URL");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!calendarUrl) return;
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      toast.success("Calendar URL copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Card data-testid="card-calendar-subscription">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Subscription
        </CardTitle>
        <CardDescription>
          Subscribe to team events in your favorite calendar app (Google Calendar, Apple Calendar, Outlook, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!calendarUrl ? (
          <Button 
            onClick={handleGetCalendarUrl} 
            disabled={isLoading}
            data-testid="button-get-calendar-url"
          >
            {isLoading ? "Loading..." : "Get Calendar URL"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={calendarUrl} 
                readOnly 
                className="font-mono text-sm"
                data-testid="input-calendar-url"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyUrl}
                data-testid="button-copy-calendar-url"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarUrl)}`, '_blank')}
                data-testid="button-add-google-calendar"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Add to Google Calendar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateUrl}
                disabled={isRegenerating}
                data-testid="button-regenerate-calendar-url"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate URL
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Copy this URL and add it to your calendar app as a subscription. 
              Events will sync automatically. Regenerating creates a new URL and invalidates the old one.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
