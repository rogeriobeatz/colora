import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, ScanEye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Room } from "./types";

interface ImageViewerProps {
  room: Room;
  selectedWallId: string | null;
  onSelectWall: (wallId: string) => void;
  onRetryAnalysis?: () => void;
  primaryColor?: string;
}

const ImageViewer = ({ room, selectedWallId, onSelectWall, onRetryAnalysis, primaryColor }: ImageViewerProps) => {
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
    <div className="relative group">
      {/* Analyzing overlay */}
      {room.isAnalyzing && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-background/60 backdrop-blur-md flex flex-col items-center justify-center gap-3">
          <div className="bg-card rounded-3xl p-8 text-center shadow-elevated animate-scale-in border border-border">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ borderColor: `${primaryColor} transparent transparent transparent` }} />
              <ScanEye className="absolute inset-0 m-auto w-6 h-6 text-primary" style={{ color: primaryColor }} />
            </div>
            <p className="font-display font-bold text-foreground text-base">Analisando ambiente...</p>
            <p className="text-xs text-muted-foreground mt-1">Nossa IA está identificando as paredes</p>
          </div>
        </div>
      )}

      {/* Failed analysis overlay */}
      {!room.isAnalyzing && !room.isAnalyzed && room.walls.length === 0 && onRetryAnalysis && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-background/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="bg-card rounded-2xl p-6 text-center shadow-elevated animate-scale-in">
            <AlertTriangle className="w-10 h-10 text-accent mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground text-sm">Falha na análise</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Não foi possível identificar as paredes</p>
            <Button size="sm" onClick={onRetryAnalysis} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Main image with before/after slider */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden bg-muted border border-border select-none shadow-soft ${
          hasSimulations ? "cursor-col-resize" : ""
        }`}
        onMouseMove={(e) => hasSimulations && e.buttons === 1 && handleSlider(e)}
        onTouchMove={(e) => hasSimulations && handleSlider(e)}
        onClick={(e) => hasSimulations && handleSlider(e)}
      >
        {/* After image (with color overlays) */}
        <div className="relative">
          <img src={room.imageUrl} alt="Ambiente" className="w-full h-auto block" />
          
          {/* Wall color overlays (SVG) */}
          {/* Note: We don't render SVG overlays for the final painted image because the image itself is already painted by the Edge Function */}
        </div>

        {/* Before image (clipped) */}
        {hasSimulations && (
          <>
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={room.originalImageUrl}
                alt="Original"
                className="w-full h-auto max-w-none"
                style={{ width: containerRef.current?.offsetWidth || "100%" }}
              />
            </div>
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/80 backdrop-blur-sm z-10 shadow-soft"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-elevated flex items-center justify-center border border-border">
                <div className="flex gap-0.5">
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </div>
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest">
              Original
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: primaryColor ? `${primaryColor}CC` : undefined }}>
              Simulado
            </div>
          </>
        )}

        {/* Clickable wall regions when analyzed */}
        {room.isAnalyzed && !room.isAnalyzing && (
          <svg
            className="absolute inset-0 w-full h-full z-20 pointer-events-auto"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {room.walls.map((wall) => (
              <polygon
                key={wall.id}
                points={wall.polygon.map(p => `${p.x},${p.y}`).join(" ")}
                fill={selectedWallId === wall.id ? (primaryColor ? `${primaryColor}33` : "hsl(var(--primary) / 0.2)") : "transparent"}
                stroke={selectedWallId === wall.id ? (primaryColor || "hsl(var(--primary))") : "transparent"}
                strokeWidth="0.5"
                className="cursor-pointer hover:fill-[rgba(255,255,255,0.1)] transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); onSelectWall(wall.id); }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* Wall labels */}
      {room.isAnalyzed && !room.isAnalyzing && room.walls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {room.walls.map((wall) => (
            <button
              key={wall.id}
              onClick={() => onSelectWall(wall.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                selectedWallId === wall.id
                  ? "text-white shadow-soft scale-105"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              style={{ backgroundColor: selectedWallId === wall.id ? (primaryColor || 'hsl(var(--primary))') : undefined }}
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