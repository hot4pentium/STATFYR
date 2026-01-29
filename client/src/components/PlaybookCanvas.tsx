import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight, Square, Triangle, Circle, X as XIcon, Undo2, Trash2, MousePointerClick, Save, Shield, Swords, Play, Pause, RotateCcw, Plus, HelpCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tool = "freedraw" | "arrow" | "square" | "xshape" | "triangle" | "circle" | "athlete" | "delete";

interface Point {
  x: number;
  y: number;
}

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
}

interface DrawnElement {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  fillColor?: string;
  lineWidth: number;
  label?: string;
}

interface KeyframeElementPosition {
  elementId: string;
  points: Point[];
}

interface Keyframe {
  id: string;
  positions: KeyframeElementPosition[];
  timestamp: number;
}

interface SavePlayData {
  name: string;
  description: string;
  canvasData: string;
  thumbnailData: string;
  category: string;
  keyframesData?: string;
}

interface PlaybookCanvasProps {
  athletes?: Athlete[];
  sport?: string;
  onSave?: (data: SavePlayData) => Promise<void>;
  isSaving?: boolean;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
  initialElements?: DrawnElement[];
  initialKeyframes?: Keyframe[];
  readOnly?: boolean;
  originalCanvasWidth?: number; // Original canvas width for scaling viewer
}

const SHAPE_SIZE = 22; // Reduced by ~10% for better canvas fit

