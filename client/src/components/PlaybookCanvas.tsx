import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowRight, Square, Triangle, Circle, X as XIcon, Undo2, Trash2 } from "lucide-react";

type Tool = "freedraw" | "arrow" | "square" | "xshape" | "triangle" | "circle";

interface Point {
  x: number;
  y: number;
}

interface DrawnElement {
  tool: Tool;
  points: Point[];
  color: string;
  lineWidth: number;
}

export function PlaybookCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("freedraw");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [elements, setElements] = useState<DrawnElement[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const tools: { id: Tool; icon: React.ReactNode; label: string; color?: string }[] = [
    { id: "freedraw", icon: <Pencil className="h-5 w-5" />, label: "Free Draw" },
    { id: "arrow", icon: <ArrowRight className="h-5 w-5" />, label: "Arrow" },
    { id: "square", icon: <Square className="h-5 w-5" />, label: "Square" },
    { id: "xshape", icon: <XIcon className="h-5 w-5" />, label: "X Shape" },
    { id: "triangle", icon: <Triangle className="h-5 w-5" />, label: "Triangle" },
    { id: "circle", icon: <Circle className="h-5 w-5 text-red-500" />, label: "O Circle", color: "red" },
  ];

  const getToolColor = (tool: Tool) => {
    return tool === "circle" ? "#ef4444" : "#ffffff";
  };

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const width = container.clientWidth;
        const height = Math.max(500, window.innerHeight - 300);
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

    ctx.fillStyle = "#1a472a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawFieldLines(ctx, canvas.width, canvas.height);

    elements.forEach((element) => {
      drawElement(ctx, element);
    });
  }, [elements]);

  useEffect(() => {
    redrawCanvas();
  }, [canvasSize, redrawCanvas]);

  const drawFieldLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;

    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawnElement) => {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
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
        const end = element.points[element.points.length - 1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 15;

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
        if (element.points.length < 2) return;
        const sqStart = element.points[0];
        const sqEnd = element.points[element.points.length - 1];
        ctx.strokeRect(sqStart.x, sqStart.y, sqEnd.x - sqStart.x, sqEnd.y - sqStart.y);
        break;

      case "xshape":
        if (element.points.length < 2) return;
        const xStart = element.points[0];
        const xEnd = element.points[element.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xEnd.x, xEnd.y);
        ctx.moveTo(xEnd.x, xStart.y);
        ctx.lineTo(xStart.x, xEnd.y);
        ctx.stroke();
        break;

      case "triangle":
        if (element.points.length < 2) return;
        const triStart = element.points[0];
        const triEnd = element.points[element.points.length - 1];
        const triMidX = (triStart.x + triEnd.x) / 2;
        ctx.beginPath();
        ctx.moveTo(triMidX, triStart.y);
        ctx.lineTo(triEnd.x, triEnd.y);
        ctx.lineTo(triStart.x, triEnd.y);
        ctx.closePath();
        ctx.stroke();
        break;

      case "circle":
        if (element.points.length < 2) return;
        const circStart = element.points[0];
        const circEnd = element.points[element.points.length - 1];
        const radiusX = Math.abs(circEnd.x - circStart.x) / 2;
        const radiusY = Math.abs(circEnd.y - circStart.y) / 2;
        const centerX = (circStart.x + circEnd.x) / 2;
        const centerY = (circStart.y + circEnd.y) / 2;
        const radius = Math.max(radiusX, radiusY);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("O", centerX, centerY);
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

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPath([point]);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    e.preventDefault();

    const point = getCanvasPoint(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (selectedTool === "freedraw") {
      setCurrentPath((prev) => [...prev, point]);
    }

    redrawCanvas();

    const tempElement: DrawnElement = {
      tool: selectedTool,
      points: selectedTool === "freedraw" ? [...currentPath, point] : [startPoint, point],
      color: getToolColor(selectedTool),
      lineWidth: 3,
    };
    drawElement(ctx, tempElement);
  };

  const handleEnd = () => {
    if (!isDrawing || !startPoint) return;

    const finalPoints = selectedTool === "freedraw" ? currentPath : [startPoint, currentPath[currentPath.length - 1] || startPoint];

    if (finalPoints.length >= 2) {
      const newElement: DrawnElement = {
        tool: selectedTool,
        points: finalPoints,
        color: getToolColor(selectedTool),
        lineWidth: 3,
      };
      setElements((prev) => [...prev, newElement]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPath([]);
  };

  const handleUndo = () => {
    setElements((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setElements([]);
  };

  return (
    <div className="flex flex-col gap-4" data-testid="playbook-canvas-container">
      <div className="flex flex-wrap gap-2 p-3 bg-background/50 dark:bg-card/50 rounded-lg border border-white/10" data-testid="playbook-toolbar">
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

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleUndo} disabled={elements.length === 0} className="gap-2" data-testid="tool-undo">
          <Undo2 className="h-5 w-5" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear} disabled={elements.length === 0} className="gap-2 text-red-500 hover:text-red-400" data-testid="tool-clear">
          <Trash2 className="h-5 w-5" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-white/10" style={{ height: canvasSize.height || 500 }}>
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
