import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ScanEye } from "lucide-react";
import { Room, DetectedWall } from "./types";

interface ImageViewerProps {
  room: Room;
  selectedWallId: string | null;
  onSelectWall: (wallId: string) => void;
}

const ImageViewer = ({ room, selectedWallId, onSelectWall }: ImageViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const hasSimulations = room.simulations.length > 0;

  const handleSlider = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  // Build composite overlay from all simulations
  const simulationOverlays = room.simulations.filter(s => !s.isPainting);

  return (
    <div className="relative">
      {/* Analyzing overlay */}
      {room.isAnalyzing && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-foreground/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="bg-card rounded-2xl p-6 text-center shadow-elevated animate-scale-in">
            <ScanEye className="w-10 h-10 text-primary mx-auto mb-3 animate-pulse" />
            <p className="font-display font-semibold text-foreground text-sm">Analisando ambiente...</p>
            <p className="text-xs text-muted-foreground mt-1">Identificando paredes e superfícies</p>
          </div>
        </div>
      )}

      {/* Main image with before/after slider */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden bg-card border border-border select-none ${
          hasSimulations ? "cursor-col-resize" : ""
        }`}
        onMouseMove={(e) => hasSimulations && e.buttons === 1 && handleSlider(e)}
        onTouchMove={(e) => hasSimulations && handleSlider(e)}
        onClick={(e) => hasSimulations && handleSlider(e)}
      >
        {/* After image (with color overlays) */}
        <div className="relative">
          <img src={room.imageUrl} alt="Ambiente" className="w-full h-auto" />
          {/* Wall color overlays */}
          {simulationOverlays.map((sim) => {
            const wall = room.walls.find(w => w.id === sim.wallId);
            if (!wall) return null;
            return (
              <svg
                key={sim.id}
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={wall.polygon.map(p => `${p.x},${p.y}`).join(" ")}
                  fill={sim.paint.hex}
                  opacity="0.35"
                  style={{ mixBlendMode: "multiply" }}
                />
              </svg>
            );
          })}
        </div>

        {/* Before image (clipped) */}
        {hasSimulations && (
          <>
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={room.imageUrl}
                alt="Original"
                className="w-full h-auto"
                style={{ minWidth: containerRef.current?.offsetWidth || "100%" }}
              />
            </div>
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-card z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card shadow-elevated flex items-center justify-center">
                <div className="flex gap-0.5">
                  <ChevronLeft className="w-3 h-3 text-foreground" />
                  <ChevronRight className="w-3 h-3 text-foreground" />
                </div>
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-foreground/70 text-primary-foreground text-xs font-medium">
              Antes
            </div>
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-foreground/70 text-primary-foreground text-xs font-medium">
              Depois
            </div>
          </>
        )}

        {/* Clickable wall regions when analyzed */}
        {room.isAnalyzed && !room.isAnalyzing && (
          <svg
            className="absolute inset-0 w-full h-full z-20"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {room.walls.map((wall) => (
              <polygon
                key={wall.id}
                points={wall.polygon.map(p => `${p.x},${p.y}`).join(" ")}
                fill={selectedWallId === wall.id ? "hsl(168 72% 32% / 0.2)" : "transparent"}
                stroke={selectedWallId === wall.id ? "hsl(168 72% 32%)" : "hsl(168 72% 32% / 0.4)"}
                strokeWidth="0.3"
                className="cursor-pointer hover:fill-[hsl(168_72%_32%_/_0.15)] transition-all"
                onClick={(e) => { e.stopPropagation(); onSelectWall(wall.id); }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Wall labels */}
      {room.isAnalyzed && !room.isAnalyzing && room.walls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {room.walls.map((wall) => (
            <button
              key={wall.id}
              onClick={() => onSelectWall(wall.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedWallId === wall.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {wall.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
