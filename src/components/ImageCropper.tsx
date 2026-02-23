import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Crop, RotateCw } from "lucide-react";
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
  initialAspectRatio?: AspectMode; // Nova prop para aspect ratio inicial
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
  const [aspectMode, setAspectMode] = useState<AspectMode>(initialAspectRatio); // Usa o aspect ratio inicial

  const [frame, setFrame] = useState({
    x: 5,
    y: 5,
    width: 90,
    height: 90,
  });

  const [imageState, setImageState] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

const targetAspect = aspectOptions.find(opt => opt.value === aspectMode)?.ratio || 16 / 9;

  // carrega dimensões reais da imagem
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = image;
  }, [image]);

  // mede container sempre que abre / resize
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

  // calcula frame + escala mínima da imagem
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

    setImageState({
      scale: scaleToCover,
      offsetX: 0,
      offsetY: 0,
    });

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

      const finalOffsetX = clampedBaseX - (cw / 2 - scaledWidth / 2);
      const finalOffsetY = clampedBaseY - (ch / 2 - scaledHeight / 2);

      return { offsetX: finalOffsetX, offsetY: finalOffsetY };
    },
    [containerSize, frame, imageDimensions, imageState.scale]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!containerSize.width) return;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastOffsetRef.current = { x: imageState.offsetX, y: imageState.offsetY };
    },
    [containerSize.width, imageState.offsetX, imageState.offsetY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const nextOffsetX = lastOffsetRef.current.x + deltaX;
      const nextOffsetY = lastOffsetRef.current.y + deltaY;

      const { offsetX, offsetY } = clampOffsets(nextOffsetX, nextOffsetY);

      setImageState(prev => ({
        ...prev,
        offsetX,
        offsetY,
      }));
    },
    [isDragging, clampOffsets]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

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
  }, [image, onCrop, frame, containerSize, imageState, aspectMode]);

  const cropLeft = frame.x;
  const cropTop = frame.y;
  const cropWidth = frame.width;
  const cropHeight = frame.height;

  const maskId = useRef(`cropMask-${Math.random().toString(36).slice(2)}`);

  const ready = containerSize.width && imageDimensions.width;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crop className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Ajustar Imagem</h3>
                <p className="text-sm text-muted-foreground">Escolha a melhor proporção para o seu ambiente</p>
              </div>
            </div>
            
            {/* Aspect Ratio Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Proporção:</span>
              <div className="flex gap-2">
                {aspectOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                      aspectMode === option.value
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                        : "border-border/50 bg-background hover:bg-muted/50 hover:border-border"
                    )}
                    onClick={() => setAspectMode(option.value)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-xs opacity-75">{option.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={onCancel} className="gap-2">
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button size="lg" onClick={handleApply} className="gap-2">
              <Check className="w-4 h-4" />
              Aplicar
            </Button>
          </div>
        </div>

        {/* Crop Area */}
        <div className="flex-1 p-6 overflow-hidden flex items-center justify-center bg-gradient-to-br from-muted/10 to-background">
          <div
            ref={containerRef}
            className="relative w-full max-w-[1000px] aspect-video bg-black/90 rounded-2xl overflow-hidden shadow-2xl border border-border/30"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleMouseDown}
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

                {/* Overlay Mask */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <mask id={maskId.current}>
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={`${cropLeft}%`}
                        y={`${cropTop}%`}
                        width={`${cropWidth}%`}
                        height={`${cropHeight}%`}
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

                {/* Crop Frame */}
                <div
                  className="absolute border-2 border-white/90 shadow-2xl pointer-events-none rounded-lg"
                  style={{
                    left: `${cropLeft}%`,
                    top: `${cropTop}%`,
                    width: `${cropWidth}%`,
                    height: `${cropHeight}%`,
                  }}
                >
                  {/* Corner Handles */}
                  <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary/50" />
                  
                  {/* Grid Lines */}
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

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-white text-xs text-center">
                    <span className="font-medium">Arraste</span> para ajustar a imagem • 
                    <span className="font-medium"> Escolha</span> a proporção ideal • 
                    <span className="font-medium"> Clique</span> em Aplicar quando terminar
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
