import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Link2, Sparkles } from "lucide-react";
import { AthleteCodeClaimDialog } from "./AthleteCodeClaimDialog";

interface LockedHypeStateProps {
  athleteName?: string;
  featureName?: string;
  onConnected?: () => void;
}

export function LockedHypeState({ athleteName, featureName = "HYPE features", onConnected }: LockedHypeStateProps) {
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  return (
    <>
      <Card className="border-dashed border-2 border-muted-foreground/20" data-testid="card-locked-hype">
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-orange-500" />
          </div>
          
          <h3 className="font-display font-bold text-lg mb-2">
            Connect to Unlock {featureName}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            {athleteName 
              ? `Enter ${athleteName}'s unique code to access Game Day Live, shoutouts, and more.`
              : "Enter your athlete's unique code to access Game Day Live, shoutouts, and exclusive features."}
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Game Day Live
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              Shoutouts
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              HYPE Posts
            </span>
          </div>
          
          <Button 
            onClick={() => setShowClaimDialog(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            data-testid="button-connect-athlete"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Enter Athlete Code
          </Button>
        </CardContent>
      </Card>

      <AthleteCodeClaimDialog 
        open={showClaimDialog} 
        onOpenChange={setShowClaimDialog}
        onSuccess={onConnected}
      />
    </>
  );
}
