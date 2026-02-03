import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight, Square, Triangle, Circle, X as XIcon, Undo2, Trash2, MousePointerClick, MousePointer, Save, Shield, Swords, Play, Pause, RotateCcw, Plus, HelpCircle, ChevronLeft, ChevronRight, RefreshCw, Film } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tool = "select" | "freedraw" | "arrow" | "square" | "xshape" | "triangle" | "circle" | "athlete" | "ball" | "delete";

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

const SHAPE_SIZE = 16; // Smaller to fit 22 players on football field

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
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [isAnimationMode, setIsAnimationMode] = useState(false);
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
  // Master list of all elements ever created (for restoring from keyframes)
  const allElementsRef = useRef<Map<string, DrawnElement>>(new Map());
  // Track last placement to prevent duplicate element placement from rapid touch events
  const lastPlacementTimeRef = useRef<number>(0);
  const lastPlacementPosRef = useRef<{ x: number; y: number } | null>(null);
  // Undo stack - stores previous states
  const [undoStack, setUndoStack] = useState<DrawnElement[][]>([]);
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
  const currentKeyframeIndexRef = useRef(0); // Always-current ref for timeline clicks
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const playbackKeyframesRef = useRef<Keyframe[]>([]);
  
  // Track if current keyframe has unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [pendingNavigationIndex, setPendingNavigationIndex] = useState<number | null>(null);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  
  // Explicit edit mode for keyframes
  const [isEditingKeyframe, setIsEditingKeyframe] = useState(false);
  const [editingKeyframeId, setEditingKeyframeId] = useState<string | null>(null);
  
  // Keep keyframes ref in sync to avoid stale closures in pointer handlers
  const keyframesRef = useRef<Keyframe[]>([]);
  useEffect(() => {
    keyframesRef.current = keyframes;
  }, [keyframes]);
  
  // Keep ref in sync with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
    console.log('[hasUnsavedChanges sync] state:', hasUnsavedChanges, 'ref:', hasUnsavedChangesRef.current);
  }, [hasUnsavedChanges]);

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
    let elementsToSet: DrawnElement[];
    if (originalCanvasWidth && canvasSize.width > 0) {
      elementsToSet = scaleElements(initialElements, originalCanvasWidth, canvasSize.width);
    } else {
      elementsToSet = initialElements;
    }
    setElements(elementsToSet);
    
    // Populate master element list for playback
    elementsToSet.forEach(el => {
      allElementsRef.current.set(el.id, el);
    });
  }, [JSON.stringify(initialElements), originalCanvasWidth, canvasSize.width, scaleElements]);

  // Sync keyframes when initialKeyframes prop changes - scale if needed for viewer
  // Also populate master element list from keyframe data for playback
  useEffect(() => {
    let keyframesToSet: Keyframe[];
    if (originalCanvasWidth && canvasSize.width > 0) {
      keyframesToSet = scaleKeyframes(initialKeyframes, originalCanvasWidth, canvasSize.width);
    } else {
      keyframesToSet = initialKeyframes;
    }
    setKeyframes(keyframesToSet);
    setCurrentKeyframeIndex(0);
    setAnimationProgress(0);
    setIsPlaying(false);
    
    // Populate master element list from keyframe positions
    // This ensures elements added in later keyframes are available for playback
    keyframesToSet.forEach(kf => {
      kf.positions.forEach(pos => {
        // Check if we already have this element
        if (!allElementsRef.current.has(pos.elementId)) {
          // Try to find in current elements first
          const existingEl = initialElements.find(el => el.id === pos.elementId);
          if (existingEl) {
            allElementsRef.current.set(pos.elementId, existingEl);
          } else {
            // Create a placeholder element from keyframe data
            // We need to infer the element type from the points
            const isArrow = pos.points.length === 2;
            const placeholderEl: DrawnElement = {
              id: pos.elementId,
              tool: isArrow ? "arrow" : "circle",
              points: pos.points.map(p => ({ x: p.x, y: p.y })),
              color: isArrow ? "#f59e0b" : "#ef4444",
              lineWidth: 3,
            };
            allElementsRef.current.set(pos.elementId, placeholderEl);
          }
        }
      });
    });
  }, [JSON.stringify(initialKeyframes), JSON.stringify(initialElements), originalCanvasWidth, canvasSize.width, scaleKeyframes]);

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
          currentKeyframeIndexRef.current = nextIndex;
          setCurrentKeyframeIndex(nextIndex);
          startTime = null;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Stay on last keyframe when finished
          const lastIndex = frozenKeyframes.length - 1;
          currentKeyframeIndexRef.current = lastIndex;
          setCurrentKeyframeIndex(lastIndex);
          setAnimationProgress(1);
          setIsPlaying(false);
          setAnimationFinished(true);
          
          // Also restore elements to match the last keyframe positions
          const lastKf = frozenKeyframes[lastIndex];
          if (lastKf) {
            const restoredElements: DrawnElement[] = [];
            for (const kfPos of lastKf.positions) {
              const originalEl = allElementsRef.current.get(kfPos.elementId);
              if (originalEl && kfPos.points.length > 0) {
                restoredElements.push({
                  ...originalEl,
                  points: kfPos.points.map(p => ({ x: p.x, y: p.y }))
                });
              }
            }
            setElements(restoredElements);
          }
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

  // When animation finishes, restore elements to match the last keyframe
  useEffect(() => {
    if (animationFinished && keyframes.length > 0 && !isPlaying) {
      const lastKf = keyframes[keyframes.length - 1];
      if (lastKf) {
        const restoredElements: DrawnElement[] = [];
        for (const kfPos of lastKf.positions) {
          const originalEl = allElementsRef.current.get(kfPos.elementId);
          if (originalEl && kfPos.points.length > 0) {
            restoredElements.push({
              ...originalEl,
              points: kfPos.points.map(p => ({ x: p.x, y: p.y }))
            });
          }
        }
        if (restoredElements.length > 0) {
          setElements(restoredElements);
        }
      }
    }
  }, [animationFinished, keyframes, isPlaying]);

  // Record a new keyframe with current element positions
  // Save current state to undo stack before making changes
  const saveToUndoStack = useCallback(() => {
    setUndoStack(prev => {
      // Keep only last 20 states to prevent memory issues
      const newStack = [...prev, elements.map(el => ({
        ...el,
        points: el.points.map(p => ({ x: p.x, y: p.y }))
      }))];
      return newStack.slice(-20);
    });
  }, [elements]);

  // Undo last operation
  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setElements(previousState);
    
    // Restore elements to master list
    previousState.forEach(el => {
      allElementsRef.current.set(el.id, el);
    });
  }, [undoStack]);

  // Track pending navigation to new keyframe after recording (by keyframe ID for robustness)
  const [pendingRecordedKeyframeId, setPendingRecordedKeyframeId] = useState<string | null>(null);
  
  // Navigate to newly recorded keyframe after state updates - find by ID for deterministic navigation
  useEffect(() => {
    if (pendingRecordedKeyframeId !== null) {
      const newIndex = keyframes.findIndex(kf => kf.id === pendingRecordedKeyframeId);
      if (newIndex >= 0) {
        currentKeyframeIndexRef.current = newIndex;
        setCurrentKeyframeIndex(newIndex);
        setPendingRecordedKeyframeId(null);
      }
    }
  }, [keyframes, pendingRecordedKeyframeId]);
  
  const recordKeyframe = useCallback(() => {
    if (elements.length === 0) return;

    const keyframeId = `kf-${Date.now()}`;
    const newKeyframe: Keyframe = {
      id: keyframeId,
      positions: elements.map(el => ({
        elementId: el.id,
        points: el.points.map(p => ({ ...p }))
      })),
      timestamp: Date.now()
    };

    setKeyframes(prev => [...prev, newKeyframe]);
    // Schedule navigation to new keyframe via effect (by ID for determinism)
    setPendingRecordedKeyframeId(keyframeId);
    // Changes are now saved in the new keyframe, so reset unsaved changes flag
    setHasUnsavedChanges(false);
  }, [elements]);

  // Get interpolated element positions for animation playback
  // During editing, elements array is the source of truth
  // In read-only mode, always show keyframe positions
  const getInterpolatedElements = useCallback((): DrawnElement[] => {
    // Show keyframe positions when:
    // 1. In read-only mode with keyframes
    // 2. Animation has finished (stay on last keyframe until user edits)
    const shouldShowKeyframePositions = (readOnly || animationFinished) && keyframes.length > 0 && !isPlaying;
    
    if (shouldShowKeyframePositions) {
      const currentKf = keyframes[currentKeyframeIndex];
      if (currentKf) {
        // Build elements from current keyframe
        return currentKf.positions
          .map(kfPos => {
            const originalEl = allElementsRef.current.get(kfPos.elementId);
            if (!originalEl || kfPos.points.length === 0) return null;
            return {
              ...originalEl,
              points: kfPos.points.map(p => ({ x: p.x, y: p.y }))
            };
          })
          .filter((el): el is DrawnElement => el !== null);
      }
    }

    // NOT playing = just return current elements as-is (source of truth for editing)
    if (!isPlaying) {
      return elements;
    }

    // PLAYING: interpolate between keyframes using master element list
    const activeKeyframes = playbackKeyframesRef.current;
    if (activeKeyframes.length === 0) return elements;
    
    const currentKf = activeKeyframes[currentKeyframeIndex];
    if (!currentKf) return elements;

    // Helper to build element from keyframe position using master list
    const buildElementFromKf = (kfPos: { elementId: string; points: Point[] }): DrawnElement | null => {
      const originalEl = allElementsRef.current.get(kfPos.elementId);
      if (!originalEl || kfPos.points.length === 0) return null;
      return {
        ...originalEl,
        points: kfPos.points.map(p => ({ x: p.x, y: p.y }))
      };
    };

    // At last keyframe or only one keyframe - show elements from current keyframe
    if (activeKeyframes.length === 1 || currentKeyframeIndex >= activeKeyframes.length - 1) {
      return currentKf.positions
        .map(buildElementFromKf)
        .filter((el): el is DrawnElement => el !== null);
    }

    // Interpolate between current and next keyframe
    const nextKf = activeKeyframes[currentKeyframeIndex + 1];
    if (!nextKf) {
      return currentKf.positions
        .map(buildElementFromKf)
        .filter((el): el is DrawnElement => el !== null);
    }

    // Get all unique element IDs from both keyframes
    const allElementIds = new Set<string>();
    currentKf.positions.forEach(p => allElementIds.add(p.elementId));
    nextKf.positions.forEach(p => allElementIds.add(p.elementId));

    const result: DrawnElement[] = [];
    Array.from(allElementIds).forEach(elementId => {
      const originalEl = allElementsRef.current.get(elementId);
      if (!originalEl) return;

      const currentPos = currentKf.positions.find(p => p.elementId === elementId);
      const nextPos = nextKf.positions.find(p => p.elementId === elementId);

      // Element only in next keyframe - show at next position
      if (!currentPos && nextPos) {
        result.push({
          ...originalEl,
          points: nextPos.points.map(p => ({ x: p.x, y: p.y }))
        } as DrawnElement);
        return;
      }

      // Element only in current keyframe - show at current position
      if (currentPos && !nextPos) {
        result.push({
          ...originalEl,
          points: currentPos.points.map(p => ({ x: p.x, y: p.y }))
        } as DrawnElement);
        return;
      }

      // Element in both - interpolate
      if (currentPos && nextPos) {
        const fromPoints = currentPos.points;
        const toPoints = nextPos.points;

        if (fromPoints.length !== toPoints.length) {
          result.push({
            ...originalEl,
            points: fromPoints.map(p => ({ x: p.x, y: p.y }))
          } as DrawnElement);
          return;
        }

        const interpolatedPoints = fromPoints.map((cp, i) => {
          const np = toPoints[i];
          return {
            x: cp.x + (np.x - cp.x) * animationProgress,
            y: cp.y + (np.y - cp.y) * animationProgress
          };
        });
        result.push({ ...originalEl, points: interpolatedPoints } as DrawnElement);
      }
    });

    return result;
  }, [elements, currentKeyframeIndex, animationProgress, isPlaying, readOnly, keyframes, animationFinished]);

  // Delete a specific keyframe
  const deleteKeyframe = useCallback((keyframeId: string) => {
    setKeyframes(prev => {
      const newKeyframes = prev.filter(kf => kf.id !== keyframeId);
      // If all keyframes are deleted, clear the canvas completely
      if (newKeyframes.length === 0) {
        setElements([]);
        allElementsRef.current.clear();
        currentKeyframeIndexRef.current = 0;
        setCurrentKeyframeIndex(0);
        setAnimationProgress(0);
        setIsPlaying(false);
        setHasUnsavedChanges(false);
        setUndoStack([]);
      }
      return newKeyframes;
    });
    if (currentKeyframeIndex >= keyframes.length - 1) {
      setCurrentKeyframeIndex(Math.max(0, keyframes.length - 2));
    }
  }, [keyframes.length, currentKeyframeIndex]);

  // Save current keyframe changes
  const saveCurrentKeyframe = useCallback(() => {
    const actualCurrentIndex = currentKeyframeIndexRef.current;
    if (elements.length === 0 || actualCurrentIndex >= keyframes.length) return;
    
    const updatedPositions: KeyframeElementPosition[] = elements.map(el => ({
      elementId: el.id,
      points: el.points.map(p => ({ x: p.x, y: p.y }))
    }));
    
    setKeyframes(prev => prev.map((kf, idx) => 
      idx === actualCurrentIndex 
        ? { ...kf, positions: updatedPositions, timestamp: Date.now() }
        : kf
    ));
    setHasUnsavedChanges(false);
  }, [elements, keyframes.length]);

  // Navigate to a keyframe (restores elements from that keyframe)
  const navigateToKeyframe = useCallback((index: number) => {
    setIsPlaying(false);
    setAnimationProgress(0);
    setAnimationFinished(false);
    
    // Restore elements from target keyframe
    if (keyframes[index]) {
      const kf = keyframes[index];
      const restoredElements: DrawnElement[] = [];
      for (const kfPos of kf.positions) {
        const originalEl = allElementsRef.current.get(kfPos.elementId);
        if (originalEl && kfPos.points.length > 0) {
          restoredElements.push({
            ...originalEl,
            points: kfPos.points.map(p => ({ x: p.x, y: p.y }))
          });
        }
      }
      setElements(restoredElements);
    }
    
    currentKeyframeIndexRef.current = index;
    setCurrentKeyframeIndex(index);
    setHasUnsavedChanges(false);
  }, [keyframes]);

  // Jump to a specific keyframe - shows confirmation if there are unsaved changes
  const jumpToKeyframe = useCallback((index: number) => {
    const actualCurrentIndex = currentKeyframeIndexRef.current;
    
    // If same keyframe, do nothing
    if (index === actualCurrentIndex) return;
    
    console.log('[jumpToKeyframe] hasUnsavedChangesRef:', hasUnsavedChangesRef.current, 'keyframesRef.length:', keyframesRef.current.length);
    
    // If there are unsaved changes, show confirmation dialog (use refs to avoid stale closures)
    if (hasUnsavedChangesRef.current && keyframesRef.current.length > 0) {
      console.log('[jumpToKeyframe] Showing confirmation dialog');
      setPendingNavigationIndex(index);
      setShowSaveConfirmDialog(true);
      return;
    }
    
    // No unsaved changes, navigate directly
    navigateToKeyframe(index);
  }, [navigateToKeyframe]);

  // Start playback helper
  const startPlayback = useCallback(() => {
    playbackKeyframesRef.current = [...keyframes];
    currentKeyframeIndexRef.current = 0;
    setCurrentKeyframeIndex(0);
    setAnimationProgress(0);
    setAnimationFinished(false);
    setHasUnsavedChanges(false);
    setIsPlaying(true);
  }, [keyframes]);

  // Handle save confirmation dialog actions
  const handleSaveAndNavigate = useCallback(() => {
    saveCurrentKeyframe();
    if (pendingNavigationIndex !== null) {
      // -1 means "play" action, otherwise navigate to keyframe
      if (pendingNavigationIndex === -1) {
        setTimeout(() => {
          startPlayback();
          setPendingNavigationIndex(null);
        }, 50);
      } else {
        setTimeout(() => {
          navigateToKeyframe(pendingNavigationIndex);
          setPendingNavigationIndex(null);
        }, 50);
      }
    }
    setShowSaveConfirmDialog(false);
  }, [saveCurrentKeyframe, pendingNavigationIndex, navigateToKeyframe, startPlayback]);

  const handleDiscardAndNavigate = useCallback(() => {
    setHasUnsavedChanges(false);
    if (pendingNavigationIndex !== null) {
      // -1 means "play" action
      if (pendingNavigationIndex === -1) {
        startPlayback();
      } else {
        navigateToKeyframe(pendingNavigationIndex);
      }
      setPendingNavigationIndex(null);
    }
    setShowSaveConfirmDialog(false);
  }, [pendingNavigationIndex, navigateToKeyframe, startPlayback]);

  const handleCancelNavigation = useCallback(() => {
    setPendingNavigationIndex(null);
    setShowSaveConfirmDialog(false);
  }, []);

  // Enter edit mode for a specific keyframe
  const enterEditMode = useCallback((keyframeId: string) => {
    const index = keyframes.findIndex(kf => kf.id === keyframeId);
    if (index < 0) return;
    
    // Navigate to the keyframe first
    navigateToKeyframe(index);
    
    // Enter edit mode
    setIsEditingKeyframe(true);
    setEditingKeyframeId(keyframeId);
    setHasUnsavedChanges(false);
  }, [keyframes, navigateToKeyframe]);

  // Save changes and exit edit mode
  const saveAndExitEditMode = useCallback(() => {
    if (!editingKeyframeId) return;
    
    // Save changes to the keyframe
    saveCurrentKeyframe();
    
    // Exit edit mode
    setIsEditingKeyframe(false);
    setEditingKeyframeId(null);
    setHasUnsavedChanges(false);
  }, [editingKeyframeId, saveCurrentKeyframe]);

  // Cancel edit mode and restore original keyframe state
  const cancelEditMode = useCallback(() => {
    if (!editingKeyframeId) return;
    
    // Restore the keyframe's original state
    const index = keyframes.findIndex(kf => kf.id === editingKeyframeId);
    if (index >= 0) {
      navigateToKeyframe(index);
    }
    
    // Exit edit mode
    setIsEditingKeyframe(false);
    setEditingKeyframeId(null);
    setHasUnsavedChanges(false);
  }, [editingKeyframeId, keyframes, navigateToKeyframe]);

  // Get the keyframe number being edited
  const editingKeyframeNumber = editingKeyframeId 
    ? keyframes.findIndex(kf => kf.id === editingKeyframeId) + 1 
    : null;

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
    currentKeyframeIndexRef.current = 0;
    setCurrentKeyframeIndex(0);
    setAnimationProgress(0);
    setIsPlaying(false);
  }, []);

  // Reset animation to start - updates elements to first keyframe state
  const resetAnimation = useCallback(() => {
    setIsPlaying(false);
    currentKeyframeIndexRef.current = 0;
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
    { id: "select", icon: <MousePointer className="h-5 w-5" />, label: "Select" },
    { id: "freedraw", icon: <Pencil className="h-5 w-5" />, label: "Free Draw" },
    { id: "arrow", icon: <ArrowRight className="h-5 w-5" />, label: "Arrow" },
    { id: "square", icon: <Square className="h-5 w-5" />, label: "Square" },
    { id: "xshape", icon: <XIcon className="h-5 w-5" />, label: "X Shape" },
    { id: "triangle", icon: <Triangle className="h-5 w-5" />, label: "Triangle" },
    { id: "circle", icon: <Circle className="h-5 w-5 text-red-500" />, label: "O Circle", color: "red" },
  ];

  const isShapeTool = (tool: Tool) => ["square", "xshape", "triangle", "circle", "athlete", "ball"].includes(tool);
  const isDraggableTool = (tool: Tool) => ["select", "square", "xshape", "triangle", "circle", "arrow", "athlete", "ball", "freedraw"].includes(tool);

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

  // Sport-specific ball icon
  const getBallIcon = () => {
    const normalizedSport = sport?.toLowerCase();
    const size = "h-5 w-5";
    
    if (normalizedSport === "basketball") {
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#f97316" stroke="#c2410c" strokeWidth="1"/>
          <path d="M12 2C12 12 12 12 12 22" stroke="#c2410c" strokeWidth="1"/>
          <path d="M2 12C12 12 12 12 22 12" stroke="#c2410c" strokeWidth="1"/>
          <path d="M4 6C8 10 16 10 20 6" stroke="#c2410c" strokeWidth="1" fill="none"/>
          <path d="M4 18C8 14 16 14 20 18" stroke="#c2410c" strokeWidth="1" fill="none"/>
        </svg>
      );
    } else if (normalizedSport === "football") {
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="10" ry="6" fill="#92400e" stroke="#78350f" strokeWidth="1"/>
          <path d="M12 6V18" stroke="#fff" strokeWidth="1.5"/>
          <path d="M9 8L15 8M9 10L15 10M9 12L15 12M9 14L15 14M9 16L15 16" stroke="#fff" strokeWidth="0.75"/>
        </svg>
      );
    } else if (normalizedSport === "soccer") {
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#fff" stroke="#1f2937" strokeWidth="1"/>
          <polygon points="12,7 14.5,9 13.5,12 10.5,12 9.5,9" fill="#1f2937"/>
          <polygon points="17,11 18,14 16,16 13,15 14,12" fill="#1f2937"/>
          <polygon points="7,11 6,14 8,16 11,15 10,12" fill="#1f2937"/>
        </svg>
      );
    } else if (normalizedSport === "baseball") {
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#f5f5f4" stroke="#a8a29e" strokeWidth="1"/>
          <path d="M6 6C8 8 8 16 6 18" stroke="#dc2626" strokeWidth="1.5" fill="none"/>
          <path d="M18 6C16 8 16 16 18 18" stroke="#dc2626" strokeWidth="1.5" fill="none"/>
          <path d="M5.5 8L7 9M5 11L7 12M5.5 14L7 15" stroke="#dc2626" strokeWidth="0.75"/>
          <path d="M18.5 8L17 9M19 11L17 12M18.5 14L17 15" stroke="#dc2626" strokeWidth="0.75"/>
        </svg>
      );
    } else if (normalizedSport === "volleyball") {
      return (
        <svg className={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
          <path d="M12 2C12 12 12 12 12 22" stroke="#2563eb" strokeWidth="1"/>
          <path d="M2 12C6 8 18 8 22 12" stroke="#dc2626" strokeWidth="1" fill="none"/>
          <path d="M2 12C6 16 18 16 22 12" stroke="#16a34a" strokeWidth="1" fill="none"/>
        </svg>
      );
    }
    // Default ball
    return <Circle className={`${size} fill-amber-600 text-amber-600`} />;
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
      let width = containerWidth;
      let height = Math.round(width * aspectRatio);
      
      // In portrait mode, limit height to 50% of viewport to leave room for toolbar/timeline
      const isPortrait = window.innerHeight > window.innerWidth;
      if (isPortrait) {
        const maxHeight = Math.round(window.innerHeight * 0.5);
        if (height > maxHeight) {
          height = maxHeight;
          width = Math.round(height / aspectRatio);
        }
      }
      
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

    // Show filtered/interpolated elements when:
    // 1. Playing animation
    // 2. In read-only viewer mode
    // 3. In edit mode with keyframes BUT NOT while dragging (so user sees live movement)
    // This ensures elements only appear in frames where they were recorded
    const shouldInterpolate = (isPlaying || readOnly || keyframes.length > 0) && !isDragging;
    const displayElements = shouldInterpolate 
      ? getInterpolatedElements() 
      : elements;
    displayElements.forEach((element) => {
      drawElement(ctx, element);
    });
  }, [elements, sport, activeHalf, isPlaying, keyframes.length, readOnly, isDragging, getInterpolatedElements]);

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
    
    // Diamond positioned lower to show more outfield
    // Home plate at 95%, second base at 35% (shifted down from 85%/15%)
    const homeY = 0.95;
    const secondY = 0.35;
    const baselineY = 0.65; // First/third base Y position
    
    // Outfield arc (darker green)
    ctx.fillStyle = FIELD_GREEN_STRIPE;
    ctx.beginPath();
    ctx.arc(width / 2, height * homeY, width * 0.55, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    // Infield dirt (tan)
    ctx.fillStyle = COURT_TAN;
    ctx.beginPath();
    ctx.moveTo(width / 2, height * homeY); // Home plate
    ctx.lineTo(width * 0.12, height * baselineY); // Third base
    ctx.lineTo(width / 2, height * secondY); // Second base
    ctx.lineTo(width * 0.88, height * baselineY); // First base
    ctx.closePath();
    ctx.fill();
    
    // Base paths (white lines)
    ctx.strokeStyle = LINE_WHITE;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(width / 2, height * homeY);
    ctx.lineTo(width * 0.88, height * baselineY);
    ctx.lineTo(width / 2, height * secondY);
    ctx.lineTo(width * 0.12, height * baselineY);
    ctx.closePath();
    ctx.stroke();
    
    // Pitcher's mound
    const moundY = (homeY + secondY) / 2 + 0.03;
    ctx.fillStyle = COURT_TAN_DARK;
    ctx.beginPath();
    ctx.arc(width / 2, height * moundY, width * 0.04, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = LINE_WHITE;
    ctx.stroke();
    
    // Bases (white squares)
    const baseSize = width * 0.03;
    ctx.fillStyle = LINE_WHITE;
    // First base
    ctx.fillRect(width * 0.88 - baseSize/2, height * baselineY - baseSize/2, baseSize, baseSize);
    // Second base
    ctx.fillRect(width / 2 - baseSize/2, height * secondY - baseSize/2, baseSize, baseSize);
    // Third base
    ctx.fillRect(width * 0.12 - baseSize/2, height * baselineY - baseSize/2, baseSize, baseSize);
    // Home plate (pentagon)
    ctx.beginPath();
    const hx = width / 2, hy = height * homeY;
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

      case "ball":
        const ballCenter = element.points[0];
        const ballRadius = SHAPE_SIZE / 2 + 2;
        const ballSport = element.label || "football";
        
        ctx.save();
        
        if (ballSport === "basketball") {
          // Orange basketball with lines
          ctx.fillStyle = "#f97316";
          ctx.beginPath();
          ctx.arc(ballCenter.x, ballCenter.y, ballRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Draw basketball lines
          ctx.beginPath();
          ctx.moveTo(ballCenter.x - ballRadius, ballCenter.y);
          ctx.lineTo(ballCenter.x + ballRadius, ballCenter.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ballCenter.x, ballCenter.y - ballRadius);
          ctx.lineTo(ballCenter.x, ballCenter.y + ballRadius);
          ctx.stroke();
        } else if (ballSport === "soccer") {
          // White soccer ball with pentagon pattern
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ballCenter.x, ballCenter.y, ballRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Draw pentagon in center
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          const pentRadius = ballRadius * 0.4;
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const px = ballCenter.x + pentRadius * Math.cos(angle);
            const py = ballCenter.y + pentRadius * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else if (ballSport === "baseball") {
          // White baseball with red stitching
          ctx.fillStyle = "#f5f5f4";
          ctx.beginPath();
          ctx.arc(ballCenter.x, ballCenter.y, ballRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#a8a29e";
          ctx.lineWidth = 1;
          ctx.stroke();
          // Red stitching curves (matching toolbar icon style - curving outward)
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 1.5;
          // Left stitching - curve opens to the left
          ctx.beginPath();
          ctx.arc(ballCenter.x - ballRadius * 0.7, ballCenter.y, ballRadius * 0.5, -Math.PI * 0.5, Math.PI * 0.5);
          ctx.stroke();
          // Right stitching - curve opens to the right
          ctx.beginPath();
          ctx.arc(ballCenter.x + ballRadius * 0.7, ballCenter.y, ballRadius * 0.5, Math.PI * 0.5, Math.PI * 1.5);
          ctx.stroke();
        } else if (ballSport === "volleyball") {
          // White/yellow volleyball with curved lines
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(ballCenter.x, ballCenter.y, ballRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#1e40af";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Draw curved lines
          ctx.beginPath();
          ctx.arc(ballCenter.x, ballCenter.y - ballRadius * 0.3, ballRadius * 0.8, Math.PI * 0.2, Math.PI * 0.8);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ballCenter.x, ballCenter.y + ballRadius * 0.3, ballRadius * 0.8, -Math.PI * 0.8, -Math.PI * 0.2);
          ctx.stroke();
        } else {
          // Brown football (american) - rotated 90 degrees (vertical)
          ctx.fillStyle = "#8b4513";
          ctx.beginPath();
          // Draw oval shape - swapped rx/ry for vertical orientation
          ctx.ellipse(ballCenter.x, ballCenter.y, ballRadius * 0.7, ballRadius * 1.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // White laces (now vertical)
          ctx.beginPath();
          ctx.moveTo(ballCenter.x, ballCenter.y - ballRadius * 0.4);
          ctx.lineTo(ballCenter.x, ballCenter.y + ballRadius * 0.4);
          ctx.stroke();
          // Lace marks (now horizontal)
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(ballCenter.x - ballRadius * 0.15, ballCenter.y + i * ballRadius * 0.15);
            ctx.lineTo(ballCenter.x + ballRadius * 0.15, ballCenter.y + i * ballRadius * 0.15);
            ctx.stroke();
          }
        }
        
        ctx.restore();
        break;
    }
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const findElementAtPoint = (point: Point): DrawnElement | null => {
    // Use elements directly - they are the source of truth during editing
    // Only use interpolated elements during playback
    const displayedElements = isPlaying ? getInterpolatedElements() : elements;
    
    for (let i = displayedElements.length - 1; i >= 0; i--) {
      const el = displayedElements[i];
      if (!isDraggableTool(el.tool)) continue;

      if (isShapeTool(el.tool)) {
        const center = el.points[0];
        const dist = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
        if (dist <= SHAPE_SIZE / 2 + 10) {
          return el;
        }
      } else if (el.tool === "arrow" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[1];
        const distToLine = pointToLineDistance(point, start, end);
        // Increased hit area from 15 to 25 for easier selection
        if (distToLine <= 25) {
          return el;
        }
      } else if (el.tool === "freedraw" && el.points.length >= 2) {
        // Check if point is near any segment of the freedraw path
        for (let j = 0; j < el.points.length - 1; j++) {
          const distToSegment = pointToLineDistance(point, el.points[j], el.points[j + 1]);
          if (distToSegment <= 15) {
            return el;
          }
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

  const handleStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    // Capture pointer to ensure we receive all move/up events even if pointer leaves canvas
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const point = getCanvasPoint(e);

    const clickedElement = findElementAtPoint(point);
    
    if (selectedTool === "delete") {
      if (clickedElement) {
        // Save current state before deleting
        saveToUndoStack();
        // Only remove from current elements array (what you see)
        // Keyframes are immutable snapshots - don't modify them
        // The deleted element will reappear if you jump back to a keyframe that contains it
        setElements((prev) => prev.filter((el) => el.id !== clickedElement.id));
        // Mark as having unsaved changes when deleting a shape
        if (keyframesRef.current.length > 0) setHasUnsavedChanges(true);
      }
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      return;
    }

    if (clickedElement) {
      setIsDragging(true);
      setDraggedElementId(clickedElement.id);
      setAnimationFinished(false); // Exit keyframe view mode when user starts editing
      
      // Use elements directly - they are the source of truth
      if (clickedElement.tool === "arrow") {
        const midX = (clickedElement.points[0].x + clickedElement.points[1].x) / 2;
        const midY = (clickedElement.points[0].y + clickedElement.points[1].y) / 2;
        setDragOffset({ x: point.x - midX, y: point.y - midY });
      } else {
        setDragOffset({
          x: point.x - clickedElement.points[0].x,
          y: point.y - clickedElement.points[0].y,
        });
      }
      return;
    }

    // Debounce element placement to prevent duplicate elements from rapid touch events on mobile
    const now = Date.now();
    const timeSinceLastPlacement = now - lastPlacementTimeRef.current;
    const DEBOUNCE_MS = 500; // Prevent placement within 500ms of last placement (increased for iOS)
    
    // Also check if trying to place at the same position (within 20px tolerance - increased for touch)
    const lastPos = lastPlacementPosRef.current;
    const isSamePosition = lastPos && 
      Math.abs(point.x - lastPos.x) < 20 && 
      Math.abs(point.y - lastPos.y) < 20;

    if (selectedTool === "athlete") {
      if (timeSinceLastPlacement < DEBOUNCE_MS || isSamePosition) return;
      lastPlacementTimeRef.current = now;
      lastPlacementPosRef.current = { x: point.x, y: point.y };
      setAnimationFinished(false); // Exit keyframe view mode when adding elements
      
      const newElement: DrawnElement = {
        id: crypto.randomUUID(),
        tool: selectedTool,
        points: [point],
        color: getToolColor(selectedTool),
        lineWidth: 3,
        label: selectedAthlete ? getInitials(selectedAthlete) : "",
      };
      allElementsRef.current.set(newElement.id, newElement);
      setElements((prev) => [...prev, newElement]);
      if (keyframesRef.current.length > 0) setHasUnsavedChanges(true);
      return;
    }

    if (isShapeTool(selectedTool)) {
      if (timeSinceLastPlacement < DEBOUNCE_MS || isSamePosition) return;
      lastPlacementTimeRef.current = now;
      lastPlacementPosRef.current = { x: point.x, y: point.y };
      setAnimationFinished(false); // Exit keyframe view mode when adding elements
      
      const newElement: DrawnElement = {
        id: crypto.randomUUID(),
        tool: selectedTool,
        points: [point],
        color: getToolColor(selectedTool),
        fillColor: getFillColor(selectedTool),
        lineWidth: 3,
        // For balls, store the sport type as label
        label: selectedTool === "ball" ? sport?.toLowerCase() : undefined,
      };
      allElementsRef.current.set(newElement.id, newElement);
      setElements((prev) => [...prev, newElement]);
      if (keyframesRef.current.length > 0) setHasUnsavedChanges(true);
      return;
    }

    setIsDrawing(true);
    setAnimationFinished(false); // Exit keyframe view mode when drawing
    setStartPoint(point);
    setLastPoint(point);
    setCurrentPath([point]);
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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

  const handleEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Release pointer capture
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    
    if (isDragging && draggedElementId) {
      // Mark keyframe as having unsaved changes after drag
      if (keyframesRef.current.length > 0) setHasUnsavedChanges(true);
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
      allElementsRef.current.set(newElement.id, newElement);
      setElements((prev) => [...prev, newElement]);
      if (keyframesRef.current.length > 0) setHasUnsavedChanges(true);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setLastPoint(null);
    setCurrentPath([]);
  };

  const handleUndo = () => {
    setElements((prev) => prev.slice(0, -1));
    if (keyframesRef.current.length > 0) setHasUnsavedChanges(true);
  };

  const handleClear = () => {
    setElements([]);
  };

  const handleSelectAthlete = (athlete: Athlete | null) => {
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
      <div className="flex flex-col gap-3 p-3 bg-background/95 dark:bg-card/95 rounded-lg border border-white/10 backdrop-blur-sm shadow-lg sticky top-0 z-10" data-testid="playbook-toolbar">
        {/* Drawing Tools - only show when not in read-only mode */}
        {!readOnly && (
          <div className="flex gap-2 items-center shrink-0 overflow-x-auto pb-2 toolbar-scrollbar scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                {tools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedTool === tool.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTool(tool.id)}
                    className={`gap-2 shrink-0 ${tool.color === "red" ? "text-red-500 hover:text-red-400" : ""}`}
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
                      className="gap-2 shrink-0 text-blue-500 hover:text-blue-400"
                      data-testid="tool-athlete"
                    >
                      <Circle className="h-5 w-5 fill-blue-500" />
                      <span className="hidden sm:inline">{selectedAthlete ? getInitials(selectedAthlete) : "Player"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <ScrollArea className="h-[200px]">
                      <div className="p-2">
                        <p className="text-xs text-muted-foreground mb-2 px-2">Select a player</p>
                        
                        {/* Generic Player option */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => handleSelectAthlete(null)}
                          data-testid="athlete-option-generic"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            <Circle className="h-3 w-3 fill-white text-white" />
                          </div>
                          Generic Player
                        </Button>
                        
                        {sortedAthletes.length > 0 && (
                          <>
                            <div className="h-px bg-white/10 my-2" />
                            <p className="text-xs text-muted-foreground mb-2 px-2">Team Roster</p>
                            {sortedAthletes.map((athlete) => (
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
                            ))}
                          </>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Button
                  variant={selectedTool === "ball" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("ball")}
                  className="gap-2 shrink-0"
                  data-testid="tool-ball"
                >
                  {getBallIcon()}
                  <span className="hidden sm:inline">Ball</span>
                </Button>

                <Button
                  variant={selectedTool === "delete" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTool("delete")}
                  className="gap-2 shrink-0 text-orange-500 hover:text-orange-400"
                  data-testid="tool-delete"
                >
                  <MousePointerClick className="h-5 w-5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="gap-2 shrink-0 text-blue-500 hover:text-blue-400"
                  data-testid="button-undo"
                >
                  <Undo2 className="h-5 w-5" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={elements.length === 0}
                  className="gap-2 shrink-0 text-red-500 hover:text-red-400"
                  data-testid="button-clear"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>

                {sport?.toLowerCase() !== "baseball" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveHalf(activeHalf === "offense" ? "defense" : "offense")}
                    className={`gap-2 shrink-0 ${activeHalf === "offense" ? "text-green-500 border-green-500/50" : "text-red-500 border-red-500/50"}`}
                    data-testid="toggle-half"
                  >
                    {activeHalf === "offense" ? <Swords className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    <span className="hidden sm:inline">{activeHalf === "offense" ? "Offense" : "Defense"}</span>
                  </Button>
                )}
          </div>
        )}

        {/* Read-only Playback Controls */}
        {readOnly && keyframes.length >= 2 && (
          <div className="flex gap-2 items-center overflow-x-auto pt-2 pb-2 border-t border-white/10 toolbar-scrollbar">
                <span className="text-sm font-medium text-amber-300 flex items-center gap-2 shrink-0">
                  <Film className="h-4 w-4" />
                  Play
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetAnimation}
                  disabled={currentKeyframeIndex === 0 && !isPlaying}
                  className="h-8 w-8 shrink-0"
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
                  className="h-8 w-8 shrink-0"
                  data-testid="button-prev-keyframe"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                    if (!isPlaying) {
                      // Check for unsaved changes before playing (use ref to avoid stale closure)
                      if (hasUnsavedChangesRef.current) {
                        setPendingNavigationIndex(-1); // -1 means "play" action
                        setShowSaveConfirmDialog(true);
                        return;
                      }
                      // Start playback from beginning
                      playbackKeyframesRef.current = [...keyframes];
                      currentKeyframeIndexRef.current = 0;
                      setCurrentKeyframeIndex(0);
                      setAnimationProgress(0);
                      setAnimationFinished(false);
                    }
                    setIsPlaying(!isPlaying);
                  }}
                  className={`h-8 w-8 shrink-0 ${isPlaying ? "bg-green-600 hover:bg-green-700" : ""}`}
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
                  className="h-8 w-8 shrink-0"
                  data-testid="button-next-keyframe"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium ml-2 shrink-0">
                  {currentKeyframeIndex + 1}/{keyframes.length}
                </span>
                <div className="hidden sm:flex items-center gap-2 ml-4 shrink-0">
                  <span className="text-xs text-muted-foreground">Speed:</span>
                  <Slider
                    value={[playbackSpeed]}
                    onValueChange={([v]) => setPlaybackSpeed(v)}
                    min={0.5}
                    max={2}
                    step={0.5}
                    className="w-20"
                    disabled={isPlaying}
                  />
                  <span className="text-xs font-medium">{playbackSpeed}x</span>
                </div>
          </div>
        )}

        {/* Save Dialog - controlled by state from animation row button */}
        {onSave && (
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
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

      </div>

      {/* Edit Mode Banner */}
      {isEditingKeyframe && editingKeyframeNumber && (
        <div className="mb-2 p-3 bg-amber-600/20 border border-amber-600/50 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Pencil className="h-4 w-4 text-amber-300 shrink-0" />
            <span className="text-sm font-medium text-amber-300 truncate">
              Editing #{editingKeyframeNumber}
            </span>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-200/80 shrink-0">*</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelEditMode}
              className="text-muted-foreground border-white/20 hover:bg-white/10 px-2 sm:px-3"
              data-testid="button-cancel-edit"
            >
              <span className="hidden sm:inline">Cancel</span>
              <XIcon className="h-4 w-4 sm:hidden" />
            </Button>
            <Button
              size="sm"
              onClick={saveAndExitEditMode}
              disabled={!hasUnsavedChanges}
              className="bg-amber-600 hover:bg-amber-700 text-white px-2 sm:px-3"
              data-testid="button-save-keyframe-edit"
            >
              <Save className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative w-full rounded-lg border border-white/10">
        <canvas
          ref={canvasRef}
          width={canvasSize.width || 400}
          height={canvasSize.height || 250}
          className={`touch-none max-w-full max-h-full ${readOnly || isPlaying ? "cursor-default" : "cursor-crosshair"}`}
          onPointerDown={!readOnly && !isPlaying ? handleStart : undefined}
          onPointerMove={!readOnly && !isPlaying ? handleMove : undefined}
          onPointerUp={!readOnly && !isPlaying ? handleEnd : undefined}
          onPointerLeave={!readOnly && !isPlaying ? handleEnd : undefined}
          data-testid="playbook-canvas"
        />
      </div>

      {/* Animation Controls - Above Timeline */}
      {!readOnly && (
        <div className="mt-3 p-3 bg-black/60 rounded-lg border border-white/20">
          <div className="flex gap-2 items-center overflow-x-auto toolbar-scrollbar" data-testid="animation-toolbar">
            {/* Animation label */}
            <span className="text-sm font-medium text-amber-300 flex items-center gap-2 shrink-0">
              <Film className="h-4 w-4" />
              <span className="hidden sm:inline">Animation</span>
            </span>

            {/* Record Keyframe Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={recordKeyframe}
              disabled={elements.length === 0 || isPlaying}
              className="gap-2 shrink-0 text-amber-300 border-amber-400/50 hover:bg-amber-400/20"
              title="Record current positions as a new keyframe"
              data-testid="button-record-keyframe"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Record</span>
              {keyframes.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-400/20 text-amber-200 rounded">
                  {keyframes.length}
                </span>
              )}
            </Button>

            {keyframes.length > 0 && !isEditingKeyframe && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    saveCurrentKeyframe();
                  }}
                  disabled={elements.length === 0 || isPlaying || !hasUnsavedChanges}
                  className="gap-2 shrink-0 text-blue-500 border-blue-500/50 hover:bg-blue-500/20"
                  title={`Save changes to keyframe ${currentKeyframeIndex + 1}`}
                  data-testid="button-update-keyframe"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">{hasUnsavedChanges ? "Save" : "Saved"}</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPlaying}
                      className="gap-2 shrink-0 text-red-500 border-red-500/50 hover:bg-red-500/20"
                      title="Clear all keyframes"
                      data-testid="button-clear-keyframes"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Keyframes?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete all {keyframes.length} keyframe{keyframes.length !== 1 ? 's' : ''} and reset your animation. Your shapes will remain on the canvas.
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

            {/* Playback Controls */}
            {keyframes.length >= 2 && (
              <>
                <div className="h-6 w-px bg-white/20 mx-1 shrink-0" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetAnimation}
                  disabled={currentKeyframeIndex === 0 && !isPlaying}
                  className="h-8 w-8 shrink-0"
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
                  className="h-8 w-8 shrink-0"
                  data-testid="button-prev-keyframe"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={isPlaying ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                    if (!isPlaying) {
                      // Check for unsaved changes before playing (use ref to avoid stale closure)
                      if (hasUnsavedChangesRef.current) {
                        setPendingNavigationIndex(-1); // -1 means "play" action
                        setShowSaveConfirmDialog(true);
                        return;
                      }
                      // Start playback from beginning
                      playbackKeyframesRef.current = [...keyframes];
                      currentKeyframeIndexRef.current = 0;
                      setCurrentKeyframeIndex(0);
                      setAnimationProgress(0);
                      setAnimationFinished(false);
                    }
                    setIsPlaying(!isPlaying);
                  }}
                  className={`h-8 w-8 shrink-0 ${isPlaying ? "bg-green-600 hover:bg-green-700" : ""}`}
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
                  className="h-8 w-8 shrink-0"
                  data-testid="button-next-keyframe"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium shrink-0">
                  {currentKeyframeIndex + 1}/{keyframes.length}
                </span>
              </>
            )}
            
            {/* Spacer and Save button at end of animation row */}
            <div className="flex-1 shrink-0 min-w-4" />
            
            {onSave && (
              <Button 
                variant="default" 
                size="sm" 
                disabled={elements.length === 0} 
                onClick={() => setIsSaveDialogOpen(true)}
                className="gap-2 shrink-0 bg-green-600 hover:bg-green-700" 
                data-testid="tool-save-animation-row"
              >
                <Save className="h-5 w-5" />
                <span className="hidden sm:inline">Save Play</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Keyframe Timeline */}
      {keyframes.length > 0 && (
        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">Timeline</span>
            <span className="text-xs text-amber-300">({keyframes.length} keyframes)</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
            {keyframes.map((kf, index) => (
              <div
                key={kf.id}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg border-2 cursor-pointer transition-all ${
                  editingKeyframeId === kf.id
                    ? "border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50"
                    : index === currentKeyframeIndex
                    ? "border-primary bg-primary/20 ring-2 ring-primary/50"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                }`}
                onClick={() => !isEditingKeyframe && jumpToKeyframe(index)}
                data-testid={`keyframe-${index}`}
              >
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                {!readOnly && !isEditingKeyframe && (
                  <>
                    {/* Edit button - on top center */}
                    <button
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-amber-500 rounded-full text-white flex items-center justify-center shadow-md border border-amber-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        enterEditMode(kf.id);
                      }}
                      title={`Edit keyframe ${index + 1}`}
                      data-testid={`edit-keyframe-${index}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {/* Delete button - on bottom center */}
                    <button
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center shadow-md border border-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteKeyframe(kf.id);
                      }}
                      title="Delete keyframe"
                    >
                      ×
                    </button>
                  </>
                )}
                {/* Show editing indicator on the keyframe being edited */}
                {editingKeyframeId === kf.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] px-1 rounded font-medium">
                    EDITING
                  </div>
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
                  <p className="text-sm text-muted-foreground">Click the <span className="text-amber-300 font-medium">+ Keyframe</span> button to save the starting positions.</p>
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
                  <p className="text-sm text-muted-foreground">Click <span className="text-amber-300 font-medium">+ Keyframe</span> again. Repeat steps 3-4 for each movement phase.</p>
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

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to keyframe {currentKeyframeIndex + 1}. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelNavigation}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDiscardAndNavigate}>
              Discard Changes
            </Button>
            <Button onClick={handleSaveAndNavigate}>
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
