import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import heroWhite from "@/assets/HeroWhite.jpg";
import heroYellowstone from "@/assets/HeroYellowstone.jpg";
import heroTiffany from "@/assets/HeroTiffany.jpg";

interface InteractiveHeroProps {
  primaryColor?: string;
  secondaryColor?: string;
}

const previewColors = [
  { id: 'yellowstone', name: 'Sândalo Suave', hex: '#E5D1B8', image: heroYellowstone },
  { id: 'tiffany', name: 'Brisa Serena', hex: '#A8DADC', image: heroTiffany },
];

export const InteractiveHero = ({
  primaryColor = "#3b82f6",
  secondaryColor = "#1d4ed8"
}: InteractiveHeroProps) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedColor, setSelectedColor] = useState(previewColors[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSlider(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleSlider(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    handleSlider(e.touches[0].clientX);
  };

  return (
    <div className="relative group w-full max-w-4xl mx-auto">
      {/* Background Decorative Element */}
      <div 
        className="absolute -inset-4 rounded-[3rem] opacity-20 blur-3xl transition-all duration-1000 group-hover:opacity-30"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
        }}
      />

      <div 
        ref={containerRef}
        className="relative aspect-[16/10] sm:aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200/50 shadow-2xl cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        {/* After Image (Full background) */}
        <img
          src={selectedColor.image}
          alt={selectedColor.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before Image (Clipped) */}
        <img
          src={heroWhite}
          alt="Ambiente Original"
          className="absolute inset-0 w-full h-full object-cover transition-none"
          draggable={false}
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        />

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 z-10"
          style={{
            left: `${sliderPos}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)]" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-slate-100 transition-transform group-hover:scale-110">
            <div className="flex gap-0.5 text-slate-400">
              <ChevronLeft className="w-5 h-5" />
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Color Selectors (The "Platform Feel") */}
        <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-3 p-3 glass-premium rounded-2xl shadow-2xl border border-white/20 animate-in fade-in slide-in-from-right-4 duration-1000">
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 text-center font-mono">Presets</p>
          {previewColors.map((color) => (
            <button
              key={color.id}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedColor(color);
              }}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all duration-300 hover:scale-110",
                selectedColor.id === color.id ? "border-slate-900 scale-110 shadow-lg" : "border-white/50"
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>

        {/* Labels */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 shadow-lg">
            Original
          </div>
        </div>
        <div className="absolute top-6 right-6 z-20 pointer-events-none">
          <div 
            className="text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 shadow-lg transition-colors duration-500"
            style={{ backgroundColor: selectedColor.hex === '#E5D1B8' ? '#c4a484' : '#457b9d' }}
          >
            {selectedColor.name}
          </div>
        </div>

        {/* Interactive Badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce-slow">
          <div className="bg-white/90 backdrop-blur-md text-slate-800 text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl border border-slate-100 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Deslize para comparar
          </div>
        </div>
      </div>
    </div>
  );
};
