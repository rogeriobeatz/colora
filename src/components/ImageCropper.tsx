import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface CropCoordinates {
  x: number; // percentual 0-100
  y: number; // percentual 0-100
  width: number; // percentual 0-100
  height: number; // percentual 0-100
}

interface ImageCropperProps {
  image: string;
  onCrop: (croppedDataUrl: string, coordinates: CropCoordinates) => void;
  onCancel: () => void;
}

export function ImageCropper({ image, onCrop, onCancel }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [crop, setCrop] = useState<CropCoordinates>({ x: 0, y: 0, width: 50, height: 50 });
  
  const isLandscape = imageDimensions.width >= imageDimensions.height;
  const aspectRatio = isLandscape ? 16 / 9 : 4 / 3;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    if (imageDimensions.width === 0) return;
    
    const containerWidth = 100;
    const containerHeight = 100;
    
    let cropWidth: number;
    let cropHeight: number;
    
    if (isLandscape) {
      cropWidth = 80;
      cropHeight = cropWidth / aspectRatio;
      if (cropHeight > 80) {
        cropHeight = 80;
        cropWidth = cropHeight * aspectRatio;
      }
    } else {
      cropHeight = 80;
      cropWidth = cropHeight * aspectRatio;
      if (cropWidth > 80) {
        cropWidth = 80;
        cropHeight = cropWidth / aspectRatio;
      }
    }
    
    const cropX = (100 - cropWidth) / 2;
    const cropY = (100 - cropHeight) / 2;
    
    setCrop({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
  }, [imageDimensions, isLandscape, aspectRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / container.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / container.height) * 100;
    
    setCrop(prev => {
      let newX = prev.x + deltaX;
      let newY = prev.y + deltaY;
      
      newX = Math.max(0, Math.min(100 - prev.width, newX));
      newY = Math.max(0, Math.min(100 - prev.height, newY));
      
      return { ...prev, x: newX, y: newY };
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleApply = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      const sourceX = (crop.x / 100) * img.width;
      const sourceY = (crop.y / 100) * img.height;
      const sourceWidth = (crop.width / 100) * img.width;
      const sourceHeight = (crop.height / 100) * img.height;
      
      const outputWidth = 1200;
      const outputHeight = isLandscape ? Math.round(outputWidth / 16 * 9) : Math.round(outputWidth / 4 * 3);
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, outputWidth, outputHeight
      );
      
      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onCrop(croppedDataUrl, crop);
    };
    img.src = image;
  }, [image, crop, isLandscape, onCrop]);

  // Generate overlay paths
  const cropLeft = crop.x;
  const cropRight = crop.x + crop.width;
  const cropTop = crop.y;
  const cropBottom = crop.y + crop.height;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">Ajustar Imagem</h3>
            <p className="text-sm text-muted-foreground">
              Proporção: {isLandscape ? "16:9 (Landscape)" : "4:3 (Portrait)"}
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
            className="relative max-w-full max-h-[60vh] select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              src={image} 
              alt="To crop" 
              className="max-w-full max-h-[60vh] object-contain pointer-events-none"
              draggable={false}
            />
            
            {/* Dark overlay with hole */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="cropMask">
                  <rect width="100%" height="100%" fill="white"/>
                  <rect 
                    x={`${cropLeft}%`} 
                    y={`${cropTop}%`} 
                    width={`${crop.width}%`} 
                    height={`${crop.height}%`} 
                    fill="black"
                    rx="4"
                  />
                </mask>
              </defs>
              <rect 
                width="100%" 
                height="100%" 
                fill="rgba(0,0,0,0.6)" 
                mask="url(#cropMask)"
              />
            </svg>
            
            {/* Crop box border */}
            <div 
              className="absolute border-2 border-white shadow-lg cursor-move"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full shadow" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full shadow" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
