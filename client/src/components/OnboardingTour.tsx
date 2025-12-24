import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

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
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    setShowWelcome(false);
    onComplete?.();
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    setIsVisible(true);
  };

  if (showWelcome && welcomeModal) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
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
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold"
                    onClick={handleStartTour}
                    data-testid="button-start-tour"
                  >
                    {welcomeModal.buttonText || "Show Me Around"}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleComplete}
                    data-testid="button-skip-welcome"
                  >
                    I'll explore on my own
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const position = step.position || "bottom";

  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const padding = 12;
    const isMobile = window.innerWidth < 640;
    const tooltipWidth = isMobile ? Math.min(280, window.innerWidth - padding * 2) : 320;
    const tooltipHeight = 180;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const clampLeft = (left: number) => Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
    const clampTop = (top: number) => Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding));

    let top: number;
    let left: number;

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

    return {
      top: `${clampTop(top)}px`,
      left: `${clampLeft(left)}px`,
      width: isMobile ? `${tooltipWidth}px` : undefined,
    };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[100]"
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
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              }}
            />
          )}

          <motion.div
            className="fixed z-[102] w-80 max-w-[calc(100vw-24px)]"
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
