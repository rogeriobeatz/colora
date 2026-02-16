import { useRef, useState, useEffect } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const hasSimulations = room.simulations.length > 0;

  // Update image size when rendered
  useEffect(() => {
    const img = containerRef.current?.querySelector('img');
    if (img) {
      const updateSize = () => {
        setImageSize({ width: img.offsetWidth, height: img.offsetHeight });
      };
      updateSize();
      img.addEventListener('load', updateSize);
      return () => img.removeEventListener('load', updateSize);
    }
  }, [room.imageUrl]);

  const handleSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (hasSimulations) {
      setIsDragging(true);
      handleSlider(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && hasSimulations) {
      handleSlider(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (hasSimulations && e.touches[0]) {
      handleSlider(e.touches[0].clientX);
    }
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
                  animation: 'spin 1s linear infinite'
                }} 
              />
              <ScanEye className="absolute inset-0 m-auto w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <p className="font-display font-bold text-lg text-foreground">Analyzing Room</p>
            <p className="text-sm text-muted-foreground mt-1">Identifying wall surfaces...</p>
          </div>
        </div>
      )}

      {/* State: Analysis error */}
      {!room.isAnalyzing && !room.isAnalyzed && room.walls.length === 0 && onRetryAnalysis && (
        <div className="absolute inset-0 z-30 rounded-2xl bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="bg-card rounded-2xl p-6 text-center shadow-elevated animate-scale-in max-w-sm">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="font-display font-semibold text-foreground">Could not identify walls</p>
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              Try using a clearer photo with good lighting and a full view of the room.
            </p>
            <Button 
              size="sm" 
              onClick={onRetryAnalysis} 
              className="gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </Button>
          </div>
        </div>
      )}

      {/* Main image container */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden bg-muted border border-border select-none shadow-soft ${
          hasSimulations ? "cursor-ew-resize" : ""
        } ${isDragging ? "select-none" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        {/* Processed image (after painting) */}
        <img 
          src={room.imageUrl} 
          alt="Room" 
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Before/After Slider */}
        {hasSimulations && (
          <>
            {/* Original image (left side) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={room.originalImageUrl}
                alt="Original"
                className="absolute top-0 left-0 w-full h-full object-cover"
                style={{ 
                  width: containerRef.current?.offsetWidth || '100%',
                  maxWidth: 'none'
                }}
                draggable={false}
              />
            </div>

            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 z-10"
              style={{ 
                left: `${sliderPos}%`,
                transform: 'translateX(-50%)'
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

            {/* Before/After labels */}
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
              Before
            </div>
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
              After
            </div>
          </>
        )}
      </div>

      {/* Wall selection buttons - semantic labels */}
      {room.isAnalyzed && !room.isAnalyzing && room.walls.length > 0 && (
        <div className="mt-4 space-y-3">
          {/* Instruction */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card p-3 rounded-xl border border-border">
            <span className="font-semibold" style={{ color: primaryColor }}>Select a wall</span>
            <span>then choose a color to paint</span>
          </div>

          {/* Wall buttons with semantic names */}
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
                    backgroundColor: isSelected ? primaryColor : undefined 
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