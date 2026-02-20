import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

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
}

type AspectMode = "16-9" | "2-3";

export function ImageCropper({ image, onCrop, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [aspectMode, setAspectMode] = useState<AspectMode>("16-9");

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

  const targetAspect = aspectMode === "16-9" ? 16 / 9 : 4 / 3;

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
      const outputHeight =
        aspectMode === "16-9"
          ? Math.round((outputWidth * 9) / 16)
          : Math.round((outputWidth * 3) / 4);

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
        x: 0,
        y: 0,
        width: 100,
        height: 100,
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Ajustar Imagem</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Proporção:
              <button
                type="button"
                className={`px-2 py-0.5 rounded text-xs border ${
                  aspectMode === "16-9"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                }`}
                onClick={() => setAspectMode("16-9")}
              >
                16:9
              </button>
              <button
                type="button"
                className={`px-2 py-0.5 rounded text-xs border ${
                  aspectMode === "4-3"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                }`}
                onClick={() => setAspectMode("4-3")}
              >
                4:3
              </button>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleApply}>
              <Check className="w-4 h-4 mr-1" /> Aplicar
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden flex items-center justify-center">
          <div
            ref={containerRef}
            className="relative w-full max-w-[900px] aspect-video bg-black/80 overflow-hidden"
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
                        rx="4"
                      />
                    </mask>
                  </defs>
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.6)"
                    mask={`url(#${maskId.current})`}
                  />
                </svg>

                <div
                  className="absolute border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${cropLeft}%`,
                    top: `${cropTop}%`,
                    width: `${cropWidth}%`,
                    height: `${cropHeight}%`,
                  }}
                >
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full shadow" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full shadow" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full shadow" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
