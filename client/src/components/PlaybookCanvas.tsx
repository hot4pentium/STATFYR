import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight, Square, Triangle, Circle, X as XIcon, Undo2, Trash2, MousePointerClick, Save } from "lucide-react";
import basketballCourtImg from "@assets/bball_court_1766345509497.png";
import footballFieldImg from "@assets/football_1768077466658.png";
import soccerPitchImg from "@assets/generated_images/soccer_pitch_top-down_view.png";
import baseballDiamondImg from "@assets/generated_images/baseball_diamond_top-down_view.png";
import volleyballCourtImg from "@assets/generated_images/volleyball_court_top-down_view.png";
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
  const basketballImageRef = useRef<HTMLImageElement | null>(null);
  const footballImageRef = useRef<HTMLImageElement | null>(null);
  const soccerImageRef = useRef<HTMLImageElement | null>(null);
  const baseballImageRef = useRef<HTMLImageElement | null>(null);
  const volleyballImageRef = useRef<HTMLImageElement | null>(null);
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
  const [sportImagesLoaded, setSportImagesLoaded] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [playName, setPlayName] = useState("");
  const [playDescription, setPlayDescription] = useState("");
  const [playCategory, setPlayCategory] = useState("Offense");

  useEffect(() => {
    const imagesToLoad = [
      { src: basketballCourtImg, ref: basketballImageRef },
      { src: footballFieldImg, ref: footballImageRef },
      { src: soccerPitchImg, ref: soccerImageRef },
      { src: baseballDiamondImg, ref: baseballImageRef },
      { src: volleyballCourtImg, ref: volleyballImageRef },
    ];
    
    let loadedCount = 0;
    imagesToLoad.forEach(({ src, ref }) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        ref.current = img;
        loadedCount++;
        if (loadedCount === imagesToLoad.length) {
          setSportImagesLoaded(true);
        }
      };
    });
  }, []);

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

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = Math.max(650, (window.innerHeight - 200) * 1.2);
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    drawSportBackground(ctx, canvas.width, canvas.height, sport);

    elements.forEach((element) => {
      drawElement(ctx, element);
    });
  }, [elements, sport, sportImagesLoaded]);

  useEffect(() => {
    redrawCanvas();
  }, [canvasSize, redrawCanvas]);

  const drawSportBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, sport: string) => {
    const normalizedSport = sport?.toLowerCase();
    switch (normalizedSport) {
      case "baseball":
        drawBaseballField(ctx, width, height);
        break;
      case "basketball":
        drawBasketballCourt(ctx, width, height);
        break;
      case "football":
        drawFootballField(ctx, width, height);
        break;
      case "soccer":
        drawSoccerPitch(ctx, width, height);
        break;
      case "volleyball":
        drawVolleyballCourt(ctx, width, height);
        break;
      default:
        drawFootballField(ctx, width, height);
    }
  };

  const drawBaseballField = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (baseballImageRef.current) {
      ctx.fillStyle = "#228B22";
      ctx.fillRect(0, 0, width, height);
      const scaledWidth = width * 1.3;
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = height * 0.1;
      ctx.drawImage(baseballImageRef.current, offsetX, offsetY, scaledWidth, height);
    } else {
      ctx.fillStyle = "#228B22";
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawBasketballCourt = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (basketballImageRef.current) {
      ctx.drawImage(basketballImageRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#CD853F";
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawFootballField = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (footballImageRef.current) {
      ctx.drawImage(footballImageRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#1a472a";
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawSoccerPitch = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (soccerImageRef.current) {
      ctx.drawImage(soccerImageRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#228B22";
      ctx.fillRect(0, 0, width, height);
    }
  };

  const drawVolleyballCourt = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (volleyballImageRef.current) {
      ctx.drawImage(volleyballImageRef.current, 0, 0, width, height);
    } else {
      ctx.fillStyle = "#CD853F";
      ctx.fillRect(0, 0, width, height);
    }
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
    <div className="relative" data-testid="playbook-canvas-container">
      <div className="fixed top-16 left-4 right-4 md:left-auto md:right-auto md:w-auto flex flex-wrap gap-2 p-3 bg-background/95 dark:bg-card/95 rounded-lg border border-white/10 z-50 backdrop-blur-sm shadow-lg" data-testid="playbook-toolbar">
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

      <div className="relative w-full overflow-hidden rounded-lg border border-white/10 mt-20" style={{ height: canvasSize.height || 500 }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width || 400}
          height={canvasSize.height || 500}
          className="touch-none cursor-crosshair w-full h-full"
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