export function PlaybookCanvas({ 
  athletes = [], 
  sport = "Football", 
  onSave, 
  isSaving = false, 
  onHasUnsavedChanges,
  initialElements = [],
  initialKeyframes = [],
  readOnly = false,
  originalCanvasWidth
}: PlaybookCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("freedraw");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isAthletePopoverOpen, setIsAthletePopoverOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [elements, setElements] = useState<DrawnElement[]>(initialElements);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dimensionsLocked, setDimensionsLocked] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [activeHalf, setActiveHalf] = useState<"offense" | "defense">("offense");
  const [playName, setPlayName] = useState("");
  const [playDescription, setPlayDescription] = useState("");
  const [playCategory, setPlayCategory] = useState("Offense");
  
  // Animation/Keyframe state
  const [keyframes, setKeyframes] = useState<Keyframe[]>(initialKeyframes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKeyframeIndex, setCurrentKeyframeIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const playbackKeyframesRef = useRef<Keyframe[]>([]);

  // Helper to scale elements based on canvas width ratio
  const scaleElements = useCallback((els: DrawnElement[], fromWidth: number, toWidth: number): DrawnElement[] => {
    if (!fromWidth || !toWidth || fromWidth === toWidth) return els;
    const scale = toWidth / fromWidth;
    return els.map(el => ({
      ...el,
      points: el.points.map(p => ({ x: p.x * scale, y: p.y * scale }))
    }));
  }, []);

  // Helper to scale keyframes based on canvas width ratio
  const scaleKeyframes = useCallback((kfs: Keyframe[], fromWidth: number, toWidth: number): Keyframe[] => {
    if (!fromWidth || !toWidth || fromWidth === toWidth) return kfs;
    const scale = toWidth / fromWidth;
    return kfs.map(kf => ({
      ...kf,
      positions: kf.positions.map(pos => ({
        ...pos,
        points: pos.points.map(p => ({ x: p.x * scale, y: p.y * scale }))
      }))
    }));
  }, []);

  // Sync elements when initialElements prop changes - scale if needed for viewer
  useEffect(() => {
    if (originalCanvasWidth && canvasSize.width > 0) {
      setElements(scaleElements(initialElements, originalCanvasWidth, canvasSize.width));
    } else {
      setElements(initialElements);
    }
  }, [JSON.stringify(initialElements), originalCanvasWidth, canvasSize.width, scaleElements]);

  // Sync keyframes when initialKeyframes prop changes - scale if needed for viewer
  useEffect(() => {
    if (originalCanvasWidth && canvasSize.width > 0) {
      setKeyframes(scaleKeyframes(initialKeyframes, originalCanvasWidth, canvasSize.width));
    } else {
      setKeyframes(initialKeyframes);
    }
    setCurrentKeyframeIndex(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  }, [JSON.stringify(initialKeyframes), originalCanvasWidth, canvasSize.width, scaleKeyframes]);

  // Clear canvas and reset dimensions when sport changes (only in edit mode, not when viewing saved plays)
  useEffect(() => {
    if (!readOnly && initialElements.length === 0) {
      setElements([]);
      setDimensionsLocked(false);
    }
  }, [sport, readOnly, initialElements.length]);

  // Notify parent when there are unsaved changes
  useEffect(() => {
    onHasUnsavedChanges?.(elements.length > 0 || keyframes.length > 0);
  }, [elements.length, keyframes.length, onHasUnsavedChanges]);

  // Reset keyframes when sport changes (only in edit mode, not when viewing saved plays)
  useEffect(() => {
    if (!readOnly && initialKeyframes.length === 0) {
      setKeyframes([]);
      setCurrentKeyframeIndex(0);
      setIsPlaying(false);
    }
  }, [sport, readOnly, initialKeyframes.length]);

  // Capture keyframes snapshot when playback starts
  useEffect(() => {
    if (isPlaying) {
      playbackKeyframesRef.current = [...keyframes];
    }
  }, [isPlaying]);

  // Animation playback engine - uses captured keyframes ref for stable playback
  useEffect(() => {
    const frozenKeyframes = playbackKeyframesRef.current;
    
    if (!isPlaying || frozenKeyframes.length < 2) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let startTime: number | null = null;
    const segmentDuration = 1000 / playbackSpeed; // ms per keyframe transition
    let isCancelled = false;

    const easeInOutQuad = (t: number): number => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };

    const animate = (timestamp: number) => {
      if (isCancelled) return;
      
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / segmentDuration, 1);
      const easedProgress = easeInOutQuad(rawProgress);
      
      setAnimationProgress(easedProgress);

      if (rawProgress >= 1) {
        const nextIndex = currentKeyframeIndex + 1;
        if (nextIndex < frozenKeyframes.length - 1) {
          // Reset progress BEFORE updating keyframe index to prevent destination blink
          setAnimationProgress(0);
          setCurrentKeyframeIndex(nextIndex);
          startTime = null;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentKeyframeIndex(frozenKeyframes.length - 1);
          setAnimationProgress(1);
          setTimeout(() => {
            if (!isCancelled) {
              setIsPlaying(false);
            }
          }, 300);
          return;
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, currentKeyframeIndex, playbackSpeed]);

  // Record a new keyframe with current element positions
  const recordKeyframe = useCallback(() => {
    if (elements.length === 0) return;

    const newKeyframe: Keyframe = {
      id: `kf-${Date.now()}`,
      positions: elements.map(el => ({
        elementId: el.id,
        points: el.points.map(p => ({ ...p }))
      })),
      timestamp: Date.now()
    };

    setKeyframes(prev => [...prev, newKeyframe]);
  }, [elements]);

  // Get interpolated element positions for animation
  const getInterpolatedElements = useCallback((): DrawnElement[] => {
    // Use frozen keyframes during playback for consistency
    const activeKeyframes = isPlaying ? playbackKeyframesRef.current : keyframes;
    
    if (activeKeyframes.length === 0) return elements;
    
    const currentKf = activeKeyframes[currentKeyframeIndex];
    if (!currentKf) return elements;

    // If not playing or only one keyframe or at last keyframe, show current keyframe state
    if (!isPlaying || activeKeyframes.length === 1 || currentKeyframeIndex >= activeKeyframes.length - 1) {
      // Build a set of all element IDs that exist in ANY keyframe
      const allKeyframedElementIds = new Set<string>();
      activeKeyframes.forEach(kf => {
        kf.positions.forEach(p => allKeyframedElementIds.add(p.elementId));
      });

      // Show elements that either:
      // 1. Exist in the current keyframe, OR
      // 2. Are brand new (not recorded in any keyframe yet) - so user can see what they just drew
      return elements
        .filter(el => {
          const existsInCurrentKf = currentKf.positions.some(p => p.elementId === el.id);
          const isNewElement = !allKeyframedElementIds.has(el.id);
          return existsInCurrentKf || isNewElement;
        })
        .map(el => {
          const kfPos = currentKf.positions.find(p => p.elementId === el.id);
          if (kfPos && kfPos.points.length === el.points.length) {
            return { ...el, points: kfPos.points };
          }
          return el;
        });
    }

    // Interpolate between current and next keyframe
    const nextKf = activeKeyframes[currentKeyframeIndex + 1];
    if (!nextKf) return elements;

    // During playback, only show elements that exist in the CURRENT keyframe
    // Elements added at later keyframes should not appear until we reach that keyframe
    return elements
      .filter(el => {
        // Only show elements that exist in the current keyframe
        return currentKf.positions.some(p => p.elementId === el.id);
      })
      .map(el => {
        const currentPos = currentKf.positions.find(p => p.elementId === el.id);
        const nextPos = nextKf.positions.find(p => p.elementId === el.id);

        // If element exists in current but not next, keep it at current position (it will disappear at next keyframe)
        if (currentPos && !nextPos) {
          if (currentPos.points.length === el.points.length) {
            return { ...el, points: currentPos.points };
          }
          return el;
        }

        // Handle missing positions - use element's current points as fallback
        const fromPoints = currentPos?.points || el.points;
        const toPoints = nextPos?.points || fromPoints; // If not in next, stay at current position

        // If point counts don't match, use the current position without interpolation
        if (fromPoints.length !== toPoints.length) {
          return { ...el, points: fromPoints };
        }

        const interpolatedPoints = fromPoints.map((cp, i) => {
          const np = toPoints[i];
          return {
            x: cp.x + (np.x - cp.x) * animationProgress,
            y: cp.y + (np.y - cp.y) * animationProgress
          };
        });
        return { ...el, points: interpolatedPoints };
      });
  }, [elements, keyframes, currentKeyframeIndex, animationProgress, isPlaying]);

  // Delete a specific keyframe
  const deleteKeyframe = useCallback((keyframeId: string) => {
    setKeyframes(prev => prev.filter(kf => kf.id !== keyframeId));
    if (currentKeyframeIndex >= keyframes.length - 1) {
      setCurrentKeyframeIndex(Math.max(0, keyframes.length - 2));
    }
  }, [keyframes.length, currentKeyframeIndex]);

  // Jump to a specific keyframe and update elements to match (for editing)
  const jumpToKeyframe = useCallback((index: number) => {
    setIsPlaying(false);
    setCurrentKeyframeIndex(index);
    setAnimationProgress(0);
    
    // In edit mode, update elements to match the keyframe positions so user can see and edit from that pose
    if (!readOnly && keyframes[index]) {
      const kf = keyframes[index];
      setElements(prev => prev.map(el => {
        const kfPos = kf.positions.find(p => p.elementId === el.id);
        if (kfPos && kfPos.points.length === el.points.length) {
          return { ...el, points: kfPos.points };
        }
        return el;
      }));
    }
  }, [readOnly, keyframes]);

  // Update the current keyframe with current element positions (for editing existing keyframes)
  const updateCurrentKeyframe = useCallback(() => {
    if (elements.length === 0 || currentKeyframeIndex >= keyframes.length) return;
    
    const updatedPositions: KeyframeElementPosition[] = elements.map(el => ({
      elementId: el.id,
      points: el.points.map(p => ({ x: p.x, y: p.y }))
    }));

    setKeyframes(prev => prev.map((kf, idx) => 
      idx === currentKeyframeIndex 
        ? { ...kf, positions: updatedPositions, timestamp: Date.now() }
        : kf
    ));
  }, [elements, currentKeyframeIndex, keyframes.length]);

  // Clear all keyframes and start fresh
  const clearAllKeyframes = useCallback(() => {
    setKeyframes([]);
    setCurrentKeyframeIndex(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  }, []);

  // Reset animation to start - updates elements to first keyframe state
  const resetAnimation = useCallback(() => {
    setIsPlaying(false);
    setCurrentKeyframeIndex(0);
    setAnimationProgress(0);
    
    // Update elements to first keyframe positions
    // Note: The getInterpolatedElements function handles filtering during playback
    // For edit mode reset, we restore positions but keep all elements visible
    if (keyframes[0]) {
      const kf = keyframes[0];
      setElements(prev => prev.map(el => {
        const kfPos = kf.positions.find(p => p.elementId === el.id);
        if (kfPos && kfPos.points.length === el.points.length) {
          return { ...el, points: kfPos.points };
        }
        return el;
      }));
    }
  }, [keyframes]);

  const sortedAthletes = [...athletes].sort((a, b) => 
    a.firstName.localeCompare(b.firstName)
  );

  const tools: { id: Tool; icon: React.ReactNode; label: string; color?: string }[] = [
    { id: "freedraw", icon: <Pencil className="h-5 w-5" />, label: "Free Draw" },
    { id: "arrow", icon: <ArrowRight className="h-5 w-5" />, label: "Arrow" },
    { id: "square", icon: <Square className="h-5 w-5" />, label: "Square" },
    { id: "xshape", icon: <XIcon className="h-5 w-5" />, label: "X Shape" },
    { id: "triangle", icon: <Triangle className="h-5 w-5" />, label: "Triangle" },
    { id: "circle", icon: <Circle className="h-5 w-5 text-red-500" />, label: "O Circle", color: "red" },
  ];

  const isShapeTool = (tool: Tool) => ["square", "xshape", "triangle", "circle", "athlete"].includes(tool);
  const isDraggableTool = (tool: Tool) => ["square", "xshape", "triangle", "circle", "arrow", "athlete"].includes(tool);

  const getToolColor = (tool: Tool) => {
    switch (tool) {
      case "circle": return "#ef4444";
      case "square": return "#22c55e";
      case "xshape": return "#000000";
      case "triangle": return "#eab308";
      case "athlete": return "#3b82f6";
      default: return "#ffffff";
    }
  };

  const getFillColor = (tool: Tool) => {
    switch (tool) {
      case "square": return "#22c55e";
      case "xshape": return "#000000";
      case "triangle": return "#eab308";
      default: return undefined;
    }
  };

  const getInitials = (athlete: Athlete) => {
    return `${athlete.firstName.charAt(0)}${athlete.lastName.charAt(0)}`.toUpperCase();
  };

  // Calculate canvas size - half field + a bit past midfield (except baseball = full)
  useEffect(() => {
    const calculateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Don't recalculate if dimensions are locked (prevents scroll-triggered changes)
      if (dimensionsLocked && canvasSize.width > 0) return;
      
      const containerWidth = container.clientWidth;
      const normalizedSport = sport?.toLowerCase();
      
      // Aspect ratio: height/width for half field + bit past midfield (~60% of field)
      // These ratios show half the field plus ~10-15% past center
      let aspectRatio = 1.0;
      
      if (normalizedSport === "basketball") {
        aspectRatio = 0.9; // Half court is roughly square
      } else if (normalizedSport === "football") {
        aspectRatio = 1.1; // Football field slightly taller
      } else if (normalizedSport === "soccer") {
        aspectRatio = 1.0; // Soccer half pitch
      } else if (normalizedSport === "baseball") {
        aspectRatio = 1.0; // Full diamond is roughly square
      } else if (normalizedSport === "volleyball") {
        aspectRatio = 1.1; // Volleyball half court
      }
      
      // Calculate height based on width and aspect ratio
      const width = containerWidth;
      const height = Math.round(width * aspectRatio);
      
      setCanvasSize({ width, height });
      setDimensionsLocked(true);
    };
    
    calculateSize();
    
    // Only recalculate on significant resize (orientation change)
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const newWidth = container.clientWidth;
      // Only unlock if width changed significantly (orientation change, not scroll)
      if (Math.abs(newWidth - canvasSize.width) > 50) {
        setDimensionsLocked(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sport, dimensionsLocked, canvasSize.width]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawSportBackground(ctx, canvas.width, canvas.height, sport, activeHalf);

    // Show interpolated/filtered elements during playback, in read-only mode, or when viewing keyframes in edit mode
    // This ensures elements only appear at keyframes where they were recorded
    const displayElements = (isPlaying || keyframes.length > 0) 
      ? getInterpolatedElements() 
      : elements;
    displayElements.forEach((element) => {
      drawElement(ctx, element);
    });
  }, [elements, sport, activeHalf, isPlaying, keyframes.length, readOnly, getInterpolatedElements]);

  useEffect(() => {
    redrawCanvas();
  }, [canvasSize, redrawCanvas, animationProgress, currentKeyframeIndex]);

  // Consistent styling constants
  const FIELD_GREEN = "#2d5a27";
  const FIELD_GREEN_STRIPE = "#346b2d";
  const COURT_TAN = "#c9a66b";
  const COURT_TAN_DARK = "#b89559";
  const LINE_WHITE = "#ffffff";
  const LINE_WIDTH = 2;

  const drawSportBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, sportType: string, half: "offense" | "defense") => {
    const normalizedSport = sportType?.toLowerCase();
    switch (normalizedSport) {
      case "baseball":
        drawBaseballField(ctx, width, height);
        break;
      case "basketball":
        drawBasketballCourt(ctx, width, height, half);
        break;
      case "football":
        drawFootballField(ctx, width, height, half);
        break;
      case "soccer":
        drawSoccerPitch(ctx, width, height, half);
        break;
      case "volleyball":
        drawVolleyballCourt(ctx, width, height, half);
        break;
      default:
        drawFootballField(ctx, width, height, half);
    }
  };

  // Baseball - Full diamond view
  const drawBaseballField = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Green grass background
    ctx.fillStyle = FIELD_GREEN;
    ctx.fillRect(0, 0, width, height);
    
    // Outfield arc (darker green)
    ctx.fillStyle = FIELD_GREEN_STRIPE;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.85, width * 0.48, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    // Infield dirt (tan)
    ctx.fillStyle = COURT_TAN;
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.85); // Home plate
    ctx.lineTo(width * 0.15, height * 0.5); // Third base
    ctx.lineTo(width / 2, height * 0.15); // Second base
    ctx.lineTo(width * 0.85, height * 0.5); // First base
    ctx.closePath();
    ctx.fill();
    
    // Base paths (white lines)
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.85);
    ctx.lineTo(width * 0.85, height * 0.5);
    ctx.lineTo(width / 2, height * 0.15);
    ctx.lineTo(width * 0.15, height * 0.5);
    ctx.closePath();
    ctx.stroke();
    
    // Pitcher's mound
    ctx.fillStyle = COURT_TAN_DARK;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.52, width * 0.04, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = LINE_WHITE;
    ctx.stroke();
    
    // Bases (white squares)
    const baseSize = width * 0.03;
    ctx.fillStyle = LINE_WHITE;
    // First base
    ctx.fillRect(width * 0.85 - baseSize/2, height * 0.5 - baseSize/2, baseSize, baseSize);
    // Second base
    ctx.fillRect(width / 2 - baseSize/2, height * 0.15 - baseSize/2, baseSize, baseSize);
    // Third base
    ctx.fillRect(width * 0.15 - baseSize/2, height * 0.5 - baseSize/2, baseSize, baseSize);
    // Home plate (pentagon)
    ctx.beginPath();
    const hx = width / 2, hy = height * 0.85;
    const hs = baseSize * 0.7;
    ctx.moveTo(hx, hy + hs);
    ctx.lineTo(hx - hs, hy);
    ctx.lineTo(hx - hs * 0.7, hy - hs);
    ctx.lineTo(hx + hs * 0.7, hy - hs);
    ctx.lineTo(hx + hs, hy);
    ctx.closePath();
    ctx.fill();
    
    // Batter's boxes
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = 1;
    ctx.strokeRect(hx - baseSize * 2.5, hy - baseSize, baseSize * 1.5, baseSize * 2.5);
    ctx.strokeRect(hx + baseSize, hy - baseSize, baseSize * 1.5, baseSize * 2.5);
  };

  // Basketball - Half court + past center
  const drawBasketballCourt = (ctx: CanvasRenderingContext2D, width: number, height: number, half: "offense" | "defense") => {
    // Flip coordinate system for defense view
    ctx.save();
    if (half === "defense") {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
    
    // Hardwood floor
    ctx.fillStyle = COURT_TAN;
    ctx.fillRect(0, 0, width, height);
    
    // Wood grain effect
    ctx.strokeStyle = COURT_TAN_DARK;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    
    // Court boundary
    const margin = width * 0.05;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    
    // Center line (at ~85% from top to show bit of other half)
    const centerY = height * 0.85;
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(width - margin, centerY);
    ctx.stroke();
    
    // Center circle (partial, at center line)
    const centerCircleRadius = width * 0.15;
    ctx.beginPath();
    ctx.arc(width / 2, centerY, centerCircleRadius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    
    // Key/paint area
    const keyWidth = width * 0.32;
    const keyHeight = height * 0.22;
    const keyX = (width - keyWidth) / 2;
    const keyY = margin;
    
    // Key rectangle
    ctx.strokeRect(keyX, keyY, keyWidth, keyHeight);
    
    // Free throw circle
    const ftCircleRadius = keyWidth / 2;
    ctx.beginPath();
    ctx.arc(width / 2, keyY + keyHeight, ftCircleRadius, 0, Math.PI);
    ctx.stroke();
    
    // Backboard (behind baseline)
    const backboardY = margin * 0.3;
    ctx.lineWidth = 4;
    ctx.strokeStyle = LINE_WHITE;
    ctx.beginPath();
    ctx.moveTo(width / 2 - width * 0.07, backboardY);
    ctx.lineTo(width / 2 + width * 0.07, backboardY);
    ctx.stroke();
    
    // Rim/hoop (behind baseline, attached to backboard)
    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeStyle = "#ff6b35";
    ctx.beginPath();
    ctx.arc(width / 2, backboardY + width * 0.025, width * 0.025, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Net indication (small lines hanging from rim)
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    const rimCenterY = backboardY + width * 0.025;
    const rimRadius = width * 0.025;
    for (let i = -3; i <= 3; i++) {
      const x = width / 2 + (i * rimRadius * 0.4);
      ctx.beginPath();
      ctx.moveTo(x, rimCenterY + rimRadius * 0.5);
      ctx.lineTo(x, rimCenterY + rimRadius * 1.5);
      ctx.stroke();
    }
    
    // 3-point line - connects directly to baseline
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    const threePointRadius = width * 0.38;
    const threePointCenterY = margin + height * 0.04;
    
    // Calculate where the arc meets the baseline
    const arcStartX = width / 2 - Math.sqrt(threePointRadius * threePointRadius - (threePointCenterY - margin) * (threePointCenterY - margin));
    const arcEndX = width / 2 + Math.sqrt(threePointRadius * threePointRadius - (threePointCenterY - margin) * (threePointCenterY - margin));
    
    ctx.beginPath();
    // Left straight portion along baseline
    ctx.moveTo(margin, margin);
    ctx.lineTo(arcStartX, margin);
    // Arc from left to right
    const startAngle = Math.acos((arcStartX - width / 2) / threePointRadius) + Math.PI;
    const endAngle = Math.acos((arcEndX - width / 2) / threePointRadius);
    ctx.arc(width / 2, threePointCenterY, threePointRadius, Math.PI + Math.asin((threePointCenterY - margin) / threePointRadius), -Math.asin((threePointCenterY - margin) / threePointRadius), true);
    // Right straight portion along baseline
    ctx.lineTo(width - margin, margin);
    ctx.stroke();
    
    ctx.restore();
  };

  // Football - Half field + past midfield
  const drawFootballField = (ctx: CanvasRenderingContext2D, width: number, height: number, half: "offense" | "defense") => {
    // Flip coordinate system for defense view
    ctx.save();
    if (half === "defense") {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
    
    // Green grass
    ctx.fillStyle = FIELD_GREEN;
    ctx.fillRect(0, 0, width, height);
    
    // Yard line stripes
    const stripeHeight = height / 11; // 10 yard increments + endzone
    for (let i = 0; i < 11; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = FIELD_GREEN_STRIPE;
        ctx.fillRect(0, i * stripeHeight, width, stripeHeight);
      }
    }
    
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    
    // Sidelines (wider field with smaller margins)
    const margin = width * 0.04;
    ctx.beginPath();
    ctx.moveTo(margin, 0);
    ctx.lineTo(margin, height);
    ctx.moveTo(width - margin, 0);
    ctx.lineTo(width - margin, height);
    ctx.stroke();
    
    // End zone back line (top of canvas)
    const endZoneHeight = height * 0.1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, 0);
    ctx.lineTo(width - margin, 0);
    ctx.stroke();
    
    // Goal line (end of endzone)
    ctx.beginPath();
    ctx.moveTo(margin, endZoneHeight);
    ctx.lineTo(width - margin, endZoneHeight);
    ctx.stroke();
    
    // Yard lines (every 10 yards) - start from 10 yard line
    ctx.lineWidth = LINE_WIDTH;
    const playableHeight = height - endZoneHeight;
    for (let i = 1; i <= 5; i++) {
      const y = endZoneHeight + (playableHeight * i * 0.18);
      if (y < height) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }
    }
    
    // Hash marks
    const hashX1 = width * 0.38;
    const hashX2 = width * 0.62;
    const hashLen = width * 0.025;
    for (let i = 0; i <= 50; i++) {
      const y = endZoneHeight + (playableHeight * i * 0.018);
      if (y < height && i % 5 !== 0) {
        ctx.beginPath();
        ctx.moveTo(hashX1 - hashLen, y);
        ctx.lineTo(hashX1, y);
        ctx.moveTo(hashX2, y);
        ctx.lineTo(hashX2 + hashLen, y);
        ctx.stroke();
      }
    }
    
    // Yard numbers - rotated vertically on either side of the line
    ctx.fillStyle = LINE_WHITE;
    ctx.font = `bold ${width * 0.055}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const yardNumbers = [10, 20, 30, 40, 50];
    const numberSpacing = width * 0.04;
    
    yardNumbers.forEach((num, i) => {
      const lineY = endZoneHeight + (playableHeight * (i + 1) * 0.18);
      if (lineY < height - 20) {
        const tens = Math.floor(num / 10).toString();
        const ones = (num % 10).toString();
        const sideOffset = width * 0.07;
        
        const leftX = margin + sideOffset;
        const rightX = width - margin - sideOffset;
        
        // Left side - rotated 90 degrees counterclockwise (facing left sideline)
        // Ones digit above the line, tens below (reading "50" top to bottom)
        ctx.save();
        ctx.translate(leftX, lineY - numberSpacing);
        if (half === "defense") ctx.scale(1, -1);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(ones, 0, 0);
        ctx.restore();
        
        ctx.save();
        ctx.translate(leftX, lineY + numberSpacing);
        if (half === "defense") ctx.scale(1, -1);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(tens, 0, 0);
        ctx.restore();
        
        // Right side - rotated 90 degrees clockwise (facing right sideline)
        // Tens digit above the line, ones below (reading "50" top to bottom)
        ctx.save();
        ctx.translate(rightX, lineY - numberSpacing);
        if (half === "defense") ctx.scale(1, -1);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(tens, 0, 0);
        ctx.restore();
        
        ctx.save();
        ctx.translate(rightX, lineY + numberSpacing);
        if (half === "defense") ctx.scale(1, -1);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(ones, 0, 0);
        ctx.restore();
      }
    });
    
    ctx.restore();
  };

  // Soccer - Half pitch + past center
  const drawSoccerPitch = (ctx: CanvasRenderingContext2D, width: number, height: number, half: "offense" | "defense") => {
    // Flip coordinate system for defense view
    ctx.save();
    if (half === "defense") {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
    
    // Green grass
    ctx.fillStyle = FIELD_GREEN;
    ctx.fillRect(0, 0, width, height);
    
    // Grass stripes
    const stripeHeight = height / 10;
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = FIELD_GREEN_STRIPE;
        ctx.fillRect(0, i * stripeHeight, width, stripeHeight);
      }
    }
    
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    
    // Pitch boundary
    const margin = width * 0.05;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    
    // Center line (at ~85% from top)
    const centerY = height * 0.85;
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(width - margin, centerY);
    ctx.stroke();
    
    // Center circle (partial)
    const centerCircleRadius = width * 0.18;
    ctx.beginPath();
    ctx.arc(width / 2, centerY, centerCircleRadius, Math.PI, 2 * Math.PI);
    ctx.stroke();
    
    // Center spot
    ctx.fillStyle = LINE_WHITE;
    ctx.beginPath();
    ctx.arc(width / 2, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Penalty area (18-yard box) - narrower width
    const penaltyWidth = width * 0.55;
    const penaltyHeight = height * 0.2;
    const penaltyX = (width - penaltyWidth) / 2;
    ctx.strokeRect(penaltyX, margin, penaltyWidth, penaltyHeight);
    
    // Goal area (6-yard box)
    const goalAreaWidth = width * 0.28;
    const goalAreaHeight = height * 0.07;
    const goalAreaX = (width - goalAreaWidth) / 2;
    ctx.strokeRect(goalAreaX, margin, goalAreaWidth, goalAreaHeight);
    
    // Penalty spot
    const penaltySpotY = margin + penaltyHeight * 0.65;
    ctx.fillStyle = LINE_WHITE;
    ctx.beginPath();
    ctx.arc(width / 2, penaltySpotY, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Penalty arc (the "D") - at the top of the penalty box, curving outward
    const penaltyBoxBottom = margin + penaltyHeight;
    const arcRadius = width * 0.12;
    // Calculate the angle where arc meets penalty box edges
    const halfPenaltyWidth = penaltyWidth / 2;
    // The arc is centered on penalty spot but only draw the part outside the box
    const angleAtBox = Math.asin((penaltyBoxBottom - penaltySpotY) / arcRadius);
    ctx.beginPath();
    ctx.arc(width / 2, penaltySpotY, arcRadius, angleAtBox, Math.PI - angleAtBox);
    ctx.stroke();
    
    // Goal (behind the endline)
    const goalWidth = width * 0.18;
    const goalDepth = margin * 0.7;
    ctx.lineWidth = 3;
    ctx.strokeStyle = LINE_WHITE;
    // Goal posts and crossbar
    ctx.beginPath();
    ctx.moveTo((width - goalWidth) / 2, margin);
    ctx.lineTo((width - goalWidth) / 2, margin - goalDepth);
    ctx.lineTo((width + goalWidth) / 2, margin - goalDepth);
    ctx.lineTo((width + goalWidth) / 2, margin);
    ctx.stroke();
    
    // Goal net effect (simple lines)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#cccccc";
    const netSpacing = goalWidth / 6;
    for (let i = 1; i < 6; i++) {
      const x = (width - goalWidth) / 2 + netSpacing * i;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, margin - goalDepth);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Volleyball - Half court + past center
  const drawVolleyballCourt = (ctx: CanvasRenderingContext2D, width: number, height: number, half: "offense" | "defense") => {
    // Flip coordinate system for defense view
    ctx.save();
    if (half === "defense") {
      ctx.translate(0, height);
      ctx.scale(1, -1);
    }
    
    // Court floor
    ctx.fillStyle = COURT_TAN;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle floor pattern
    ctx.strokeStyle = COURT_TAN_DARK;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    
    // Court boundary
    const margin = width * 0.08;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);
    
    // Net/center line (at ~85% from top)
    const centerY = height * 0.85;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(margin, centerY);
    ctx.lineTo(width - margin, centerY);
    ctx.stroke();
    
    // Net posts (visual indicators)
    ctx.fillStyle = "#666";
    ctx.fillRect(margin - 5, centerY - 3, 10, 6);
    ctx.fillRect(width - margin - 5, centerY - 3, 10, 6);
    
    // Judges ladders (referee stands) - outside the court on either side
    const ladderWidth = width * 0.025;
    const ladderHeight = height * 0.06;
    ctx.fillStyle = "#555";
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    // Left side ladder
    ctx.fillRect(margin - ladderWidth - 8, centerY - ladderHeight / 2, ladderWidth, ladderHeight);
    ctx.strokeRect(margin - ladderWidth - 8, centerY - ladderHeight / 2, ladderWidth, ladderHeight);
    // Right side ladder
    ctx.fillRect(width - margin + 8, centerY - ladderHeight / 2, ladderWidth, ladderHeight);
    ctx.strokeRect(width - margin + 8, centerY - ladderHeight / 2, ladderWidth, ladderHeight);
    
    // Ladder rungs
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 1;
    const rungCount = 3;
    for (let i = 1; i <= rungCount; i++) {
      const rungY = centerY - ladderHeight / 2 + (ladderHeight / (rungCount + 1)) * i;
      // Left ladder rungs
      ctx.beginPath();
      ctx.moveTo(margin - ladderWidth - 8, rungY);
      ctx.lineTo(margin - 8, rungY);
      ctx.stroke();
      // Right ladder rungs
      ctx.beginPath();
      ctx.moveTo(width - margin + 8, rungY);
      ctx.lineTo(width - margin + ladderWidth + 8, rungY);
      ctx.stroke();
    }
    
    // Attack line (3 meters from center)
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    const attackLineY = height * 0.5;
    ctx.beginPath();
    ctx.moveTo(margin, attackLineY);
    ctx.lineTo(width - margin, attackLineY);
    ctx.stroke();
    
    // Service zone indicators at baseline
    ctx.lineWidth = 1;
    const serviceZoneWidth = (width - margin * 2) / 6;
    for (let i = 1; i < 6; i++) {
      const x = margin + serviceZoneWidth * i;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, margin + height * 0.03);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawnElement) => {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.fillColor || element.color;
    ctx.lineWidth = element.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (element.tool) {
      case "freedraw":
        if (element.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
        break;

      case "arrow":
        if (element.points.length < 2) return;
        const start = element.points[0];
        const end = element.points[1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 15;

        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        break;

      case "square":
        const sqCenter = element.points[0];
        const half = SHAPE_SIZE / 2;
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(sqCenter.x - half, sqCenter.y - half, SHAPE_SIZE, SHAPE_SIZE);
        ctx.strokeStyle = "#16a34a";
        ctx.strokeRect(sqCenter.x - half, sqCenter.y - half, SHAPE_SIZE, SHAPE_SIZE);
        break;

      case "xshape":
        const xCenter = element.points[0];
        const xHalf = SHAPE_SIZE / 2;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(xCenter.x - xHalf, xCenter.y - xHalf);
        ctx.lineTo(xCenter.x + xHalf, xCenter.y + xHalf);
        ctx.moveTo(xCenter.x + xHalf, xCenter.y - xHalf);
        ctx.lineTo(xCenter.x - xHalf, xCenter.y + xHalf);
        ctx.stroke();
        ctx.lineWidth = element.lineWidth;
        break;

      case "triangle":
        const triCenter = element.points[0];
        const triHalf = SHAPE_SIZE / 2;
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.moveTo(triCenter.x, triCenter.y - triHalf);
        ctx.lineTo(triCenter.x + triHalf, triCenter.y + triHalf);
        ctx.lineTo(triCenter.x - triHalf, triCenter.y + triHalf);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#ca8a04";
        ctx.stroke();
        break;

      case "circle":
        const circCenter = element.points[0];
        const radius = SHAPE_SIZE / 2;

        ctx.strokeStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(circCenter.x, circCenter.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("O", circCenter.x, circCenter.y);
        break;

      case "athlete":
        const athCenter = element.points[0];
        const athRadius = SHAPE_SIZE / 2;

        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(athCenter.x, athCenter.y, athRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2563eb";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(element.label || "", athCenter.x, athCenter.y);
        break;
    }
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const findElementAtPoint = (point: Point): DrawnElement | null => {
    // Use displayed elements (which have keyframe positions applied) for hit testing
    const displayedElements = (keyframes.length > 0) ? getInterpolatedElements() : elements;
    
    for (let i = displayedElements.length - 1; i >= 0; i--) {
      const el = displayedElements[i];
      if (!isDraggableTool(el.tool)) continue;

      if (isShapeTool(el.tool)) {
        const center = el.points[0];
        const dist = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
        if (dist <= SHAPE_SIZE / 2 + 10) {
          // Return the element from elements array (not the interpolated one) so we can modify it
          return elements.find(e => e.id === el.id) || el;
        }
      } else if (el.tool === "arrow" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[1];
        const distToLine = pointToLineDistance(point, start, end);
        if (distToLine <= 15) {
          return elements.find(e => e.id === el.id) || el;
        }
      }
    }
    return null;
  };

  const pointToLineDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPoint(e);

    const clickedElement = findElementAtPoint(point);
    
    if (selectedTool === "delete") {
      if (clickedElement) {
        setElements((prev) => prev.filter((el) => el.id !== clickedElement.id));
      }
      return;
    }

    if (clickedElement) {
      setIsDragging(true);
      setDraggedElementId(clickedElement.id);
      
      // Use displayed position for drag offset calculation (from keyframe if applicable)
      const displayedElements = (keyframes.length > 0) ? getInterpolatedElements() : elements;
      const displayedElement = displayedElements.find(e => e.id === clickedElement.id) || clickedElement;
      
      if (clickedElement.tool === "arrow") {
        const midX = (displayedElement.points[0].x + displayedElement.points[1].x) / 2;
        const midY = (displayedElement.points[0].y + displayedElement.points[1].y) / 2;
        setDragOffset({ x: point.x - midX, y: point.y - midY });
      } else {
        setDragOffset({
          x: point.x - displayedElement.points[0].x,
          y: point.y - displayedElement.points[0].y,
        });
      }
      return;
    }

    if (selectedTool === "athlete") {
      if (!selectedAthlete) return;
      const newElement: DrawnElement = {
        id: crypto.randomUUID(),
        tool: selectedTool,
        points: [point],
        color: getToolColor(selectedTool),
        lineWidth: 3,
        label: getInitials(selectedAthlete),
      };
      setElements((prev) => [...prev, newElement]);
      return;
    }

    if (isShapeTool(selectedTool)) {
      const newElement: DrawnElement = {
        id: crypto.randomUUID(),
        tool: selectedTool,
        points: [point],
        color: getToolColor(selectedTool),
        fillColor: getFillColor(selectedTool),
        lineWidth: 3,
      };
      setElements((prev) => [...prev, newElement]);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    setLastPoint(point);
    setCurrentPath([point]);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPoint(e);

    if (isDragging && draggedElementId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== draggedElementId) return el;

          if (el.tool === "arrow") {
            const midX = (el.points[0].x + el.points[1].x) / 2;
            const midY = (el.points[0].y + el.points[1].y) / 2;
            const newMidX = point.x - dragOffset.x;
            const newMidY = point.y - dragOffset.y;
            const dx = newMidX - midX;
            const dy = newMidY - midY;
            return {
              ...el,
              points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }

          return {
            ...el,
            points: [{ x: point.x - dragOffset.x, y: point.y - dragOffset.y }],
          };
        })
      );
      return;
    }

    if (!isDrawing || !startPoint) return;
    if (isShapeTool(selectedTool)) return;

    setLastPoint(point);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (selectedTool === "freedraw") {
      setCurrentPath((prev) => [...prev, point]);
    }

    redrawCanvas();

    const tempElement: DrawnElement = {
      id: "temp",
      tool: selectedTool,
      points: selectedTool === "freedraw" ? [...currentPath, point] : [startPoint, point],
      color: getToolColor(selectedTool),
      lineWidth: 3,
    };
    drawElement(ctx, tempElement);
  };

  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedElementId(null);
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    if (!isDrawing || !startPoint) return;
    if (isShapeTool(selectedTool)) {
      setIsDrawing(false);
      return;
    }

    let finalPoints: Point[];
    if (selectedTool === "freedraw") {
      finalPoints = currentPath;
    } else if (selectedTool === "arrow" && lastPoint) {
      finalPoints = [startPoint, lastPoint];
    } else {
      finalPoints = currentPath.length >= 2 ? currentPath : [];
    }

    if (finalPoints.length >= 2) {
      const newElement: DrawnElement = {
        id: crypto.randomUUID(),
        tool: selectedTool,
        points: finalPoints,
        color: getToolColor(selectedTool),
        lineWidth: 3,
      };
      setElements((prev) => [...prev, newElement]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setLastPoint(null);
    setCurrentPath([]);
  };

  const handleUndo = () => {
    setElements((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setElements([]);
  };

  const handleSelectAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSelectedTool("athlete");
    setIsAthletePopoverOpen(false);
  };

  const handleSavePlay = async () => {
    if (!onSave || !playName.trim()) return;
    
    // Store elements with canvas width for proper scaling when viewing
    const canvasData = JSON.stringify({
      elements,
      canvasWidth: canvasSize.width
    });
    
    // Capture canvas as thumbnail
    const canvas = canvasRef.current;
    const thumbnailData = canvas ? canvas.toDataURL("image/png", 0.5) : "";
    
    await onSave({
      name: playName.trim(),
      description: playDescription.trim(),
      canvasData,
      thumbnailData,
      category: playCategory,
      keyframesData: keyframes.length > 0 ? JSON.stringify({ keyframes, canvasWidth: canvasSize.width }) : undefined,
    });
    
    setIsSaveDialogOpen(false);
    setPlayName("");
    setPlayDescription("");
    setPlayCategory("Offense");
    setKeyframes([]);
    setElements([]);
  };

  return (
    <div className="flex flex-col gap-4" data-testid="playbook-canvas-container">
      <div className="flex flex-wrap gap-2 p-3 bg-background/95 dark:bg-card/95 rounded-lg border border-white/10 backdrop-blur-sm shadow-lg sticky top-0 z-10" data-testid="playbook-toolbar">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={selectedTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTool(tool.id)}
            className={`gap-2 ${tool.color === "red" ? "text-red-500 hover:text-red-400" : ""}`}
            data-testid={`tool-${tool.id}`}
          >
            {tool.icon}
            <span className="hidden sm:inline">{tool.label}</span>
          </Button>
        ))}

        <Popover open={isAthletePopoverOpen} onOpenChange={setIsAthletePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={selectedTool === "athlete" ? "default" : "outline"}
              size="sm"
              className="gap-2 text-blue-500 hover:text-blue-400"
              data-testid="tool-athlete"
            >
              <Circle className="h-5 w-5 fill-blue-500" />
              <span className="hidden sm:inline">{selectedAthlete ? getInitials(selectedAthlete) : "Athlete"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0" align="start">
            <ScrollArea className="h-[200px]">
              <div className="p-2">
                <p className="text-xs text-muted-foreground mb-2 px-2">Select an athlete</p>
                {sortedAthletes.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2 py-4 text-center">No athletes on team</p>
                ) : (
                  sortedAthletes.map((athlete) => (
                    <Button
                      key={athlete.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => handleSelectAthlete(athlete)}
                      data-testid={`athlete-option-${athlete.id}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(athlete)}
                      </div>
                      {athlete.firstName} {athlete.lastName}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button
          variant={selectedTool === "delete" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTool("delete")}
          className="gap-2 text-orange-500 hover:text-orange-400"
          data-testid="tool-delete"
        >
          <MousePointerClick className="h-5 w-5" />
          <span className="hidden sm:inline">Delete</span>
        </Button>

        {sport?.toLowerCase() !== "baseball" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveHalf(activeHalf === "offense" ? "defense" : "offense")}
            className={`gap-2 ${activeHalf === "offense" ? "text-green-500 border-green-500/50" : "text-red-500 border-red-500/50"}`}
            data-testid="toggle-half"
          >
            {activeHalf === "offense" ? <Swords className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            <span className="hidden sm:inline">{activeHalf === "offense" ? "Offense" : "Defense"}</span>
          </Button>
        )}

        {/* Animation Controls */}
        {!readOnly && (
          <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={recordKeyframe}
              disabled={elements.length === 0 || isPlaying}
              className="gap-1 text-amber-500 border-amber-500/50 hover:bg-amber-500/20"
              title="Record current positions as a new keyframe"
              data-testid="button-record-keyframe"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Keyframe</span>
            </Button>
            {keyframes.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={updateCurrentKeyframe}
                  disabled={elements.length === 0 || isPlaying}
                  className="gap-1 text-blue-500 border-blue-500/50 hover:bg-blue-500/20"
                  title={`Update keyframe ${currentKeyframeIndex + 1} with current positions`}
                  data-testid="button-update-keyframe"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Update</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPlaying}
                      className="gap-1 text-red-500 border-red-500/50 hover:bg-red-500/20"
                      title="Clear all keyframes and start over"
                      data-testid="button-clear-keyframes"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Clear</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Keyframes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all {keyframes.length} keyframe{keyframes.length !== 1 ? 's' : ''} and reset your animation. Your shapes will remain on the canvas, but you'll need to record new keyframes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllKeyframes} className="bg-red-600 hover:bg-red-700">
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsHelpModalOpen(true)}
              className="text-muted-foreground hover:text-white"
              title="How to animate plays"
              data-testid="button-animation-help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Playback Controls - show when keyframes exist */}
        {keyframes.length >= 2 && (
          <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-2">
            <Button
              variant="outline"
              size="icon"
              onClick={resetAnimation}
              disabled={currentKeyframeIndex === 0 && !isPlaying}
              className="h-8 w-8"
              title="Reset to start"
              data-testid="button-reset-animation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => jumpToKeyframe(Math.max(0, currentKeyframeIndex - 1))}
              disabled={currentKeyframeIndex === 0 || isPlaying}
              className="h-8 w-8"
              data-testid="button-prev-keyframe"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`h-8 w-8 ${isPlaying ? "bg-green-600 hover:bg-green-700" : ""}`}
              title={isPlaying ? "Pause" : "Play animation"}
              data-testid="button-play-animation"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => jumpToKeyframe(Math.min(keyframes.length - 1, currentKeyframeIndex + 1))}
              disabled={currentKeyframeIndex >= keyframes.length - 1 || isPlaying}
              className="h-8 w-8"
              data-testid="button-next-keyframe"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground">{playbackSpeed}x</span>
              <Slider
                value={[playbackSpeed]}
                onValueChange={([v]) => setPlaybackSpeed(v)}
                min={0.5}
                max={2}
                step={0.5}
                className="w-16"
                disabled={isPlaying}
              />
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {currentKeyframeIndex + 1}/{keyframes.length}
            </span>
          </div>
        )}

        {/* Keyframe count indicator when < 2 keyframes */}
        {keyframes.length === 1 && (
          <span className="text-xs text-amber-500 ml-2">1 keyframe (add more to animate)</span>
        )}

        <div className="flex-1" />

        {onSave && (
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                size="sm" 
                disabled={elements.length === 0} 
                className="gap-2 bg-green-600 hover:bg-green-700" 
                data-testid="tool-save"
              >
                <Save className="h-5 w-5" />
                <span className="hidden sm:inline">Save Play</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Save Play</DialogTitle>
                <DialogDescription>
                  Give your play a name and description so you can find it later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="play-name">Play Name</Label>
                  <Input
                    id="play-name"
                    placeholder="e.g., Zone Defense Setup"
                    value={playName}
                    onChange={(e) => setPlayName(e.target.value)}
                    data-testid="input-play-name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="play-description">Description (optional)</Label>
                  <Textarea
                    id="play-description"
                    placeholder="Describe when and how to use this play..."
                    value={playDescription}
                    onChange={(e) => setPlayDescription(e.target.value)}
                    rows={3}
                    data-testid="input-play-description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="play-category">Category</Label>
                  <Select value={playCategory} onValueChange={setPlayCategory}>
                    <SelectTrigger data-testid="select-play-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Offense">Offense</SelectItem>
                      <SelectItem value="Defense">Defense</SelectItem>
                      <SelectItem value="Special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSavePlay} 
                  disabled={!playName.trim() || isSaving}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-save-play"
                >
                  {isSaving ? "Saving..." : "Save Play"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Button variant="outline" size="sm" onClick={handleUndo} disabled={elements.length === 0} className="gap-2" data-testid="tool-undo">
          <Undo2 className="h-5 w-5" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={elements.length === 0} className="gap-2 text-red-500 hover:text-red-400" data-testid="tool-clear">
              <Trash2 className="h-5 w-5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Canvas</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clear the canvas? This will remove all your drawings and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear} className="bg-red-500 hover:bg-red-600">Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div ref={containerRef} className="relative w-full rounded-lg border border-white/10">
        <canvas
          ref={canvasRef}
          width={canvasSize.width || 400}
          height={canvasSize.height || 250}
          className={`touch-none max-w-full max-h-full ${readOnly || isPlaying ? "cursor-default" : "cursor-crosshair"}`}
          onMouseDown={!readOnly && !isPlaying ? handleStart : undefined}
          onMouseMove={!readOnly && !isPlaying ? handleMove : undefined}
          onMouseUp={!readOnly && !isPlaying ? handleEnd : undefined}
          onMouseLeave={!readOnly && !isPlaying ? handleEnd : undefined}
          onTouchStart={!readOnly && !isPlaying ? handleStart : undefined}
          onTouchMove={!readOnly && !isPlaying ? handleMove : undefined}
          onTouchEnd={!readOnly && !isPlaying ? handleEnd : undefined}
          data-testid="playbook-canvas"
        />
      </div>

      {/* Keyframe Timeline */}
      {keyframes.length > 0 && (
        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Timeline</span>
            <span className="text-xs text-amber-500">({keyframes.length} keyframes)</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {keyframes.map((kf, index) => (
              <div
                key={kf.id}
                className={`relative flex-shrink-0 w-12 h-12 rounded-lg border-2 cursor-pointer transition-all ${
                  index === currentKeyframeIndex
                    ? "border-primary bg-primary/20 ring-2 ring-primary/50"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                }`}
                onClick={() => jumpToKeyframe(index)}
                data-testid={`keyframe-${index}`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                {!readOnly && (
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteKeyframe(kf.id);
                    }}
                    title="Delete keyframe"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animation Help Modal */}
      <Dialog open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              How to Animate Plays
            </DialogTitle>
            <DialogDescription>
              Create step-by-step animations to show player movements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Set up your starting positions</p>
                  <p className="text-sm text-muted-foreground">Place shapes (squares, circles, triangles) and draw arrows to show the initial formation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Record your first keyframe</p>
                  <p className="text-sm text-muted-foreground">Click the <span className="text-amber-500 font-medium">+ Keyframe</span> button to save the starting positions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Move shapes to their next positions</p>
                  <p className="text-sm text-muted-foreground">Drag shapes to where they should move. You can also add new shapes or arrows.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <p className="font-medium">Record another keyframe</p>
                  <p className="text-sm text-muted-foreground">Click <span className="text-amber-500 font-medium">+ Keyframe</span> again. Repeat steps 3-4 for each movement phase.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-sm font-bold flex-shrink-0">▶</div>
                <div>
                  <p className="font-medium">Play your animation</p>
                  <p className="text-sm text-muted-foreground">Once you have 2+ keyframes, playback controls appear. Press play to watch your animated play!</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
              <p className="text-sm text-blue-200">
                <strong>Edit existing keyframes:</strong> Click a keyframe in the timeline to jump to it, make changes, then click <span className="text-blue-400 font-medium">Update</span> to save.
              </p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-2">
              <p className="text-sm text-amber-200">
                <strong>Tip:</strong> Team members viewing saved plays can also play animations at different speeds.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHelpModalOpen(false)}>Got it!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
