import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { PlaybookCanvas } from "@/components/PlaybookCanvas";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Crown, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isDemoMode, demoPlays } from "@/lib/demoData";
import { useEntitlements } from "@/lib/entitlementsContext";
import { useUser } from "@/lib/userContext";
import { getPlay, updatePlay } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Hook to detect landscape orientation on mobile only (desktop is always allowed)
function useIsMobileLandscape() {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsMobileLandscape(isMobile && isLandscape);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return isMobileLandscape;
}

export default function PlayEditorPage() {
  const params = useParams<{ playId: string }>();
  const [location, navigate] = useLocation();
  const isDemo = isDemoMode();
  const isEditMode = location.startsWith('/play/edit/');
  const { entitlements, isLoading: entitlementsLoading } = useEntitlements();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [play, setPlay] = useState<any>(null);
  const isMobileLandscape = useIsMobileLandscape();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Load existing play when in edit mode
  const { data: existingPlay, isLoading: playLoading } = useQuery({
    queryKey: ['play', params.playId],
    queryFn: () => getPlay(params.playId!),
    enabled: isEditMode && !!params.playId && !isDemo,
  });

  // Update play mutation
  const updatePlayMutation = useMutation({
    mutationFn: async (data: { canvasData: string; thumbnailData?: string; keyframesData?: string }) => {
      if (!user?.id || !params.playId) throw new Error("Missing user or play ID");
      return updatePlay(params.playId, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['play', params.playId] });
      queryClient.invalidateQueries({ queryKey: ['teamPlays'] });
      toast.success("Play updated successfully!");
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast.error("Failed to update play");
    },
  });

  const handleBack = useCallback(() => {
    const backUrl = isDemo ? "/playbook?demo=true" : "/dashboard";
    if (hasUnsavedChanges) {
      setShowLeaveDialog(true);
    } else {
      navigate(backUrl);
    }
  }, [hasUnsavedChanges, isDemo, navigate]);

  const handleConfirmLeave = useCallback(() => {
    const backUrl = isDemo ? "/playbook?demo=true" : "/dashboard";
    setShowLeaveDialog(false);
    navigate(backUrl);
  }, [isDemo, navigate]);

  useEffect(() => {
    if (isDemo) {
      const demoPlay = demoPlays.find(p => p.id === params.playId);
      setPlay(demoPlay || null);
    } else if (existingPlay) {
      setPlay(existingPlay);
    }
  }, [params.playId, isDemo, existingPlay]);

  // Wait for play data to be ready in edit mode
  const isLoading = entitlementsLoading || (isEditMode && (playLoading || !play));

  if (isLoading) {
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
              onClick={handleBack}
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

  // Handle updating an existing play
  const handleUpdatePlay = async (data: {
    name: string;
    description: string;
    canvasData: string;
    thumbnailData?: string;
    category: string;
    keyframesData?: string;
  }) => {
    updatePlayMutation.mutate({
      canvasData: data.canvasData,
      thumbnailData: data.thumbnailData,
      keyframesData: data.keyframesData,
    });
  };

  const backUrl = isDemo ? "/playbook?demo=true" : "/dashboard";

  const handleHasUnsavedChanges = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Handle browser back button and beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        // Push state back to prevent navigation
        window.history.pushState(null, '', window.location.href);
        setShowLeaveDialog(true);
      }
    };

    // Push initial state to enable popstate handling
    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href);
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Show rotate message in landscape mode
  if (isMobileLandscape) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="bg-card/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 max-w-sm">
            <RotateCcw className="w-16 h-16 mx-auto text-primary mb-4 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">Rotate Your Device</h2>
            <p className="text-muted-foreground mb-4">
              PlayMaker works best in portrait mode. Please rotate your device to continue.
            </p>
            <Button 
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Playbook
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isDemo && (
          <div className="bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-600/30 border border-amber-500/50 rounded-lg p-3 sticky top-0 z-20">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Eye className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm">Demo Mode</p>
                  <p className="text-xs text-amber-100 truncate">Try drawing on the football field below</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => navigate("/subscription")}
                  className="border-amber-400/50 text-white hover:bg-amber-500/30 h-8"
                >
                  <Crown className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleBack}
                  className="text-amber-100 hover:text-white h-8 text-xs"
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-display font-bold uppercase tracking-tight text-foreground truncate">
              {play?.name || "Play Designer"} {isDemo && <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500/30 text-xs">DEMO</Badge>}
            </h1>
            <p className="text-muted-foreground/70 text-xs hidden md:block">
              Design plays for your team to review and learn.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-white/10 p-2">
          {(() => {
            // Parse existing play data if editing
            let initialElements: any[] = [];
            let initialKeyframes: any[] = [];
            let originalCanvasWidth: number | undefined;

            if (play?.canvasData) {
              try {
                const parsed = JSON.parse(play.canvasData);
                if (Array.isArray(parsed)) {
                  initialElements = parsed;
                } else if (parsed.elements) {
                  initialElements = parsed.elements;
                  originalCanvasWidth = parsed.canvasWidth;
                }
              } catch {}
            }

            if (play?.keyframesData) {
              try {
                const parsed = JSON.parse(play.keyframesData);
                if (Array.isArray(parsed)) {
                  initialKeyframes = parsed;
                } else if (parsed.keyframes) {
                  initialKeyframes = parsed.keyframes;
                  if (!originalCanvasWidth) originalCanvasWidth = parsed.canvasWidth;
                }
              } catch {}
            }

            return (
              <PlaybookCanvas 
                key={play?.id || 'new'}
                sport={play?.category || "Football"}
                onSave={isDemo ? undefined : (isEditMode ? handleUpdatePlay : handleSave)}
                isSaving={updatePlayMutation.isPending}
                onHasUnsavedChanges={handleHasUnsavedChanges}
                initialElements={initialElements}
                initialKeyframes={initialKeyframes}
                originalCanvasWidth={originalCanvasWidth}
              />
            );
          })()}
        </div>

        {isDemo && (
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-1">Also Available with Pro</h3>
              <p className="text-sm text-muted-foreground">Create plays for these sports too</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg border border-white/10 p-4 flex flex-col items-center justify-center h-24">
                <span className="text-2xl mb-1">🏀</span>
                <p className="text-xs text-center text-white font-medium">Basketball</p>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg border border-white/10 p-4 flex flex-col items-center justify-center h-24">
                <span className="text-2xl mb-1">⚽</span>
                <p className="text-xs text-center text-white font-medium">Soccer</p>
              </div>
              <div className="bg-gradient-to-br from-green-700 to-amber-700 rounded-lg border border-white/10 p-4 flex flex-col items-center justify-center h-24">
                <span className="text-2xl mb-1">⚾</span>
                <p className="text-xs text-center text-white font-medium">Baseball</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg border border-white/10 p-4 flex flex-col items-center justify-center h-24">
                <span className="text-2xl mb-1">🏐</span>
                <p className="text-xs text-center text-white font-medium">Volleyball</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on the canvas. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-red-600 hover:bg-red-700">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
