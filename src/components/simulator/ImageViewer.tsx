import { useRef, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, ScanEye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Room } from "./types";

interface ImageViewerProps {
  room: Room;
  selectedWallId: string | null;
  onSelectWall: (wallId: string) => void;
  onRetryAnalysis?: () => void;
  onSelectSimulation: (simId: string | null) => void;
  primaryColor?: string;
}

const ImageViewer = ({
  room,
  selectedWallId,
  onSelectWall,
  onRetryAnalysis,
  onSelectSimulation,
  primaryColor,
}: ImageViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [hoverSimUrl, setHoverSimUrl] = useState<string | null>(null);

  const hasSimulations = room.simulations.length > 0;

  const activeSim = useMemo(() => {
    if (!room.activeSimulationId) return null;
    return room.simulations.find((s) => s.id === room.activeSimulationId) || null;
  }, [room.activeSimulationId, room.simulations]);

  const displayAfterUrl = hoverSimUrl || room.imageUrl;
  const displayBeforeUrl = room.originalImageUrl;

  useEffect(() => {
    setHoverSimUrl(null);
  }, [room.id]);

  const handleSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasSimulations) return;
    setIsDragging(true);
    handleSlider(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !hasSimulations) return;
    handleSlider(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!hasSimulations || !e.touches[0]) return;
    handleSlider(e.touches[0].clientX);
  };

  return (
    <div className="relative">
      {/* State: Analyzing */}
      {room.isAnalyzing && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="bg-card rounded-3xl p-8 text-center shadow-elevated animate-scale-in border border-border">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                style={{
                  borderColor: `${primaryColor} transparent transparent transparent`,
                  animation: "spin 1s linear infinite",
                }}
              />
              <ScanEye className="absolute inset-0 m-auto w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <p className="font-display font-bold text-lg text-foreground">Analisando ambiente</p>
            <p className="text-sm text-muted-foreground mt-1">Identificando superfícies pintáveis...</p>
          </div>
        </div>
      )}

      {/* State: Analysis error */}
      {!room.isAnalyzing && !room.isAnalyzed && room.walls.length === 0 && onRetryAnalysis && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="bg-card rounded-2xl p-6 text-center shadow-elevated animate-scale-in max-w-sm">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">Não foi possível identificar as paredes</p>
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              Tente uma foto mais nítida, com boa iluminação e pegando o ambiente inteiro.
            </p>
            <Button size="sm" onClick={onRetryAnalysis} className="gap-2" style={{ backgroundColor: primaryColor }}>
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Main image container (aspectRatio -> sobreposição perfeita) */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl overflow-hidden bg-muted border border-border select-none shadow-soft ${
          hasSimulations ? "cursor-ew-resize" : ""
        }`}
        style={aspectRatio ? { aspectRatio } : undefined}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        {/* After (bottom) */}
        <img
          src={displayAfterUrl}
          alt="Ambiente"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setAspectRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
        />

        {/* Before (top) */}
        {hasSimulations && (
          <img
            src={displayBeforeUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            style={{
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
            }}
          />
        )}

        {/* Slider */}
        {hasSimulations && (
          <div
            className="absolute top-0 bottom-0 z-10"
            style={{
              left: `${sliderPos}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white shadow-elevated flex items-center justify-center border-2 border-primary">
              <div className="flex gap-0.5">
                <ChevronLeft className="w-5 h-5 text-foreground" />
                <ChevronRight className="w-5 h-5 text-foreground" />
              </div>
            </div>
          </div>
        )}

        {/* Labels */}
        {hasSimulations && (
          <>
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
              Antes
            </div>
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
              Depois
            </div>
          </>
        )}

        {/* History dots */}
        {hasSimulations && (
          <div className="absolute bottom-4 left-4 z-20">
            <div className="flex items-center gap-2 bg-background/70 backdrop-blur-md border border-border rounded-full px-3 py-2 shadow-soft">
              {/* dot for "original" */}
              <button
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  room.activeSimulationId === null ? "scale-110 border-foreground" : "border-border"
                }`}
                style={{ backgroundColor: "#fff" }}
                title="Original"
                onMouseEnter={() => setHoverSimUrl(room.originalImageUrl)}
                onMouseLeave={() => setHoverSimUrl(null)}
                onClick={() => onSelectSimulation(null)}
              />

              <div className="w-px h-4 bg-border" />

              {room.simulations.map((sim) => {
                const isActive = room.activeSimulationId === sim.id;
                return (
                  <button
                    key={sim.id}
                    className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                      isActive ? "scale-110 border-foreground" : "border-border"
                    }`}
                    style={{ backgroundColor: sim.paint.hex }}
                    title={`${sim.paint.name} · ${sim.wallLabel}`}
                    onMouseEnter={() => setHoverSimUrl(sim.imageUrl)}
                    onMouseLeave={() => setHoverSimUrl(null)}
                    onClick={() => onSelectSimulation(sim.id)}
                  />
                );
              })}
            </div>

            {activeSim && (
              <div className="mt-2 text-xs text-muted-foreground bg-background/70 backdrop-blur-md border border-border rounded-xl px-3 py-2 inline-flex">
                <span className="font-semibold text-foreground">{activeSim.paint.name}</span>
                <span className="mx-2 text-muted-foreground/60">·</span>
                <span>{activeSim.wallLabel}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wall selection */}
      {room.isAnalyzed && !room.isAnalyzing && room.walls.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card p-3 rounded-xl border border-border">
            <span className="font-semibold" style={{ color: primaryColor }}>
              Selecione uma parede
            </span>
            <span>e depois escolha uma cor</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {room.walls.map((wall) => {
              const isSelected = selectedWallId === wall.id;

              return (
                <button
                  key={wall.id}
                  onClick={() => onSelectWall(wall.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isSelected
                      ? "text-white shadow-soft scale-105"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border"
                  }`}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                >
                  <span className="text-base">🧱</span>
                  <span>{wall.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;