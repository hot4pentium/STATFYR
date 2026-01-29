import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight, Square, Triangle, Circle, X as XIcon, Undo2, Trash2, MousePointerClick, Save, Shield, Swords } from "lucide-react";
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

interface SavePlayData {
  name: string;
  description: string;
  canvasData: string;
  thumbnailData: string;
  category: string;
}

interface PlaybookCanvasProps {
  athletes?: Athlete[];
  sport?: string;
  onSave?: (data: SavePlayData) => Promise<void>;
  isSaving?: boolean;
}

const SHAPE_SIZE = 24;

export function PlaybookCanvas({ athletes = [], sport = "Football", onSave, isSaving = false }: PlaybookCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [elements, setElements] = useState<DrawnElement[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dimensionsLocked, setDimensionsLocked] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [activeHalf, setActiveHalf] = useState<"offense" | "defense">("offense");
  const [playName, setPlayName] = useState("");
  const [playDescription, setPlayDescription] = useState("");
  const [playCategory, setPlayCategory] = useState("Offense");

  // Clear canvas and reset dimensions when sport changes
  useEffect(() => {
    setElements([]);
    setDimensionsLocked(false);
  }, [sport]);

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

    elements.forEach((element) => {
      drawElement(ctx, element);
    });
  }, [elements, sport, activeHalf]);

  useEffect(() => {
    redrawCanvas();
  }, [canvasSize, redrawCanvas]);

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
    
    // Sidelines
    const margin = width * 0.08;
    ctx.beginPath();
    ctx.moveTo(margin, 0);
    ctx.lineTo(margin, height);
    ctx.moveTo(width - margin, 0);
    ctx.lineTo(width - margin, height);
    ctx.stroke();
    
    // End zone line (top)
    const endZoneHeight = height * 0.1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(margin, endZoneHeight);
    ctx.lineTo(width - margin, endZoneHeight);
    ctx.stroke();
    
    // Yard lines (every 10 yards)
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
    const hashX1 = width * 0.35;
    const hashX2 = width * 0.65;
    const hashLen = width * 0.03;
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
    
    // Yard numbers
    ctx.fillStyle = LINE_WHITE;
    ctx.font = `bold ${width * 0.06}px Arial`;
    ctx.textAlign = "center";
    const yardNumbers = half === "offense" ? ["G", "10", "20", "30", "40", "50"] : ["G", "10", "20", "30", "40", "50"];
    yardNumbers.forEach((num, i) => {
      const y = endZoneHeight + (playableHeight * i * 0.18) + playableHeight * 0.09;
      if (y < height - 20) {
        // Flip text if in defense mode so it reads correctly
        if (half === "defense") {
          ctx.save();
          ctx.translate(margin + width * 0.08, y);
          ctx.scale(1, -1);
          ctx.fillText(num, 0, 0);
          ctx.restore();
          ctx.save();
          ctx.translate(width - margin - width * 0.08, y);
          ctx.scale(1, -1);
          ctx.fillText(num, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(num, margin + width * 0.08, y);
          ctx.fillText(num, width - margin - width * 0.08, y);
        }
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
    
    // Penalty area (18-yard box)
    const penaltyWidth = width * 0.7;
    const penaltyHeight = height * 0.2;
    const penaltyX = (width - penaltyWidth) / 2;
    ctx.strokeRect(penaltyX, margin, penaltyWidth, penaltyHeight);
    
    // Goal area (6-yard box)
    const goalAreaWidth = width * 0.35;
    const goalAreaHeight = height * 0.08;
    const goalAreaX = (width - goalAreaWidth) / 2;
    ctx.strokeRect(goalAreaX, margin, goalAreaWidth, goalAreaHeight);
    
    // Penalty spot
    ctx.fillStyle = LINE_WHITE;
    ctx.beginPath();
    ctx.arc(width / 2, margin + penaltyHeight * 0.7, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Penalty arc
    ctx.beginPath();
    ctx.arc(width / 2, margin + penaltyHeight * 0.7, width * 0.15, 0.3 * Math.PI, 0.7 * Math.PI);
    ctx.stroke();
    
    // Goal
    const goalWidth = width * 0.15;
    ctx.lineWidth = 3;
    ctx.strokeStyle = LINE_WHITE;
    ctx.beginPath();
    ctx.moveTo((width - goalWidth) / 2, margin);
    ctx.lineTo((width + goalWidth) / 2, margin);
    ctx.stroke();
    
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
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
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
        if (distToLine <= 15) {
          return el;
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
    
    const canvasData = JSON.stringify(elements);
    
    // Capture canvas as thumbnail
    const canvas = canvasRef.current;
    const thumbnailData = canvas ? canvas.toDataURL("image/png", 0.5) : "";
    
    await onSave({
      name: playName.trim(),
      description: playDescription.trim(),
      canvasData,
      thumbnailData,
      category: playCategory,
    });
    
    setIsSaveDialogOpen(false);
    setPlayName("");
    setPlayDescription("");
    setPlayCategory("Offense");
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
          className="touch-none cursor-crosshair max-w-full max-h-full"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          data-testid="playbook-canvas"
        />
      </div>
    </div>
  );
}
