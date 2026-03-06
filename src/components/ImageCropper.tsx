import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Crop } from "lucide-react";
import { cn } from "@/lib/utils";

interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  image: string;
  onCrop: (croppedDataUrl: string, coordinates: CropCoordinates) => void;
  onCancel: () => void;
  initialAspectRatio?: AspectMode;
}

type AspectMode = "16-9" | "2-3" | "1-1";

interface AspectOption {
  value: AspectMode;
  label: string;
  ratio: number;
  description: string;
}

const aspectOptions: AspectOption[] = [
  { value: "16-9", label: "16:9", ratio: 16 / 9, description: "Panorâmico" },
  { value: "2-3", label: "2:3", ratio: 2 / 3, description: "Retrato" },
  { value: "1-1", label: "1:1", ratio: 1, description: "Quadrado" },
];

export function ImageCropper({ image, onCrop, onCancel, initialAspectRatio = "16-9" }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [aspectMode, setAspectMode] = useState<AspectMode>(initialAspectRatio);

  const [frame, setFrame] = useState({ x: 5, y: 5, width: 90, height: 90 });
  const [imageState, setImageState] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  const targetAspect = aspectOptions.find(opt => opt.value === aspectMode)?.ratio || 16 / 9;

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageDimensions({ width: img.width, height: img.height });
    img.src = image;
  }, [image]);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!containerSize.width || !imageDimensions.width) return;
    const cw = containerSize.width;
    const ch = containerSize.height;
    const margin = 0.05;
    const maxFrameWidth = cw * (1 - margin * 2);
    const maxFrameHeight = ch * (1 - margin * 2);
    let frameWidth = maxFrameWidth;
    let frameHeight = frameWidth / targetAspect;
    if (frameHeight > maxFrameHeight) {
      frameHeight = maxFrameHeight;
      frameWidth = frameHeight * targetAspect;
    }
    const frameX = (cw - frameWidth) / 2;
    const frameY = (ch - frameHeight) / 2;
    setFrame({
      x: (frameX / cw) * 100,
      y: (frameY / ch) * 100,
      width: (frameWidth / cw) * 100,
      height: (frameHeight / ch) * 100,
    });
    const iw = imageDimensions.width;
    const ih = imageDimensions.height;
    const scaleToCover = Math.max(frameWidth / iw, frameHeight / ih);
    setImageState({ scale: scaleToCover, offsetX: 0, offsetY: 0 });
    lastOffsetRef.current = { x: 0, y: 0 };
  }, [containerSize, imageDimensions, targetAspect]);

  const clampOffsets = useCallback(
    (offsetX: number, offsetY: number) => {
      const { width: cw, height: ch } = containerSize;
      if (!cw || !ch || !imageDimensions.width) return { offsetX, offsetY };
      const framePx = {
        x: (frame.x / 100) * cw,
        y: (frame.y / 100) * ch,
        width: (frame.width / 100) * cw,
        height: (frame.height / 100) * ch,
      };
      const scaledWidth = imageDimensions.width * imageState.scale;
      const scaledHeight = imageDimensions.height * imageState.scale;
      const baseX = cw / 2 - scaledWidth / 2 + offsetX;
      const baseY = ch / 2 - scaledHeight / 2 + offsetY;
      const minX = framePx.x + framePx.width - scaledWidth;
      const maxX = framePx.x;
      const minY = framePx.y + framePx.height - scaledHeight;
      const maxY = framePx.y;
      const clampedBaseX = Math.min(Math.max(baseX, minX), maxX);
      const clampedBaseY = Math.min(Math.max(baseY, minY), maxY);
      return {
        offsetX: clampedBaseX - (cw / 2 - scaledWidth / 2),
        offsetY: clampedBaseY - (ch / 2 - scaledHeight / 2),
      };
    },
    [containerSize, frame, imageDimensions, imageState.scale]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!containerSize.width) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastOffsetRef.current = { x: imageState.offsetX, y: imageState.offsetY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [containerSize.width, imageState.offsetX, imageState.offsetY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const { offsetX, offsetY } = clampOffsets(
        lastOffsetRef.current.x + deltaX,
        lastOffsetRef.current.y + deltaY
      );
      setImageState(prev => ({ ...prev, offsetX, offsetY }));
    },
    [isDragging, clampOffsets]
  );

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  const handleApply = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      const outputWidth = 1200;
      const outputHeight = Math.round(outputWidth / targetAspect);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const { width: cw, height: ch } = containerSize;
      if (!cw || !ch) return;
      const framePx = {
        x: (frame.x / 100) * cw,
        y: (frame.y / 100) * ch,
        width: (frame.width / 100) * cw,
        height: (frame.height / 100) * ch,
      };
      const scaledWidth = img.width * imageState.scale;
      const scaledHeight = img.height * imageState.scale;
      const baseX = cw / 2 - scaledWidth / 2 + imageState.offsetX;
      const baseY = ch / 2 - scaledHeight / 2 + imageState.offsetY;
      const sourceX = ((framePx.x - baseX) / scaledWidth) * img.width;
      const sourceY = ((framePx.y - baseY) / scaledHeight) * img.height;
      const sourceWidth = (framePx.width / scaledWidth) * img.width;
      const sourceHeight = (framePx.height / scaledHeight) * img.height;
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const coords: CropCoordinates = {
        x: Math.round((frame.x / 100) * imageDimensions.width),
        y: Math.round((frame.y / 100) * imageDimensions.height),
        width: Math.round((frame.width / 100) * imageDimensions.width),
        height: Math.round((frame.height / 100) * imageDimensions.height),
      };
      onCrop(croppedDataUrl, coords);
    };
    img.src = image;
  }, [image, onCrop, frame, containerSize, imageState, targetAspect, imageDimensions]);

  const maskId = useRef(`cropMask-${Math.random().toString(36).slice(2)}`);
  const ready = containerSize.width && imageDimensions.width;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
      {/* Header - stacks vertically on mobile */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border/30 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Crop className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Ajustar Imagem</h3>
              <p className="text-xs text-muted-foreground hidden sm:block">Escolha a melhor proporção</p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={onCancel} className="gap-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cancelar</span>
            </Button>
            <Button size="sm" onClick={handleApply} className="gap-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
              <Check className="w-3.5 h-3.5" />
              Aplicar
            </Button>
          </div>
        </div>

        {/* Aspect Ratio Selector - horizontal scroll on mobile */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground flex-shrink-0">Proporção:</span>
          <div className="flex gap-1.5 overflow-x-auto">
            {aspectOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex-shrink-0",
                  aspectMode === option.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border bg-background hover:bg-muted/50"
                )}
                onClick={() => setAspectMode(option.value)}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="ml-1 opacity-75 hidden sm:inline">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Crop Area - fills remaining space */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-6">
        <div
          ref={containerRef}
          className="relative w-full h-full max-w-[1000px] bg-black/90 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border/30 touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: ready ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          {ready && (
            <>
              <img
                src={image}
                alt="To crop"
                className="pointer-events-none"
                draggable={false}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translate(${imageState.offsetX}px, ${imageState.offsetY}px) scale(${imageState.scale})`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                }}
              />

              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <mask id={maskId.current}>
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={`${frame.x}%`}
                      y={`${frame.y}%`}
                      width={`${frame.width}%`}
                      height={`${frame.height}%`}
                      fill="black"
                      rx="8"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.7)"
                  mask={`url(#${maskId.current})`}
                />
              </svg>

              <div
                className="absolute border-2 border-white/90 shadow-2xl pointer-events-none rounded-lg"
                style={{
                  left: `${frame.x}%`,
                  top: `${frame.y}%`,
                  width: `${frame.width}%`,
                  height: `${frame.height}%`,
                }}
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />

                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div />
                </div>
              </div>

              <div className="absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                <p className="text-white text-[10px] sm:text-xs text-center">
                  Arraste para ajustar • Escolha a proporção • Clique em Aplicar
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
