import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PlaybookCanvas } from "@/components/PlaybookCanvas";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Crown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isDemoMode, demoPlays, DEMO_SPORTS, type DemoSport } from "@/lib/demoData";
import { useEntitlements } from "@/lib/entitlementsContext";
import { toast } from "sonner";

export default function PlayEditorPage() {
  const params = useParams<{ playId: string }>();
  const [, navigate] = useLocation();
  const isDemo = isDemoMode();
  const { entitlements, isLoading: entitlementsLoading } = useEntitlements();
  const [play, setPlay] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoSport, setDemoSport] = useState<DemoSport>("Soccer");

  useEffect(() => {
    if (isDemo) {
      const demoPlay = demoPlays.find(p => p.id === params.playId);
      setPlay(demoPlay || null);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [params.playId, isDemo]);

  if (entitlementsLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!entitlements.canEditPlayMaker && !isDemo) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
          <div className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-md">
            <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              PlayMaker is a premium feature. Upgrade to Coach Pro to design and view plays.
            </p>
            <Button 
              onClick={() => navigate("/subscription")}
              className="gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Coach Pro
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/playbook")}
              className="mt-2 w-full"
            >
              Back to Playbook
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSave = async () => {
    if (isDemo) {
      toast.info("Demo Mode", {
        description: "Changes won't be saved in demo mode.",
      });
      return;
    }
  };

  const backUrl = isDemo ? "/playbook?demo=true" : "/playbook";

  return (
    <Layout>
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isDemo && (
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-200">Demo Mode</p>
                <p className="text-xs text-amber-300/70">Explore the play designer. Changes won't be saved.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-300/70">Sport:</span>
                <Select value={demoSport} onValueChange={(v) => setDemoSport(v as DemoSport)}>
                  <SelectTrigger className="w-[130px] h-8 border-amber-500/30 bg-amber-500/10 text-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_SPORTS.map((sport) => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => navigate("/subscription")}
                className="border-amber-500/30 text-amber-200 hover:bg-amber-500/20"
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => navigate("/playbook")}
                className="text-amber-300/70 hover:text-amber-200"
              >
                Exit Demo
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate(backUrl)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">
              {play?.name || "Play Designer"} {isDemo && <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30">DEMO</Badge>}
            </h1>
            {play?.description && (
              <p className="text-muted-foreground text-sm">{play.description}</p>
            )}
            <p className="text-muted-foreground/70 text-xs mt-1">
              Plays can be saved for coaches and staff to review. Saved plays will show for athletes and supporters to learn for game day.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-white/10 overflow-hidden">
          <PlaybookCanvas 
            sport={isDemo ? demoSport : "Football"}
            onSave={isDemo ? undefined : handleSave}
            isSaving={false}
          />
        </div>
      </div>
    </Layout>
  );
}
