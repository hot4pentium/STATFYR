import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles, Smartphone, Download, Check, Plus } from "lucide-react";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

export interface WelcomeModal {
  title: string;
  subtitle?: string;
  description: string;
  buttonText?: string;
  icon?: React.ReactNode;
}

interface OnboardingTourProps {
  steps: TourStep[];
  storageKey: string;
  welcomeModal?: WelcomeModal;
  onComplete?: () => void;
}

export function OnboardingTour({ steps, storageKey, welcomeModal, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const isIOS = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  const isAndroid = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  }, []);

  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted && steps.length > 0) {
      const timer = setTimeout(() => {
        if (welcomeModal) {
          setShowWelcome(true);
        } else {
          setIsVisible(true);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey, steps.length, welcomeModal]);

  const updateTargetPosition = useCallback(() => {
    if (!isVisible || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [currentStep, steps, isVisible]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition);
    return () => {
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition);
    };
  }, [updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    setShowWelcome(false);
    if (!isStandalone && (isIOS || isAndroid || deferredPrompt)) {
      setShowInstallPrompt(true);
    } else {
      onComplete?.();
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    setShowWelcome(false);
    setShowInstallPrompt(false);
    onComplete?.();
  };

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
    finishOnboarding();
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    setIsVisible(true);
  };

  if (showWelcome && welcomeModal) {
    return (
      <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-card via-card to-orange-500/5 border-orange-500/30 shadow-2xl shadow-orange-500/20">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {welcomeModal.icon || (
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/30 flex items-center justify-center border-2 border-orange-500/40">
                  <Sparkles className="h-10 w-10 text-orange-500" />
                </div>
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-orange-500 bg-clip-text text-transparent">
              {welcomeModal.title}
            </h2>
            
            {welcomeModal.subtitle && (
              <p className="text-lg text-orange-500 font-medium mb-4">
                {welcomeModal.subtitle}
              </p>
            )}
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {welcomeModal.description}
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg flex items-center justify-center"
                onClick={handleStartTour}
                data-testid="button-start-tour"
              >
                {welcomeModal.buttonText || "Show Me Around"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </button>
              <button
                className="py-2 px-4 text-sm text-muted-foreground hover:text-foreground"
                onClick={finishOnboarding}
                data-testid="button-skip-welcome"
              >
                I'll explore on my own
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showInstallPrompt) {
    return (
      <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-card via-card to-emerald-500/5 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
          <CardContent className="p-6 text-center">
            <div className="mb-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              Install STATFYR
            </h2>
            
            <p className="text-muted-foreground mb-6 text-sm">
              Add STATFYR to your home screen for the best experience with push notifications and quick access!
            </p>

            {isIOS && (
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="8" width="14" height="12" rx="2" />
                      <path d="M12 2v10M8 6l4-4 4 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">1</span>
                      <span className="font-medium text-sm">Tap Share</span>
                    </div>
                    <p className="text-xs text-muted-foreground">At the bottom of Safari</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center border border-border">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-foreground rounded-md" />
                      <Plus className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                      <span className="font-medium text-sm">Add to Home Screen</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Scroll down in the menu</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                      <span className="font-medium text-sm">Tap "Add"</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Confirm in the top right</p>
                  </div>
                </div>
              </div>
            )}

            {isAndroid && deferredPrompt && (
              <Button
                onClick={handleAndroidInstall}
                className="w-full mb-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3"
                data-testid="button-install-android"
              >
                <Download className="h-5 w-5 mr-2" />
                Install App
              </Button>
            )}

            {isAndroid && !deferredPrompt && (
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-lg">⋮</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">1</span>
                      <span className="font-medium text-sm">Tap Menu</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Three dots at the top right</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
                      <span className="font-medium text-sm">Install App</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Or "Add to Home Screen"</p>
                  </div>
                </div>
              </div>
            )}

            {!isIOS && !isAndroid && deferredPrompt && (
              <Button
                onClick={handleAndroidInstall}
                className="w-full mb-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3"
                data-testid="button-install-desktop"
              >
                <Download className="h-5 w-5 mr-2" />
                Install App
              </Button>
            )}
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={finishOnboarding}
                className="w-full"
                data-testid="button-skip-install"
              >
                {isIOS ? "Got it!" : "Maybe Later"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const position = step.position || "bottom";

  const getTooltipPosition = () => {
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth < 480;
    const tooltipWidth = isMobile ? Math.min(280, viewportWidth - padding * 2) : 320;
    const tooltipHeight = 200;

    if (!targetRect) {
      return { 
        top: "50%", 
        left: "50%", 
        transform: "translate(-50%, -50%)",
        width: `${tooltipWidth}px`,
      };
    }

    const clampLeft = (left: number) => Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
    const clampTop = (top: number) => Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

    let top: number;
    let left: number;

    if (isMobile) {
      top = targetRect.bottom + padding;
      if (top + tooltipHeight > viewportHeight - padding) {
        top = targetRect.top - tooltipHeight - padding;
      }
      left = (viewportWidth - tooltipWidth) / 2;
    } else {
      switch (position) {
        case "top":
          top = targetRect.top - tooltipHeight - padding;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          if (top < padding) {
            top = targetRect.bottom + padding;
          }
          break;
        case "bottom":
          top = targetRect.bottom + padding;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
          if (top + tooltipHeight > viewportHeight - padding) {
            top = targetRect.top - tooltipHeight - padding;
          }
          break;
        case "left":
          top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
          left = targetRect.left - tooltipWidth - padding;
          if (left < padding) {
            left = targetRect.right + padding;
            if (left + tooltipWidth > viewportWidth - padding) {
              top = targetRect.bottom + padding;
              left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            }
          }
          break;
        case "right":
          top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
          left = targetRect.right + padding;
          if (left + tooltipWidth > viewportWidth - padding) {
            left = targetRect.left - tooltipWidth - padding;
            if (left < padding) {
              top = targetRect.bottom + padding;
              left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
            }
          }
          break;
        default:
          top = targetRect.bottom + padding;
          left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      }
    }

    return {
      top: `${clampTop(top)}px`,
      left: `${clampLeft(left)}px`,
      width: `${tooltipWidth}px`,
    };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
          />

          {targetRect && (
            <motion.div
              className="fixed z-[101] rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
              }}
            />
          )}

          <motion.div
            className="fixed z-[102]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={getTooltipPosition()}
          >
            <Card className="bg-card border-primary/30 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">{step.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2 -mt-1"
                    onClick={handleSkip}
                    data-testid="button-skip-tour"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {step.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentStep ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        data-testid="button-prev-step"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      data-testid="button-next-step"
                    >
                      {currentStep === steps.length - 1 ? "Done" : "Next"}
                      {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-3 text-center">
                  Step {currentStep + 1} of {steps.length} • <button onClick={handleSkip} className="underline hover:text-foreground">Skip tour</button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useOnboardingComplete(storageKey: string): boolean {
  const [hasCompleted, setHasCompleted] = useState(true);
  
  useEffect(() => {
    setHasCompleted(localStorage.getItem(storageKey) === "true");
  }, [storageKey]);
  
  return hasCompleted;
}

export function resetOnboarding(storageKey: string) {
  localStorage.removeItem(storageKey);
}
